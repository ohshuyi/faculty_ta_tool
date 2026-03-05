"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  message,
  Upload,
  Card,
  Divider,
  DatePicker,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useCourse } from "@/context/CourseContext";
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const AddTaskModal = ({ isVisible, onClose, onTaskAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tas, setTAs] = useState([]);
  const [classes, setClasses] = useState([]); // State for classes (course groups)
  const { data: session } = useSession();
  const { activeCourseCode } = useCourse();
  const [file, setFile] = useState(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);
  const [filteredClassGroups, setFilteredClassGroups] = useState([]);
  const [filteredClassTypes, setFilteredClassTypes] = useState([]);
  const [students, setStudents] = useState([]);

  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  // Fetch TAs and Classes when the modal is visible
  useEffect(() => {
    if (isVisible) {

      async function fetchTAs() {
        try {
          const url = activeCourseCode ? `/api/tas?courseCode=${activeCourseCode}` : "/api/tas";
          const response = await fetch(url);
          const data = await response.json();
          setTAs(data);
        } catch (error) {
          console.error("Error fetching TAs:", error);
        }
      }

      async function fetchClasses() {
        try {
          const response = await fetch("/api/classes");
          const data = await response.json();

          // Filter classes by active course code for strict isolation
          const filteredClasses = activeCourseCode
            ? data.filter(cls => cls.courseCode === activeCourseCode)
            : data;

          setClasses(filteredClasses);

          // Pre-fill logic when modal opens
          if (activeCourseCode) {
            form.setFieldsValue({ courseCode: activeCourseCode });
            // Manually trigger handleCourseChange logic for initialization
            setSelectedCourseCode(activeCourseCode);
            const courseClasses = data.filter((cls) => cls.courseCode === activeCourseCode);
            const uniqueTypes = [...new Set(courseClasses.map((cls) => cls.classType))];
            setFilteredClassTypes(uniqueTypes);
          }
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }

      fetchTAs();
      fetchClasses();
    } else {
      // Reset logic when modal closes
      if (!isVisible) {
        setSelectedCourseCode(null);
        setFilteredClassTypes([]);
        setFilteredClassGroups([]);
        setStudents([]);
        form.resetFields();
      }
    }
  }, [isVisible, activeCourseCode]);

  // Handle file selection
  const handleFileChange = ({ fileList }) => {
    setFile(fileList[0]);
  };

  const handleCourseChange = (courseCode) => {
    setSelectedCourseCode(courseCode); // Store the selection

    // Find unique class types for the selected course
    const courseClasses = classes.filter((cls) => cls.courseCode === courseCode);
    const uniqueTypes = [...new Set(courseClasses.map((cls) => cls.classType))];
    setFilteredClassTypes(uniqueTypes);

    // Clear all dependent fields
    setFilteredClassGroups([]);
    form.setFieldsValue({
      classType: undefined,
      classId: undefined,
    });
  };

  const handleClassTypeChange = (classType) => {
    // Filter class groups based on BOTH course code and class type
    const groupsForType = classes.filter(
      (cls) => cls.courseCode === selectedCourseCode && cls.classType === classType
    );
    setFilteredClassGroups(groupsForType);

    // Clear the dependent class group field
    form.setFieldsValue({ classId: undefined, studentId: undefined });
    setStudents([]);
  };

  const handleClassGroupChange = async (classId) => {
    // Clear dependent student field
    form.setFieldsValue({ studentId: undefined });
    try {
      const response = await fetch(`/api/students?classId=${classId}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };

  const handleGenerateDetails = async () => {
    if (!aiDescription) {
      return message.warning("Please describe the task in the text box first.");
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription, type: 'task' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI generation failed.");
      }

      console.log(data);

      // 1. Find the target class ID from the AI-generated data
      const targetClass = data.classGroup
        ? classes.find(c => c.courseCode === data.courseCode && c.classGroup === data.classGroup)
        : null;

      // 2. Set ALL form values in a single, reliable call
      const finalCourseCode = activeCourseCode || data.courseCode;

      form.setFieldsValue({
        name: data.name,
        details: data.details,
        courseCode: finalCourseCode,
        classType: data.classType,
        classId: targetClass?.id, // Use the ID we found
        dueDate: data.dueDate ? dayjs(data.dueDate, 'YYYY-MM-DD') : null,
      });

      // 3. Manually update the states that populate the dropdown OPTIONS
      if (finalCourseCode) {
        const courseClasses = classes.filter((cls) => cls.courseCode === finalCourseCode);
        const uniqueTypes = [...new Set(courseClasses.map((cls) => cls.classType))];
        setFilteredClassTypes(uniqueTypes);
        setSelectedCourseCode(finalCourseCode); // Also update the selected course code state
      }
      if (data.courseCode && data.classType) {
        const groupsForType = classes.filter(
          (cls) => cls.courseCode === data.courseCode && cls.classType === data.classType
        );
        setFilteredClassGroups(groupsForType);
      }

      message.success("Details generated successfully!");
    } catch (error) {
      message.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Handle form submission
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("courseCode", values.courseCode); // Selected course group
      formData.append("classType", values.classType);
      formData.append("classId", values.classId);
      formData.append("dueDate", values.dueDate.format("YYYY-MM-DD"));
      formData.append("details", values.details);
      formData.append("professorId", session.user.id);
      formData.append("taId", values.taId);
      if (values.studentId) {
        formData.append("studentId", values.studentId);
      }

      if (file) {
        formData.append("file", file.originFileObj);
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        message.success("Task created successfully");
        onClose();
        onTaskAdded();
      } else {
        message.error("Failed to create task");
      }
    } catch (error) {
      console.error(error);
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isVisible}
      title="Add New Task"
      onCancel={onClose}
      footer={null}
      width={800} // Increase modal width if needed
    >
      <Card title="Describe Task with AI" style={{ marginBottom: 24 }}>
        <TextArea
          rows={3}
          placeholder="e.g., 'Grade the mid-term exams for SC2207 Lab Group SCMA, due next Friday'"
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
        />
        <Button
          type="primary"
          onClick={handleGenerateDetails}
          loading={generating}
          style={{ marginTop: 16 }}
        >
          Generate Details
        </Button>
      </Card>

      <Divider>Or Fill Manually</Divider>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Task Name"
          name="name"
          rules={[{ required: true, message: "Please input the task name!" }]}
          style={{ width: "100%" }}
        >
          <Input placeholder="Enter task name" />
        </Form.Item>

        <Form.Item
          label="Course Code"
          name="courseCode"
          rules={[{ required: true, message: "Please select a course code!" }]}
        >
          <Select
            placeholder="Search or select a course code"
            onChange={handleCourseChange}
            loading={classes.length === 0}
            showSearch
            filterOption={filterOption}
            disabled={!!activeCourseCode} // Disable if pre-filled
          >
            {activeCourseCode ? (
              <Option key={activeCourseCode} value={activeCourseCode}>
                {activeCourseCode}
              </Option>
            ) : (
              [...new Set(classes.map((cls) => cls.courseCode))].map((code) => (
                <Option key={code} value={code}>
                  {code}
                </Option>
              ))
            )}
          </Select>
        </Form.Item>

        {/* NEW Class Type Dropdown */}
        <Form.Item
          label="Class Type"
          name="classType"
          rules={[{ required: true, message: "Please select a class type!" }]}
        >
          <Select
            placeholder="Select a class type"
            onChange={handleClassTypeChange}
            disabled={filteredClassTypes.length === 0}
            showSearch
            filterOption={filterOption}
          >
            {filteredClassTypes.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* UPDATED Class Group Dropdown */}
        <Form.Item
          label="Class Group"
          name="classId"
          rules={[{ required: true, message: "Please select a class group!" }]}
        >
          <Select
            placeholder="Search or select a class group"
            disabled={filteredClassGroups.length === 0}
            showSearch
            onChange={handleClassGroupChange}
            filterOption={filterOption}
          >
            {filteredClassGroups.map((cls) => (
              <Option key={cls.id} value={cls.id}>
                {cls.classGroup}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Student (Optional)"
          name="studentId"
          style={{ width: "100%" }}
        >
          <Select
            placeholder="Search or select a student"
            showSearch
            allowClear
            disabled={students.length === 0}
            filterOption={filterOption}
          >
            {students.map((student) => (
              <Option key={student.id} value={student.id}>
                {student.name} ({student.studentCode})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Assign To (TA/Tutor)"
          name="taId"
          rules={[{ required: true, message: "Please select a TA/Tutor!" }]}
          style={{ width: "100%" }}
        >
          <Select
            placeholder="Search or select a TA/Tutor"
            showSearch
            filterOption={filterOption}>
            {tas.map((ta) => {
              const courseRole = ta.courseRoles?.find(cr => cr.courseCode === activeCourseCode)?.role;
              const displayRole = courseRole || ta.role;
              return (
                <Option key={ta.id} value={ta.id}>
                  {ta.name} ({displayRole.replace('_', ' ')})
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label="Due Date"
          name="dueDate"
          rules={[{ required: true, message: "Please select a due date!" }]}
          style={{ width: "100%" }}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Details"
          name="details"
          rules={[{ required: true, message: "Please input task details!" }]}
          style={{ width: "100%" }}
        >
          <TextArea rows={4} placeholder="Enter task details" />
        </Form.Item>

        <Form.Item label="Attach File (Optional)" style={{ width: "100%" }}>
          <Upload beforeUpload={() => false} onChange={handleFileChange}>
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
        </Form.Item>

        <Form.Item style={{ width: "100%" }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddTaskModal;

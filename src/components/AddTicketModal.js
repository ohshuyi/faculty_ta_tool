"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  Divider,
  Modal,
  Form,
  Input,
  Button,
  Select,
  message,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { TextArea } = Input;
const { Option } = Select;

const AddTicketModal = ({ isVisible, onClose, onTicketAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);
  const [filteredClassTypes, setFilteredClassTypes] = useState([]);
  const [filteredClassGroups, setFilteredClassGroups] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  // Fetch professors, classes, and students when the modal is visible
  useEffect(() => {
    if (isVisible) {
      async function fetchProfessors() {
        try {
          const response = await fetch("/api/professors");
          const data = await response.json();
          setProfessors(data);
        } catch (error) {
          console.error("Error fetching professors:", error);
        }
      }

      async function fetchClasses() {
        try {
          const response = await fetch("/api/classes");
          const data = await response.json();
          console.log("API Response for Classes:", data);

          setClasses(data);
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
      async function fetchAllStudents() {
        try {
          const response = await fetch("/api/students");
          const data = await response.json();
          setAllStudents(data); // Populate the complete list
        } catch (error) {
          console.error("Error fetching all students:", error);
        }
      }

      fetchAllStudents();
      fetchProfessors();
      fetchClasses();
    } else {
      setSelectedCourseCode(null);
      setFilteredClassTypes([]);
      setFilteredClassGroups([]);
      setFilteredStudents([]);
      form.resetFields();
    }
  }, [isVisible, form]);

  console.log("Classes state:", classes);

  const handleCourseChange = (courseCode) => {
    setSelectedCourseCode(courseCode); // Store the selected course code

    // Find unique class types for the selected course
    const courseClasses = classes.filter((cls) => cls.courseCode === courseCode);
    const uniqueTypes = [...new Set(courseClasses.map((cls) => cls.classType))];
    setFilteredClassTypes(uniqueTypes);

    // Clear all three dependent fields
    setFilteredClassGroups([]);
    setFilteredStudents([]);
    form.setFieldsValue({
      classType: undefined,
      classId: undefined,
      studentId: undefined,
    });
  };

  // 2. NEW: Handles when a user selects a Class Type
  const handleClassTypeChange = (classType) => {
    // Filter class groups based on BOTH course code and class type
    const groupsForType = classes.filter(
      (cls) => cls.courseCode === selectedCourseCode && cls.classType === classType
    );
    setFilteredClassGroups(groupsForType);

    // Clear the two dependent fields
    setFilteredStudents([]);
    form.setFieldsValue({
      classId: undefined,
      studentId: undefined,
    });
  };
  // Handles when a user selects a Class Group
  const handleClassGroupChange = (classId) => {
    // Find the full class object from the selected ID
    const selectedClass = classes.find((cls) => cls.id === classId);

    // Set the students from that class
    setFilteredStudents(selectedClass ? selectedClass.students : []);

    // Clear the dependent student field
    form.setFieldsValue({ studentId: undefined });
  };

  // Handle file selection
  const handleFileChange = ({ fileList }) => {
    setFile(fileList[0]);
  };

  const handleGenerateDetails = async () => {
    if (!aiDescription) {
      return message.warning("Please describe the ticket first.");
    }
    if (allStudents.length === 0) {
      return message.warning("Student list is still loading, please wait a moment.");
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription, type: 'ticket' }), // Send type: 'ticket'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI generation failed.");
      }

      // Find IDs based on names returned by AI
      const student = data.studentName ? allStudents.find(s => s.name.toLowerCase() === data.studentName.toLowerCase()) : null;
      const professor = data.professorName ? professors.find(p => p.name.toLowerCase() === data.professorName.toLowerCase()) : null;
      const targetClass = data.courseCode && data.classGroup && data.classType
        ? classes.find(c =>
          c.courseCode === data.courseCode &&
          c.classGroup === data.classGroup &&
          c.classType === data.classType)
        : null;

      // 2. Set ALL form values in a single call
      form.setFieldsValue({
        name: data.name,
        ticketDescription: data.ticketDescription,
        category: data.category,
        priority: data.priority,
        studentId: student?.id,
        professorId: professor?.id,
        courseGroupType: data.courseCode,
        classType: data.classType,
        classId: targetClass?.id,
      });

      // 3. Manually update the states that control the dropdown options and enabled status
      let tempFilteredTypes = [];
      let tempFilteredGroups = [];
      let tempFilteredStudents = [];

      if (data.courseCode) {
        setSelectedCourseCode(data.courseCode); // Store the selected course code
        const courseClasses = classes.filter((cls) => cls.courseCode === data.courseCode);
        tempFilteredTypes = [...new Set(courseClasses.map((cls) => cls.classType))];
      }

      if (data.courseCode && data.classType) {
        tempFilteredGroups = classes.filter(
          (cls) => cls.courseCode === data.courseCode && cls.classType === data.classType
        );
      }

      if (targetClass) {
        tempFilteredStudents = targetClass.students || [];
      }

      // Update the states AFTER calculating them
      setFilteredClassTypes(tempFilteredTypes);
      setFilteredClassGroups(tempFilteredGroups);
      setFilteredStudents(tempFilteredStudents);

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
      formData.append("name", values.name); // Adding name to form data
      formData.append("ticketDescription", values.ticketDescription);
      formData.append("courseGroupType", values.courseGroupType);
      formData.append("classType", values.classType);
      formData.append("classId", values.classId);
      formData.append("category", values.category);
      formData.append("studentId", values.studentId);
      formData.append("priority", values.priority);
      formData.append("professorId", values.professorId);
      formData.append("taId", session.user.id);

      if (file) {
        formData.append("file", file.originFileObj);
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        message.success("Ticket added successfully");
        onClose();
        onTicketAdded();
      } else {
        message.error("Failed to add ticket");
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
      title="Add New Ticket"
      onCancel={onClose}
      footer={null}
      width={800} // Adjust modal width if necessary
    >
      {/* --- NEW AI SECTION --- */}
      <Card title="Describe Ticket with AI" style={{ marginBottom: 24 }}>
        <TextArea
          rows={3}
          placeholder="e.g., 'Student John Doe from SCMA lab submitted assignment late for SC2207 due to MC. High priority. Assign to Prof Smith.'"
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
      <Form layout="vertical" onFinish={onFinish} form={form}>
        {/* New Name Field */}
        <Form.Item
          label="Ticket Name"
          name="name"
          rules={[{ required: true, message: "Please input a ticket name!" }]}
          style={{ width: "100%" }}
        >
          <Input placeholder="Enter ticket name" />
        </Form.Item>

        <Form.Item
          label="Ticket Description"
          name="ticketDescription"
          rules={[
            {
              required: true,
              message: "Please input the ticket description!",
            },
          ]}
          style={{ width: "100%" }}
        >
          <TextArea rows={4} placeholder="Enter ticket description" />
        </Form.Item>

        <Form.Item
          label="Course Code"
          name="courseGroupType"
          rules={[{ required: true, message: "Please select a course code!" }]}
        >
          <Select
            placeholder="Search or select a course code"
            onChange={handleCourseChange}
            showSearch
            filterOption={filterOption}
          >
            {/* Create a unique list of course codes for the options */}
            {[...new Set(classes.map((cls) => cls.courseCode))].map((code) => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Class Type"
          name="classType"
          rules={[{ required: true, message: "Please select a class type!" }]}
        >
          <Select
            placeholder="Search or select a class type"
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

        <Form.Item
          label="Class Group"
          name="classId"
          rules={[{ required: true, message: "Please select a class group!" }]}
        >
          <Select
            placeholder="Search or select a class group"
            onChange={handleClassGroupChange}
            // Disable until a course code is selected
            disabled={filteredClassGroups.length === 0}
            showSearch
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
          label="Category"
          name="category"
          rules={[{ required: true, message: "Please select a category!" }]}
          style={{ width: "100%" }}
        >
          <Select placeholder="Select a category">
            <Option value="Assignment">Assignment</Option>
            <Option value="Exam">Exam</Option>
            <Option value="Project">Project</Option>
            <Option value="Quiz">Quiz</Option>
            <Option value="Lab">Lab</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Student"
          name="studentId"
          rules={[{ required: true, message: "Please select a student!" }]}
        >
          <Select
            placeholder="Search or select a student"
            // Disable until a class group is selected
            disabled={filteredStudents.length === 0}
            showSearch
            filterOption={filterOption}
          >
            {filteredStudents.map((student) => (
              <Option key={student.id} value={student.id}>
                {student.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: "Please select a priority!" }]}
          style={{ width: "100%" }}
        >
          <Select placeholder="Select priority">
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Professor"
          name="professorId"
          rules={[{ required: true, message: "Please select a professor!" }]}
          style={{ width: "100%" }}
        >
          <Select
            placeholder="Search or select a professor"
            showSearch
            filterOption={filterOption}>
            {professors.map((professor) => (
              <Option key={professor.id} value={professor.id}>
                {professor.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* File Upload Field */}
        <Form.Item
          label="Medical Certificate (Optional)"
          style={{ width: "100%" }}
        >
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

export default AddTicketModal;
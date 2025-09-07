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
  DatePicker,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { TextArea } = Input;
const { Option } = Select;

const AddTaskModal = ({ isVisible, onClose, onTaskAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tas, setTAs] = useState([]);
  const [classes, setClasses] = useState([]); // State for classes (course groups)
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);
  const [filteredClassGroups, setFilteredClassGroups] = useState([]);
  const [filteredClassTypes, setFilteredClassTypes] = useState([]);

  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  // Fetch TAs and Classes when the modal is visible
  useEffect(() => {
    if (isVisible) {
      async function fetchTAs() {
        try {
          const response = await fetch("/api/tas");
          const data = await response.json();
          setTAs(data);
        } catch (error) {
          console.error("Error fetching TAs:", error);
        }
      }

      async function fetchClasses() {
        try {
          const response = await fetch("/api/classes"); // Replace with your API endpoint
          const data = await response.json();
          setClasses(data);
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }

      fetchTAs();
      fetchClasses();
    }
  }, [isVisible]);

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
    form.setFieldsValue({ classId: undefined });
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
      <Form layout="vertical" onFinish={onFinish}>
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
          >
            {[...new Set(classes.map((cls) => cls.courseCode))].map((code) => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
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
          label="Assign To (TA)"
          name="taId"
          rules={[{ required: true, message: "Please select a TA!" }]}
          style={{ width: "100%" }}
        >
          <Select
            placeholder="Search or select a TA"
            showSearch
            filterOption={filterOption}>
            {tas.map((ta) => (
              <Option key={ta.id} value={ta.id}>
                {ta.name}
              </Option>
            ))}
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

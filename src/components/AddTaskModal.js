"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Select, DatePicker, message, Upload, Row, Col } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { TextArea } = Input;
const { Option } = Select;

const AddTaskModal = ({ isVisible, onClose, onTaskAdded }) => {
  const [loading, setLoading] = useState(false);
  const [tas, setTAs] = useState([]); // For TAs dropdown
  const { data: session } = useSession();
  const [file, setFile] = useState(null); // State to store the uploaded file

  // Fetch TAs when the modal is visible
  useEffect(() => {
    if (isVisible) {
      async function fetchTAs() {
        try {
          const response = await fetch("/api/tas"); // Ensure the API endpoint is correct
          const data = await response.json();
          setTAs(data);
        } catch (error) {
          console.error("Error fetching TAs:", error);
        }
      }
      fetchTAs();
    }
  }, [isVisible]);

  // Handle file selection
  const handleFileChange = ({ fileList }) => {
    setFile(fileList[0]); // Take the first file from the list
  };

  // Handle form submission
  const onFinish = async (values) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name); // New name field for the task
      formData.append("courseGroupType", values.courseGroupType);
      formData.append("dueDate", values.dueDate.format("YYYY-MM-DD"));
      formData.append("details", values.details);
      formData.append("professorId", session.user.id); // Assuming professor is logged in
      formData.append("taId", values.taId); // Selected TA

      if (file) {
        formData.append("file", file.originFileObj); // Add the selected file to the form data
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        message.success("Task created successfully");
        onClose(); // Close the modal after success
        onTaskAdded(); // Re-fetch tasks after adding a new one
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
      visible={isVisible} // Ensure this prop is controlling the modal's visibility
      title="Add New Task"
      onCancel={onClose}
      footer={null}
    >
      <Form layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Task Name" // Add the name field
              name="name"
              rules={[{ required: true, message: "Please input the task name!" }]}
            >
              <Input placeholder="Enter task name" />
            </Form.Item>

            <Form.Item
              label="Course Group"
              name="courseGroupType"
              rules={[{ required: true, message: "Please select a course group!" }]}
            >
              <Input placeholder="Enter course group type" />
            </Form.Item>

            <Form.Item
              label="Assign To (TA)"
              name="taId"
              rules={[{ required: true, message: "Please select a TA!" }]}
            >
              <Select placeholder="Select a TA">
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
            >
              <DatePicker />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Details"
              name="details"
              rules={[{ required: true, message: "Please input task details!" }]}
            >
              <TextArea rows={4} placeholder="Enter task details" />
            </Form.Item>

            {/* File Upload Field */}
            <Form.Item label="Attach File (Optional)">
              <Upload beforeUpload={() => false} onChange={handleFileChange}>
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddTaskModal;

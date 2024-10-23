"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  message,
  Row,
  Col,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { TextArea } = Input;
const { Option } = Select;

const AddTicketModal = ({ isVisible, onClose, onTicketAdded }) => {
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState([]);
  const { data: session } = useSession();
  const [file, setFile] = useState(null); // State to store the uploaded file
  console.log(isVisible);
  // Fetch professors when the modal is visible
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
      fetchProfessors();
    }
  }, [isVisible]);

  // Function to handle file selection
  const handleFileChange = ({ fileList }) => {
    setFile(fileList[0]); // Take the first file from the list
  };

  // Function to handle form submission
  const onFinish = async (values) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("ticketNumber", values.ticketNumber);
      formData.append("ticketDescription", values.ticketDescription);
      formData.append("courseGroupType", values.courseGroupType);
      formData.append("category", values.category);
      formData.append("student", values.student);
      formData.append("details", values.details);
      formData.append("priority", values.priority);
      formData.append("professorId", values.professorId);
      formData.append("taId", session.user.id);

      if (file) {
        formData.append("file", file.originFileObj); // Add the selected file to the form data
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        message.success("Ticket added successfully");
        onClose(); // Close the modal after success
        onTicketAdded(); // Re-fetch tickets after adding a new one
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
      visible={isVisible} // Ensure this prop is controlling the modal's visibility
      title="Add New Ticket"
      onCancel={onClose}
      footer={null}
    >
      <Form layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Ticket Number"
              name="ticketNumber"
              rules={[
                { required: true, message: "Please input the ticket number!" },
              ]}
            >
              <Input placeholder="Enter ticket number" />
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
            >
              <TextArea rows={4} placeholder="Enter ticket description" />
            </Form.Item>

            <Form.Item
              label="Course Group"
              name="courseGroupType"
              rules={[
                { required: true, message: "Please select a course group!" },
              ]}
            >
              <Select placeholder="Select a course group">
                <Option value="Math 101">Math 101</Option>
                <Option value="Physics 202">Physics 202</Option>
                <Option value="Chemistry 103">Chemistry 103</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Please select a category!" }]}
            >
              <Select placeholder="Select a category">
                <Option value="Assignment">Assignment</Option>
                <Option value="Exam">Exam</Option>
                <Option value="Project">Project</Option>
                <Option value="Quiz">Quiz</Option>
                <Option value="Lab">Lab</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Student"
              name="student"
              rules={[
                { required: true, message: "Please input the student name!" },
              ]}
            >
              <Input placeholder="Enter student name" />
            </Form.Item>

            <Form.Item label="Details" name="details">
              <TextArea rows={4} placeholder="Enter additional details" />
            </Form.Item>

            <Form.Item
              label="Priority"
              name="priority"
              rules={[{ required: true, message: "Please select a priority!" }]}
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
              rules={[
                { required: true, message: "Please select a professor!" },
              ]}
            >
              <Select placeholder="Select a professor">
                {professors.map((professor) => (
                  <Option key={professor.id} value={professor.id}>
                    {professor.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* File Upload Field */}
        <Form.Item label="Medical Certificate (Optional)">
          <Upload beforeUpload={() => false} onChange={handleFileChange}>
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddTicketModal;

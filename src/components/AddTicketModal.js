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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { TextArea } = Input;
const { Option } = Select;

const AddTicketModal = ({ isVisible, onClose, onTicketAdded }) => {
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const { data: session } = useSession();
  const [file, setFile] = useState(null);

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
          setClasses(data);
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }

      async function fetchStudents() {
        try {
          const response = await fetch("/api/students");
          const data = await response.json();
          setStudents(data);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      }

      fetchProfessors();
      fetchClasses();
      fetchStudents();
    }
  }, [isVisible]);

  // Handle file selection
  const handleFileChange = ({ fileList }) => {
    setFile(fileList[0]);
  };

  // Handle form submission
  const onFinish = async (values) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("ticketDescription", values.ticketDescription);
      formData.append("courseGroupType", values.courseGroupType);
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
      visible={isVisible}
      title="Add New Ticket"
      onCancel={onClose}
      footer={null}
      width={800} // Adjust modal width if necessary
    >
      <Form layout="vertical" onFinish={onFinish}>
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
          rules={[
            { required: true, message: "Please select a course group!" },
          ]}
          style={{ width: "100%" }}
        >
          <Select placeholder="Select a course code">
            {classes.map((cls) => (
              <Option key={cls.id} value={cls.courseCode}>
                {cls.courseCode}
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
          style={{ width: "100%" }}
        >
          <Select placeholder="Select a student">
            {students.map((student) => (
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
          <Select placeholder="Select a professor">
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

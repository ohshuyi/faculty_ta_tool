"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Select, message, Row, Col } from "antd";
import { useSession } from "next-auth/react";

const { TextArea } = Input;
const { Option } = Select;

const AddTicketModal = ({ isVisible, onClose, onTicketAdded }) => {
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState([]); // State to store list of professors
  const { data: session } = useSession(); // Get session data to identify the logged-in TA

  // Fetch professors when the modal is visible
  useEffect(() => {
    if (isVisible) {
      async function fetchProfessors() {
        try {
          const response = await fetch("/api/professors"); // API to fetch professors
          const data = await response.json();
          setProfessors(data);
        } catch (error) {
          console.error("Error fetching professors:", error);
        }
      }
      fetchProfessors();
    }
  }, [isVisible]);

  // Function to handle form submission
  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Make the POST request to add a new ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          taId: session.user.id, // Add the TA's ID from the session
        }),
      });

      if (response.ok) {
        message.success("Ticket added successfully");
        onClose(); // Close the modal after success
        onTicketAdded(); // Re-fetch tickets after adding a new one
      } else {
        message.error("Failed to add ticket");
      }
    } catch (error) {
      console.log(error);
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
      footer={null} // Hides the default footer buttons
    >
      <Form layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          {/* Left Column */}
          <Col span={12}>
            {/* Ticket Number Field */}
            <Form.Item
              label="Ticket Number"
              name="ticketNumber"
              rules={[{ required: true, message: "Please input the ticket number!" }]}
            >
              <Input placeholder="Enter ticket number" />
            </Form.Item>

            {/* Ticket Description Field */}
            <Form.Item
              label="Ticket Description"
              name="ticketDescription"
              rules={[{ required: true, message: "Please input the ticket description!" }]}
            >
              <TextArea rows={4} placeholder="Enter ticket description" />
            </Form.Item>

            {/* Course Group Field */}
            <Form.Item
              label="Course Group"
              name="courseGroupType"
              rules={[{ required: true, message: "Please select a course group!" }]}
            >
              <Select placeholder="Select a course group">
                <Option value="Math 101">Math 101</Option>
                <Option value="Physics 202">Physics 202</Option>
                <Option value="Chemistry 103">Chemistry 103</Option>
              </Select>
            </Form.Item>

            {/* Category Field */}
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

          {/* Right Column */}
          <Col span={12}>
            {/* Student Field */}
            <Form.Item
              label="Student"
              name="student"
              rules={[{ required: true, message: "Please input the student name!" }]}
            >
              <Input placeholder="Enter student name" />
            </Form.Item>

            {/* Details Field */}
            <Form.Item
              label="Details"
              name="details"
            >
              <TextArea rows={4} placeholder="Enter additional details" />
            </Form.Item>

            {/* Priority Field */}
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

            {/* Professor Field */}
            <Form.Item
              label="Professor"
              name="professorId"
              rules={[{ required: true, message: "Please select a professor!" }]}
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

        {/* Submit Button */}
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

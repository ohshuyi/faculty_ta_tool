import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form, Select, Button, Spin } from "antd";

const { Option } = Select;

const AdvancedSearchModalTask = ({ visible, onClose, onSearch, onReset }) => {
  const [form] = Form.useForm();
  const [teachingAssistants, setTeachingAssistants] = useState([]);
  const [courseCode, setCourseCodes] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTAs = useCallback(async () => {
    try {
      const response = await fetch(`/api/tas`);
      const data = await response.json();
      setTeachingAssistants(data);
    } catch (error) {
      console.error("Error fetching TAs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseCode = useCallback(async () => {
    try {
      const response = await fetch(`/api/classes`);
      const data = await response.json();
      setCourseCodes(data);
    } catch (error) {
      console.error("Error fetching CourseCode:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfessors = useCallback(async () => {
    try {
      const response = await fetch(`/api/professors`);
      const data = await response.json();
      setProfessors(data);
    } catch (error) {
      console.error("Error fetching Professors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchTAs();
      fetchCourseCode();
      fetchProfessors();
    }
  }, [visible, fetchTAs, fetchCourseCode, fetchProfessors]);

  const handleOk = () => {
    form.submit();
  };

  const handleSubmit = (values) => {
    console.log("Filter values:", values);
    onSearch(values);
    onClose();
  };

  const handleReset = () => {
    form.resetFields(); // Clear all form fields
    onReset(); // Trigger reset for the search list
    onClose(); // Close the modal
  };

  return (
    <Modal
      title="Advanced Search"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="reset" onClick={handleReset}>
          Reset
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Search
        </Button>,
      ]}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Teaching Assistant" name="teachingAssistant">
          <Select placeholder="Select a teaching assistant">
            {teachingAssistants.map((ta) => (
              <Option key={ta.id} value={ta.id}>
                {ta.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Course Code" name="courseCode">
          <Select placeholder="Select a Course Code">
            {courseCode.map((course) => (
              <Option key={course.courseCode} value={course.courseCode}>
                {course.courseCode}
              </Option>
            ))}
          </Select>
        </Form.Item>
       
      </Form>
    </Modal>
  );
};

export default AdvancedSearchModalTask;

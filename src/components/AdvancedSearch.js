"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  message,
} from "antd";

const { Option } = Select;

const AdvancedSearch = ({ onSearch }) => {
  const [courseCodes, setCourseCodes] = useState([]);
  const [tas, setTAs] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [statuses] = useState(["Pending", "Completed", "In Progress"]);

  // Fetch options for filters
  useEffect(() => {
    async function fetchFilters() {
      try {
        const courseResponse = await fetch("/api/courses");
        const courses = await courseResponse.json();
        setCourseCodes(courses);

        const taResponse = await fetch("/api/tas");
        const teachingAssistants = await taResponse.json();
        setTAs(teachingAssistants);

        const profResponse = await fetch("/api/professors");
        const profs = await profResponse.json();
        setProfessors(profs);
      } catch (error) {
        console.error("Error fetching filters:", error);
        message.error("Failed to load search options.");
      }
    }

    fetchFilters();
  }, []);

  // Handle form submission
  const handleSearch = (values) => {
    if (onSearch) {
      onSearch(values);
    }
  };

  // Handle clearing filters
  const handleClearFilters = (form) => {
    form.resetFields();
    if (onSearch) {
      onSearch({});
    }
  };

  return (
    <Form layout="vertical" onFinish={handleSearch}>
      <Row gutter={16}>
        {/* Course Code Filter */}
        <Col span={6}>
          <Form.Item label="Course Code" name="courseCode">
            <Select placeholder="Select a course code" allowClear>
              {courseCodes.map((course) => (
                <Option key={course.id} value={course.code}>
                  {course.code}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Course Type Filter */}
        <Col span={6}>
          <Form.Item label="Course Type" name="courseType">
            <Input placeholder="Enter course type" />
          </Form.Item>
        </Col>

        {/* TA Filter */}
        <Col span={6}>
          <Form.Item label="Teaching Assistant" name="taId">
            <Select placeholder="Select a TA" allowClear>
              {tas.map((ta) => (
                <Option key={ta.id} value={ta.id}>
                  {ta.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Professor Filter */}
        <Col span={6}>
          <Form.Item label="Professor" name="professorId">
            <Select placeholder="Select a professor" allowClear>
              {professors.map((professor) => (
                <Option key={professor.id} value={professor.id}>
                  {professor.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Task Status Filter */}
        <Col span={6}>
          <Form.Item label="Task Status" name="status">
            <Select placeholder="Select task status" allowClear>
              {statuses.map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16} justify="end">
        <Col>
          <Button
            htmlType="reset"
            onClick={(e) => handleClearFilters(e.target.form)}
          >
            Clear Filters
          </Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit">
            Search
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default AdvancedSearch;

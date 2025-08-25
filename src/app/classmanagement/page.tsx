"use client";
import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Modal, message, Spin, List, Input } from "antd";
import { UploadOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import AppLayout from "@/components/Layout";
import * as XLSX from "xlsx";

const { confirm } = Modal;

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null); // For modals
  const [isViewModalVisible, setIsViewModalVisible] = useState(false); // Modal to view students
  const [studentSearchQuery, setStudentSearchQuery] = useState(""); // Search query for students
  const [file, setFile] = useState(null); // File state
  const [uploadStatus, setUploadStatus] = useState(""); // Upload status message
  const fileInputRef = useRef(null);

  // Fetch classes from the API
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/management");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Handle "View Students" Modal
  const showViewStudentModal = (cls) => {
    setSelectedClass(cls);
    setStudentSearchQuery(""); // Reset the search query
    setIsViewModalVisible(true);
  };

  const closeViewStudentModal = () => {
    setIsViewModalVisible(false);
    setSelectedClass(null);
  };

  // Handle File Change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleClearFile = () => {
    setFile(null); // Clear the file from state
    setUploadStatus(""); // Clear any status message
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset the file input DOM element
    }
  };

  // Handle File Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/management", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadStatus("File uploaded successfully!");
        fetchClasses(); // Refresh the table after successful upload
        handleClearFile();
      } else {
        const error = await res.json();
        setUploadStatus(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  // Show confirmation modal before deleting
  const showDeleteConfirm = (classId) => {
    confirm({
      title: "Are you sure you want to delete this class?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        handleDeleteClass(classId);
      },
    });
  };

  // Handle Deletion of Class Group
  const handleDeleteClass = async (classId) => {
    try {
      const res = await fetch(`/api/management/${classId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        message.success("Class deleted successfully!");
        fetchClasses(); // Refresh the table after deletion
      } else {
        const error = await res.json();
        message.error(`Failed to delete class: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      message.error("An error occurred. Please try again.");
    }
  };

  // Filtered list of students based on search query
  const filteredStudents = selectedClass?.students.filter((student) =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  // Table columns with filters
  const columns = [
    {
      title: "Course Code",
      dataIndex: "courseCode",
      key: "courseCode",
    },
    { title: "Class Group", dataIndex: "classGroup", key: "classGroup" },
    { title: "Class Type", dataIndex: "classType", key: "classType" },
    {
      title: "Student Count",
      dataIndex: "students",
      key: "students",
      render: (students) => students?.length,
    },
    {
      title: "View Students",
      key: "viewStudents",
      render: (_, record) => (
        <Button type="link" onClick={() => showViewStudentModal(record)}>
          View Students
        </Button>
      ),
    },
    {
      title: "Delete",
      key: "delete",
      render: (_, record) => (
        <DeleteOutlined
          style={{ color: "red", cursor: "pointer" }}
          onClick={() => showDeleteConfirm(record.id)}
        />
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ padding: "24px" }}>
        {/* Upload Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "16px",
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
            Upload Class
          </h1>
          <form
            onSubmit={handleUpload}
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            {/* Group the input and clear icon together */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                ref={fileInputRef} // Attach the ref here
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                }}
              />
              {/* This icon appears only when a file is selected */}
              {file && (
                <DeleteOutlined
                  onClick={handleClearFile}
                  style={{ color: "red", cursor: "pointer", fontSize: "16px" }}
                  title="Clear selection"
                />
              )}
            </div>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Upload
            </button>
          </form>
          {uploadStatus && (
            <p style={{ marginTop: "8px", color: uploadStatus.includes("successfully") ? "green" : "red" }}>
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Class Table */}
        {loading ? (
          <Spin size="large" style={{ marginTop: "24px", display: "flex", justifyContent: "center" }} />
        ) : (
          <Table columns={columns} dataSource={classes} rowKey="id" style={{ marginTop: "24px" }} />
        )}

        {/* Modal to view students */}
        <Modal
          title={`Students in ${selectedClass?.courseCode} - ${selectedClass?.classGroup}`}
          visible={isViewModalVisible}
          onCancel={closeViewStudentModal}
          footer={null}
        >
          <div style={{ marginBottom: "16px" }}>
            <Input
              placeholder="Search for a student"
              onChange={(e) => setStudentSearchQuery(e.target.value)} // Update search query
              allowClear
            />
          </div>
          {selectedClass && selectedClass.students.length > 0 ? (
            <List
              dataSource={filteredStudents} // Use the filtered list
              renderItem={(student) => (
                <List.Item>
                  {student.name} ({student.studentCode})
                </List.Item>
              )}
            />
          ) : (
            <p>No students found for this class.</p>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
};

export default ClassManagement;

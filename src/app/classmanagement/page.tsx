"use client";
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, message, Upload, Spin, List, Input } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import AppLayout from "@/components/Layout";
import ClassUploader from "@/components/ClassUploader"; // Import ClassUploader component
import * as XLSX from "xlsx";

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null); // For modals
  const [isViewModalVisible, setIsViewModalVisible] = useState(false); // Modal to view students
  const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Modal to add students

  // Fetch classes from the API
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/classes");
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
    setIsViewModalVisible(true);
  };

  const closeViewStudentModal = () => {
    setIsViewModalVisible(false);
    setSelectedClass(null);
  };

  // Handle "Add Students" Modal
  const showAddStudentModal = (cls) => {
    setSelectedClass(cls);
    setIsAddModalVisible(true);
  };

  const closeAddStudentModal = () => {
    setIsAddModalVisible(false);
    setSelectedClass(null);
  };

  // Handle File Upload for Adding Students
  const handleFileUpload = async (info) => {
    const file = info.file;

    try {
      // Step 1: Read the file as binary
      const data = await file.arrayBuffer();

      // Step 2: Parse the Excel file
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Step 3: Validate the parsed data
      if (!jsonData.length) {
        message.error("The uploaded Excel file is empty.");
        return;
      }

      const students = jsonData.map((row) => ({
        name: row["Student Name"],
        studentCode: row["Student Code"],
        year: row["Year"],
        classId: selectedClass.id,
      }));

      console.log("Parsed Students:", students);

      // Step 4: Send the parsed data to the backend
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ students }),
      });

      if (response.ok) {
        message.success("Students added successfully!");
        fetchClasses(); // Refresh the class list
        setIsAddModalVisible(false);
      } else {
        const error = await response.json();
        message.error(`Failed to add students: ${error.message}`);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      message.error(
        "Failed to process file. Please ensure it is a valid Excel file."
      );
    }
  };

  // Table columns with filters
  const columns = [
    {
      title: "Course Code",
      dataIndex: "courseCode",
      key: "courseCode",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Course Code"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            style={{ width: "100%" }}
          >
            Search
          </Button>
        </div>
      ),
      onFilter: (value, record) =>
        record.courseCode
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    {
      title: "Course Name",
      dataIndex: "courseName",
      key: "courseName",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Course Name"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            style={{ width: "100%" }}
          >
            Search
          </Button>
        </div>
      ),
      onFilter: (value, record) =>
        record.courseName
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase()),
    },
    { title: "Group Code", dataIndex: "groupCode", key: "groupCode" },
    { title: "Group Type", dataIndex: "groupType", key: "groupType" },
    {
      title: "Student Count",
      dataIndex: "students",
      key: "students",
      render: (students) => students.length,
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
      title: "Add Students",
      key: "addStudents",
      render: (_, record) => (
        <Button type="primary" onClick={() => showAddStudentModal(record)}>
          Add Students
        </Button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ padding: "24px"}}>
        <div className="flex items-center gap-4 rounded-md shadow-md">
          <h1 className="text-lg font-semibold">Upload Class:</h1>
          {/* ClassUploader Component */}
          <ClassUploader onUploadSuccess={fetchClasses} />
        </div>
        {loading ? (
          <Spin size="large" />
        ) : classes.length === 0 ? (
          <p>No classes found</p>
        ) : (
          <Table columns={columns} dataSource={classes} rowKey="id" />
        )}

        {/* Modal to view students */}
        <Modal
          title={`Students in ${selectedClass?.courseCode} - ${selectedClass?.groupCode}`}
          visible={isViewModalVisible}
          onCancel={closeViewStudentModal}
          footer={null}
        >
          {selectedClass && selectedClass.students.length > 0 ? (
            <List
              dataSource={selectedClass.students}
              renderItem={(student) => (
                <List.Item>
                  {student.name} ( {student.studentCode} )
                </List.Item>
              )}
            />
          ) : (
            <p>No students found for this class.</p>
          )}
        </Modal>

        {/* Modal to add students */}
        <Modal
          title={`Add Students to ${selectedClass?.courseCode} - ${selectedClass?.groupCode}`}
          visible={isAddModalVisible}
          onCancel={closeAddStudentModal}
          footer={null}
        >
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={() => false} // Prevent automatic upload
            onChange={handleFileUpload}
          >
            <Button icon={<UploadOutlined />}>Upload Student Excel</Button>
          </Upload>
          <p style={{ marginTop: "10px" }}>
            Ensure the Excel file has the following columns:
          </p>
          <ul>
            <li>
              <b>Student Name</b>: Name of the student
            </li>
            <li>
              <b>Year</b>: Academic year of the student
            </li>
          </ul>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default ClassManagement;

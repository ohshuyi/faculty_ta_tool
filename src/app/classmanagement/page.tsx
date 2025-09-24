"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  Spin,
  List,
  Input,
  Card,
  Col,
  Row,
  Popconfirm,
  Select,
  Space,
  Form,
  Tabs,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import AppLayout from "@/components/Layout";
import * as XLSX from "xlsx";
import AssignTAsModal from "@/components/AssignTAsModal";
import { useSession } from "next-auth/react";

const { confirm } = Modal;
const { Option } = Select;

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- State for Modals ---
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [studentToAdd, setStudentToAdd] = useState(null);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [studentToMove, setStudentToMove] = useState(null);
  const [filteredMoveGroups, setFilteredMoveGroups] = useState([]);
  const [moveTargetClassId, setMoveTargetClassId] = useState(null);
  const [addStudentTab, setAddStudentTab] = useState("existing"); // To track the active tab
  const [newStudentForm] = Form.useForm();
  const [moveForm] = Form.useForm();
  const [courseCodeFilter, setCourseCodeFilter] = useState(null);
  const [classTypeFilter, setClassTypeFilter] = useState(null);
  const [isAssignTAsModalVisible, setIsAssignTAsModalVisible] = useState(false);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  // --- Data Fetching ---
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/management");
      let data = await response.json();

      // Ensure data is an array before sorting
      if (!Array.isArray(data)) {
        console.warn("API returned non-array data for classes:", data);
        data = []; // Default to an empty array to prevent sort errors
      }

      // --- START: NEW SORTING LOGIC ---

      // Define the desired sort order for class types
      const sortOrder = {
        Lab: 1,
        Tutorial: 2,
      };

      data.sort((a, b) => {
        // Assign a sort number to each class type (defaulting to 3 for others)
        const orderA = sortOrder[a.classType] || 3;
        const orderB = sortOrder[b.classType] || 3;

        // 1. Primary Sort: By class type (Lab before Tutorial)
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // 2. Secondary Sort: If types are the same, sort alphabetically by class group
        return a.classGroup.localeCompare(b.classGroup);
      });

      // --- END: NEW SORTING LOGIC ---

      setClasses(data); // Set the state with the newly sorted array
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllStudents = useCallback(async () => {
    try {
      const response = await fetch("/api/students");
      setAllStudents(await response.json());
    } catch (error) {
      message.error("Failed to fetch student list.");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClasses(), fetchAllStudents()]);
      setLoading(false);
    };

    if (status === "authenticated") {
      loadData();
    } else if (status === "unauthenticated") {
      // Handle unauthenticated state, e.g., redirect to login
      setLoading(false); // Stop loading if unauthenticated
    }
  }, [fetchClasses, fetchAllStudents, status]);

  useEffect(() => {
    // If no class is selected, do nothing.
    if (!selectedClass) return;

    // After the main 'classes' list is re-fetched, find the updated version
    // of the class we are currently viewing.
    const updatedClassInList = classes.find(c => c.id === selectedClass.id);

    // If we found it, update our 'selectedClass' state to match.
    // This will trigger a re-render of the modal with the fresh student list.
    if (updatedClassInList) {
      setSelectedClass(updatedClassInList);
    }

    // This effect should only run when the main `classes` array changes.
    // We disable the lint warning because we intentionally don't want to
    // include `selectedClass` as a dependency, which would cause a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  useEffect(() => {
    let newFilteredClasses = [...classes];

    // Apply course code filter
    if (courseCodeFilter) {
      newFilteredClasses = newFilteredClasses.filter(
        (cls) => cls.courseCode === courseCodeFilter
      );
    }

    // Apply class type filter
    if (classTypeFilter) {
      newFilteredClasses = newFilteredClasses.filter(
        (cls) => cls.classType === classTypeFilter
      );
    }

    setFilteredClasses(newFilteredClasses);
  }, [classes, courseCodeFilter, classTypeFilter]);

  // --- Event Handlers ---
  const handleAddStudent = async () => {
    if (!selectedClass) return;
    let success = false;

    if (addStudentTab === "existing") {
      if (!studentToAdd) return;
      try {
        await fetch(`/api/classes/${selectedClass.id}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: studentToAdd }),
        });
        message.success("Student added successfully!");
        success = true;
      } catch (error) {
        message.error("Failed to add student.");
      }
    } else { // 'new' tab
      try {
        const values = await newStudentForm.validateFields();
        const response = await fetch(`/api/classes/${selectedClass.id}/students/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create student.");
        }
        message.success("New student created and added successfully!");
        success = true;
      } catch (error) {
        message.error(error.message);
      }
    }

    if (success) {
      await fetchClasses();
      await fetchAllStudents();
      handleAddModalCancel();
      setIsAddModalVisible(false);
      newStudentForm.resetFields();
      setStudentToAdd(null);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClass) return;
    try {
      await fetch(`/api/classes/${selectedClass.id}/students/${studentId}`, {
        method: "DELETE",
      });
      message.success("Student removed successfully!");
      await fetchClasses();
    } catch (error) {
      message.error("Failed to remove student.");
    }
  };

  const handleMoveStudent = async () => {
    if (!studentToMove || !moveTargetClassId || !selectedClass) return;
    try {
      await fetch(`/api/students/${studentToMove.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromClassId: selectedClass.id,
          toClassId: moveTargetClassId,
        }),
      });
      message.success(`${studentToMove.name} moved successfully!`);
      await fetchClasses();
    } catch (error) {
      message.error("Failed to move student.");
    } finally {
      handleMoveModalCancel();
    }
  };

  // --- File Upload Handlers ---
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleUpload = async () => {
    if (!file) return message.error("Please select a file first.");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/management", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      message.success("Class list synced successfully!");
      handleClearFile();
      await fetchClasses();
    } catch (error) {
      message.error("Failed to process file.");
    }
  };

  const handleAddModalCancel = () => {
    setIsAddModalVisible(false);    // Hide the modal
    newStudentForm.resetFields();   // Clear the 'Create New Student' form fields
    setStudentToAdd(null);          // Clear the selection from the 'Add Existing' tab
    setAddStudentTab('existing');   // Reset the tabs to the default view
  };

  // --- Modal Control ---
  const showViewStudentModal = (cls) => {
    setSelectedClass(cls);
    setIsViewModalVisible(true);
  };

  const showMoveModal = (student) => {
    if (!selectedClass) return;

    // 1. Find all classes that have the SAME TYPE as the student's current class,
    //    but exclude the current class itself.
    const potentialGroups = classes.filter(
      (cls) => cls.classType === selectedClass.classType && cls.id !== selectedClass.id
    );

    // 2. Pre-load the state with this filtered list for the dropdown.
    setFilteredMoveGroups(potentialGroups);

    // 3. Set the student to move and open the modal.
    setStudentToMove(student);
    setIsMoveModalVisible(true);
  };

  const handleMoveModalCancel = () => {
    setIsMoveModalVisible(false);
    setStudentToMove(null);
    setFilteredMoveGroups([]);
    setMoveTargetClassId(null);
    moveForm.resetFields();
  };

  const showAddStudentModal = () => {
    if (!selectedClass) return;
    // Fetch only the students relevant to the selected class type
    fetchAllStudents(selectedClass.classType);
    setIsAddModalVisible(true);
  };

  const handleMoveClassTypeChange = (classType) => {
    const potentialGroups = classes.filter(
      (cls) => cls.classType === classType && cls.id !== selectedClass?.id
    );
    setFilteredMoveGroups(potentialGroups);
    setMoveTargetClassId(null);
  };

  const handleDeleteClass = async (classId) => {
    try {
      const res = await fetch(`/api/management/${classId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete class");
      }

      message.success("Class deleted successfully!");
      fetchClasses(); // Refresh the table after deletion
    } catch (error) {
      console.error("Error deleting class:", error);
      message.error("An error occurred while deleting the class.");
    }
  };

  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  // Filtered list of students for the view modal's search bar
  const filteredStudents = selectedClass?.students?.filter((student) =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(studentSearchQuery.toLowerCase())
  ) || [];

  const courseCodeOptions = useMemo(() => {
    return [...new Set(classes.map((cls) => cls.courseCode))];
  }, [classes]);

  // Create a unique list of class types for the filter dropdown
  const classTypeOptions = useMemo(() => {
    return [...new Set(classes.map((cls) => cls.classType))];
  }, [classes]);

  const columns = [
    { title: "Course Code", dataIndex: "courseCode", key: "courseCode" },
    { title: "Class Group", dataIndex: "classGroup", key: "classGroup" },
    { title: "Class Type", dataIndex: "classType", key: "classType" },
    {
      title: "Student Count",
      dataIndex: "students",
      key: "students",
      render: (students) => students?.length || 0,
    },
    {
      title: "Actions",
      key: "actions",
      align: 'left',
      render: (_, record) => (
        <Space size="middle">
          {userRole === 'PROFESSOR' || userRole === 'ADMIN' ? (
            <>
              <Button type="link" onClick={() => showViewStudentModal(record)}>
                Manage Class
              </Button>
              <Popconfirm
                title="Delete this class?"
                description="This action is permanent. Are you sure?"
                onConfirm={() => handleDeleteClass(record.id)}
                okText="Yes, Delete"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </>
          ) : (
            <Button type="link" onClick={() => showViewStudentModal(record)}>
              View Students
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (status === "loading" || loading) return <AppLayout><Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} /></AppLayout>;

  return (
    <AppLayout>
      <div style={{ padding: "24px" }}>
        <Card title="Upload New Class Roster" style={{ marginBottom: 24 }}>
          <Space>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            {file && <Button icon={<DeleteOutlined />} onClick={handleClearFile} danger />}
            <Button icon={<UploadOutlined />} onClick={handleUpload} type="primary" disabled={!file}>
              Upload and Sync
            </Button>
          </Space>
        </Card>

        {userRole === 'PROFESSOR' && (
          <Card title="Assign TAs" style={{ marginBottom: 24 }}>
            <Button onClick={() => setIsAssignTAsModalVisible(true)}>
              Assign TAs to Classes
            </Button>
          </Card>
        )}

        <Card title="Filter Classes" style={{ marginBottom: 24 }}>
          <Space wrap>
            <Select
              allowClear
              showSearch
              placeholder="Filter by Course Code"
              style={{ width: 200 }}
              onChange={(value) => setCourseCodeFilter(value)}
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {courseCodeOptions.map((code) => (
                <Option key={code} value={code}>{code}</Option>
              ))}
            </Select>

            <Select
              allowClear
              showSearch
              placeholder="Filter by Class Type"
              style={{ width: 200 }}
              onChange={(value) => setClassTypeFilter(value)}
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {classTypeOptions.map((type) => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="id"
        />

        <AssignTAsModal
          visible={isAssignTAsModalVisible}
          onCancel={() => setIsAssignTAsModalVisible(false)}
        />

        {/* Modal to VIEW and MANAGE students */}
        {selectedClass && (
          <Modal
            width={600}
            title={`Manage Roster: ${selectedClass.courseCode} - ${selectedClass.classGroup}`}
            open={isViewModalVisible}
            onCancel={() => setIsViewModalVisible(false)}
            // The "Add Student" button is removed from the footer
            footer={[
              <Button key="close" onClick={() => setIsViewModalVisible(false)}>
                Done
              </Button>,
            ]}
          >
            {/* The search bar remains here */}
            <Input
              placeholder="Search students in this class"
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              style={{ marginBottom: 16 }}
              allowClear
            />

            {/* The "Add Student" button is now placed here, below the search bar */}
            {(userRole === 'PROFESSOR' || userRole === 'ADMIN') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalVisible(true)}
                style={{ marginBottom: 16 }}
              >
                Add Student
              </Button>
            )}

            <List
              dataSource={filteredStudents}
              renderItem={(student) => (
                <List.Item
                  actions={[
                    (userRole === 'PROFESSOR' || userRole === 'ADMIN') && (
                      <Button key="move" type="link" onClick={() => showMoveModal(student)}>Move</Button>
                    ),
                    (userRole === 'PROFESSOR' || userRole === 'ADMIN') && (
                      <Popconfirm
                        key="remove"
                        title="Remove this student from the class?"
                        onConfirm={() => handleRemoveStudent(student.id)}
                      >
                        <Button icon={<UserDeleteOutlined />} type="text" danger />
                      </Popconfirm>
                    ),
                  ].filter(Boolean)}
                >
                  {student.name} ({student.studentCode})
                </List.Item>
              )}
            />
          </Modal>
        )}

        {/* Modal to ADD a student */}
        <Modal
          title={`Add Student to ${selectedClass?.courseCode} - ${selectedClass?.classGroup}`}
          open={isAddModalVisible}
          onOk={handleAddStudent}
          onCancel={handleAddModalCancel}
          okText="Add Student"
        >
          <Tabs defaultActiveKey="existing" onChange={(key) => setAddStudentTab(key)}>
            <Tabs.TabPane tab="Add Existing Student" key="existing">
              <Select
                showSearch
                placeholder="Search for an existing student to add"
                style={{ width: "100%" }}
                onChange={(value) => setStudentToAdd(value)}
                filterOption={(input, option) =>
                  (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {allStudents.map((student) => (
                  <Option key={student.id} value={student.id}>
                    {`${student.name} (${student.studentCode})`}
                  </Option>
                ))}
              </Select>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Create New Student" key="new">
              <Form form={newStudentForm} layout="vertical">
                <Form.Item name="name" label="Student Name" rules={[{ required: true }]}>
                  <Input placeholder="Enter student's full name" onChange={(e) => {
                    newStudentForm.setFieldsValue({ name: e.target.value.toUpperCase() });
                  }} />
                </Form.Item>
                <Form.Item name="studentCode" label="Student Code" rules={[{ required: true }]}>
                  <Input placeholder="Enter unique student code (e.g., KE001TAN)"
                    onChange={(e) => {
                      newStudentForm.setFieldsValue({ studentCode: e.target.value.toUpperCase() });
                    }} />
                </Form.Item>
                <Form.Item name="prog" label="Program" rules={[{ required: true }]}>
                  <Input placeholder="Enter student's program (e.g., CSC3, DSAI1)" />
                </Form.Item>
              </Form>
            </Tabs.TabPane>
          </Tabs>
        </Modal>

        {/* Modal to MOVE a student */}
        <Modal
          title={`Move ${studentToMove?.name}`}
          open={isMoveModalVisible}
          onOk={handleMoveStudent}
          onCancel={handleMoveModalCancel}
          okText="Confirm Move"
          okButtonProps={{ disabled: !moveTargetClassId }}
        >
          <p>
            Moving from <strong>{selectedClass?.classGroup}</strong> ({selectedClass?.classType}).
          </p>

          <Form form={moveForm} layout="vertical">
            <Form.Item
              label={`Select New ${selectedClass?.classType} Group`}
              name="toClassId"
            >
              <Select
                placeholder="Search or select a new class group"
                onChange={(value) => setMoveTargetClassId(value)}
                showSearch
                filterOption={filterOption}
              >
                {filteredMoveGroups.map((cls) => (
                  <Option key={cls.id} value={cls.id}>
                    {`${cls.courseCode} - ${cls.classGroup}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default ClassManagement;
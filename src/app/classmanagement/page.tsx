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
  Radio,
  Tag,
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
import { useCourse } from "@/context/CourseContext";

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
  const [addStudentTab, setAddStudentTab] = useState("existing"); 
  const [newStudentForm] = Form.useForm();
  const [moveForm] = Form.useForm();
  const [courseCodeFilter, setCourseCodeFilter] = useState(null);
  const [classTypeFilter, setClassTypeFilter] = useState(null);
  const [isAssignTAsModalVisible, setIsAssignTAsModalVisible] = useState(false);
  const [tas, setTAs] = useState<any[]>([]);
  const [selectedTaIdForEdit, setSelectedTaIdForEdit] = useState(null);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const { activeCourseCode, activeCourseRole } = useCourse();

  const effectiveRole = activeCourseRole || userRole;

  const [potentialMatches, setPotentialMatches] = useState([]);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState(null);
  const [newStudentData, setNewStudentData] = useState(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeCourseCode) queryParams.append('courseCode', activeCourseCode);
      const url = `/api/management?${queryParams.toString()}`;

      const response = await fetch(url);
      let data = await response.json();

      if (!Array.isArray(data)) {
        console.warn("API returned non-array data for classes:", data);
        data = []; 
      }

      const sortOrder = {
        Lab: 1,
        Tutorial: 2,
      };

      data.sort((a, b) => {
        
        const orderA = sortOrder[a.classType] || 3;
        const orderB = sortOrder[b.classType] || 3;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.classGroup.localeCompare(b.classGroup);
      });

      setClasses(data); 
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Failed to fetch classes.");
    } finally {
      setLoading(false);
    }
  }, [activeCourseCode]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const url = activeCourseCode ? `/api/students?courseCode=${activeCourseCode}` : "/api/students";
      const response = await fetch(url);
      setAllStudents(await response.json());
    } catch (error) {
      message.error("Failed to fetch student list.");
    }
  }, [activeCourseCode]);

  const fetchTAs = useCallback(async () => {
    try {
      const url = activeCourseCode ? `/api/tas?courseCode=${activeCourseCode}` : "/api/tas";
      const response = await fetch(url);
      if (response.ok) {
        setTAs(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch TAs", error);
    }
  }, [activeCourseCode]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClasses(), fetchAllStudents(), fetchTAs()]);
      setLoading(false);
    };

    if (status === "authenticated") {
      loadData();
    } else if (status === "unauthenticated") {
      
      setLoading(false); 
    }
  }, [fetchClasses, fetchAllStudents, fetchTAs, status, activeCourseCode]);

  useEffect(() => {
    
    if (!selectedClass) return;

    const updatedClassInList = classes.find(c => c.id === selectedClass.id);

    if (updatedClassInList) {
      setSelectedClass(updatedClassInList);
    }

  }, [classes]);

  useEffect(() => {
    let newFilteredClasses = [...classes];

    if (courseCodeFilter) {
      newFilteredClasses = newFilteredClasses.filter(
        (cls) => cls.courseCode === courseCodeFilter
      );
    }

    if (classTypeFilter) {
      newFilteredClasses = newFilteredClasses.filter(
        (cls) => cls.classType === classTypeFilter
      );
    }

    setFilteredClasses(newFilteredClasses);
  }, [classes, courseCodeFilter, classTypeFilter]);

  const handleAddStudent = async () => {
    if (!selectedClass) return;

    let success = false;
    let studentNameAdded = ''; // Store the name for the confirmation message

    try {
      // Logic for creating and adding a new student
      const values = await newStudentForm.validateFields();
      setNewStudentData(values); // Store data for potential confirmation step

      // Check for similar names in the same class type
      const searchResponse = await fetch(
        `/api/students/search?name=${encodeURIComponent(values.name)}&classType=${encodeURIComponent(selectedClass.classType)}`
      );
      if (!searchResponse.ok) throw new Error("Failed to check for duplicates.");
      const matches = await searchResponse.json();

      const similarNameMatches = matches.filter(s => s.studentCode.toUpperCase() !== values.studentCode.toUpperCase());

      if (similarNameMatches.length > 0) {
        // Found similar names: Show confirmation modal
        setPotentialMatches(similarNameMatches);
        setSelectedExistingStudentId(null);
        setIsConfirmModalVisible(true);
        // Do not mark as success yet, wait for confirmation modal
      } else {
        // No similar names found: Proceed directly to create
        await createNewStudent(values);
        success = true; // Mark as successful
        studentNameAdded = values.name;
      }
    } catch (error) {
      // Catch errors from API calls (like duplicate check or create)
      console.log(error.message || "An error occurred during the add process.");
    }

    // --- THIS BLOCK WAS MISSING ---
    // If the creation was directly successful (no duplicates found)
    if (success && !isConfirmModalVisible) {
      await fetchClasses();
      await fetchAllStudents();

      // Show Confirmation Dialog
      Modal.confirm({
        title: `${studentNameAdded} added successfully!`,
        content: 'Do you want to add another student?',
        okText: 'Yes, Add Another',
        cancelText: 'No, Close',
        onOk() {
          
          newStudentForm.resetFields();
          setNewStudentData(null);
          
        },
        onCancel() {
          
          handleAddModalCancel();
        },
      });
    }
  };

  const createNewStudent = async (studentData) => {
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}/students/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create student.");
      }
      message.success("New student created and added successfully!");
      await fetchClasses();
      await fetchAllStudents(); 
    } catch (error) {
      throw error; 
    }
  };

  const handleConfirmModalOk = async () => {
    let success = false;
    let studentNameProcessed = '';

    try {
      if (selectedExistingStudentId) {
        const studentToProcess = potentialMatches.find(s => s.id === selectedExistingStudentId);
        const isAlreadyInClass = studentToProcess.classes.some(c => c.id === selectedClass.id);

        if (isAlreadyInClass) {
          handleConfirmModalCancel(); // Close the selection modal
          Modal.confirm({
            title: 'Student Already in Class',
            content: `"${studentToProcess.name}" is already in this class. Would you like to create the new student profile you originally entered instead?`,
            okText: 'Yes, Create New',
            cancelText: 'No, Cancel',
            onOk: async () => {
              try {
                await createNewStudent(newStudentData);
                Modal.confirm({
                  title: `"${newStudentData.name}" created successfully!`,
                  content: 'Do you want to add another student?',
                  okText: 'Yes, Add Another',
                  cancelText: 'No, Close',
                  onOk: () => {
                    newStudentForm.resetFields();
                    setNewStudentData(null);
                    setIsAddModalVisible(true);
                  },
                  onCancel: () => {
                    handleAddModalCancel();
                  }
                });
              } catch (error) {
                
              }
            },
            onCancel: () => {
              handleAddModalCancel();
            }
          });
          return; 
        }

        const studentToMove = studentToProcess;
        const currentClassOfStudent = studentToMove.classes[0];

        if (!currentClassOfStudent) {
          message.error("Could not determine the student's current class.");
          return;
        }

        try {
          await fetch(`/api/students/${selectedExistingStudentId}/move`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromClassId: currentClassOfStudent.id,
              toClassId: selectedClass.id,
            }),
          });
          message.success(`${studentToMove.name} moved successfully!`);
          studentNameProcessed = studentToMove.name;
          success = true;
        } catch (error) {
          message.error("Failed to move student.");
        }

      } else {
        
        studentNameProcessed = newStudentData.name;
        await createNewStudent(newStudentData);
        success = true;
      }
    } catch (error) {
      
    } finally {
      if (success) {
        handleConfirmModalCancel(); 
      }
    }

    if (success) {
      await fetchClasses();
      await fetchAllStudents();

      Modal.confirm({
        title: `${studentNameProcessed} processed successfully!`,
        content: 'Do you want to add another student?',
        okText: 'Yes, Add Another',
        cancelText: 'No, Close',
        onOk() {
          newStudentForm.resetFields();
          setNewStudentData(null);
          setIsAddModalVisible(true);
        },
        onCancel() {
          handleAddModalCancel();
        },
      });
    }
  };

  const handleConfirmModalCancel = () => {
    setIsConfirmModalVisible(false);
    setPotentialMatches([]);
    setNewStudentData(null);
    setSelectedExistingStudentId(null);
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
      const studentNameMoved = studentToMove.name; 
      await fetchClasses();

      Modal.confirm({
        title: `${studentNameMoved} moved successfully!`,
        content: 'Do you want to move another student from this class?',
        okText: 'Yes, Move Another',
        cancelText: 'No, Close',
        onOk() {
          
          handleMoveModalCancel(); 
          
        },
        onCancel() {
          
          handleMoveModalCancel();
          setIsViewModalVisible(false); 
        },
      });
    } catch (error) {
      message.error("Failed to move student.");
    }
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleUpload = async () => {
    if (!file) return message.error("Please select a file first.");
    if (!activeCourseCode) return message.error("Please select an active course to upload a class list.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("activeCourseCode", activeCourseCode);

    try {
      const res = await fetch("/api/management", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }

      message.success("Class list synced successfully!");
      handleClearFile();
      await fetchClasses();
    } catch (error) {
      message.error(error.message || "Failed to process file.");
    }
  };

  const handleAddModalCancel = () => {
    setIsAddModalVisible(false);    
    newStudentForm.resetFields();   
    setStudentToAdd(null);          
    setAddStudentTab('existing');   
  };

  const showViewStudentModal = (cls) => {
    setSelectedClass(cls);
    setIsViewModalVisible(true);
  };

  const showMoveModal = (student) => {
    if (!selectedClass) return;

    const potentialGroups = classes.filter(
      (cls) => cls.classType === selectedClass.classType && cls.id !== selectedClass.id
    );

    setFilteredMoveGroups(potentialGroups);

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

  const handleDeleteClass = async (classId) => {
    try {
      const res = await fetch(`/api/management/${classId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete class");
      }

      message.success("Class deleted successfully!");
      fetchClasses(); 
    } catch (error) {
      console.error("Error deleting class:", error);
      message.error("An error occurred while deleting the class.");
    }
  };

  const handleUnassignAllClasses = async (taId) => {
    try {
      const res = await fetch(`/api/tas/${taId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: [] }), 
      });

      if (!res.ok) {
        throw new Error("Failed to unassign classes");
      }

      message.success("All classes unassigned successfully!");
      fetchTAs(); 
    } catch (error) {
      console.error("Error unassigning classes:", error);
      message.error("Failed to unassign classes.");
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
          {effectiveRole === 'PROFESSOR' || effectiveRole === 'ADMIN' || effectiveRole === 'COURSE_COORDINATOR' ? (
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

  const taColumns = [
    {
      title: "TA/Tutor Name",
      dataIndex: "name",
      key: "name",
      render: (text, record: any) => {
        const courseRole = record.courseRoles?.find((cr: any) => cr.courseCode === activeCourseCode);
        const roleToShow = courseRole ? courseRole.role : record.role;
        const tagColor = roleToShow === 'TUTOR' ? 'blue' : 'green';

        return (
          <div>
            <Space>
              <span>{text}</span>
              <Tag color={tagColor} style={{ fontSize: '10px' }}>{roleToShow}</Tag>
            </Space>
            {record.email && (
              <div style={{ fontSize: '12px', color: '#888' }}>
                ({record.email})
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: "Assigned Classes",
      dataIndex: "assignedClasses",
      key: "assignedClasses",
      render: (classes) => (
        classes && classes.length > 0 ? (
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {classes.map(c => (
              <li key={c.id}>{c.courseCode} - {c.classGroup} ({c.classType})</li>
            ))}
          </ul>
        ) : <span style={{ color: '#999' }}>No classes assigned</span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            size="small"
            onClick={() => {
              setSelectedTaIdForEdit(record.id);
              setIsAssignTAsModalVisible(true);
            }}
          >
            Edit Assignments
          </Button>
          {record.assignedClasses && record.assignedClasses.length > 0 && (
            <Popconfirm
              title="Unassign all classes?"
              description={`Are you sure you want to remove all classes from ${record.name}?`}
              onConfirm={() => handleUnassignAllClasses(record.id)}
              okText="Yes, Unassign All"
              cancelText="No"
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                title="Unassign All Classes"
              />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  if (status === "loading" || loading) return <AppLayout><Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} /></AppLayout>;

  return (
    <AppLayout>
      <div style={{ padding: "24px" }}>
        {(effectiveRole === 'PROFESSOR' || effectiveRole === 'ADMIN' || effectiveRole === 'COURSE_COORDINATOR') && (
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
        )}

        {}
        {(effectiveRole === 'PROFESSOR' || effectiveRole === 'ADMIN' || effectiveRole === 'COURSE_COORDINATOR') && (
          <Card title="Assign TAs/Tutors" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Button onClick={() => {
                setSelectedTaIdForEdit(null);
                setIsAssignTAsModalVisible(true);
              }}>
                Assign TAs/Tutors to Classes
              </Button>
            </div>
            <Table
              columns={taColumns}
              dataSource={tas.filter(ta => ta.assignedClasses && ta.assignedClasses.length > 0)}
              rowKey="id"
              pagination={false}
              size="small"
            />
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
          onCancel={() => {
            setIsAssignTAsModalVisible(false);
            setSelectedTaIdForEdit(null);
            fetchTAs(); 
          }}
          initialTaId={selectedTaIdForEdit}
        />

        {}
        {selectedClass && (
          <Modal
            width={600}
            title={`Manage Roster: ${selectedClass.courseCode} - ${selectedClass.classGroup}`}
            open={isViewModalVisible}
            onCancel={() => setIsViewModalVisible(false)}
            
            footer={[
              <Button key="close" onClick={() => setIsViewModalVisible(false)}>
                Done
              </Button>,
            ]}
          >
            {}
            <Input
              placeholder="Search students in this class"
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              style={{ marginBottom: 16 }}
              allowClear
            />

            {}
            {(effectiveRole === 'PROFESSOR' || effectiveRole === 'ADMIN' || effectiveRole === 'COURSE_COORDINATOR') && (
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
                    (effectiveRole === 'PROFESSOR' || effectiveRole === 'ADMIN' || effectiveRole === 'COURSE_COORDINATOR') && (
                      <Button key="move" type="link" onClick={() => showMoveModal(student)}>Move</Button>
                    ),
                    (effectiveRole === 'PROFESSOR' || effectiveRole === 'ADMIN' || effectiveRole === 'COURSE_COORDINATOR') && (
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

        {}
        <Modal
          title={`Add New Student to ${selectedClass?.courseCode} - ${selectedClass?.classGroup}`}
          open={isAddModalVisible}
          onOk={handleAddStudent} 
          onCancel={handleAddModalCancel}
          okText="Check & Add Student"
        
        >
          {}
          <Form form={newStudentForm} layout="vertical">
            <Form.Item name="name" label="Student Name" rules={[{ required: true }]}>
              <Input placeholder="Enter student's full name" onChange={(e) => {
                newStudentForm.setFieldsValue({ name: e.target.value.toUpperCase() });
              }} />
            </Form.Item>
            <Form.Item name="studentCode" label="Student Code" rules={[{ required: true }]}>
              <Input placeholder="Enter unique student code (e.g., KE001TAN)" onChange={(e) => {
                newStudentForm.setFieldsValue({ studentCode: e.target.value.toUpperCase() });
              }} />
            </Form.Item>
            <Form.Item name="prog" label="Program" rules={[{ required: true }]}>
              <Input placeholder="Enter student's program (e.g., CSC3, DSAI1)" />
            </Form.Item>
          </Form>
        </Modal>

        {}
        <Modal
          title="Potential Duplicate Found"
          open={isConfirmModalVisible}
          onOk={handleConfirmModalOk}
          onCancel={handleConfirmModalCancel}
          okText={selectedExistingStudentId ? "Move Selected Student" : "Create New Student Anyway"}
          cancelText="Cancel Add"
        >
          <p>We found existing students with similar names in this class type. Did you mean one of these?</p>
          <Radio.Group
            onChange={(e) => setSelectedExistingStudentId(e.target.value)}
            value={selectedExistingStudentId}
            style={{ width: '100%' }}
          >
            <List
              size="small"
              bordered
              dataSource={potentialMatches}
              renderItem={(student) => (
                <List.Item>
                  <Radio value={student.id}>
                    {student.name} ({student.studentCode}) - Currently in: {student.classes[0]?.classGroup || 'N/A'}
                  </Radio>
                </List.Item>
              )}
            />
          </Radio.Group>
          <p style={{ marginTop: '10px' }}>If none match, select &quot;Create New Student Anyway&quot; by leaving the list unselected.</p>
        </Modal>

        {}
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
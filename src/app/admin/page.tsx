"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Table, Select, Button, message, Input, Space, Modal, Form, Tag, AutoComplete, Divider } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/Layout";

const { Option } = Select;
const { Search } = Input;

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [courseForm] = Form.useForm();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddCourseModalVisible, setAddCourseModalVisible] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("USER");
  const [courseCodes, setCourseCodes] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users", { cache: 'no-store' });
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means it's created only once

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [session, status, router, fetchUsers]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        const uniqueCourseCodes: string[] = Array.from(new Set(data.map((c: any) => c.courseCode)));
        setCourseCodes(uniqueCourseCodes);
      } catch (e) {
        console.error("Failed to load course list", e);
      }
    };
    fetchCourses();
  }, []);
  const handleRoleChange = async (userId: any, data: any) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), // Send the entire object
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      message.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      message.error("Failed to update role");
    }
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      message.success("User deleted successfully");
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      setFilteredUsers((prevFilteredUsers) =>
        prevFilteredUsers.filter((user) => user.id !== userId)
      );
      setIsDeleteModalVisible(false); // Close the modal
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Failed to delete user");
    }
  };

  const handleAddUser = async (values) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add user");
      }

      message.success("User added successfully");
      setIsAddModalVisible(false); // Close the modal
      addForm.resetFields(); // Reset the form
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error adding user:", error);
      message.error(error.message);
    }
  };

  const showAddModal = () => {
    setIsAddModalVisible(true);
  };

  const showAddCourseModal = () => {
    setAddCourseModalVisible(true);
  };

  const handleAddModalCancel = () => {
    setIsAddModalVisible(false);
    addForm.resetFields();
  };

  const handleAddCourseCancel = () => {
    setAddCourseModalVisible(false);
    courseForm.resetFields();
  };

  const handleAddCourse = async (values: any) => {
    try {
      const response = await fetch('/api/courses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add course");
      }

      message.success("Course added successfully");
      setAddCourseModalVisible(false);
      courseForm.resetFields();

      // refresh course list locally
      if (!courseCodes.includes(values.courseCode.toUpperCase())) {
        setCourseCodes(prev => [...prev, values.courseCode.toUpperCase()].sort());
      }
    } catch (error: any) {
      console.error("Error adding course:", error);
      message.error(error.message);
    }
  };

  const handleUpdateClick = (user: any) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    form.setFieldsValue({
      role: user.role,
      labId: user.labId,
      courseRoles: user.courseRoles?.map((cr: any) => ({ courseCode: cr.courseCode, role: cr.role })) || []
    });
    setIsUpdateModalVisible(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalVisible(true); // Show the delete confirmation modal
  };

  const handleUpdateModalOk = async () => {
    try {
      const values = form.getFieldsValue();
      await handleRoleChange(selectedUser.id, values);
      setIsUpdateModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      message.error("Failed to update role");
    }
  };

  const handleDeleteModalOk = async () => {
    await handleDelete(selectedUser.id); // Call the delete handler
    setSelectedUser(null);
  };

  const handleModalCancel = () => {
    setIsUpdateModalVisible(false);
    setIsDeleteModalVisible(false);
    setSelectedUser(null);
  };

  const handleSearch = (value) => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(value.toLowerCase()) ||
        user.role.toLowerCase().includes(value.toLowerCase()) ||
        user.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Course Roles",
      dataIndex: "courseRoles",
      key: "courseRoles",
      render: (courseRoles: any) => (
        <Space wrap>
          {courseRoles?.map((cr: any) => (
            <Tag color="geekblue" key={`${cr.courseCode}-${cr.role}`}>
              {cr.courseCode}: {cr.role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleUpdateClick(record)}
            style={{ backgroundColor: "blue", borderColor: "blue" }}
          >
            Update
          </Button>
          <Button
            type="danger"
            onClick={() => handleDeleteClick(record)}
            style={{ color: "white", backgroundColor: "red" }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (status === "loading" || loading) {
    return <p>Loading...</p>;
  }

  return (
    <AppLayout>
      <Space
        direction="vertical"
        style={{ marginBottom: 16, width: "100%", padding: "16px" }}
      >
        <Space>
          <Search
            placeholder="Search by name, email, or role"
            onSearch={handleSearch}
            enterButton
            style={{ width: 400 }}
          />
          {/* Add the "Add User" button here */}
          <Button type="primary" onClick={showAddModal}>
            Add User
          </Button>
          <Button onClick={showAddCourseModal}>
            Add Course
          </Button>
        </Space>
      </Space>
      {/* <div className="table-side-borders-container"> */}
      <Table
        className="table-side-borders-container"
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        style={{ padding: "16px" }}
      />
      {/* </div>table-side-borders-container */}
      <Modal
        title="Add New User"
        open={isAddModalVisible}
        onOk={() => addForm.submit()}
        onCancel={handleAddModalCancel}
        okText="Add User"
        cancelText="Cancel"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddUser}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter the user's name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter the user's email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          {/* The Password Form.Item has been completely removed */}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
            initialValue="USER"
          >
            <Select onChange={(value) => setSelectedRole(value)}>
              <Option value="USER">USER</Option>
              <Option value="TA">TA</Option>
              <Option value="PROFESSOR">PROFESSOR</Option>
              <Option value="ADMIN">ADMIN</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">Course Roles (Optional)</Divider>
          <Form.List name="courseRoles">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'courseCode']}
                      rules={[{ required: true, message: 'Missing course code' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select Course Code"
                        style={{ width: 160 }}
                        options={courseCodes.map(c => ({ value: c, label: c }))}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'role']}
                      rules={[{ required: true, message: 'Missing role' }]}
                    >
                      <Select placeholder="Course Role" style={{ width: 180 }}>
                        {selectedRole !== 'TA' && <Option value="COURSE_COORDINATOR">COURSE_COORDINATOR</Option>}
                        {selectedRole !== 'TA' && <Option value="TUTOR">TUTOR</Option>}
                        {selectedRole !== 'PROFESSOR' && <Option value="TA">TA</Option>}
                      </Select>
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Course Role
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Modal for Add Course */}
      <Modal
        title="Add New Course"
        open={isAddCourseModalVisible}
        onOk={() => courseForm.submit()}
        onCancel={handleAddCourseCancel}
        okText="Add Course"
        cancelText="Cancel"
      >
        <Form form={courseForm} layout="vertical" onFinish={handleAddCourse}>
          <Form.Item
            name="courseCode"
            label="Course Code"
            rules={[{ required: true, message: "Please enter the course code (e.g., SC2207)" }]}
          >
            <Input placeholder="Course Code" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Course Name (Optional)"
          >
            <Input placeholder="Brief descriptive name" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for Update */}
      <Modal
        title="Update User Role"
        open={isUpdateModalVisible}
        onOk={handleUpdateModalOk}
        onCancel={handleModalCancel}
        okText="Update"
        cancelText="Cancel"
      >
        {selectedUser && (
          <Form form={form} layout="vertical">
            <Form.Item label="Name">
              <Input value={selectedUser.name} disabled />
            </Form.Item>
            <Form.Item label="Email">
              <Input value={selectedUser.email} disabled />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Please select a role" }]}
            >
              <Select onChange={(value) => setSelectedRole(value)}>
                <Option value="USER">USER</Option>
                <Option value="TA">TA</Option>
                <Option value="PROFESSOR">PROFESSOR</Option>
                <Option value="ADMIN">ADMIN</Option>
              </Select>
            </Form.Item>

            <Divider orientation="left">Course Roles (Optional)</Divider>
            <Form.List name="courseRoles">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'courseCode']}
                        rules={[{ required: true, message: 'Missing course code' }]}
                      >
                        <Select
                          showSearch
                          placeholder="Select Course Code"
                          style={{ width: 160 }}
                          options={courseCodes.map(c => ({ value: c, label: c }))}
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'role']}
                        rules={[{ required: true, message: 'Missing role' }]}
                      >
                        <Select placeholder="Course Role" style={{ width: 180 }}>
                          {selectedRole !== 'TA' && <Option value="COURSE_COORDINATOR">COURSE_COORDINATOR</Option>}
                          {selectedRole !== 'TA' && <Option value="TUTOR">TUTOR</Option>}
                          {selectedRole !== 'PROFESSOR' && <Option value="TA">TA</Option>}
                        </Select>
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Course Role
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

          </Form>
        )}
      </Modal>
      {/* Modal for Delete */}
      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={handleDeleteModalOk}
        onCancel={handleModalCancel}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{selectedUser?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </AppLayout>
  );
};

export default AdminPage;

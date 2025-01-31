"use client";

import React, { useEffect, useState } from "react";
import { Table, Select, Button, message, Input, Space, Modal, Form } from "antd";
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/"); // Redirect unauthorized users
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session, status, router]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      message.success("Role updated successfully");
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      setFilteredUsers((prevFilteredUsers) =>
        prevFilteredUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
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

  const handleUpdateClick = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({ role: user.role }); // Set initial role in the form
    setIsUpdateModalVisible(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalVisible(true); // Show the delete confirmation modal
  };

  const handleUpdateModalOk = async () => {
    try {
      const { role } = form.getFieldsValue();
      await handleRoleChange(selectedUser.id, role); // Update the user's role
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
  style={{ marginBottom: 16, width: "100%", padding: "16px" }} // Added padding
>
  <Search
    placeholder="Search by name, email, or role"
    onSearch={handleSearch}
    enterButton
    style={{ maxWidth: 400 }}
  />
</Space>
      <Table dataSource={filteredUsers} columns={columns} rowKey="id" />
      {/* Modal for Update */}
      <Modal
        title="Update User Role"
        visible={isUpdateModalVisible}
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
              <Select>
                <Option value="USER">USER</Option>
                <Option value="TA">TA</Option>
                <Option value="PROFESSOR">PROFESSOR</Option>
                <Option value="ADMIN">ADMIN</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
      {/* Modal for Delete */}
      <Modal
        title="Confirm Delete"
        visible={isDeleteModalVisible}
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

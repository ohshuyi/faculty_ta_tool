"use client";
import React, { useState } from "react";
import { Layout, Menu, theme, Modal, Button } from "antd";
import Link from "next/link"; // Import Next.js Link component
import { signOut } from "next-auth/react"; // Import signOut from NextAuth

const { Header, Content, Footer } = Layout;

const items = [
  {
    label: <Link href="/dashboard">Dashboard</Link>,
    key: "dashboard",
  },
  {
    label: <Link href="/task">Task</Link>,
    key: "task",
  },
  {
    label: <Link href="/ticket">Tickets</Link>,
    key: "ticket",
  },
  {
    label: <Link href="/history">History</Link>,
    key: "history",
  },
  {
    label: <Link href="/classmanagement">Management</Link>,
    key: "classmanagement",
  },
];

const AppLayout = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showLogoutModal = () => {
    setIsModalVisible(true);
  };

  const handleLogout = async () => {
    setIsModalVisible(false);
    // Call NextAuth's signOut function and redirect to /home
    await signOut({ callbackUrl: '/home' }); // Redirect to home page after logout
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Layout>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          items={[
            ...items,
            {
              label: (
                <Button type="link" style={{ color: "white" }} onClick={showLogoutModal}>
                  Logout
                </Button>
              ),
              key: "logout",
            },
          ]}
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
        />
      </Header>

      <Content>{children}</Content>

      <Footer style={{ textAlign: "center" }}>
        Ant Design ©{new Date().getFullYear()} Created for NTU - TA Faculty Tool
      </Footer>

      {/* Logout Confirmation Modal */}
      <Modal
        title="Confirm Logout"
        visible={isModalVisible}
        onOk={handleLogout}
        onCancel={handleCancel}
        okText="Yes, Logout"
        cancelText="Cancel"
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </Layout>
  );
};

export default AppLayout;

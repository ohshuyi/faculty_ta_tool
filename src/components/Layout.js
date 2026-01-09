"use client";
import React, { useState } from "react";
import { Layout, Menu, Modal, Button } from "antd";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const { Header, Content, Footer } = Layout;

const AppLayout = ({ children }) => {
  const { data: session } = useSession(); // Fetch session data
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showLogoutModal = () => {
    setIsModalVisible(true);
  };

  const handleLogout = async () => {
    setIsModalVisible(false);
    // test
    // Debugging
    console.log("Signing out...");

    await signOut({ callbackUrl: "/" })
      .then(() => console.log("User signed out successfully"))
      .catch((err) => console.error("Error signing out:", err));
  };


  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Define menu items for different roles
  const commonItems = [
    { label: <Link href="/dashboard">Dashboard</Link>, key: "dashboard" },
    { label: <Link href="/task">Task</Link>, key: "task" },
    { label: <Link href="/ticket">Tickets</Link>, key: "ticket" },
    { key: 'lab-issues', label: <Link href="/lab-issues">Lab Issues</Link> },
    { label: <Link href="/history">History</Link>, key: "history" },
    { key: 'timesheet', label: <Link href="/timesheet">Timesheet</Link> },
    { label: <Link href="/classmanagement">Management</Link>, key: "classmanagement" },
  ];

  const adminItems = [
    { label: <Link href="/admin">Admin Management</Link>, key: "adminmanagement" },
    { label: <Link href="/admin/labs">Manage Labs</Link>, key: "adminmanagement" },
  ];

  const labTechItems = [
    { label: <Link href="/dashboard">Dashboard</Link>, key: "dashboard" },
    { key: 'lab-issues', label: <Link href="/lab-issues">Lab Issues</Link> },
    { label: <Link href="/history">History</Link>, key: "history" },
  ]

  const logoutItem = {
    label: (
      <Button type="link" style={{ color: "white" }} onClick={showLogoutModal}>
        Logout {session?.user?.email ? `(${session.user.email})` : ""}
      </Button>
    ),
    key: "logout",
  };

  const userRole = session?.user?.role;

  let menuItems;
  if (userRole === "ADMIN") {
    menuItems = [...adminItems, logoutItem];
  } else if (userRole === "LAB_TECH") {
    menuItems = [...labTechItems, logoutItem];
  } else {
    menuItems = [...commonItems, logoutItem];
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* <Image src="/ntu.png" width={160} height={10} alt="NT U" />¬ */}

        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
        />
      </Header>

      <Content>{children}</Content>

      <Footer style={{ textAlign: "center" }}>
        Created for NTU - TA Faculty Tool
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

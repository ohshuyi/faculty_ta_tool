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
  
    // Debugging
    console.log("Signing out...");
  
    await signOut({ callbackUrl: "/home" })
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
    { label: <Link href="/history">History</Link>, key: "history" },
    { label: <Link href="/classmanagement">Management</Link>, key: "classmanagement" },
  ];

  const adminItems = [
    { label: <Link href="/admin">Admin Management</Link>, key: "adminmanagement" },
  ];

  const logoutItem = {
    label: (
      <Button type="link" style={{ color: "white" }} onClick={showLogoutModal}>
        Logout
      </Button>
    ),
    key: "logout",
  };

  // Check if the user is an admin
  const isAdmin = session?.user?.role === "ADMIN"; // Assuming `role` is stored in the session

  // Determine the menu items to display

  const menuItems = isAdmin
    ? [...adminItems, logoutItem]
    : [...commonItems, logoutItem];

  return (
    <Layout>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* <Image src="/ntu.png" width={160} height={10} alt="NTU" /> */}

        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
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

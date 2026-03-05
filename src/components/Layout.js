"use client";
import React, { useState } from "react";
import { Layout, Menu, Modal, Button, Select } from "antd";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useCourse } from "@/context/CourseContext";

const { Header, Content, Footer } = Layout;

const AppLayout = ({ children }) => {
  const { data: session } = useSession(); // Fetch session data
  const { activeCourseCode, setActiveCourseCode, availableCourses, activeCourseRole } = useCourse();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

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
    { label: <Link href="/history">History</Link>, key: "history" },
    { key: 'timesheet', label: <Link href="/timesheet">Timesheet</Link> },
    { label: <Link href="/classmanagement">Management</Link>, key: "classmanagement" },
  ];

  const adminItems = [
    { label: <Link href="/admin">Admin Management</Link>, key: "adminmanagement" },
  ];

  const logoutItemArr = [{
    label: (
      <Button type="link" style={{ color: "white" }} onClick={showLogoutModal}>
        Logout {session?.user?.email ? `(${session.user.email})` : ""}
      </Button>
    ),
    key: "logout",
  }];

  const userRole = session?.user?.role;

  let menuItems;
  if (userRole === "ADMIN") {
    menuItems = [...adminItems, ...logoutItemArr];
  } else {
    // Modify common items based on course role if needed
    let items = [...commonItems];
    // Removed restriction hides classmanagement for TAs/Tutors, as requested by the user
    menuItems = [...items, ...logoutItemArr];
  }

  const requiresCourseRoutes = ['/dashboard', '/task', '/ticket', '/history', '/timesheet', '/classmanagement'];
  const isCourseRequiredPage = requiresCourseRoutes.some(route => pathname.startsWith(route));

  let contentToRender = children;
  if (isCourseRequiredPage && !activeCourseCode) {
    if (availableCourses.length === 0) {
      contentToRender = (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>No Courses Assigned</h2>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>You currently have no courses assigned to your account.</p>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Please contact your administrator to be assigned to a course.</p>
          </div>
        </div>
      );
    } else {
      contentToRender = (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Select a Course</h2>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Please select a course from the dropdown menu in the top left corner</p>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>to view the information on this page.</p>
          </div>
        </div>
      );
    }
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* <Image src="/ntu.png" width={160} height={10} alt="NT U" /> */}
          {!isAdminPage && (
            <Select
              value={availableCourses.length === 0 ? 'none' : (activeCourseCode || undefined)}
              onChange={(value) => setActiveCourseCode(value)}
              style={{ width: 250, marginLeft: 20 }}
              disabled={availableCourses.length === 0}
              options={availableCourses.length === 0
                ? [{
                  value: 'none', label: (
                    <span style={{ color: 'rgba(255, 255, 255, 0.88)' }}>No courses assigned</span>
                  )
                }]
                : availableCourses.map((c) => ({
                  value: c.courseCode,
                  label: `${c.courseCode} (${c.role.replace('_', ' ')})`,
                }))}
            />
          )}
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
        />
      </Header>

      <Content style={{ padding: '24px' }}>{contentToRender}</Content>

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

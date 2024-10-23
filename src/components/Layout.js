"use client";
import React from "react";
import { Layout, Menu, theme } from "antd";
import Link from "next/link"; // Import Next.js Link component

const { Header, Content, Footer } = Layout;

const items = [
  {
    label: <Link href="/dashboard">Dashboard</Link>, // Wrap with Link
    key: "dashboard", // Provide a unique key
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
    label: <Link href="/contact">Contact</Link>,
    key: "contact",
  },
];

const AppLayout = ({ children }) => {


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
         
          items={items}
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
        />
      </Header>

      <Content>{children}</Content>
      <Footer style={{ textAlign: "center" }}>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
  );
};

export default AppLayout;

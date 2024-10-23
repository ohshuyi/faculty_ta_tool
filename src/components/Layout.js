"use client";
import React from "react";
import { Layout, Menu, theme } from "antd";

const { Header, Content, Footer } = Layout;

const items = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Task",
    href: "/task",
  },
  {
    label: "Tickets",
    href: "/services",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

const AppLayout = ({ children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
          defaultSelectedKeys={["2"]}
          items={items}
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }} // Added flex layout to Menu
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

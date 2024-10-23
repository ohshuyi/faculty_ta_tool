"use client";
import React, { useState } from "react";
import { Layout, Menu, theme } from "antd";

const { Sider, Content } = Layout;

const TwoColumnLayout = ({ items, renderContent }) => {
  const [selectedKey, setSelectedKey] = useState(items[0].key); // Set initial selection
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Function to handle selection from the left sidebar
  const onSelect = ({ key }) => {
    setSelectedKey(key);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Left Section - Scrollable List */}
      <Sider
        width={250}
        style={{
          background: "#fff",
          position: "sticky", // Change from fixed to sticky
          top: 0,             // Sticks to the top when scrolling
          height: "100vh",    // Full viewport height
          overflow: "auto",   // Allows the sider to be scrollable
        }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={[items[0].key]}
          onClick={onSelect}
          items={items.map((item) => ({
            key: item.key,
            label: item.title,
          }))}
        />
      </Sider>

      {/* Right Section - Dynamic Content */}
      <Layout style={{ padding: "24px" }}>
        <Content
          style={{
            padding: 24,
            minHeight: "100vh",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {renderContent(selectedKey)} {/* Render dynamic content based on the selected key */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default TwoColumnLayout;

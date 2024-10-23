"use client";
import React, { useState } from "react";
import { Layout, Menu, Input, Button, theme } from "antd";
import { PlusOutlined } from '@ant-design/icons';  // For the add ticket button

const { Sider, Content } = Layout;
const { Search } = Input;

const TwoColumnLayout = ({ items, renderContent, onAddTicket, userRole }) => {  // Receive userRole prop
  console.log("User Role in Layout:", userRole); // Check if the role is passed correctly
  const [selectedKey, setSelectedKey] = useState(items[0]?.key); // Handle if items are empty
  const [filteredItems, setFilteredItems] = useState(items); // Items filtered based on search
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Function to handle item selection from the left sidebar
  const onSelect = ({ key }) => {
    setSelectedKey(key);
  };

  // Function to handle the search
  const onSearch = (value) => {
    const filtered = items.filter((item) =>
      item.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Left Section - Scrollable List */}
      <Sider
        width={300} // Increased the width for more space
        style={{
          background: "#fff",
          position: "sticky", // Keeps it at the top when scrolling
          top: 0,             // Sticky behavior
          height: "100vh",    // Full viewport height
          overflow: "auto",   // Allows the sider to be scrollable
          padding: "16px",    // Add some padding
        }}
      >
        {/* Search Bar */}
        <Search
          placeholder="Search tickets"
          onSearch={onSearch}
          style={{ marginBottom: 16 }}
        />

        {/* Add New Ticket Button - Only visible if userRole is TA */}
        {userRole === 'TA' && (  // Check user role
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 16 }}
            onClick={onAddTicket} // Action to add a new ticket
          >
            Add New Ticket
          </Button>
        )}

        {/* Ticket List */}
        <Menu
          mode="inline"
          defaultSelectedKeys={[items[0]?.key]} // Prevent error if items is empty
          onClick={onSelect}
          items={filteredItems.map((item) => ({
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
          {renderContent(selectedKey)} {/* Render dynamic content based on selected key */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default TwoColumnLayout;

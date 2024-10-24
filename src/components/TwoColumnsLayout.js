"use client";
import React, { useState } from "react";
import { Layout, Menu, Input, Button, theme } from "antd";
import { PlusOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;
const { Search } = Input;

const TwoColumnsLayout = ({ items, renderContent, onAdd, userRole, showAddButton = true, type }) => {
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

    // Automatically set the selected key to the first filtered result if available
    if (filtered.length > 0) {
      setSelectedKey(filtered[0].key);
    } else {
      setSelectedKey(null); // Reset selectedKey if no items match the search
    }
  };

  // Logic for determining if the Add button should be shown
  const shouldShowAddButton = () => {
    if (type === 'task' && userRole === 'PROFESSOR') {
      return true; // Professors can add tasks
    } else if (type === 'ticket' && userRole === 'TA') {
      return true; // TAs can add tickets
    }
    return false;
  };

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Left Section - Scrollable List */}
      <Sider
        width={300}
        style={{
          background: "#fff",
          position: "sticky", // Keeps it at the top when scrolling
          top: 0,
          height: "100vh",
          overflow: "auto",
          padding: "16px",
        }}
      >
        {/* Search Bar */}
        <Search
          placeholder="Search"
          onSearch={onSearch}
          style={{ marginBottom: 16 }}
        />

        {/* Conditionally render the Add button based on role and type */}
        {showAddButton && shouldShowAddButton() && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 16 }}
            onClick={onAdd}
          >
            Add New {type === 'task' ? 'Task' : 'Ticket'}
          </Button>
        )}

        {/* List of items (tasks/tickets) */}
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
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
          {selectedKey ? renderContent(selectedKey) : <p>Select an item to view details</p>}
        </Content>
      </Layout>
    </Layout>
  );
};

export default TwoColumnsLayout;

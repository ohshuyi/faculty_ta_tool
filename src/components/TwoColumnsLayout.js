"use client";
import React, { useState, useEffect } from "react";
import { Layout, Collapse, Input, Button, Menu, Modal, Select, message } from "antd";
import { FilterOutlined, SettingOutlined, PlusOutlined } from "@ant-design/icons";
import AdvancedSearchModalTask from "./AdvancedSearchModalTask";
import AdvancedSearchModalTicket from "./AdvancedSearchModalTicket";

const { Sider, Content } = Layout;
const { Panel } = Collapse;
const { Option } = Select;
const { Search } = Input;

const TwoColumnsLayout = ({ items, renderContent, onAdd, userRole, showAddButton = true, type }) => {
  const [grouping, setGrouping] = useState("All"); // Default grouping is "All"
  const [groupedItems, setGroupedItems] = useState({});
  const [selectedKey, setSelectedKey] = useState(items[0]?.key || null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isGroupingModalVisible, setIsGroupingModalVisible] = useState(false); // Modal state for grouping options
  const [searchAndFilteredItems, setSearchAndFilteredItems] = useState(items); // Items after search and filtering

  // Group items dynamically based on search/filters and selected grouping
  useEffect(() => {
    const groupBy = searchAndFilteredItems.reduce((acc, item) => {
      let groupKey;

      if (grouping === "All") {
        groupKey = "All Tickets"; // Show all tickets under one group
      } else if (grouping === "professor") {
        groupKey = item.professor.name || "Uncategorized"; // Group by professor name
      } else if (grouping === "category") {
        groupKey = item.category || "Uncategorized"; // Group by category
      } else if (grouping === "ta") {
        groupKey = item.tas.name || "Uncategorized"; // Assuming TA is directly available in the item
      } else if (grouping === "courseCode") {
        groupKey = item.courseCode || "Uncategorized"; // Group by course code
      } else {
        groupKey = item[grouping] || "Uncategorized"; // Group by direct key (e.g., priority)
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    setGroupedItems(groupBy);
  }, [searchAndFilteredItems, grouping]);

  // Handle search
  const onSearch = (value) => {
    const filtered = items.filter((item) => item.title.toLowerCase().includes(value.toLowerCase()));
    if (filtered.length === 0) {
      message.warning("No results found for the search query.");
    }
    setSearchAndFilteredItems(filtered);
    if (filtered.length > 0) setSelectedKey(filtered[0]?.key);
  };

  const handleResetSearch = () => {
    setSearchAndFilteredItems(items);
  };

  // Handle advanced search for tasks
  const handleAdvancedSearchTask = (filters) => {
    const { teachingAssistant, courseCode } = filters;
    const filtered = items.filter((item) => {
      const matchesTA = teachingAssistant ? item.tas.id === teachingAssistant : true;
      const matchesCourseCode = courseCode ? item.courseCode === courseCode : true;
      return matchesTA && matchesCourseCode;
    });

    if (filtered.length === 0) {
      message.warning("No results found for the selected filters.");
    }

    setSearchAndFilteredItems(filtered);
    setSelectedKey(filtered[0]?.key || null);
  };

  // Handle advanced search for tickets
  const handleAdvancedSearchTicket = (filters) => {
    const { priority, courseCode, professor, category } = filters;
    const filtered = items.filter((item) => {
      const matchesPriority = priority ? item.priority === priority : true;
      const matchesCourseCode = courseCode ? item.courseCode === courseCode : true;
      const matchesProfessor = professor ? item.professor.id === professor : true;
      const matchesCategory = category ? item.category === category : true;
      return matchesPriority && matchesCourseCode && matchesProfessor && matchesCategory;
    });

    if (filtered.length === 0) {
      message.warning("No results found for the selected filters.");
    }

    setSearchAndFilteredItems(filtered);
    setSelectedKey(filtered[0]?.key || null);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        width={450}
        style={{ background: "#fff", padding: "16px", overflow: "auto" }}
        
        // --- Add these responsive props ---
        breakpoint="md" // The screen width at which the sidebar will collapse (md = 768px)
        collapsedWidth="0" // Hides the sidebar completely and shows a trigger button
      >
        <div className="flex gap-2 mb-4">
          <Search placeholder="Search" onSearch={onSearch} />
          {type !== "history" && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsModalVisible(true)}
            />
          )}
          <Button
            icon={<SettingOutlined />}
            onClick={() => setIsGroupingModalVisible(true)}
          />
        </div>

        {showAddButton &&
          ((type === "task" && userRole === "PROFESSOR") ||
            (type === "ticket" && userRole === "TA")) && (
            <Button type="primary" icon={<PlusOutlined />} block onClick={onAdd}>
              Add New {type === "task" ? "Task" : "Ticket"}
            </Button>
          )}

        <Collapse defaultActiveKey={["All Tickets"]} ghost>
          {Object.keys(groupedItems).map((group) => (
            <Panel header={group} key={group}>
              <Menu
                mode="inline"
                selectedKeys={selectedKey ? [selectedKey] : []}
                onClick={({ key }) => setSelectedKey(key)}
                items={groupedItems[group].map((item) => ({
                  key: item.key,
                  label: item.title,
                  style: {
                    textDecoration:
                      item.status === "completed" ? "line-through" : "none",
                    opacity: item.status === "completed" ? 0.6 : 1,
                  },
                }))}
              />
            </Panel>
          ))}
        </Collapse>
      </Sider>

      {/* This part remains the same and will correctly expand to full-width on mobile */}
      <Layout style={{ padding: "24px", overflow: "auto" }}>
        <Content
          style={{ padding: 24, background: "#f0f2f5", borderRadius: 8 }}
        >
          {selectedKey ? (
            renderContent(selectedKey)
          ) : (
            <p>Select an item to view details</p>
          )}
        </Content>
      </Layout>

      {/* Grouping Selection Modal */}
      <Modal
        title="Select Grouping Criteria"
        open={isGroupingModalVisible} // Use 'open' instead of deprecated 'visible'
        onOk={() => setIsGroupingModalVisible(false)}
        onCancel={() => setIsGroupingModalVisible(false)}
      >
        <Select
          value={grouping}
          onChange={setGrouping}
          style={{ width: "100%" }}
        >
          {type === "history" ? (
            <>
              <Option value="All">All Tickets</Option>
              <Option value="courseCode">Course Code</Option>
            </>
          ) : type === "task" ? (
            <>
              <Option value="All">All Tickets</Option>
              <Option value="courseCode">Course Code</Option>
              <Option value="ta">Teaching Assistant</Option>
            </>
          ) : (
            <>
              <Option value="All">All Tickets</Option>
              <Option value="priority">Priority</Option>
              <Option value="professor">Professor</Option>
              <Option value="category">Category</Option>
              <Option value="courseCode">Course Code</Option>
            </>
          )}
        </Select>
      </Modal>

      {/* Advanced Search Modals */}
      {type === "task" ? (
        <AdvancedSearchModalTask
          onReset={handleResetSearch}
          open={isModalVisible} // Use 'open' instead of deprecated 'visible'
          onClose={() => setIsModalVisible(false)}
          onSearch={handleAdvancedSearchTask}
        />
      ) : (
        <AdvancedSearchModalTicket
          onReset={handleResetSearch}
          open={isModalVisible} // Use 'open' instead of deprecated 'visible'
          onClose={() => setIsModalVisible(false)}
          onSearch={handleAdvancedSearchTicket}
        />
      )}
    </Layout>
  );
};

export default TwoColumnsLayout;

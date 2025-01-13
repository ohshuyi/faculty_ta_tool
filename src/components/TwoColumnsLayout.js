"use client";
import React, { useState } from "react";
import { Layout, Menu, Input, Button } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import AdvancedSearchModalTask from "./AdvancedSearchModalTask"; // Import the new component
import AdvancedSearchModalTicket from "./AdvancedSearchModalTicket";
const { Sider, Content } = Layout;
const { Search } = Input;


const TwoColumnsLayout = ({ items, renderContent, onAdd, userRole, showAddButton = true, type }) => {
  console.log("Type ")
  console.log(type)
  const [selectedKey, setSelectedKey] = useState(items[0]?.key); // Handle if items are empty
  const [filteredItems, setFilteredItems] = useState(items); // Items filtered based on search
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state



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

    if (filtered.length > 0) {
      setSelectedKey(filtered[0].key);
    } else {
      setSelectedKey(null);
    }
  };

  const handleResetSearch = () => {
    console.log("Resetting search...");
    setFilteredItems(items); // Reset filtered items to the original list
  };
  console.log("items")
  console.log(items)
  // Advanced search function
  const handleAdvancedSearchTask = (filters) => {
    console.log("Filters received:", filters); // Debug: Verify filters
    const { teachingAssistant, courseCode, professor } = filters;


    // Filter items based on provided conditions
    const filtered = items.filter((item) => {
      const matchesTA = teachingAssistant ? item.tas === teachingAssistant : true;
      const matchesCourseCode = courseCode ? item.courseCode === courseCode : true;
      const matchesProfessor = professor ? item.professor === professor : true;
    
      return matchesTA && matchesCourseCode && matchesProfessor
    
    });

    setFilteredItems(filtered);
    setSelectedKey(filtered[0]?.key || null); // Automatically select the first filtered item, or reset if no results
  };

  const handleAdvancedSearchTicket = (filters) => {
    console.log("Filters received:", filters); // Debug: Verify filters
    const { priority, courseCode, professor, category } = filters;


    // Filter items based on provided conditions
    const filtered = items.filter((item) => {
      // const matchesTA = teachingAssistant ? item.tas === teachingAssistant : true;
      const matchesCourseCode = courseCode ? item.courseCode === courseCode : true;
      const matchesProfessor = professor ? item.professor === professor : true;
      const matchesPriority = priority ? item.priority === priority : true;
      const matchesCategory = category ? item.category === category : true;
      return matchesProfessor && matchesCourseCode && matchesPriority && matchesCategory
      return matchesTA && matchesCourseCode && matchesProfessor
    
    });

    setFilteredItems(filtered);
    setSelectedKey(filtered[0]?.key || null); // Automatically select the first filtered item, or reset if no results
  };
  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        width={450}
        style={{
          background: "#fff",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
          padding: "16px",
        }}
      >
        <div className="flex gap-2">
          <Search
            placeholder="Search"
            onSearch={onSearch}
            style={{ marginBottom: 16 }}
          />
          {type != "history" &&  <Button onClick={() => setIsModalVisible(true)}>Advanced</Button>}
        
        </div>
        {showAddButton && (type === "task" && userRole === "PROFESSOR" || type === "ticket" && userRole === "TA") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            style={{ marginBottom: 16 }}
            onClick={onAdd}
          >
            Add New {type === "task" ? "Task" : "Ticket"}
          </Button>
        )}
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
      <Layout style={{ padding: "24px" }}>
        <Content
          style={{
            padding: 24,
            minHeight: "100vh",
            background: "#f0f2f5",
            borderRadius: 8,
          }}
        >
          {selectedKey ? renderContent(selectedKey) : <p>Select an item to view details</p>}
        </Content>
      </Layout>

      { type == "task" ?  <AdvancedSearchModalTask
       onReset={handleResetSearch}
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSearch={handleAdvancedSearchTask}
      /> : <AdvancedSearchModalTicket
      onReset={handleResetSearch}
       visible={isModalVisible}
       onClose={() => setIsModalVisible(false)}
       onSearch={handleAdvancedSearchTicket}
     /> }
      {/* Advanced Search Modal */}
     
    </Layout>
  );
};

export default TwoColumnsLayout;

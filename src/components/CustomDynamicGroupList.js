import React, { useState, useEffect } from "react";
import { Collapse, List, Avatar, Select } from "antd";

const { Panel } = Collapse;
const { Option } = Select;

// Sample ticket data
const ticketsData = [
  { id: 1, ticketDescription: "Fix backend issue", priority: "high", professor: "Prof. John Doe", ta: "TA Mark Lee" },
  { id: 2, ticketDescription: "Update syllabus", priority: "medium", professor: "Prof. Jane Smith", ta: "TA Anna Kim" },
  { id: 3, ticketDescription: "Review project submission", priority: "high", professor: "Prof. John Doe", ta: "TA Mark Lee" },
  { id: 4, ticketDescription: "Prepare lab materials", priority: "low", professor: "Prof. Jane Smith", ta: "TA Anna Kim" },
];

const CustomDynamicGroupList = () => {
  const [grouping, setGrouping] = useState("priority");
  const [groupedData, setGroupedData] = useState({});

  // Dynamically group tickets based on the selected criterion
  const groupTickets = () => {
    const grouped = ticketsData.reduce((acc, ticket) => {
      const key = ticket[grouping] || "Uncategorized";  // Group by dynamic key
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ticket);
      return acc;
    }, {});
    setGroupedData(grouped);
  };

  // Re-group tickets when the user changes the grouping criteria
  useEffect(() => {
    groupTickets();
  }, [grouping]);

  return (
    <div style={{ padding: "16px" }}>
      <Select
        value={grouping}
        onChange={(value) => setGrouping(value)}
        style={{ marginBottom: "16px", width: "250px" }}
      >
        <Option value="priority">Priority</Option>
        <Option value="professor">Professor</Option>
        <Option value="ta">Teaching Assistant</Option>
      </Select>

      <Collapse defaultActiveKey={Object.keys(groupedData)} ghost>
        {Object.keys(groupedData).map((group) => (
          <Panel header={group} key={group}>
            <List
              itemLayout="horizontal"
              dataSource={groupedData[group]}
              renderItem={(ticket) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: "#87d068" }}>{ticket.ticketDescription[0]}</Avatar>}
                    title={<strong>{ticket.ticketDescription}</strong>}
                    description={`Assigned by ${ticket.professor}`}
                  />
                </List.Item>
              )}
            />
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default CustomDynamicGroupList;

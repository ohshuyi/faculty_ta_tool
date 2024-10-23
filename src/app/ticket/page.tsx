"use client";
import React, { useState } from "react";
import { Layout, Descriptions, Tag, List } from "antd";
import AppLayout from '@/components/Layout';
import TwoColumnsLayout from '@/components/TwoColumnsLayout';

import { tickets } from '@/data/ticketsData'; // Adjust path as needed

// Ticket Priority Tag
const getPriorityTag = (priority: string) => {
  const color = priority === "high" ? "red" : priority === "medium" ? "orange" : "green";
  return <Tag color={color}>{priority.toUpperCase()}</Tag>;
};

export default function TicketPage() {
  const [selectedTicket, setSelectedTicket] = useState(tickets[0]); // Default to the first ticket

  // Function to render ticket details on the right
  const renderTicketDetails = (key: string) => {
    const ticket = tickets.find((ticket) => ticket.ticketNumber === key);

    if (!ticket) {
      return <div>Ticket not found</div>;
    }

    return (
      <>
        <Descriptions title={`Ticket Details: ${ticket.ticketNumber}`} bordered>
          <Descriptions.Item label="Description">{ticket.ticketDescription}</Descriptions.Item>
          <Descriptions.Item label="Course Group">{ticket.courseGroupType}</Descriptions.Item>
          <Descriptions.Item label="Category">{ticket.category}</Descriptions.Item>
          <Descriptions.Item label="Student">{ticket.student}</Descriptions.Item>
          <Descriptions.Item label="Details">{ticket.details}</Descriptions.Item>
          <Descriptions.Item label="Professor">{ticket.prof}</Descriptions.Item>
          <Descriptions.Item label="TA">{ticket.ta}</Descriptions.Item>
          <Descriptions.Item label="Priority">{getPriorityTag(ticket.priority)}</Descriptions.Item>
        </Descriptions>

        <h3>Comments</h3>
        <List
          dataSource={ticket.comments}
          renderItem={(comment) => (
            <List.Item>
              <div>
                <strong>{comment.author}: </strong>{comment.content}
              </div>
            </List.Item>
          )}
        />
      </>
    );
  };

  return (
    <AppLayout>
      <TwoColumnsLayout
        items={tickets.map((ticket) => ({
          key: ticket.ticketNumber,
          title: ticket.ticketDescription,
        }))}
        renderContent={renderTicketDetails}
      />
    </AppLayout>
  );
}

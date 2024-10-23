"use client";
import React, { useState, useEffect } from "react";
import { Layout, Descriptions, Tag, List, Spin, Alert, Button } from "antd";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/Layout";
import TwoColumnsLayout from "@/components/TwoColumnsLayout";
import AddTicketModal from "@/components/AddTicketModal"; // Import the modal component
import { Ticket } from "@/lib/types";

const getPriorityTag = (priority: string) => {
  const color =
    priority === "high" ? "red" : priority === "medium" ? "orange" : "green";
  return <Tag color={color}>{priority.toUpperCase()}</Tag>;
};

export default function TicketPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility

  // Function to fetch tickets (used on page load and after adding a new ticket)
  const fetchTickets = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch("/api/tickets");
      const data = await response.json();
      setTickets(data);
      setSelectedTicket(data[0]); // Default to the first ticket
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoading(false); // Set loading to false if there's an error
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    } else {
      setLoading(false); // Stop loading if the user is not authenticated
    }
  }, [status]);

  const renderTicketDetails = (key: any) => {
    const ticket = tickets.find(
      (ticket: Ticket) => ticket.ticketNumber === key
    );

    if (!ticket) return <div>Ticket not found</div>;

    return (
      <>
        <Descriptions title={`Ticket Details: ${ticket.ticketNumber}`} bordered>
          <Descriptions.Item label="Description">
            {ticket.ticketDescription}
          </Descriptions.Item>
          <Descriptions.Item label="Course Group">
            {ticket.courseGroupType}
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            {ticket.category}
          </Descriptions.Item>
          <Descriptions.Item label="Student">
            {ticket.student}
          </Descriptions.Item>
          <Descriptions.Item label="Details">
            {ticket.details}
          </Descriptions.Item>
          <Descriptions.Item label="Professor">
            {ticket.professor.name}
          </Descriptions.Item>
          <Descriptions.Item label="TA">{ticket.ta.name}</Descriptions.Item>
          <Descriptions.Item label="Priority">
            {getPriorityTag(ticket.priority)}
          </Descriptions.Item>
        </Descriptions>

        <h3>Comments</h3>
        <List
          dataSource={ticket.comments}
          renderItem={(comment) => (
            <List.Item>
              <div>
                <strong>{comment.author}: </strong>
                {comment.content}
              </div>
            </List.Item>
          )}
        />
      </>
    );
  };

  // Function to show the Add Ticket Modal
  const showModal = () => {
    setIsModalVisible(true);
  };

  // Function to close the Add Ticket Modal
  const closeModal = () => {
    setIsModalVisible(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <Spin size="large" />
      </AppLayout>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Alert
        message="You must be logged in to view tickets."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <AppLayout>
      {tickets.length === 0 ? (
        <Alert message="No tickets available." type="info" showIcon />
      ) : (
        <TwoColumnsLayout
          items={tickets.map((ticket) => ({
            key: ticket.ticketNumber,
            title: ticket.ticketDescription,
          }))}
          renderContent={renderTicketDetails}
          onAddTicket={showModal}
        />
      )}

      {/* Add Ticket Modal */}
      <AddTicketModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onTicketAdded={fetchTickets}
      />
    </AppLayout>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import {
  Layout,
  Descriptions,
  Tag,
  List,
  Spin,
  Alert,
  Button,
  Modal,
  Form,
  message,
  Divider,
} from "antd";
import { FileOutlined } from "@ant-design/icons"; // Import the file icon
import { useSession } from "next-auth/react";
import AppLayout from "@/components/Layout";
import TwoColumnsLayout from "@/components/TwoColumnsLayout";
import AddTicketModal from "@/components/AddTicketModal";
import { Ticket } from "@/lib/types";
import TextArea from "antd/es/input/TextArea";

const getPriorityTag = (priority: string) => {
  const color =
    priority === "high" ? "red" : priority === "medium" ? "orange" : "green";
  return <Tag color={color}>{priority.toUpperCase()}</Tag>;
};

export default function TicketPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null); // Ensure initial null value
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  console.log(tickets)
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tickets");
      const data = await response.json();
      setTickets(data);
      setSelectedTicket(data[0]); // Default to the first ticket
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    }
  };

  const fetchComments = async (ticketNumber: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketNumber}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment || !selectedTicket) {
      message.warning(
        "Please enter a comment and ensure a ticket is selected."
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/tickets/${selectedTicket.ticketNumber}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: session.user.name,
            content: newComment,
          }),
        }
      );

      if (response.ok) {
        message.success("Comment added successfully.");
        setNewComment("");
        fetchComments(selectedTicket.ticketNumber);
      } else {
        message.error("Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      message.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [status]);

  // Use useEffect to fetch comments when selectedTicket changes
  useEffect(() => {
    if (selectedTicket?.ticketNumber) {
      fetchComments(selectedTicket.ticketNumber);
    }
  }, [selectedTicket]);

  const renderTicketDetails = (ticket: Ticket) => {
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontWeight: "bold" }}>
            Ticket Details: {ticket.ticketNumber}
          </h2>

          {session?.user?.role === "PROFESSOR" && (
            <Button
              type="primary"
              danger
              onClick={() => setIsCloseModalVisible(true)}
            >
              Close Ticket
            </Button>
          )}
        </div>
        <Descriptions bordered>
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
        {/* Display Files Section */}
        {ticket.files?.length > 0 && (
          <>
            <Divider />
            <h3>Attached Files</h3>
            <List
              dataSource={ticket.files}
              renderItem={(file) => (
                <List.Item>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Button
                      type="link"
                      icon={<FileOutlined />}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      {file.fileName}
                    </Button>
                  </a>
                </List.Item>
              )}
            />
          </>
        )}

        <Divider />

        <h3
          style={{
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          Comments
        </h3>
        <List
          dataSource={comments}
          renderItem={(comment) => (
            <List.Item>
              <div>
                {comment.author}: {}
                {comment.content}
              </div>
            </List.Item>
          )}
        />

        <h3>Add a Comment</h3>
        <Form onFinish={handleCommentSubmit}>
          <Form.Item>
            <TextArea
              rows={4}
              placeholder="Write your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add Comment
            </Button>
          </Form.Item>
        </Form>

        <Modal
          title="Confirm Close Ticket"
          visible={isCloseModalVisible}
          onOk={() => handleCloseTicket(ticket.ticketNumber)}
          onCancel={() => setIsCloseModalVisible(false)}
          okText="Close Ticket"
          cancelText="Cancel"
        >
          <p>Are you sure you want to close this ticket?</p>
        </Modal>
      </>
    );
  };

  const handleCloseTicket = async (ticketNumber: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketNumber}`, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log("Ticket closed successfully");
        setIsCloseModalVisible(false);
        fetchTickets();
      } else {
        console.error("Failed to close the ticket");
      }
    } catch (error) {
      console.error("Error closing the ticket:", error);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

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
          renderContent={(key) => {
            const ticket = tickets.find(
              (ticket) => ticket.ticketNumber === key
            );
            if (ticket) {
              setSelectedTicket(ticket);
              return renderTicketDetails(ticket);
            }
          }}
          onAddTicket={showModal}
          userRole={session?.user?.role}
        />
      )}
      <AddTicketModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onTicketAdded={fetchTickets}
      />
    </AppLayout>
  );
}

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
import { FileOutlined } from "@ant-design/icons"; 
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async (status = "open") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets?status=${status}`);
      const data = await response.json();
      
      if (data.length > 0) {
        setTickets(data);
        setSelectedTicket(data[0]);
      } else {
        setTickets([]);
        setSelectedTicket(null);
      }
  
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    }
  };
  
  const fetchComments = async (ticketId: number) => {
    setComments([]); // Clear comments before fetching new ones
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
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
        `/api/tickets/${selectedTicket.id}/comments`,
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
        fetchComments(selectedTicket.id);
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

  useEffect(() => {
    if (selectedTicket?.id) {
      fetchComments(selectedTicket.id);
    }
  }, [selectedTicket]);

  const renderTicketDetails = (ticket: Ticket) => (
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
          Ticket Details: {ticket.id}
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
          {ticket.ticketDescription || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Course Group">
        {ticket.classes?.length > 0 ? ticket.classes[0].courseCode : "N/A"}
      </Descriptions.Item>
        <Descriptions.Item label="Category">
          {ticket.category || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Student">
          {ticket.student?.name || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Professor">
          {ticket.professor?.name || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="TA">
          {ticket.ta?.name || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Priority">
          {getPriorityTag(ticket.priority)}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {ticket.status === "completed" ? (
            <Tag color="green">COMPLETED</Tag>
          ) : (
            <Tag color="blue">OPEN</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

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
      <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>Comments</h3>
      <List
        dataSource={comments}
        renderItem={(comment) => (
          <List.Item>
            <div>
              {comment.author}: {comment.content}
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
        onOk={() => handleCloseTicket(ticket.id)}
        onCancel={() => setIsCloseModalVisible(false)}
        okText="Close Ticket"
        cancelText="Cancel"
      >
        <p>Are you sure you want to close this ticket?</p>
      </Modal>
    </>
  );

  const handleCloseTicket = async (id: string) => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
      });

      if (response.ok) {
        message.success("Ticket marked as completed");
        setIsCloseModalVisible(false);
        fetchTickets();
      } else {
        message.error("Failed to close the ticket");
      }
    } catch (error) {
      console.error("Error closing the ticket:", error);
      message.error("An error occurred. Please try again.");
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
      
        <TwoColumnsLayout
          items={tickets.map((ticket) => ({
            key: ticket.id, // d
            title: ticket.ticketDescription, // d
            category: ticket.category, // d
            priority: ticket.priority, // d
            professor: ticket.professor.id, // d
            student: ticket.student.id,
            courseCode: ticket.classes[0].courseCode, // d
          }))}
          renderContent={(key) => {
            const ticket = tickets.find((ticket) => ticket.id == key);
            if (ticket) {
              setSelectedTicket(ticket);
              return renderTicketDetails(ticket);
            }
          }}
          onAdd={showModal}
          type={"ticket"}
          userRole={session?.user?.role}
        />

      <AddTicketModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onTicketAdded={fetchTickets}
      />
    </AppLayout>
  );
}

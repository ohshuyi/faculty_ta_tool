"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Spin, Alert, Descriptions, Tag, List, Button, message } from "antd";
import { useSession } from "next-auth/react";
import TwoColumnsLayout from "@/components/TwoColumnsLayout";
import AppLayout from "@/components/Layout";

const { TabPane } = Tabs;

const getStatusTag = (status) => {
  return (
    <Tag color={status === "completed" ? "green" : "blue"}>
      {status.toUpperCase()}
    </Tag>
  );
};

const HistoryPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchCompletedTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch("/api/tasks?status=completed");
      const data = await response.json();
      setTasks(data);
      setSelectedTask(data[0] || null);
      setLoadingTasks(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setLoadingTasks(false);
    }
  };

  const fetchCompletedTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch("/api/tickets?status=completed");
      const data = await response.json();
      setTickets(data);
      setSelectedTicket(data[0] || null);
      setLoadingTickets(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchCompletedTasks();
      fetchCompletedTickets();
    }
  }, [sessionStatus]);

  const handleReopenTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });

      if (response.ok) {
        message.success("Task reopened successfully.");
        fetchCompletedTasks(); // Refresh the list
      } else {
        message.error("Failed to reopen task.");
      }
    } catch (error) {
      console.error("Error reopening task:", error);
      message.error("An error occurred.");
    }
  };

  const handleReopenTicket = async (ticketId) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });

      if (response.ok) {
        message.success("Ticket reopened successfully.");
        fetchCompletedTickets(); // Refresh the list
      } else {
        message.error("Failed to reopen ticket.");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
      message.error("An error occurred.");
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: "24px" }}>
        <Tabs defaultActiveKey="1">
          {/* Task History */}
          <TabPane tab="Task History" key="1">
            {loadingTasks ? (
              <Spin size="large" />
            ) : tasks.length === 0 ? (
              <Alert message="No completed tasks found." type="info" />
            ) : (
              <TwoColumnsLayout
                items={tasks.map((task) => ({
                  key: task.id.toString(),
                  title: task.name,
                }))}
                renderContent={(key) => {
                  const task = tasks.find((t) => t.id.toString() === key);
                  if (!task) return <Alert message="Task not found" type="error" />;
                  return (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3>Task Details</h3>
                        <Button type="primary" onClick={() => handleReopenTask(task.id)}>
                          Reopen Task
                        </Button>
                      </div>
                      <Descriptions bordered>
                        <Descriptions.Item label="Course Group">
                          {task.classes?.[0]?.courseCode || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Due Date">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Details">
                          {task.details}
                        </Descriptions.Item>
                        <Descriptions.Item label="Professor">
                          {task.professor?.name || "N/A"} {/* Access name */}
                        </Descriptions.Item>
                        <Descriptions.Item label="TA">
                          {task.ta?.name || "N/A"} {/* Access name */}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          {getStatusTag(task.status)}
                        </Descriptions.Item>
                      </Descriptions>

                      <div style={{ marginTop: "24px" }}>
                        <h4>Comments</h4>
                        {task.comments && task.comments.length > 0 ? (
                          <List
                            itemLayout="horizontal"
                            dataSource={task.comments}
                            renderItem={(comment) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={
                                    <span>
                                      <strong>{comment.author}</strong>&nbsp;
                                      <span style={{ color: "#888", fontSize: "12px" }}>
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </span>
                                    </span>
                                  }
                                  description={comment.content}
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <p style={{ color: "#888" }}>No comments.</p>
                        )}
                      </div>
                    </div>
                  );
                }}
                type="history"
                userRole={session?.user?.role}
                showAddButton={false}
              />
            )}
          </TabPane>

          {/* Ticket History */}
          <TabPane tab="Ticket History" key="2">
            {loadingTickets ? (
              <Spin size="large" />
            ) : tickets.length === 0 ? (
              <Alert message="No completed tickets found." type="info" />
            ) : (
              <TwoColumnsLayout
                type="history"
                items={tickets.map((ticket) => ({
                  key: ticket.id.toString(),
                  title: ticket.ticketDescription,
                }))}
                renderContent={(key) => {
                  const ticket = tickets.find((t) => t.id.toString() === key);
                  if (!ticket) return <Alert message="Ticket not found" type="error" />;
                  return (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3>Ticket Details</h3>
                        <Button type="primary" onClick={() => handleReopenTicket(ticket.id)}>
                          Reopen Ticket
                        </Button>
                      </div>
                      <Descriptions bordered>
                        <Descriptions.Item label="Description">
                          {ticket.ticketDescription}
                        </Descriptions.Item>
                        <Descriptions.Item label="Course Group">
                          {ticket.classes?.[0]?.courseCode || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Category">
                          {ticket.category || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Student">
                          {ticket.student?.name ? (
                            <>
                              {ticket.student.name} (
                              {ticket.student.studentCode}@e.ntu.edu.sg,{" "}
                              {ticket.classes?.[0]?.classGroup || "Unknown Group"})
                            </>
                          ) : (
                            "N/A"
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Professor">
                          {ticket.professor?.name || "N/A"} {/* Access name */}
                        </Descriptions.Item>
                      </Descriptions>

                      <div style={{ marginTop: "24px" }}>
                        <h4>Comments</h4>
                        {ticket.comments && ticket.comments.length > 0 ? (
                          <List
                            itemLayout="horizontal"
                            dataSource={ticket.comments}
                            renderItem={(comment) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={
                                    <span>
                                      <strong>{comment.author}</strong>&nbsp;
                                      <span style={{ color: "#888", fontSize: "12px" }}>
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </span>
                                    </span>
                                  }
                                  description={comment.content}
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <p style={{ color: "#888" }}>No comments.</p>
                        )}
                      </div>
                    </div>
                  );
                }}
                userRole={session?.user?.role}
                showAddButton={false}
              />
            )}
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HistoryPage;


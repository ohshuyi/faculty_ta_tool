"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Spin, Alert, Descriptions, Tag } from "antd";
import { useSession } from "next-auth/react";
import TwoColumnsLayout from "@/components/TwoColumnsLayout";
import AppLayout from "@/components/Layout";

const { TabPane } = Tabs;

// Function to get the status tag (for the task)
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

  // Fetch completed tasks
  const fetchCompletedTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch("/api/tasks?status=completed");
      const data = await response.json();
      setTasks(data);
      setSelectedTask(data[0] || null); // Default to the first task
      setLoadingTasks(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setLoadingTasks(false);
    }
  };

  // Fetch completed tickets
  const fetchCompletedTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch("/api/tickets?status=completed");
      const data = await response.json();
      setTickets(data);
      setSelectedTicket(data[0] || null); // Default to the first ticket
      setLoadingTickets(false);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setLoadingTickets(false);
    }
  };

  // Fetch tasks and tickets when session is authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchCompletedTasks();
      fetchCompletedTickets();
    }
  }, [sessionStatus]);

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
                  key: task.id.toString(), // Ensure key is a string
                  title: task.name,
                }))}
                renderContent={(key) => {
                  const task = tasks.find((t) => t.id.toString() === key); // Ensure you're comparing strings
                  if (!task) return <Alert message="Task not found" type="error" />;
                  return (
                    <Descriptions bordered>
                      <Descriptions.Item label="Course Group">
                        {task.courseGroupType}
                      </Descriptions.Item>
                      <Descriptions.Item label="Due Date">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Details">
                        {task.details}
                      </Descriptions.Item>
                      <Descriptions.Item label="Professor">
                        {task.professor.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="TA">
                        {task.ta.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {getStatusTag(task.status)}
                      </Descriptions.Item>
                    </Descriptions>
                  );
                }}
                userRole={session?.user?.role}
                showAddButton={false} // Hide the Add New Task button for history
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
                items={tickets.map((ticket) => ({
                  key: ticket.ticketNumber.toString(), // Ensure key is a string
                  title: ticket.ticketDescription,
                }))}
                renderContent={(key) => {
                  const ticket = tickets.find(
                    (t) => t.ticketNumber.toString() === key
                  ); // Ensure you're comparing strings
                  if (!ticket) return <Alert message="Ticket not found" type="error" />;
                  return (
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
                    </Descriptions>
                  );
                }}
                userRole={session?.user?.role}
                showAddButton={false} // Hide the Add New Ticket button for history
              />
            )}
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HistoryPage;

"use client";
import React, { useEffect, useState } from "react";
import { Tabs, Spin, Alert, Descriptions, App } from "antd";
import { useSession } from "next-auth/react";
import TwoColumnsLayout from "@/components/TwoColumnsLayout"; // Assuming you have this component
import AppLayout from "@/components/Layout";

const { TabPane } = Tabs;

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
        <TabPane tab="Task History" key="1">
          {loadingTasks ? (
            <Spin size="large" />
          ) : tasks.length === 0 ? (
            <Alert message="No completed tasks found." type="info" />
          ) : (
            <TwoColumnsLayout
              items={tasks.map((task) => ({
                key: task.id,
                title: task.name,
              }))}
              renderContent={(key) => {
                const task = tasks.find((t) => t.id === key);
                setSelectedTask(task);
                return (
                    <Descriptions bordered>
        <Descriptions.Item label="Ticket Number">{ticket.ticketNumber}</Descriptions.Item>
        <Descriptions.Item label="Description">{ticket.ticketDescription}</Descriptions.Item>
        <Descriptions.Item label="Course Group">{ticket.courseGroupType}</Descriptions.Item>
      
        {/* Add more details as necessary */}
      </Descriptions>
                );
              }}
              userRole={session?.user?.role}
              showAddButton={false} // Hide the Add New Ticket button for history
            />
          )}
        </TabPane>

        <TabPane tab="Ticket History" key="2">
          {loadingTickets ? (
            <Spin size="large" />
          ) : tickets.length === 0 ? (
            <Alert message="No completed tickets found." type="info" />
          ) : (
            <TwoColumnsLayout
              items={tickets.map((ticket) => ({
                key: ticket.ticketNumber,
                title: ticket.ticketDescription,
              }))}
              renderContent={(key) => {
                const ticket = tickets.find((t) => t.ticketNumber === key);
                setSelectedTicket(ticket);
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

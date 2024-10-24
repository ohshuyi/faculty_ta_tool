"use client"
import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto'; // This is required for Chart.js to work properly
import AppLayout from '@/components/Layout';

const Dashboard = () => {
  // Mock Data
  const taskAnalytics = {
    totalTasks: 50,
    completedTasks: 35,
    pendingTasks: 10,
    overdueTasks: 5,
    tasksByCourseGroup: {
      Math101: 20,
      Physics202: 15,
      Chemistry301: 10,
      Biology401: 5,
    },
  };

  const ticketAnalytics = {
    totalTickets: 80,
    completedTickets: 60,
    pendingTickets: 15,
    highPriorityTickets: 5,
    ticketsByCategory: {
      Technical: 40,
      Administrative: 30,
      Other: 10,
    },
  };

  // Data for the Pie Charts
  const taskPieData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        label: 'Task Status',
        data: [taskAnalytics.completedTasks, taskAnalytics.pendingTasks, taskAnalytics.overdueTasks],
        backgroundColor: ['#00C49F', '#FFBB28', '#FF8042'],
      },
    ],
  };

  const ticketPieData = {
    labels: ['Technical', 'Administrative', 'Other'],
    datasets: [
      {
        label: 'Ticket Categories',
        data: [
          ticketAnalytics.ticketsByCategory.Technical,
          ticketAnalytics.ticketsByCategory.Administrative,
          ticketAnalytics.ticketsByCategory.Other,
        ],
        backgroundColor: ['#0088FE', '#00C49F', '#FFBB28'],
      },
    ],
  };

  // Data for the Bar Charts
  const taskBarData = {
    labels: Object.keys(taskAnalytics.tasksByCourseGroup),
    datasets: [
      {
        label: 'Tasks by Course Group',
        data: Object.values(taskAnalytics.tasksByCourseGroup),
        backgroundColor: '#0088FE',
      },
    ],
  };

  const ticketBarData = {
    labels: Object.keys(ticketAnalytics.ticketsByCategory),
    datasets: [
      {
        label: 'Tickets by Category',
        data: Object.values(ticketAnalytics.ticketsByCategory),
        backgroundColor: '#FF8042',
      },
    ],
  };

  return (
    <AppLayout>
      <div className='p-16'>

      <Row gutter={16}>
        {/* Task Analytics */}
        <Col span={12}>
          <Card title="Task Analytics">
            <Statistic title="Total Tasks" value={taskAnalytics.totalTasks} />
            <Statistic title="Completed Tasks" value={taskAnalytics.completedTasks} />
            <Statistic title="Pending Tasks" value={taskAnalytics.pendingTasks} />
            <Statistic title="Overdue Tasks" value={taskAnalytics.overdueTasks} />

            {/* Task by Course Group Bar Chart */}
            <Bar data={taskBarData} />
          </Card>
        </Col>

        {/* Ticket Analytics */}
        <Col span={12}>
          <Card title="Ticket Analytics">
            <Statistic title="Total Tickets" value={ticketAnalytics.totalTickets} />
            <Statistic title="Completed Tickets" value={ticketAnalytics.completedTickets} />
            <Statistic title="Pending Tickets" value={ticketAnalytics.pendingTickets} />
            <Statistic title="High Priority Tickets" value={ticketAnalytics.highPriorityTickets} />

            {/* Tickets by Category Bar Chart */}
            <Bar data={ticketBarData} />
          </Card>
        </Col>
      </Row>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

"use client"
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import AppLayout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    fetchData();
  }, [session, router]);
  console.log(session)
  if (session?.user?.role === 'USER') {
    return <p>You do not have access to this page. Contact the admin to update your role.</p>;
  }

  if (!analyticsData) {
    return <div>Loading...</div>;
  }

  const { taskAnalytics, ticketAnalytics, studentAnalytics } = analyticsData;

  // Fix undefined keys in task analytics
  const cleanedTaskGroups = Object.entries(taskAnalytics.tasksByCourseGroup).reduce(
    (acc, [key, value]) => {
      acc[key === 'undefined' ? 'Uncategorized' : key] = value;
      return acc;
    },
    {}
  );

  // Data for charts
  const taskStatusHistogramData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [
      {
        label: 'Task Status',
        data: [
          taskAnalytics.completedTasks,
          taskAnalytics.pendingTasks,
          taskAnalytics.overdueTasks,
        ],
        backgroundColor: ['#00C49F', '#FFBB28', '#FF8042'],
      },
    ],
  };

  const taskBarData = {
    labels: Object.keys(cleanedTaskGroups),
    datasets: [
      {
        label: 'Tasks by Course Group',
        data: Object.values(cleanedTaskGroups),
        backgroundColor: '#0088FE',
      },
    ],
  };

  const ticketCategoryHistogramData = {
    labels: Object.keys(ticketAnalytics.ticketsByCategory),
    datasets: [
      {
        label: 'Tickets by Category',
        data: Object.values(ticketAnalytics.ticketsByCategory),
        backgroundColor: '#FF8042',
      },
    ],
  };

  const studentBarData = {
    labels: Object.keys(studentAnalytics.studentsPerClass),
    datasets: [
      {
        label: 'Students per Class',
        data: Object.values(studentAnalytics.studentsPerClass),
        backgroundColor: '#82CA9D',
      },
    ],
  };

  const studentProgramData = {
    labels: Object.keys(studentAnalytics.studentsByProgram),
    datasets: [
      {
        label: 'Students by Program',
        data: Object.values(studentAnalytics.studentsByProgram),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <AppLayout>
      <div className="p-16">
        {/* Welcome Message Section */}
        <Card style={{ marginBottom: '24px' }}>
          <Title level={2}>
            Welcome, {session?.user?.name || 'User'}!
          </Title>
          <Text>
            This is your personalized dashboard, where you can explore key insights on tasks, tickets, and students. Stay updated with the latest analytics to manage projects and track progress effectively.
          </Text>
        </Card>

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

              {/* Tickets by Category Histogram */}
              <Bar data={ticketCategoryHistogramData} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: '16px' }}>
          {/* Student Analytics */}
          <Col span={12}>
            <Card title="Student Analytics">
              <Statistic title="Total Students" value={studentAnalytics.totalStudents} />

              {/* Students per Class Bar Chart */}
              <Bar data={studentBarData} />
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Program Distribution">
              {/* Students by Program Pie Chart */}
              <Bar data={studentProgramData} />
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

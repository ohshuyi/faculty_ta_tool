"use client"
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Alert, Space, Button } from 'antd';
import { Bar, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import AppLayout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCourse } from '@/context/CourseContext';
import { FileAddOutlined, TeamOutlined, ProfileOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const { data: session, status: sessionStatus } = useSession();
  const { activeCourseCode } = useCourse();
  const router = useRouter();

  const userRole = (session as any)?.user?.role;
  const { taskAnalytics, ticketAnalytics, studentAnalytics, timesheetAnalytics } = analyticsData || {
    taskAnalytics: {},
    ticketAnalytics: {},
    studentAnalytics: {},
    timesheetAnalytics: {},
  };

  const timesheetBarData = {
    labels: Object.keys(timesheetAnalytics?.timesheetChartData || {}),
    datasets: [
      {
        label: userRole === 'TA' || userRole === 'TUTOR' ? 'Hours per Week' : 'Hours per TA',
        data: Object.values(timesheetAnalytics?.timesheetChartData || {}),
        backgroundColor: '#722ed1',
      },
    ],
  };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    if ((session as any)?.user?.role === 'ADMIN') {
      router.push('/admin');
      return;
    }

    const fetchData = async () => {
      if (!activeCourseCode) return;
      try {
        const response = await fetch(`/api/analytics?courseCode=${activeCourseCode}`);
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    fetchData();
  }, [session, router, activeCourseCode, sessionStatus]);

  if ((session as any)?.user?.role === 'USER') {
    return <p>You do not have access to this page. Contact the admin to update your role.</p>;
  }

  if (!activeCourseCode) {
    return (
      <AppLayout>
        <div style={{ padding: '24px' }}>
          <Alert
            message="No Course Selected"
            description="Please select a course from the top navigation menu to view its analytics dashboard."
            type="info"
            showIcon
          />
        </div>
      </AppLayout>
    );
  }

  if (!analyticsData) {
    return (
      <AppLayout>
        <div style={{ padding: '24px' }}>
          <div>Loading analytics...</div>
        </div>
      </AppLayout>
    );
  }

  const cleanedTaskGroups = Object.entries(taskAnalytics.tasksByClassGroup || {}).reduce(
    (acc: any, [key, value]) => {
      acc[key === 'undefined' ? 'Uncategorized' : key] = value;
      return acc;
    },
    {}
  );

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    }
  };

  const doughnutOptionsNoLegend = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    }
  };

  const sharedStatusLabels = ['Completed', 'Pending', 'Overdue'];

  const taskStatusData = {
    labels: sharedStatusLabels,
    datasets: [
      {
        data: [
          taskAnalytics.completedTasks || 0,
          taskAnalytics.pendingTasks || 0,
          taskAnalytics.overdueTasks || 0,
        ],
        backgroundColor: ['#52c41a', '#faad14', '#f5222d'],
        borderWidth: 1,
      },
    ],
  };

  const ticketStatusData = {
    labels: sharedStatusLabels,
    datasets: [
      {
        data: [
          ticketAnalytics.completedTickets || 0,
          ticketAnalytics.pendingTickets || 0,
          0, 
        ],
        backgroundColor: ['#52c41a', '#faad14', '#f5222d'],
        borderWidth: 1,
      },
    ],
  };

  const taskBarData = {
    labels: Object.keys(cleanedTaskGroups),
    datasets: [
      {
        label: 'Tasks by Class Group',
        data: Object.values(cleanedTaskGroups),
        backgroundColor: '#1890ff',
      },
    ],
  };

  const ticketCategoryData = {
    labels: Object.keys(ticketAnalytics.ticketsByCategory || {}),
    datasets: [
      {
        label: 'Tickets by Category',
        data: Object.values(ticketAnalytics.ticketsByCategory || {}),
        backgroundColor: '#eb2f96',
      },
    ],
  };

  const studentBarData = {
    labels: Object.keys(studentAnalytics.studentsPerClass || {}),
    datasets: [
      {
        label: 'Students per Class Group',
        data: Object.values(studentAnalytics.studentsPerClass || {}),
        backgroundColor: '#13c2c2',
      },
    ],
  };

  const stackedData = studentAnalytics.studentsByProgramStacked || {};
  const programLabels = Object.keys(stackedData).sort();
  const yearLevels = ["Year 1", "Year 2", "Year 3", "Year 4", "Other"];
  const yearColors: { [key: string]: string } = {
    "Year 1": "#ff4d4f",
    "Year 2": "#1890ff",
    "Year 3": "#faad14",
    "Year 4": "#13c2c2",
    "Other": "#722ed1"
  };

  const studentProgramBarData = {
    labels: programLabels,
    datasets: yearLevels.map(year => ({
      label: year,
      data: programLabels.map(prog => stackedData[prog][year] || 0),
      backgroundColor: yearColors[year],
    })).filter(ds => ds.data.some(count => count > 0)) 
  };

  const stackedBarOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        {}
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {activeCourseCode} Analytics Dashboard
            </Title>
            <Text type="secondary">
              Welcome, {session?.user?.name || 'User'}! Here are key insights for your active course.
            </Text>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<FileAddOutlined />} onClick={() => router.push('/task')}>
                Manage Tasks
              </Button>
              <Button icon={<ProfileOutlined />} onClick={() => router.push('/ticket')}>
                Manage Tickets
              </Button>
              <Button icon={<ClockCircleOutlined />} onClick={() => router.push('/timesheet')}>
                Manage Timesheets
              </Button>
              <Button icon={<TeamOutlined />} onClick={() => router.push('/classmanagement')}>
                Manage Classes
              </Button>
            </Space>
          </Col>
        </Row>

        {}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic title="Total Students" value={studentAnalytics.totalStudents || 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic title="Total Tasks" value={taskAnalytics.totalTasks || 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="Overdue Tasks"
                value={taskAnalytics.overdueTasks || 0}
                valueStyle={{ color: (taskAnalytics.overdueTasks || 0) > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="High Priority"
                value={ticketAnalytics.highPriorityTickets || 0}
                valueStyle={{ color: (ticketAnalytics.highPriorityTickets || 0) > 0 ? '#fa8c16' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={16} md={8}>
            <Card>
              <Statistic
                title={userRole === 'TA' || userRole === 'TUTOR' ? "My Pending Timesheets" : "Timesheets Pending Approvals"}
                value={timesheetAnalytics?.pendingTimesheets || 0}
                valueStyle={{ color: (timesheetAnalytics?.pendingTimesheets || 0) > 0 ? '#faad14' : '#3f8600' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {}
            <Card title="Status Breakdown" style={{ marginBottom: '16px' }}>
              <div style={{ height: '330px', display: 'flex', flexDirection: 'column' }}>
                <Row gutter={16} style={{ flex: 1, marginBottom: '16px' }}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}><Text strong>Tasks</Text></div>
                    <div style={{ height: '220px' }}>
                      <Doughnut data={taskStatusData} options={doughnutOptionsNoLegend} />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}><Text strong>Tickets</Text></div>
                    <div style={{ height: '220px' }}>
                      <Doughnut data={ticketStatusData} options={doughnutOptionsNoLegend} />
                    </div>
                  </Col>
                </Row>
                <Row justify="space-around" style={{ marginTop: '8px', marginBottom: '8px' }}>
                  <Col style={{ textAlign: 'center' }}>
                    <div><span style={{ color: '#52c41a', fontSize: '18px', marginRight: '4px' }}>●</span><Text strong>Completed</Text></div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>(Tasks: {taskAnalytics.completedTasks || 0}, Tickets: {ticketAnalytics.completedTickets || 0})</Text>
                  </Col>
                  <Col style={{ textAlign: 'center' }}>
                    <div><span style={{ color: '#faad14', fontSize: '18px', marginRight: '4px' }}>●</span><Text strong>Pending</Text></div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>(Tasks: {taskAnalytics.pendingTasks || 0}, Tickets: {ticketAnalytics.pendingTickets || 0})</Text>
                  </Col>
                  <Col style={{ textAlign: 'center' }}>
                    <div><span style={{ color: '#f5222d', fontSize: '18px', marginRight: '4px' }}>●</span><Text strong>Overdue</Text></div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>(Tasks: {taskAnalytics.overdueTasks || 0})</Text>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            {}
            <Card title="Students by Program" style={{ marginBottom: '16px' }}>
              <div style={{ height: '330px' }}>
                <Bar data={studentProgramBarData} options={stackedBarOptions} />
              </div>
            </Card>
          </Col>
        </Row>

        {}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {}
            <Card title="Tasks by Class Group" style={{ marginBottom: '16px' }}>
              <div style={{ height: '300px' }}>
                <Bar data={taskBarData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            {}
            <Card title="Tickets by Category" style={{ marginBottom: '16px' }}>
              <div style={{ height: '300px' }}>
                <Bar data={ticketCategoryData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card>
          </Col>
        </Row>

        {}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {}
            <Card title={userRole === 'TA' || userRole === 'TUTOR' ? "My Hours per Week" : "Total Hours per TA"} style={{ marginBottom: '16px' }}>
              <div style={{ height: '300px' }}>
                <Bar data={timesheetBarData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            {}
            <Card title="Students per Class Group" style={{ marginBottom: '16px' }}>
              <div style={{ height: '400px' }}>
                <Bar data={studentBarData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card>
          </Col>
        </Row>

      </div>
    </AppLayout>
  );
};

export default Dashboard;

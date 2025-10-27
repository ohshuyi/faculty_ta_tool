"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/Layout';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Spin, Card, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const LabIssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  // --- Data Fetching ---
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/lab-issues', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch issues.');
      setIssues(await response.json());
    } catch (error) { message.error(error.message); } 
    finally { setLoading(false); }
  }, []);

  const fetchLabs = useCallback(async () => {
    try {
      const response = await fetch('/api/labs', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch labs.');
      setLabs(await response.json());
    } catch (error) { message.error(error.message); }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchIssues();
      // Only TAs/Profs need the lab list to create new issues
      if (userRole === 'TA' || userRole === 'PROFESSOR' || userRole === 'ADMIN') {
        fetchLabs();
      }
    }
  }, [status, userRole, fetchIssues, fetchLabs]);

  // --- Modal Handlers ---
  const showCreateModal = () => setIsCreateModalVisible(true);
  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };
  
  const showUpdateModal = (issue) => {
    setSelectedIssue(issue);
    updateForm.setFieldsValue({ status: issue.status });
    setIsUpdateModalVisible(true);
  };
  const handleUpdateCancel = () => {
    setIsUpdateModalVisible(false);
    setSelectedIssue(null);
    updateForm.resetFields();
  };

  // --- API Handlers ---
  const handleCreateIssue = async (values) => {
    try {
      const response = await fetch('/api/lab-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Credentials': 'include' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create issue.');
      }
      message.success('Issue reported successfully!');
      handleCreateCancel();
      fetchIssues();
    } catch (error) { message.error(error.message); }
  };

  const handleUpdateStatus = async (values) => {
    if (!selectedIssue) return;
    try {
      const response = await fetch(`/api/lab-issues/${selectedIssue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Credentials': 'include' },
        body: JSON.stringify(values), // Sends { status: 'NewStatus' }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status.');
      }
      message.success('Status updated successfully!');
      handleUpdateCancel();
      fetchIssues();
    } catch (error) { message.error(error.message); }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => {
        const color = status === 'Open' ? 'red' : (status === 'In Progress' ? 'blue' : 'green');
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Lab', dataIndex: ['lab', 'name'], key: 'labName' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Reported By', dataIndex: ['createdByUser', 'name'], key: 'createdByUser' },
    { title: 'Date Reported', dataIndex: 'createdAt', key: 'createdAt', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => {
        // Only Lab Techs and Admins can update the status
        if ((userRole === 'LAB_TECH' || userRole === 'ADMIN') && record.status !== 'Resolved') {
          return (
            <Button icon={<EditOutlined />} onClick={() => showUpdateModal(record)}>
              Update Status
            </Button>
          );
        }
        return null;
      }
    },
  ];

  if (status === 'loading' || loading) {
    return <AppLayout><Spin /></AppLayout>;
  }

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <Card title="Lab Issues">
          {/* Only TAs and Professors can create new issues */}
          {(userRole === 'TA' || userRole === 'PROFESSOR' || userRole === 'ADMIN') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              style={{ marginBottom: 16 }}
            >
              Report New Issue
            </Button>
          )}
          
          <Table
            columns={columns}
            dataSource={issues}
            rowKey="id"
            loading={loading}
          />
        </Card>

        {/* Create Issue Modal (for TAs/Profs) */}
        <Modal
          title="Report New Lab Issue"
          open={isCreateModalVisible}
          onCancel={handleCreateCancel}
          onOk={() => createForm.submit()}
          okText="Submit Issue"
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreateIssue}>
            <Form.Item name="labId" label="Lab" rules={[{ required: true }]}>
              <Select showSearch placeholder="Select the lab with the issue" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                {labs.map(lab => (
                  <Option key={lab.id} value={lab.id}>{lab.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="title" label="Issue Title" rules={[{ required: true }]}>
              <Input placeholder="e.g., Network Switch 3 is down" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Please provide details, e.g., PC numbers affected, error messages..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Update Status Modal (for Lab Techs) */}
        <Modal
          title={`Update Status for: ${selectedIssue?.title}`}
          open={isUpdateModalVisible}
          onCancel={handleUpdateCancel}
          onOk={() => updateForm.submit()}
          okText="Update Status"
        >
          <Form form={updateForm} layout="vertical" onFinish={handleUpdateStatus}>
            <Form.Item name="status" label="New Status" rules={[{ required: true }]}>
              <Select placeholder="Select a new status">
                <Option value="Open">Open</Option>
                <Option value="In Progress">In Progress</Option>
                <Option valueD="Resolved">Resolved</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default LabIssuesPage;
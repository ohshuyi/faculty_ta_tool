"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Input, List, message, Popconfirm, Spin, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import AppLayout from '@/components/Layout'; // Make sure this path is correct

const LabManagementPage = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // --- Data Fetching ---
  const fetchLabs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/labs', { cache: 'no-store' });
      if (!response.ok) throw new Error("Failed to fetch labs.");
      setLabs(await response.json());
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  // --- Handlers ---
  const handleAddLab = async (values) => {
    try {
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Failed to create lab.");
      }
      message.success("Lab created successfully!");
      form.resetFields();
      setIsModalVisible(false);
      fetchLabs(); // Refresh the list
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDeleteLab = async (labId) => {
    try {
      const response = await fetch(`/api/labs/${labId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Failed to delete lab.");
      }
      message.success("Lab deleted successfully!");
      fetchLabs(); // Refresh the list
    } catch (e) {
      message.error(e.message);
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <Card title="Lab Management">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{ marginBottom: 16 }}
          >
            Add New Lab
          </Button>

          {loading ? <Spin /> : (
            <List
              header={<div>Available Labs</div>}
              bordered
              dataSource={labs}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Delete this lab?"
                      description="Are you sure? This action cannot be undone."
                      onConfirm={() => handleDeleteLab(item.id)}
                      okText="Yes, Delete"
                      cancelText="No"
                    >
                      <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                  ]}
                >
                  {item.name}
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* --- Add New Lab Modal --- */}
        <Modal
          title="Add New Lab"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={() => form.submit()}
          okText="Create"
        >
          <Form form={form} layout="vertical" onFinish={handleAddLab}>
            <Form.Item
              name="name"
              label="Lab Name"
              rules={[{ required: true, message: "Please enter the lab name." }]}
            >
              <Input placeholder="e.g., HW Lab 1 (S2-B1a)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default LabManagementPage;
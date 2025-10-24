"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Modal, Form, DatePicker, InputNumber, Input, message, Select, Space, Spin, Tag, Popconfirm, Card, Cascader } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAcademicYearPeriods, getCurrentAcademicPeriod } from '@/lib/academicUtils';

const { Option } = Select;
const { TextArea } = Input;

// Helper to get current period (e.g., "October 2025")
const getCurrentPeriod = () => dayjs().format('MMMM YYYY');

const TATimesheetView = ({ userId }) => {
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [form] = Form.useForm();
    const [academicYearPeriods, setAcademicYearPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentAcademicPeriod()); // Default to current semester
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [recalling, setRecalling] = useState(false);

    const currentTimesheet = timesheets.find(ts => ts.period === selectedPeriod);
    const isEditable = currentTimesheet?.status === 'Draft' || !currentTimesheet; // Allow edits if draft or not yet created

    const fetchTimesheets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/timesheets'); // Fetches TA's own timesheets
            const data = await response.json();
            setTimesheets(data);
        } catch (error) {
            message.error("Failed to load timesheets.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAssignedClasses = useCallback(async () => {
        try {
            // Assuming /api/management returns classes scoped for the logged-in TA
            const response = await fetch('/api/management', { credentials: 'include', cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to fetch assigned classes');
            const data = await response.json();
            setAssignedClasses(data);
        } catch (error) {
            message.error(error.message);
        }
    }, []);

    useEffect(() => {
        fetchTimesheets();
        fetchAssignedClasses();
        setAcademicYearPeriods(getAcademicYearPeriods());
    }, [fetchTimesheets, fetchAssignedClasses]);

    const isApproved = currentTimesheet?.status === 'Approved';

    const classOptions = useMemo(() => {
        const options = {};
        assignedClasses.forEach(cls => {
            if (!options[cls.courseCode]) {
                options[cls.courseCode] = { value: cls.courseCode, label: cls.courseCode, children: {} };
            }
            if (!options[cls.courseCode].children[cls.classType]) {
                options[cls.courseCode].children[cls.classType] = { value: cls.classType, label: cls.classType, children: [] };
            }
            options[cls.courseCode].children[cls.classType].children.push({
                value: cls.id, // The final value will be the class ID
                label: cls.classGroup,
                classDetails: `${cls.classType} - ${cls.classGroup}`, // Store details for submission
            });
        });
        // Convert nested objects to arrays for Cascader
        return Object.values(options).map(course => ({
            ...course,
            children: Object.values(course.children),
        }));
    }, [assignedClasses]);

    const sortedEntries = useMemo(() => {
        // Get the entries for the current period, or an empty array
        const entries = currentTimesheet?.entries || [];

        // Sort the entries
        return [...entries].sort((a, b) => { // Use spread (...) to avoid mutating original state
            // 1. Primary Sort: Class Details (alphabetical)
            const classCompare = (a.classDetails || '').localeCompare(b.classDetails || '');
            if (classCompare !== 0) {
                return classCompare;
            }
            // 2. Secondary Sort: Week Number (ascending)
            return (a.weekNumber || 0) - (b.weekNumber || 0);
        });
    }, [currentTimesheet]);

    const showAddModal = () => {
        setEditingEntry(null);
        form.resetFields();
        form.setFieldsValue({ date: dayjs() }); // Default to today
        setIsModalVisible(true);
    };

    const showEditModal = (entry) => {
        setEditingEntry(entry);
        form.setFieldsValue({
            date: dayjs(entry.date),
            hours: entry.hours,
            weekNumber: entry.weekNumber,
            description: entry.description,
        });
        setIsModalVisible(true);
    };

    const handleRecallTimesheet = async () => {
        if (!currentTimesheet) return;
        setRecalling(true);
        try {
            const response = await fetch(`/api/timesheets/${currentTimesheet.id}/recall`, {
                method: 'PATCH',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to recall.');
            }
            message.success("Timesheet recalled successfully! You can now make changes.");
            fetchTimesheets(); // Refresh to update status
        } catch (error) {
            message.error(error.message);
        } finally {
            setRecalling(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!currentTimesheet) {
            return message.error("No timesheet exists for this period yet. Add an entry first.");
        }
        setSubmitting(true);
        try {
            const response = await fetch(`/api/timesheets/${currentTimesheet.id}/submit`, {
                method: 'PATCH',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit.');
            }
            message.success("Timesheet submitted for approval!");
            fetchTimesheets(); // Refresh to update status
        } catch (error) {
            message.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingEntry(null);
        form.resetFields();
    };

    const handleFormSubmit = async (values) => {
        const [courseCode, classType, classId] = values.classSelection; // Cascader returns an array
        const selectedClassOption = classOptions
            .find(c => c.value === courseCode)?.children
            .find(t => t.value === classType)?.children
            .find(g => g.value === classId);

        const apiData = {
            date: values.date.toISOString(),
            hours: values.hours,
            courseCode: courseCode,
            classDetails: selectedClassOption?.classDetails || 'Unknown',
            weekNumber: values.weekNumber,
            description: values.description,
        };

        try {
            let response;
            if (editingEntry) {
                // Update existing entry
                response = await fetch(`/api/timesheet-entries/${editingEntry.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiData),
                });
            } else {
                // Add new entry
                response = await fetch('/api/timesheets/entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiData),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save entry.');
            }

            message.success(`Entry ${editingEntry ? 'updated' : 'added'} successfully!`);
            handleCancel();
            fetchTimesheets(); // Refresh data
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        try {
            const response = await fetch(`/api/timesheet-entries/${entryId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete entry.');
            }
            message.success('Entry deleted successfully!');
            fetchTimesheets(); // Refresh
        } catch (error) {
            message.error(error.message);
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => dayjs(date).format('YYYY-MM-DD') },
        { title: 'Week', dataIndex: 'weekNumber', key: 'weekNumber', width: 80 },
        { title: 'Course Code', dataIndex: 'courseCode', key: 'courseCode' },
        { title: 'Class Details', dataIndex: 'classDetails', key: 'classDetails' },
        { title: 'Hours', dataIndex: 'hours', key: 'hours', render: (h) => parseFloat(h).toFixed(2) },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} disabled={!isEditable} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDeleteEntry(record.id)} disabled={!isEditable}>
                        <Button icon={<DeleteOutlined />} danger disabled={!isEditable} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Generate period options (e.g., last 3 months + current)
    const periodOptions = Array.from({ length: 4 }).map((_, i) =>
        dayjs().subtract(i, 'month').format('MMMM YYYY')
    );
    if (!periodOptions.includes(selectedPeriod)) {
        periodOptions.unshift(selectedPeriod); // Add selected if not recent
    }


    return (
        <div style={{ padding: "24px" }}>
            <Card title="My Timesheet" style={{ marginBottom: 24 }}>
                <Space style={{ marginBottom: 16 }}>
                    <Select
                        value={selectedPeriod}
                        onChange={(value) => setSelectedPeriod(value)}
                        style={{ width: 200 }}
                    >
                        {academicYearPeriods.map(p => <Option key={p} value={p}>{p}</Option>)}
                    </Select>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showAddModal}
                    >
                        Log Hours
                    </Button>
                    {currentTimesheet && currentTimesheet.status === 'Draft' && (
                        <Popconfirm
                            title="Submit Timesheet?"
                            description="Once submitted, you cannot make further changes unless rejected. Are you sure?"
                            onConfirm={handleSubmitForApproval} // Call the submit function on confirm
                            okText="Yes, Submit"
                            cancelText="Cancel"
                        >
                            <Button
                                type="primary"
                                loading={submitting}
                                style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                            // onClick is removed from here
                            >
                                Submit for Approval
                            </Button>
                        </Popconfirm>
                    )}

                    {currentTimesheet && (currentTimesheet.status === 'Submitted' || currentTimesheet.status === 'Approved') && (
                        <Popconfirm
                            title="Recall Timesheet?"
                            description="This will change the status back to Draft, allowing you to edit it again."
                            onConfirm={handleRecallTimesheet}
                            okText="Yes, Recall"
                            cancelText="Cancel"
                        >
                            <Button danger loading={recalling}>Recall Timesheet</Button>
                        </Popconfirm>
                    )}

                    {currentTimesheet && (
                        <Tag color={currentTimesheet.status === 'Approved' ? 'green' : (currentTimesheet.status === 'Submitted' ? 'gold' : 'blue')}>
                            Status: {currentTimesheet.status}
                        </Tag>
                    )}
                </Space>
            </Card>

            {loading ? <Spin /> : (
                <Table
                    columns={columns}
                    dataSource={sortedEntries}
                    rowKey="id"
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={1}>Total</Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                                <strong>{currentTimesheet?.totalHours || 0}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                            <Table.Summary.Cell index={3} />
                        </Table.Summary.Row>
                    )}
                />
            )}

            <Modal
                title={editingEntry ? 'Edit Entry' : 'Add New Entry'}
                open={isModalVisible}
                onCancel={handleCancel}
                onOk={() => form.submit()}
                okText={editingEntry ? 'Update' : 'Add'}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    <Form.Item name="classSelection" label="Class" rules={[{ required: true }]}>
                        <Cascader options={classOptions} placeholder="Select Course / Type / Group" />
                    </Form.Item>
                    <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="weekNumber"
                        label="Academic Week"
                        rules={[
                            { required: true, message: 'Please enter the week number' },
                            { type: 'number', min: 1, max: 13, message: 'Week must be between 1 and 13' } // Adjust max value
                        ]}
                    >
                        <InputNumber placeholder="e.g., 5 (Week 1-13)" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="hours" label="Hours Worked" rules={[{ required: true, type: 'number', min: 0.1 }]}>
                        <InputNumber style={{ width: '100%' }} step={0.5} />
                    </Form.Item>
                    <Form.Item name="description" label="Description (Optional)">
                        <TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TATimesheetView;
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, message, Spin, Tag, Popconfirm, Select, Card, Space, Collapse, Descriptions, List } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const ProfessorTimesheetView = () => {
    const [allTimesheets, setAllTimesheets] = useState([]);
    const [tas, setTas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [taFilter, setTaFilter] = useState(null);
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    const fetchTAs = useCallback(async () => {
        try {
            const response = await fetch('/api/tas'); // Assuming you have this endpoint
            if (!response.ok) throw new Error('Failed to fetch TAs');
            setTas(await response.json());
        } catch (error) {
            message.error(error.message);
        }
    }, []);

    const fetchSubmittedTimesheets = useCallback(async () => {
        setLoading(true);
        try {
            // Remove the status filter from the API call
            const response = await fetch('/api/timesheets?status=Submitted');
            if (!response.ok) throw new Error('Failed to load timesheets');
            setAllTimesheets(await response.json());
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTAs();
        fetchSubmittedTimesheets();
    }, [fetchTAs, fetchSubmittedTimesheets]);

    const handleExpand = (recordId) => {
        setExpandedRowKeys(prevKeys =>
            prevKeys.includes(recordId)
                ? prevKeys.filter(key => key !== recordId) // Collapse if already expanded
                : [...prevKeys, recordId] // Expand if not expanded
        );
    };

    const handleApprove = async (timesheetId) => {
        try {
            const response = await fetch(`/api/timesheets/${timesheetId}/approve`, {
                method: 'PATCH',
            });
            if (!response.ok) throw new Error('Failed to approve');
            message.success('Timesheet approved!');
            setExpandedRowKeys(prevKeys => prevKeys.filter(key => key !== timesheetId));
            fetchTimesheets(); // Refresh list
        } catch (error) {
            message.error('Failed to approve timesheet.');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedRowKeys.length === 0 || isAnySelectedApproved) {
            return message.warning('Please select timesheets to approve.');
        }
        try {
            const response = await fetch('/api/timesheets/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timesheetIds: selectedRowKeys }),
            });
            if (!response.ok) throw new Error('Bulk approve failed');
            const result = await response.json();
            message.success(result.message);
            setSelectedRowKeys([]); // Clear selection
            fetchTimesheets(); // Refresh
        } catch (error) {
            message.error('Failed to bulk approve timesheets.');
        }
    };

    const handleRevoke = async (timesheetId) => {
        try {
            const response = await fetch(`/api/timesheets/${timesheetId}/revoke`, {
                method: 'PATCH',
            });
            if (!response.ok) throw new Error('Failed to revoke');
            message.success('Approval revoked!');
            setExpandedRowKeys(prevKeys => prevKeys.filter(key => key !== timesheetId));
            fetchTimesheets(); // Refresh list
        } catch (error) {
            message.error('Failed to revoke approval.');
        }
    };

    const filteredTimesheets = useMemo(() => {
        if (!taFilter) {
            return allTimesheets; // Show all if no TA is selected
        }
        return allTimesheets.filter(ts => ts.userId === taFilter);
    }, [allTimesheets, taFilter]);

    const groupEntriesByCourse = (entries) => {
        return entries.reduce((acc, entry) => {
            const key = entry.courseCode || 'Unspecified Course';
            if (!acc[key]) {
                acc[key] = { totalHours: 0, entries: [] };
            }
            acc[key].totalHours += parseFloat(entry.hours);
            acc[key].entries.push(entry);
            return acc;
        }, {});
    };

    const isAnySelectedApproved = useMemo(() => {
        if (selectedRowKeys.length === 0) return false; // Nothing selected, so none are approved
        return filteredTimesheets.some(ts =>
            selectedRowKeys.includes(ts.id) && ts.status === 'Approved'
        );
    }, [selectedRowKeys, filteredTimesheets]);

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        // Optional: Prevent selecting already approved rows
        getCheckboxProps: (record) => ({
            disabled: record.status === 'Approved',
        }),
    };
    const columns = [
        { title: 'TA Name', dataIndex: ['user', 'name'], key: 'taName' },
        { title: 'Period', dataIndex: 'period', key: 'period' },
        {
            title: 'Total Hours / Details', // Update column title
            key: 'totalHoursAndDetails',
            render: (_, record) => (
                <Space>
                    <span>{parseFloat(record.totalHours || 0).toFixed(2)} hrs</span>
                    {record.entries?.length > 0 && ( // Only show button if there are entries
                        <Button
                            size="small" // Make button smaller
                            onClick={() => handleExpand(record.id)} // Use new handler
                        >
                            {expandedRowKeys.includes(record.id) ? "Collapse" : "Show Details"}
                        </Button>
                    )}
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'Approved' ? 'green' : (status === 'Submitted' ? 'gold' : 'blue')}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.status === 'Approved' ? (
                    // Show Revoke button if already approved
                    <Popconfirm
                        title="Revoke approval?"
                        description="This will change the status back to Pending."
                        onConfirm={() => handleRevoke(record.id)}
                        okText="Yes, Revoke"
                        cancelText="Cancel"
                    >
                        <Button danger>Revoke</Button>
                    </Popconfirm>
                ) : (
                    // Show Approve button if pending
                    <Button
                        type="primary"
                        onClick={() => handleApprove(record.id)}
                    >
                        Approve
                    </Button>
                )
            ),
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Card title="Filter and Actions" style={{ marginBottom: 24 }}>
                <Space wrap> {/* Use Space for layout */}
                    <Select
                        allowClear
                        showSearch
                        placeholder="Filter by TA"
                        style={{ width: 250 }}
                        onChange={(value) => setTaFilter(value)}
                        filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {tas.map(ta => (
                            <Option key={ta.id} value={ta.id}>{ta.name}</Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        onClick={handleBulkApprove}
                        disabled={selectedRowKeys.length === 0}
                    >
                        Approve Selected ({selectedRowKeys.length})
                    </Button>
                </Space>
            </Card>

            {loading ? <Spin /> : (
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={filteredTimesheets}
                    rowKey="id"
                    // --- Expandable Row for Details ---
                    expandable={{
                        expandedRowRender: (record) => {
                            const entriesByCourse = groupEntriesByCourse(record.entries);
                            return (
                                <Collapse accordion ghost>
                                    {Object.entries(entriesByCourse).map(([courseCode, courseData]) => {
                                        // --- Add Sorting Here ---
                                        const sortedEntries = courseData.entries.sort((a, b) => {
                                            // 1. Primary Sort: Class Details (alphabetical)
                                            const classCompare = a.classDetails.localeCompare(b.classDetails);
                                            if (classCompare !== 0) {
                                                return classCompare;
                                            }
                                            // 2. Secondary Sort: Week Number (ascending)
                                            return (a.weekNumber || 0) - (b.weekNumber || 0);
                                        });
                                        // --- End Sorting ---

                                        return (
                                            <Collapse.Panel
                                                header={`${courseCode} (Total: ${courseData.totalHours.toFixed(2)} hours)`}
                                                key={courseCode}
                                            >
                                                <List
                                                    size="small"
                                                    // Use the sorted data
                                                    dataSource={sortedEntries}
                                                    renderItem={item => (
                                                        <List.Item>
                                                            <Descriptions size="small" column={4}>
                                                                <Descriptions.Item label="Date">{dayjs(item.date).format('YYYY-MM-DD')}</Descriptions.Item>
                                                                <Descriptions.Item label="Week">{item.weekNumber || 'N/A'}</Descriptions.Item>
                                                                <Descriptions.Item label="Details">{item.classDetails}</Descriptions.Item>
                                                                <Descriptions.Item label="Hours">{parseFloat(item.hours).toFixed(2)}</Descriptions.Item>
                                                                {item.description && <Descriptions.Item label="Desc" span={4}>{item.description}</Descriptions.Item>}
                                                            </Descriptions>
                                                        </List.Item>
                                                    )}
                                                />
                                            </Collapse.Panel>
                                        );
                                    })}
                                </Collapse>
                            );
                        },
                        rowExpandable: (record) => record.entries?.length > 0,
                        expandedRowKeys: expandedRowKeys, // Control expanded rows using state
                        onExpand: (expanded, record) => handleExpand(record.id), // Use custom handler
                        expandIcon: () => null,
                    }}
                />
            )}
        </div>
    );
};

export default ProfessorTimesheetView;
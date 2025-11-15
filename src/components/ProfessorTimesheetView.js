"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, message, Spin, Tag, Popconfirm, Select, Card, Space, Collapse, Descriptions, List, Modal, Form, Input } from 'antd';
import dayjs from 'dayjs';
import { getAcademicYear, getCurrentAcademicPeriod, getPreviousAcademicPeriod } from '@/lib/academicUtils';
import TimesheetLogList from '@/components/TimesheetLogList';

const { Option } = Select;
const { TextArea } = Input;

const ProfessorTimesheetView = () => {
    const [allTimesheets, setAllTimesheets] = useState([]);
    const [tas, setTas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [taFilter, setTaFilter] = useState(null);
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentAcademicPeriod());
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedTimesheetForAction, setSelectedTimesheetForAction] = useState(null);

    const fetchTAs = useCallback(async () => {
        try {
            const response = await fetch('/api/tas');
            if (!response.ok) throw new Error('Failed to fetch TAs');
            setTas(await response.json());
        } catch (error) {
            message.error(error.message);
        }
    }, []);

    const fetchTimesheets = useCallback(async (period) => { // Accept AY parameter
        setLoading(true);
        try {
            const response = await fetch(`/api/timesheets?period=${encodeURIComponent(period)}`, {
                credentials: 'include',
                cache: 'no-store'
            });

            // 2. The 'if' check must happen *after* the fetch call is complete
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load timesheets');
            }
            setAllTimesheets(await response.json());
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTAs();
        fetchTimesheets(selectedPeriod);
    }, [selectedPeriod, fetchTAs, fetchTimesheets]);

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
            fetchTimesheets(selectedPeriod); // Refresh list
        } catch (error) {
            message.error('Failed to approve timesheet.');
        }
    };
    const periodOptions = useMemo(() => {
        const currentPeriod = getCurrentAcademicPeriod();
        const prevPeriod = getPreviousAcademicPeriod();
        return [currentPeriod, prevPeriod];
    }, []);

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
            fetchTimesheets(selectedPeriod); // Refresh
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
            fetchTimesheets(selectedPeriod); // Refresh list
        } catch (error) {
            message.error('Failed to revoke approval.');
        }
    };

    const showRejectModal = (timesheet) => {
        setSelectedTimesheetForAction(timesheet);
        setIsRejectModalVisible(true);
    };

    const handleRejectCancel = () => {
        setIsRejectModalVisible(false);
        setRejectReason("");
        setSelectedTimesheetForAction(null);
    };

    const handleRejectSubmit = async () => {
        if (!rejectReason) {
            return message.error("A reason for rejection is required.");
        }
        try {
            const response = await fetch(`/api/timesheets/${selectedTimesheetForAction.id}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject.');
            }
            message.success("Timesheet rejected.");
            handleRejectCancel();
            fetchTimesheets(selectedPeriod);
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleUndoRejection = async (timesheetId) => {
        try {
            const response = await fetch(`/api/timesheets/${timesheetId}/undo-reject`, {
                method: 'PATCH',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to undo rejection');
            }
            message.success('Rejection has been undone. Timesheet is now "Submitted".');
            fetchTimesheets(selectedPeriod); // Refresh list
        } catch (error) {
            message.error(error.message);
        }
    };

    const filteredTimesheets = useMemo(() => {
        const statusOrder = {
            'Submitted': 1,
            'Rejected': 2,
            'Approved': 3,
        };

        // 2. Start with the TA filter (if any)
        const filtered = allTimesheets.filter(ts => {
            if (!taFilter) return true; // No filter, show all
            return ts.userId === taFilter;
        });

        // 3. Apply the multi-level sort
        return filtered.sort((a, b) => {
            // 1. Primary Sort: By Status
            const statusA = statusOrder[a.status] || 99; // Get status number (99 for any unknown)
            const statusB = statusOrder[b.status] || 99;
            if (statusA !== statusB) {
                return statusA - statusB; // Sort by status number
            }

            // 2. Secondary Sort: By TA Name (if status is the same)
            const nameA = a.user?.name || '';
            const nameB = b.user?.name || '';
            const nameCompare = nameA.localeCompare(nameB);
            if (nameCompare !== 0) {
                return nameCompare;
            }

            // 3. Tertiary Sort: By Course Code
            return a.courseCode.localeCompare(b.courseCode);
        });
    }, [allTimesheets, taFilter]);

    const groupEntriesByCourse = (entries) => {
        return entries.reduce((acc, entry) => {
            // Group by classDetails, not courseCode
            const key = entry.classDetails || "Unspecified Class";
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
        { title: 'Course Code', dataIndex: 'courseCode', key: 'courseCode' },
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
        // { title: 'Total Hours', dataIndex: 'totalHours', key: 'totalHours', render: h => parseFloat(h).toFixed(2) },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const color = status === 'Approved' ? 'green' : (status === 'Submitted' ? 'gold' : (status === 'Rejected' ? 'red' : 'blue'));
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                // Use if/else if to handle the different statuses
                if (record.status === 'Submitted') {
                    return (
                        <Space>
                            <Button type="primary" onClick={() => handleApprove(record.id)}>
                                Approve
                            </Button>
                            <Button danger onClick={() => showRejectModal(record)}>
                                Reject
                            </Button>
                        </Space>
                    );
                }
                if (record.status === 'Approved') {
                    return (
                        <Popconfirm
                            title="Revoke approval?"
                            description="This will change the status back to Submitted." // Updated description
                            onConfirm={() => handleRevoke(record.id)}
                            okText="Yes, Revoke"
                            cancelText="Cancel"
                        >
                            <Button danger>Revoke</Button>
                        </Popconfirm>
                    );
                }
                if (record.status === 'Rejected') {
                    return (
                        <Popconfirm
                            title="Undo rejection?"
                            description="This will change the status back to Submitted."
                            onConfirm={() => handleUndoRejection(record.id)}
                            okText="Yes, Undo"
                            cancelText="Cancel"
                        >
                            <Button>Undo Rejection</Button>
                        </Popconfirm>
                    );
                }
                // Default case (e.g., "Draft")
                return null;
            },
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Card title="Approve Submitted TA Timesheets" style={{ marginBottom: 24 }}>
                <Space wrap>
                    {/* Academic Year Selector */}
                    <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 220 }}>
                        {periodOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
                    </Select>
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
                            // 1. Group entries by the specific class (e.g., "Lab - BCG1")
                            const entriesByClassDetails = record.entries.reduce((acc, entry) => {
                                const key = entry.classDetails || 'Unspecified Class';
                                if (!acc[key]) {
                                    acc[key] = { totalHours: 0, entries: [] };
                                }
                                acc[key].totalHours += parseFloat(entry.hours);
                                acc[key].entries.push(entry);
                                return acc;
                            }, {});

                            return (
                                <div>
                                <Collapse accordion ghost>
                                    {/* 2. Use the correct variable name: [classDetailString, classData] */}
                                    {Object.entries(entriesByClassDetails).map(([classDetailString, classData]) => {

                                        // 3. Sort the entries within this group by week number
                                        const sortedEntries = classData.entries.sort((a, b) => {
                                            return (a.weekNumber || 0) - (b.weekNumber || 0);
                                        });

                                        return (
                                            <Collapse.Panel
                                                // 4. Use the correct variable for the header
                                                header={`${classDetailString} (Total: ${classData.totalHours.toFixed(2)} hours)`}
                                                key={classDetailString} // Use the class detail string as the key
                                            >
                                                <List
                                                    size="small"
                                                    dataSource={sortedEntries}
                                                    renderItem={item => (
                                                        <List.Item>
                                                            {/* 5. Display fields in your requested order */}
                                                            <Descriptions size="small" column={4}>
                                                                <Descriptions.Item label="Date">{dayjs(item.date).format('YYYY-MM-DD')}</Descriptions.Item>
                                                                <Descriptions.Item label="Week">{item.weekNumber || 'N/A'}</Descriptions.Item>
                                                                <Descriptions.Item label="Hours">{parseFloat(item.hours).toFixed(2)}</Descriptions.Item>
                                                                <Descriptions.Item label="Desc" span={4}>{item.description|| 'N/A'}</Descriptions.Item>
                                                            </Descriptions>
                                                        </List.Item>
                                                    )}
                                                />
                                            </Collapse.Panel>
                                        );
                                    })}
                                </Collapse>
                                <TimesheetLogList logs={record.logs} />
                                </div>
                            );
                        },
                        rowExpandable: (record) => record.entries?.length > 0,
                        expandedRowKeys: expandedRowKeys,
                        onExpand: (expanded, record) => handleExpand(record.id),
                        expandIcon: () => null,
                    }}
                />
            )}
            <Modal
                title={`Reject Timesheet for ${selectedTimesheetForAction?.user?.name}`}
                open={isRejectModalVisible}
                onOk={handleRejectSubmit}
                onCancel={handleRejectCancel}
                okText="Submit Rejection"
                okButtonProps={{ danger: true }}
            >
                <Form layout="vertical">
                    <Form.Item label="Reason for Rejection" required>
                        <TextArea
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., 'Hours logged on Week 5 seem incorrect.'"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfessorTimesheetView;
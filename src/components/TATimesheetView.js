"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Button, Modal, Form, DatePicker, InputNumber, Input,
  message, Select, Space, Spin, Tag, Popconfirm, Card, Cascader, Alert, Transfer, List, Descriptions
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAcademicYear, getPreviousAcademicPeriod, getCurrentAcademicPeriod } from '@/lib/academicUtils';
import TimesheetLogList from '@/components/TimesheetLogList';
import { useCourse } from '@/context/CourseContext';

const { Option } = Select;
const { TextArea } = Input;

const TATimesheetView = ({ userId }) => {
  const { activeCourseCode } = useCourse();
  const [allTimesheets, setAllTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentAcademicPeriod());
  const [allClasses, setAllClasses] = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const [submittingIds, setSubmittingIds] = useState([]);
  const [recallingIds, setRecallingIds] = useState([]);

  const [isAddCourseModalVisible, setIsAddCourseModalVisible] = useState(false);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState(null);

  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [targetKeys, setTargetKeys] = useState([]);

  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentTimesheet, setCurrentTimesheet] = useState(null); 
  const [form] = Form.useForm();

  const [classTypes, setClassTypes] = useState([]);
  const [classGroups, setClassGroups] = useState([]);

  const fetchTimesheets = useCallback(async (period) => {
    if (!activeCourseCode) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/timesheets?period=${encodeURIComponent(period)}&courseCode=${activeCourseCode}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load timesheets');
      setAllTimesheets(await response.json());
    } catch (error) { message.error(error.message); }
    finally { setLoading(false); }
  }, [activeCourseCode]);

  const fetchAllClasses = useCallback(async () => {
    if (!activeCourseCode) return;
    try {
      const response = await fetch(`/api/classes?courseCode=${activeCourseCode}&fetchAll=true`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch class list');
      setAllClasses(await response.json());
    } catch (error) {
      message.error(error.message);
    }
  }, [activeCourseCode]);

  const fetchProfessors = useCallback(async () => {
    if (!activeCourseCode) return;
    try {
      const response = await fetch(`/api/professors?courseCode=${activeCourseCode}`, { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch professors');
      setAllProfessors(await response.json());
    } catch (error) {
      message.error(error.message);
    }
  }, [activeCourseCode]);

  useEffect(() => {
    
    fetchTimesheets(selectedPeriod);
    fetchAllClasses();
    fetchProfessors();
  }, [selectedPeriod, fetchTimesheets, fetchAllClasses, fetchProfessors]);

  const periodOptions = useMemo(() => {
    const currentPeriod = getCurrentAcademicPeriod();
    const prevPeriod = getPreviousAcademicPeriod();
    return [currentPeriod, prevPeriod];
  }, []);

  const classOptions = useMemo(() => {
    const options = {};
    allClasses.forEach(cls => {
      if (!options[cls.courseCode]) {
        options[cls.courseCode] = { value: cls.courseCode, label: cls.courseCode, children: {} };
      }
      if (!options[cls.courseCode].children[cls.classType]) {
        options[cls.courseCode].children[cls.classType] = { value: cls.classType, label: cls.classType, children: [] };
      }
      options[cls.courseCode].children[cls.classType].children.push({
        value: cls.id,
        label: cls.classGroup,
        classDetails: `${cls.classType} - ${cls.classGroup}`,
      });
    });
    return Object.values(options).map(course => ({
      ...course,
      children: Object.values(course.children),
    }));
  }, [allClasses]);

  const uniqueCourseCodes = useMemo(() => {
    return [...new Set(allClasses.map(cls => cls.courseCode))];
  }, [allClasses]);

  const sortedTimesheets = useMemo(() => {
    const statusOrder = { 'Draft': 1, 'Rejected': 2, 'Submitted': 3, 'Approved': 4 };
    return [...allTimesheets].sort((a, b) => {
      const statusA = statusOrder[a.status] || 99;
      const statusB = statusOrder[b.status] || 99;
      if (statusA !== statusB) return statusA - statusB;
      return a.courseCode.localeCompare(b.courseCode);
    });
  }, [allTimesheets]);

  const filteredClassOptions = useMemo(() => {
    if (!currentTimesheet) return [];
    const courseData = classOptions.find(opt => opt.value === currentTimesheet.courseCode);
    return courseData ? courseData.children : [];
  }, [classOptions, currentTimesheet]);

  const handleExpand = (expanded, record) => {
    const keys = expanded
      ? [...expandedRowKeys, record.id]
      : expandedRowKeys.filter(k => k !== record.id);
    setExpandedRowKeys(keys);
  };

  const showAddModal = (timesheet) => {
    setCurrentTimesheet(timesheet);
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });

    const courseData = classOptions.find(opt => opt.value === timesheet.courseCode);
    const types = (courseData ? courseData.children : []).map(type => ({ label: type.label, value: type.value }));
    setClassTypes([...new Set(types.map(t => t.value))].map(val => types.find(t => t.value === val))); 
    setClassGroups([]);

    setIsEntryModalVisible(true);
  };

  const showEditModal = (entry, timesheet) => {
    setCurrentTimesheet(timesheet);
    setEditingEntry(entry);

    const courseData = classOptions.find(opt => opt.value === timesheet.courseCode);
    const allTypesForCourse = (courseData ? courseData.children : []).map(type => ({ label: type.label, value: type.value }));

    const entryClassType = entry.classDetails.split(' - ')[0];
    const typeData = courseData?.children.find(type => type.value === entryClassType);
    const groupsForType = typeData ? typeData.children : [];
    const entryClassId = typeData?.children.find(group => group.classDetails === entry.classDetails)?.value;

    setClassTypes([...new Set(allTypesForCourse.map(t => t.value))].map(val => allTypesForCourse.find(t => t.value === val)));
    setClassGroups(groupsForType);

    form.setFieldsValue({
      classType: entryClassType,
      classId: entryClassId,
      date: dayjs(entry.date),
      hours: parseFloat(entry.hours),
      weekNumber: entry.weekNumber,
      description: entry.description,
    });
    setIsEntryModalVisible(true);
  };

  const handleEntryCancel = () => {
    setIsEntryModalVisible(false);
    setEditingEntry(null);
    setCurrentTimesheet(null);
    form.resetFields();
    setClassTypes([]);
    setClassGroups([]);
  };

  const handleModalClassTypeChange = (selectedType) => {
    const typeData = filteredClassOptions.find(type => type.value === selectedType);
    setClassGroups(typeData ? typeData.children : []);
    form.setFieldsValue({ classId: undefined });
  };

  const handleEntryFormSubmit = async (values) => {
    if (!currentTimesheet) return;

    let classDetailsStr = 'Unknown';
    const typeData = filteredClassOptions.find(type => type.value === values.classType);
    if (typeData) {
      const groupData = typeData.children.find(group => group.value === values.classId);
      if (groupData) { classDetailsStr = groupData.classDetails; }
    }

    const apiData = {
      date: values.date.toISOString(),
      hours: values.hours,
      courseCode: currentTimesheet.courseCode,
      classDetails: classDetailsStr,
      weekNumber: values.weekNumber,
      description: values.description,
    };

    try {
      let response;
      if (editingEntry) {
        response = await fetch(`/api/timesheet-entries/${editingEntry.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiData) });
      } else {
        response = await fetch('/api/timesheets/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiData) });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save entry.');
      }
      message.success(`Entry ${editingEntry ? 'updated' : 'added'}!`);
      handleEntryCancel();
      fetchTimesheets(selectedPeriod);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      const response = await fetch(`/api/timesheet-entries/${entryId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete entry.');
      message.success('Entry deleted!');
      fetchTimesheets(selectedPeriod);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleAddCourse = async (courseOverride) => {
    const courseToUse = courseOverride || selectedCourseToAdd;
    if (!courseToUse) {
      return message.error("Please select a course to add.");
    }
    try {
      const response = await fetch('/api/timesheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Credentials': 'include' },
        body: JSON.stringify({
          courseCode: courseToUse,
          period: selectedPeriod,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add course.');
      }

      const newTimesheet = await response.json();
      message.success(`Timesheet for ${courseToUse} created!`);

      setIsAddCourseModalVisible(false);
      setSelectedCourseToAdd(null);

      await fetchTimesheets(selectedPeriod);
      setExpandedRowKeys(prev => [...prev, newTimesheet.id]);

    } catch (error) {
      message.error(error.message);
    }
  };

  const handleSubmitForApproval = async (timesheetId) => {
    setSubmittingIds(prev => [...prev, timesheetId]);
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/submit`, { method: 'PATCH' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit.');
      }
      message.success("Timesheet submitted!");
      fetchTimesheets(selectedPeriod);
    } catch (error) {
      message.error(error.message);
    } finally {
      setSubmittingIds(prev => prev.filter(id => id !== timesheetId));
    }
  };

  const handleRecallTimesheet = async (timesheetId) => {
    setRecallingIds(prev => [...prev, timesheetId]);
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/recall`, { method: 'PATCH' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recall.');
      }
      message.success("Timesheet recalled!");
      fetchTimesheets(selectedPeriod);
    } catch (error) {
      message.error(error.message);
    } finally {
      setRecallingIds(prev => prev.filter(id => id !== timesheetId));
    }
  };

  const showAssignModal = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setTargetKeys(timesheet.approvers.map(prof => prof.id));
    setIsAssignModalVisible(true);
  };

  const handleAssignApprovers = async () => {
    if (!selectedTimesheet) return;
    try {
      await fetch(`/api/timesheets/${selectedTimesheet.id}/assign-approvers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professorIds: targetKeys }),
      });
      message.success("Approvers assigned!");
      setIsAssignModalVisible(false);
      fetchTimesheets(selectedPeriod);
    } catch (error) {
      message.error("Failed to assign approvers.");
    }
  };

  const timesheetColumns = [
    { title: 'Course Code', dataIndex: 'courseCode', key: 'courseCode' },
    { title: 'Period', dataIndex: 'period', key: 'period' },
    { title: 'Total Hours', dataIndex: 'totalHours', key: 'totalHours', render: h => parseFloat(h).toFixed(2) },
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
      title: 'Approvers',
      dataIndex: 'approvers',
      key: 'approvers',
      render: (approvers) => (approvers && approvers.length > 0) ?
        approvers.map(prof => prof.name).join(', ') :
        <Tag color="red">None Assigned</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {(record.status === 'Draft' || record.status === 'Rejected') && (
            <Button size="small" onClick={() => showAssignModal(record)}>Manage Approvers</Button>
          )}
          {(record.status === 'Draft' || record.status === 'Rejected') && (
            <Popconfirm
              title={record.status === 'Rejected' ? "Resubmit Timesheet?" : "Submit Timesheet?"}
              description={
                record.approvers.length === 0 ? "Please assign an approver first." :
                  (record.totalHours <= 0 ? "You cannot submit a timesheet with 0 hours." : "Are you sure?")
              }
              disabled={record.approvers.length === 0 || record.totalHours <= 0}
              onConfirm={() => handleSubmitForApproval(record.id)}
            >
              <Button
                type="primary"
                loading={submittingIds.includes(record.id)}
                style={record.status === 'Rejected' ? {} : { backgroundColor: 'orange', borderColor: 'orange' }}
                disabled={record.approvers.length === 0 || record.totalHours <= 0}
              >
                {record.status === 'Rejected' ? "Resubmit" : "Submit"}
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'Submitted' || record.status === 'Approved') && (
            <Popconfirm title="Recall this timesheet?" onConfirm={() => handleRecallTimesheet(record.id)}>
              <Button danger loading={recallingIds.includes(record.id)}>Recall</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const filterOption = (input, option) =>
    (option?.children ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <div style={{ padding: "24px" }}>
      <Card title="My Timesheets">
        <Space style={{ marginBottom: 16 }}>
          <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 220 }}>
            {periodOptions.map(p => <Option key={p} value={p}>{p}</Option>)}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddCourseModalVisible(true)}
            disabled={!activeCourseCode || allTimesheets.some(ts => ts.courseCode === activeCourseCode)}
          >
            Add Course Timesheet
          </Button>
        </Space>

        {!activeCourseCode ? (
          <Alert message="Please select a course to view timesheets." type="info" showIcon />
        ) : loading ? (
          <Spin />
        ) : (
          <Table
            columns={timesheetColumns}
            dataSource={sortedTimesheets} // Use sortedTimesheets
            rowKey="id"
            expandable={{
              expandedRowKeys: expandedRowKeys,
              onExpand: handleExpand,
              expandedRowRender: (record) => {
                const isEditable = record.status === 'Draft' || record.status === 'Rejected';
                
                const sortedEntries = [...record.entries].sort((a, b) => {
                  const classCompare = (a.classDetails || '').localeCompare(b.classDetails || '');
                  if (classCompare !== 0) return classCompare;
                  return (a.weekNumber || 0) - (b.weekNumber || 0);
                });

                // Define columns for the sub-table
                const entryColumns = [
                  { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => dayjs(date).format('YYYY-MM-DD') },
                  { title: 'Week', dataIndex: 'weekNumber', key: 'weekNumber', width: 80 },
                  { title: 'Class Details', dataIndex: 'classDetails', key: 'classDetails' },
                  { title: 'Hours', dataIndex: 'hours', key: 'hours', render: (h) => parseFloat(h).toFixed(2) },
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, entry) => (
                      <Space>
                        <Button icon={<EditOutlined />} onClick={() => showEditModal(entry, record)} disabled={!isEditable} />
                        <Popconfirm title="Delete this entry?" onConfirm={() => handleDeleteEntry(entry.id)} disabled={!isEditable}>
                          <Button icon={<DeleteOutlined />} danger disabled={!isEditable} />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ];

                return (
                  <div style={{ padding: '8px 24px' }}>
                    {record.status === 'Rejected' && record.rejectionReason && (
                      <Alert
                        message="Timesheet Rejected"
                        description={<><strong>Reason:</strong> {record.rejectionReason}</>}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    {isEditable ? (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showAddModal(record)}
                        style={{ marginBottom: 16 }}
                      >
                        Log Hours for {record.courseCode}
                      </Button>
                    ) : null}
                    <Table
                      columns={entryColumns}
                      dataSource={sortedEntries}
                      rowKey="id"
                      size="small"
                      pagination={false}
                    />
                    <TimesheetLogList logs={record.logs} />
                  </div>
                );
              },
              rowExpandable: (record) => true,
            }}
          />
        )}
      </Card>

      {}
      <Modal
        title={`Add New Course Timesheet for ${activeCourseCode}`}
        open={isAddCourseModalVisible}
        onOk={() => {
          handleAddCourse(activeCourseCode);
        }}
        onCancel={() => {
          setIsAddCourseModalVisible(false);
          setSelectedCourseToAdd(null);
        }}
        okText="Add"
      >
        <Form layout="vertical">
          <Form.Item label="Academic Period">
            <Input value={selectedPeriod} disabled />
          </Form.Item>
          <Form.Item label="Course Code">
            <Input value={activeCourseCode} disabled />
          </Form.Item>
        </Form>
      </Modal>

      {}
      {selectedTimesheet && (
        <Modal
          title={`Assign Approvers for ${selectedTimesheet.courseCode} (${selectedTimesheet.period})`}
          open={isAssignModalVisible}
          onOk={handleAssignApprovers}
          onCancel={() => setIsAssignModalVisible(false)}
          width={800}
          okText="Save Assignments"
        >
          <Alert
            message="How to Assign Approvers"
            description="Select professors from 'Available' and use the '>' button to move them to 'Assigned'."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Transfer
            dataSource={allProfessors.map(prof => {
              const roleInfo = prof.courseRoles?.find(r => r.courseCode === selectedTimesheet.courseCode);
              const displayRole = roleInfo ? roleInfo.role.replace("_", " ") : "COURSE COORDINATOR";
              const title = `${prof.name} (${displayRole} - ${selectedTimesheet.courseCode})`;
              return { key: prof.id, title };
            })}
            targetKeys={targetKeys}
            onChange={setTargetKeys}
            render={item => item.title}
            listStyle={{ width: '100%', height: 300 }}
            titles={['Available Professors', 'Assigned Approvers']}
            operations={['Assign >', '< Unassign']}
          />
        </Modal>
      )}

      {}
      <Modal
        title={editingEntry ? 'Edit Entry' : `Log Hours for ${currentTimesheet?.courseCode}`}
        open={isEntryModalVisible}
        onCancel={handleEntryCancel}
        onOk={() => form.submit()}
        okText={editingEntry ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical" onFinish={handleEntryFormSubmit}>
          <Form.Item name="classType" label="Class Type" rules={[{ required: true }]}>
            <Select
              placeholder="Search or select Type"
              onChange={handleModalClassTypeChange}
              showSearch
              filterOption={filterOption}
            >
              {classTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="classId" label="Class Group" rules={[{ required: true }]}>
            <Select
              placeholder="Search or select Group"
              disabled={classGroups.length === 0}
              showSearch
              filterOption={filterOption}
            >
              {classGroups.map(group => (
                <Option key={group.value} value={group.value}>{group.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
          <Form.Item
            name="weekNumber"
            label="Academic Week"
            rules={[
              { required: true, message: 'Please enter the week number' },
              { type: 'number', min: 1, max: 13, message: 'Week must be between 1 and 13' }
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
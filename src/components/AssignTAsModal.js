
import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, message, Transfer, Alert } from 'antd';
import { useCourse } from '@/context/CourseContext';

const { Option } = Select;

const AssignTAsModal = ({ visible, onCancel, initialTaId }) => {
  const { activeCourseCode } = useCourse();
  const [tas, setTAs] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedTa, setSelectedTa] = useState(null);
  const [targetKeys, setTargetKeys] = useState([]); // Keys of assigned classes
  const [loading, setLoading] = useState(false);
  const [isAssignmentModalVisible, setIsAssignmentModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      // Fetch TAs
      const tasUrl = activeCourseCode ? `/api/tas?courseCode=${activeCourseCode}` : '/api/tas';
      fetch(tasUrl)
        .then(res => res.json())
        .then(data => {
          setTAs(data);
          // If initialTaId is provided, auto-select and open modal
          if (initialTaId) {
            const ta = data.find(t => t.id === initialTaId);
            if (ta) {
              setSelectedTa(initialTaId);
              setIsAssignmentModalVisible(true);
            }
          }
        })
        .catch(() => message.error('Failed to fetch TAs'));

      // Fetch all Classes for the Transfer component
      const classesUrl = activeCourseCode ? `/api/management/classes?courseCode=${activeCourseCode}` : '/api/management/classes';
      fetch(classesUrl)
        .then(res => res.json())
        .then(data => {
          // Format classes for Transfer component
          const formattedClasses = data.map(cls => ({
            key: cls.id.toString(), // Transfer expects string keys
            title: `${cls.courseCode} - ${cls.classGroup} (${cls.classType})`,
            description: `${cls.courseCode} - ${cls.classGroup} (${cls.classType})`,
          }));
          setAllClasses(formattedClasses);
        })
        .catch(() => message.error('Failed to fetch classes'));
    } else {
      // Reset state when modal closes
      setSelectedTa(null);
      setIsAssignmentModalVisible(false);
    }
  }, [visible, initialTaId, activeCourseCode]);

  useEffect(() => {
    if (selectedTa && isAssignmentModalVisible) {
      // Fetch assigned classes for the selected TA
      fetch(`/api/tas/${selectedTa}/classes`)
        .then(res => res.json())
        .then(data => {
          setTargetKeys(data.map(cls => cls.id.toString())); // Transfer expects string keys
        })
        .catch(() => message.error('Failed to fetch assigned classes'));
    } else if (!selectedTa) {
      setTargetKeys([]);
    }
  }, [selectedTa, isAssignmentModalVisible]);

  const handleTaSelect = (value) => {
    setSelectedTa(value);
  };

  const openAssignmentModal = () => {
    if (selectedTa) {
      setIsAssignmentModalVisible(true);
    }
  };

  const handleAssignClasses = async () => {
    if (!selectedTa) {
      message.warning('No TA selected.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tas/${selectedTa}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: targetKeys.map(key => parseInt(key, 10)) }),
      });

      if (res.ok) {
        message.success('Classes assigned successfully!');
        setIsAssignmentModalVisible(false);
        onCancel(); // Close the initial modal as well
      } else {
        throw new Error('Failed to assign classes');
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentModalClose = () => {
    setIsAssignmentModalVisible(false);
    setSelectedTa(null);
    setTargetKeys([]);
    // If we opened in "direct edit" mode, closing this modal should close the whole thing
    if (initialTaId) {
      onCancel();
    }
  };

  const filterOption = (inputValue, option) => {
    const searchTerms = inputValue.toLowerCase().split(' ').filter(term => term);
    const title = option.title.toLowerCase();
    return searchTerms.every(term => title.includes(term));
  };

  return (
    <>
      <Modal
        title="Select TA to Assign Classes"
        visible={visible && !initialTaId} // Hide this modal if we are in direct edit mode
        onCancel={onCancel}
        closable={false}
        footer={[
          <Button key="back" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={openAssignmentModal} disabled={!selectedTa}>
            Assign Classes
          </Button>,
        ]}
      >
        <Select
          showSearch
          placeholder="Select a TA"
          style={{ width: '100%', marginBottom: 16 }}
          onChange={handleTaSelect}
          value={selectedTa}
          allowClear
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {tas.map(ta => {
            const courseRole = ta.courseRoles?.find(cr => cr.courseCode === activeCourseCode)?.role;
            const displayRole = courseRole || ta.role;
            return (
              <Option key={ta.id} value={ta.id}>
                {ta.name} ({displayRole.replace('_', ' ')})
              </Option>
            );
          })}
        </Select>
      </Modal>

      {selectedTa && (
        <Modal
          title={`Assign Classes to ${tas.find(t => t.id === selectedTa)?.name}`}
          open={isAssignmentModalVisible}
          onOk={handleAssignClasses}
          onCancel={handleAssignmentModalClose}
          width={800}
          confirmLoading={loading}
        >
          <Alert
            message="How to Assign and Unassign Classes"
            description={
              <>
                To assign a class, select it from the &apos;Available&apos; list and click the &apos;Assign &gt;&apos; button.
                <br />
                <br />
                To unassign, select a class from the &apos;Assigned&apos; list and click the &apos;&lt; Unassign&apos; button.
              </>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Transfer
            dataSource={allClasses}
            targetKeys={targetKeys}
            onChange={(newTargetKeys) => setTargetKeys(newTargetKeys)}
            render={(item) => item.title}
            listStyle={{ width: '100%', height: 300 }}
            titles={['Available Classes', 'Assigned Classes']}
            operations={['Assign', 'Unassign']}
            showSearch
            filterOption={filterOption}
          />
        </Modal>
      )}
    </>
  );
};


export default AssignTAsModal;

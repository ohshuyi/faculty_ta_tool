
import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, message, Transfer, Alert } from 'antd';

const { Option } = Select;

const AssignTAsModal = ({ visible, onCancel }) => {
  const [tas, setTAs] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedTa, setSelectedTa] = useState(null);
  const [targetKeys, setTargetKeys] = useState([]); // Keys of assigned classes
  const [loading, setLoading] = useState(false);
  const [isAssignmentModalVisible, setIsAssignmentModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      // Fetch TAs
      fetch('/api/tas')
        .then(res => res.json())
        .then(data => setTAs(data))
        .catch(() => message.error('Failed to fetch TAs'));

      // Fetch all Classes for the Transfer component
      fetch('/api/management/classes')
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
    }
  }, [visible]);

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
        visible={visible}
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
          {tas.map(ta => (
            <Option key={ta.id} value={ta.id}>{ta.name}</Option>
          ))}
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
                To <b>ASSIGN</b> a class, select a class from the <b>'Available Classes'</b> list and click the <b>'&gt; Assign'</b> button.
                <br />
                To <b>UNASSIGN</b> a class, select a class from the <b>'Assigned Classes'</b> list and click the <b>'&lt; Unassign'</b> button.
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

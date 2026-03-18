"use client";
import React, { useState } from 'react';
import { List, Typography, Button } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;
const DEFAULT_VISIBLE_LOGS = 3;

const TimesheetLogList = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!logs || logs.length === 0) {
    return <Text type="secondary" style={{ display: 'block', paddingTop: '4px'}}>No history for this timesheet yet.</Text>;
  }

  const logsToShow = isExpanded ? logs : logs.slice(0, DEFAULT_VISIBLE_LOGS);

  return (
    
    <div style={{ paddingTop: '4px' }}>
      {}
      <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>History Log</h4>
      <List
        size="small"
        dataSource={logsToShow}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={`${item.action} by ${item.actorName}`}
              description={item.details}
            />
            <Text type="secondary">{dayjs(item.timestamp).format('YYYY-MM-DD HH:mm')}</Text>
          </List.Item>
        )}
      />
      {logs.length > DEFAULT_VISIBLE_LOGS && (
        <Button
          type="link"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ paddingLeft: 0, marginTop: '8px' }}
        >
          {isExpanded ? 'Show Less' : `Show All (${logs.length})`}
        </Button>
      )}
    </div>
  );
};

export default TimesheetLogList;
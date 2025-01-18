import React from 'react';
import { Button } from 'antd';
import { signOut } from 'next-auth/react';

const Restricted = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Access Restricted</h1>
      <p>Your account role is "USER". Please contact the administrator to update your role to "PROFESSOR" or "TA".</p>
      <Button onClick={() => signOut()} type="primary">
        Sign Out
      </Button>
    </div>
  );
};

export default Restricted;
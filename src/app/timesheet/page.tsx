"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/Layout';
import TATimesheetView from '@/components/TATimesheetView';
import ProfessorTimesheetView from '@/components/ProfessorTimesheetView';
import { Spin, Alert } from 'antd';
import { useRouter } from 'next/navigation';

const TimesheetPage: React.FC = () => {
  // Specify the type for session data if you have custom session properties
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in after check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/'); // Redirect to login or home page
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AppLayout>
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }} />
      </AppLayout>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <AppLayout>
        <Alert message="Redirecting to login..." type="info" />
      </AppLayout>
    );
  }

  // Ensure session.user exists and has properties before accessing them
  const userId = session.user?.id;
  const userRole = session.user?.role;

  // Render different components based on role
  return (
    <AppLayout>
      {userRole === 'TA' && userId && <TATimesheetView userId={userId} />}
      {userRole === 'PROFESSOR' && <ProfessorTimesheetView />}
      {(userRole !== 'TA' && userRole !== 'PROFESSOR') && (
        <Alert message="You do not have permission to view this page." type="warning" />
      )}
    </AppLayout>
  );
};

export default TimesheetPage;
"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/Layout';
import TATimesheetView from '@/components/TATimesheetView';
import ProfessorTimesheetView from '@/components/ProfessorTimesheetView';
import { Spin, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import { useCourse } from '@/context/CourseContext';

const TimesheetPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeCourseRole } = useCourse();

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
  const userId = (session.user as any)?.id;

  // Render different components based on role
  return (
    <AppLayout>
      {(activeCourseRole === 'TA' || activeCourseRole === 'TUTOR') && userId && <TATimesheetView userId={userId} />}
      {(activeCourseRole === 'COURSE_COORDINATOR') && <ProfessorTimesheetView />}
      {(!activeCourseRole) && (
        <Alert message="Please select a course to view timesheets." type="info" showIcon />
      )}
    </AppLayout>
  );
};

export default TimesheetPage;
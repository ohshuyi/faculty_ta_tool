'use client';

import { SessionProvider } from 'next-auth/react';
import { CourseProvider } from '@/context/CourseContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CourseProvider>
        {children}
      </CourseProvider>
    </SessionProvider>
  );
}
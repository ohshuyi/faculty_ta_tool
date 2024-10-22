// src/app/login/page.tsx
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // If logged in, redirect to the dashboard
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    } //
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-blue-400 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back!</h1>
        <p className="text-gray-600 text-center mb-6">Log in with your Microsoft account to continue</p>
        <button
          onClick={() => signIn('azure-ad')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300 ease-in-out"
        >
          <svg className="inline-block h-5 w-5 mr-2" viewBox="0 0 48 48">
            <path fill="#F25022" d="M24 24H3V3h21v21z" />
            <path fill="#00A4EF" d="M45 24H24V3h21v21z" />
            <path fill="#7FBA00" d="M24 45H3V24h21v21z" />
            <path fill="#FFB900" d="M45 45H24V24h21v21z" />
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}

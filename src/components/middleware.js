import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Restrict access for 'USER' role
  if (token.role === 'USER') {
    return NextResponse.redirect(new URL('/restricted', req.url)); // Redirect to a restricted page
  }

  return NextResponse.next(); // Allow access
}

// Specify protected routes
export const config = {
  matcher: [
    '/dashboard/:path*', // Add all protected routes here
  ],
};

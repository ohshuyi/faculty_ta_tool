import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  console.log("API Route Hit: Fetching fresh data");  // For debugging

  const users = await prisma.user.findMany();  // Always query fresh data
  console.log()
  // Disable caching completely in the API response
  const response = NextResponse.json(users);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
export const dynamic = "force-dynamic";
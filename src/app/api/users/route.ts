import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET method to retrieve users
export async function GET(req: Request) {
  // Retrieve all users from the database
  const users = await prisma.user.findMany();

  // Create a response with cache control headers to disable caching
  const response = NextResponse.json(users);


  return response;
}

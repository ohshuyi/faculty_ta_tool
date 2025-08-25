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

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, role } = await req.json();

    if (!name || !rawEmail || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required fields" },
        { status: 400 }
      );
    }

    // Convert the email to lowercase
    const email = rawEmail.toLowerCase();

    // Check if a user with the lowercase email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }, // Use the lowercase email for the check
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create the user with the lowercase email
    const newUser = await prisma.user.create({
      data: {
        name,
        email, // Save the lowercase email
        role,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the user" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts

// GET method to retrieve tickets for the logged-in user (where they are the TA)

export async function POST(req: Request) {
  try {
    // Parse the incoming request body
    const data = await req.json();

    // Create a new ticket using Prisma
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: data.ticketNumber,
        ticketDescription: data.ticketDescription,
        courseGroupType: data.courseGroupType,
        category: data.category,
        student: data.student,
        details: data.details || "", // Optional field
        priority: data.priority,
        professorId: data.professorId, // Professor selected in the form
        taId: data.taId, // TA assigned (you might want to get this from session or the logged-in user)
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Return a success response
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userEmail = session.user?.email;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define the condition based on role
    let whereCondition = {};
    if (user.role === "TA") {
      whereCondition = { taId: user.id };
    } else if (user.role === "PROFESSOR") {
      whereCondition = { professorId: user.id };
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch tickets based on the condition (for both TA and Professor)
    const tickets = await prisma.ticket.findMany({
      where: whereCondition,
      include: {
        ta: true,
        professor: true,
        comments: true,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Error fetching tickets" }, { status: 500 });
  }
}

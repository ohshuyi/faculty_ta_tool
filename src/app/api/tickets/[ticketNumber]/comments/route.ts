import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET method to fetch comments for a specific ticketNumber
export async function GET(req: Request, { params }: { params: { ticketNumber: string } }) {
  const { ticketNumber } = params;

  try {
    // Find the ticket by ticketNumber and include comments
    const ticketWithComments = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        comments: true,  // Include comments associated with the ticket
      },
    });

    if (!ticketWithComments) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Return the comments
    return NextResponse.json(ticketWithComments.comments, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST method to add a comment for a specific ticketNumber
export async function POST(req: Request, { params }: { params: { ticketNumber: string } }) {
    const { ticketNumber } = params;
    const body = await req.json();
    
    const { author, content } = body;
  
    try {
      // Find the ticket by ticketNumber
      const ticket = await prisma.ticket.findUnique({
        where: { ticketNumber },
      });
  
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
  
      // Add a new comment for the ticket
      const newComment = await prisma.comment.create({
        data: {
          author,
          content,
          ticketId: ticket.id, // Associate with the ticket
        },
      });
  
      return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
      console.error("Error adding comment:", error);
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }
  }
  
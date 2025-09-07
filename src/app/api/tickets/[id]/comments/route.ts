import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// GET method to fetch comments for a specific ticketNumber
export async function GET(req: Request, { params }: { params: { id: number } }) {
  const { id } = params;
  try {
    // Find the ticket by ticketNumber and include comments
    const ticketWithComments = await prisma.ticket.findUnique({
      where: { id: Number(id) },
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
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  const baseUrl = "https://faculty-ta.azurewebsites.net"

  const { author, content } = body;

  try {
    // Find the ticket by ticketNumber
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        professor: true,
        ta: true
      },
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

    if (ticket) {
      const subject = `New Comment on Ticket: ${ticket.name}`;
      const body = `
        <html>
          <body>
            <p><strong>${author}</strong> added a new comment to ticket "<strong>${ticket.name}</strong>":</p>
            <blockquote style="padding: 10px; border-left: 3px solid #eee; margin-left: 5px; font-style: italic;">
              ${content}
            </blockquote>
            <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View Ticket
            </a>
          </body>
        </html>
      `;

      // Notify the professor (unless they wrote the comment)
      if (ticket.professor?.name !== author && ticket.professor?.email) {
        await sendEmail(ticket.professor.email, subject, body);
      }

      // Notify the TA (unless they wrote the comment)
      if (ticket.ta?.name !== author && ticket.ta?.email) {
        await sendEmail(ticket.ta.email, subject, body);
      }
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request, { params }: { params: { id: number } }) {
  const { id } = params;
  try {
    
    const ticketWithComments = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        comments: true,  
      },
    });

    if (!ticketWithComments) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticketWithComments.comments, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  const baseUrl = "https://faculty-ta-v2.azurewebsites.net"

  const { author, content } = body;

  try {
    
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

    const newComment = await prisma.comment.create({
      data: {
        author,
        content,
        ticketId: ticket.id, 
      },
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
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

      if (ticket.professor?.name !== author && ticket.professor?.email) {
        await sendEmail(ticket.professor.email, subject, body);
      }

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

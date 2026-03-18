import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const baseUrl = "https://faculty-ta-v2.azurewebsites.net"

  try {
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const status = body.status || "completed";

    const session = await getServerSession(authOptions);
    const authorName = session?.user?.name || "System";

    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        status: status,
        updatedAt: new Date(),
        comments: {
          create: {
            author: authorName,
            content: `Ticket marked as ${status} by ${authorName}.`,
          },
        },
      },
      include: {
        professor: true,
        ta: true,
      },
    });

    const subject = `Ticket Status Updated: ${updatedTicket.name}`;
    const emailBody = `
      <html>
        <body>
          <p>The status of ticket "<strong>${updatedTicket.name}</strong>" has been updated to <strong>${updatedTicket.status.toUpperCase()}</strong>.</p>
          <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View Ticket
            </a>
        </body>
      </html>
    `;

    if (updatedTicket.professor?.email) {
      await sendEmail(updatedTicket.professor.email, subject, emailBody);
    }

    if (updatedTicket.ta?.email) {
      await sendEmail(updatedTicket.ta.email, subject, emailBody);
    }

    return NextResponse.json(
      { message: "Ticket marked as completed", ticket: updatedTicket },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "Failed to update ticket status" },
      { status: 500 }
    );
  }
}
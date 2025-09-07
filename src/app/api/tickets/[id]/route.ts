import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// DELETE method to delete a ticket by its ticketNumber
// export async function DELETE(
//   req: Request,
//   { params }: { params: { ticketNumber: string } }
// ) {
//   const { ticketNumber } = params;

//   try {
//     // Fetch the ticket first to get the id
//     const ticket = await prisma.ticket.findUnique({
//       where: { ticketNumber },
//     });

//     if (!ticket) {
//       return NextResponse.json(
//         { error: "Ticket not found" },
//         { status: 404 }
//       );
//     }

//     // Delete the associated comments first by ticketId
//     await prisma.comment.deleteMany({
//       where: { ticketId: ticket.id },
//     });

//     // Delete the associated files first by ticketId
//     await prisma.file.deleteMany({
//       where: { ticketId: ticket.id },
//     });

//     // Now delete the ticket
//     await prisma.ticket.delete({
//       where: { id: ticket.id },
//     });

//     return NextResponse.json(
//       { message: "Ticket deleted successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error deleting ticket:", error);
//     return NextResponse.json(
//       { error: "Failed to delete ticket" },
//       { status: 500 }
//     );
//   }
// }


// PATCH method to update the status of a ticket
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const baseUrl = "https://faculty-ta.azurewebsites.net"

  try {
    // Find the ticket first
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Update the status to 'completed'
    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        status: "completed",
        updatedAt: new Date(),
      },
      include: {
        professor: true,
        ta: true,
      },
    });

    const subject = `Ticket Status Updated: ${updatedTicket.name}`;
    const body = `
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

    // Send email to the professor
    if (updatedTicket.professor?.email) {
      await sendEmail(updatedTicket.professor.email, subject, body);
    }

    // Send email to the TA
    if (updatedTicket.ta?.email) {
      await sendEmail(updatedTicket.ta.email, subject, body);
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
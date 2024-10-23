import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE method to delete a ticket by its ticketNumber
export async function DELETE(
  req: Request,
  { params }: { params: { ticketNumber: string } }
) {
  const { ticketNumber } = params;

  try {
    // Fetch the ticket first to get the id
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Delete the associated files first by ticketId
    await prisma.file.deleteMany({
      where: { ticketId: ticket.id },
    });

    // Delete the ticket from the database
    await prisma.ticket.delete({
      where: { id: ticket.id },
    });

    return NextResponse.json(
      { message: "Ticket deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
}

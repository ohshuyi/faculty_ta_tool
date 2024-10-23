import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE method to delete a ticket by its ticketNumber
export async function DELETE(req: Request, { params }: { params: { ticketNumber: string } }) {
    const { ticketNumber } = params;
      console.log(ticketNumber)
    try {
      // Delete the ticket from the database
      await prisma.ticket.delete({
        where: { ticketNumber },
      });
  
      return NextResponse.json({ message: "Ticket deleted successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
    }
  }
  
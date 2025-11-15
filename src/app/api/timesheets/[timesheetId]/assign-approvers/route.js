import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const timesheetId = parseInt(params.timesheetId, 10);
    const { professorIds } = await req.json(); // Expects an array of Prof IDs

    if (!session?.user?.id || session.user.role !== 'TA') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the TA owns this timesheet
    const timesheet = await prisma.timesheet.findFirst({
      where: { id: timesheetId, userId: session.user.id },
    });
    if (!timesheet) {
      return NextResponse.json({ error: "Timesheet not found or access denied." }, { status: 404 });
    }

    // Use 'set' to replace the old list of approvers with the new one
    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        approvers: {
          set: professorIds.map(id => ({ id: id })),
        },
      },
    });

    const profs = await prisma.user.findMany({ 
      where: { id: { in: professorIds } },
      select: { name: true }
    });
    const profNames = profs.map(p => p.name).join(', ') || 'None';

    await prisma.timesheetLog.create({
      data: {
        timesheetId: timesheetId,
        actorName: `${session.user.name} (TA)`,
        action: "Approvers Assigned",
        details: `Set approvers to: ${profNames}`
      }
    });

    return NextResponse.json({ message: "Approvers assigned successfully." });
  } catch (error) {
    console.error("Error assigning approvers:", error);
    return NextResponse.json({ error: "Failed to assign approvers." }, { status: 500 });
  }
}
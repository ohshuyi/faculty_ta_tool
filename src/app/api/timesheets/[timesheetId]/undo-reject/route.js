import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const professorId = session?.user?.id;
    const timesheetId = parseInt(params.timesheetId, 10);

    if (session?.user?.role !== 'PROFESSOR' || !professorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (isNaN(timesheetId)) {
      return NextResponse.json({ error: "Invalid timesheet ID" }, { status: 400 });
    }

    // Find the timesheet to ensure the prof is an approver and it's 'Rejected'
    const timesheet = await prisma.timesheet.findFirst({
        where: {
            id: timesheetId,
            status: "Rejected",
            approvers: { some: { id: professorId } }
        }
    });

    if (!timesheet) {
        return NextResponse.json({ error: "Timesheet not found, not 'Rejected', or you are not an approver." }, { status: 403 });
    }

    // Update the status back to "Submitted" and clear the reason
    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { 
        status: "Submitted",
        rejectionReason: null // Clear the rejection reason
      },
    });

    await prisma.timesheetLog.create({
      data: {
        timesheetId: timesheetId,
        actorName: `${session.user.name} (Professor)`,
        action: "Undo rejection",
      }
    });

    return NextResponse.json(updatedTimesheet);
  } catch (error) {
    console.error("Error undoing rejection:", error);
     if (error.code === 'P2025') { 
        return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
     }
    return NextResponse.json({ error: "Failed to undo rejection" }, { status: 500 });
  }
}
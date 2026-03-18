import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const timesheetId = parseInt(params.timesheetId, 10);

    if (isNaN(timesheetId)) {
      return NextResponse.json({ error: "Invalid timesheet ID" }, { status: 400 });
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet || timesheet.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Timesheet not found or unauthorized" }, { status: 404 });
    }

    if (timesheet.status !== 'Submitted' && timesheet.status !== 'Approved') {
       return NextResponse.json({ error: "Only Submitted or Approved timesheets can be recalled." }, { status: 400 });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: "Draft" },
    });

    await prisma.timesheetLog.create({
      data: {
        timesheetId: timesheetId,
        actorName: `${session.user.name} (TA)`,
        action: "Recalled",
      }
    });

    return NextResponse.json(updatedTimesheet);
  } catch (error) {
    console.error("Error recalling timesheet:", error);
    return NextResponse.json({ error: "Failed to recall timesheet" }, { status: 500 });
  }
}
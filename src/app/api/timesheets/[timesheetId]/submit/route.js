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

    // Verify the TA owns this timesheet and it's currently a Draft
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet || timesheet.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Timesheet not found or unauthorized" }, { status: 404 });
    }
    if (timesheet.status !== 'Draft') {
      return NextResponse.json({ error: "Only draft timesheets can be submitted." }, { status: 400 });
    }

    // Update status to 'Submitted'
    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: "Submitted" },
    });

    return NextResponse.json(updatedTimesheet);
  } catch (error) {
    console.error("Error submitting timesheet:", error);
    return NextResponse.json({ error: "Failed to submit timesheet" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'PROFESSOR') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const timesheetId = parseInt(params.timesheetId, 10);
    if (isNaN(timesheetId)) {
      return NextResponse.json({ error: "Invalid timesheet ID" }, { status: 400 });
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: "Submitted" },
    });

    await prisma.timesheetLog.create({
      data: {
        timesheetId: timesheetId,
        actorName: `${session.user.name} (Professor)`,
        action: "Revoke timesheet approval",
      }
    });

    return NextResponse.json(updatedTimesheet);
  } catch (error) {
    console.error("Error revoking timesheet approval:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to revoke approval" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'PROFESSOR') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { timesheetIds } = await req.json();

    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return NextResponse.json({ error: "No timesheet IDs provided." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const timesheetsToApprove = await tx.timesheet.findMany({
        where: {
          id: { in: timesheetIds },
          status: "Submitted",
        },
        select: { id: true }
      });

      const idsToApprove = timesheetsToApprove.map(t => t.id);

      if (idsToApprove.length === 0) {
        return { count: 0 };
      }

      const updateResult = await tx.timesheet.updateMany({
        where: {
          id: { in: idsToApprove },
        },
        data: { status: "Approved" },
      });

      const actorName = `${session.user.name} (Professor)`;
      const logEntries = idsToApprove.map(id => ({
        timesheetId: id,
        actorName: actorName,
        action: "Approved",
      }));

      await tx.timesheetLog.createMany({
        data: logEntries,
      });

      return updateResult;
    });

    return NextResponse.json({ message: `${result.count} timesheets approved.` });
  } catch (error) {
    console.error("Error bulk approving timesheets:", error);
    return NextResponse.json({ error: "Failed to bulk approve" }, { status: 500 });
  }
}
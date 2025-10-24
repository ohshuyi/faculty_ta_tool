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

    const { timesheetIds } = await req.json(); // Expect an array of IDs

    if (!Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return NextResponse.json({ error: "No timesheet IDs provided." }, { status: 400 });
    }

    const result = await prisma.timesheet.updateMany({
      where: {
        id: { in: timesheetIds },
        status: "Pending", // Only approve pending timesheets
      },
      data: { status: "Approved" },
    });

    return NextResponse.json({ message: `${result.count} timesheets approved.` });
  } catch (error) {
    console.error("Error bulk approving timesheets:", error);
    return NextResponse.json({ error: "Failed to bulk approve" }, { status: 500 });
  }
}
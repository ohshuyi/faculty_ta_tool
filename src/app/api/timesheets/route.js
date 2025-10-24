import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user;
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status"); // Optional status filter

    let whereCondition = {};

    if (user.role === "TA") {
      whereCondition.userId = user.id; // TA sees only their own timesheets
    } else if (user.role === "PROFESSOR") {
      const statusToFetch = statusFilter || "Submitted";
      whereCondition.status = statusToFetch;
    } else {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    const timesheets = await prisma.timesheet.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true } }, // Include TA name for professor view
        entries: true, // Include entries for detail view
      },
      orderBy: {
        period: 'desc', // Show most recent periods first
      },
    });

    return NextResponse.json(timesheets);
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'TA') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { courseCode, period } = await req.json();
    if (!courseCode || !period) {
      return NextResponse.json({ error: "Course code and period are required." }, { status: 400 });
    }

    // Check if a timesheet already exists for this combination
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: {
        userId_period_courseCode: {
          userId: session.user.id,
          period: period,
          courseCode: courseCode,
        },
      },
    });

    if (existingTimesheet) {
      return NextResponse.json({ error: "A timesheet for this course and period already exists." }, { status: 409 });
    }

    // Create the new, empty timesheet
    const newTimesheet = await prisma.timesheet.create({
      data: {
        userId: session.user.id,
        period: period,
        courseCode: courseCode,
        status: "Draft",
        totalHours: 0,
      },
    });

    return NextResponse.json(newTimesheet, { status: 201 });
  } catch (error) {
    console.error("Error creating timesheet:", error);
    return NextResponse.json({ error: "Failed to create timesheet." }, { status: 500 });
  }
}
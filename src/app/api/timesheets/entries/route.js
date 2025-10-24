import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from '@prisma/client'; // Import Prisma namespace for Decimal
import { getAcademicYear, getSemester, getCurrentAcademicPeriod } from '@/lib/academicUtils';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'TA') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { date, hours, courseCode, classDetails, weekNumber, description } = await req.json();
        if (!date || !hours || !courseCode || !classDetails || weekNumber == null) { // Added check for weekNumber
            return NextResponse.json({ error: "Date, hours, course code, class details, and week number are required." }, { status: 400 });
        }

        const entryDate = new Date(date);
        // --- Calculate the period automatically ---
        const period = getCurrentAcademicPeriod(entryDate);

        // Convert hours to Decimal
        const hoursDecimal = new Prisma.Decimal(hours);

        // Use transaction to find/create timesheet and add entry
        const newEntry = await prisma.$transaction(async (tx) => {
            // Find or create the timesheet for the given user and period
            const timesheet = await tx.timesheet.upsert({
                where: { userId_period: { userId, period } },
                update: {}, // No update needed here
                create: { userId, period, status: 'Draft' },
            });

            if (timesheet.status !== 'Draft') {
                throw new Error("Cannot add entries to a non-draft timesheet.");
            }

            // Create the new entry
            const entry = await tx.timesheetEntry.create({
                data: {
                    timesheetId: timesheet.id,
                    date: new Date(date),
                    hours: hoursDecimal,
                    courseCode: courseCode,
                    classDetails: classDetails,
                    weekNumber: parseInt(weekNumber),
                    description,
                },
            });

            // Recalculate total hours for the timesheet
            const aggregate = await tx.timesheetEntry.aggregate({
                _sum: { hours: true },
                where: { timesheetId: timesheet.id },
            });

            const newTotalHours = aggregate._sum.hours || 0;

            await tx.timesheet.update({
                where: { id: timesheet.id },
                data: {
                    totalHours: newTotalHours,
                    // If it was approved, set it back to Pending
                    status: timesheet.status === 'Approved' ? 'Pending' : timesheet.status,
                },
            });

            return entry;
        });

        return NextResponse.json(newEntry, { status: 201 });
    } catch (error) {
        console.error("Error adding timesheet entry:", error);
        // Handle potential decimal conversion errors
        if (error instanceof Prisma.PrismaClientValidationError) {
            return NextResponse.json({ error: "Invalid data format (e.g., hours must be a number)." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
    }
}
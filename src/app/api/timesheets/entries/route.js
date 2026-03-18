import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from '@prisma/client'; 
import { getAcademicYear, getSemester, getCurrentAcademicPeriod } from '@/lib/academicUtils';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'TA') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { date, hours, courseCode, classDetails, weekNumber, description } = await req.json();
        if (!date || !hours || !courseCode || !classDetails || weekNumber == null) { 
            return NextResponse.json({ error: "Date, hours, course code, class details, and week number are required." }, { status: 400 });
        }

        const entryDate = new Date(date);
        
        const period = getCurrentAcademicPeriod(entryDate);

        const hoursDecimal = new Prisma.Decimal(hours);

        const newEntry = await prisma.$transaction(async (tx) => {
            
            const timesheet = await tx.timesheet.upsert({
                where: {
                    userId_period_courseCode: { 
                        userId: userId,
                        period: period,
                        courseCode: courseCode
                    }
                },
                update: {}, 
                create: {
                    userId: userId,
                    period: period,
                    courseCode: courseCode, 
                    status: 'Draft'
                },
            });

            if (timesheet.status !== 'Draft' && timesheet.status !== 'Rejected') {
                throw new Error("Cannot add entries. Please recall the timesheet first.");
            }

            const entry = await tx.timesheetEntry.create({
                data: {
                    timesheetId: timesheet.id,
                    date: entryDate,
                    hours: hoursDecimal,
                    classDetails: classDetails,
                    weekNumber: parseInt(weekNumber),
                    description,
                },
            });

            const aggregate = await tx.timesheetEntry.aggregate({
                _sum: { hours: true },
                where: { timesheetId: timesheet.id },
            });

            const newTotalHours = aggregate._sum.hours || 0;

            await tx.timesheet.update({
                where: { id: timesheet.id },
                data: {
                    totalHours: newTotalHours,
                    status: 'Draft',
                    rejectionReason: null, 
                },
            });
            return entry;
        });

        return NextResponse.json(newEntry, { status: 201 });
    } catch (error) {
        console.error("Error adding timesheet entry:", error);
        
        if (error instanceof Prisma.PrismaClientValidationError) {
            return NextResponse.json({ error: "Invalid data format (e.g., hours must be a number)." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
    }
}
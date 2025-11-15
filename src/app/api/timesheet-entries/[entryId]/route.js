import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from '@prisma/client';

async function recalculateTotalHours(tx, timesheetId) {
    const aggregate = await tx.timesheetEntry.aggregate({
        _sum: { hours: true },
        where: { timesheetId },
    });
    await tx.timesheet.update({
        where: { id: timesheetId },
        data: { totalHours: aggregate._sum.hours || 0 },
    });
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const entryId = parseInt(params.entryId, 10);
        const { date, hours, weekNumber, description } = await req.json();

        if (isNaN(entryId) || !date || !hours) {
            return NextResponse.json({ error: "Invalid ID or missing required fields." }, { status: 400 });
        }
        const hoursDecimal = new Prisma.Decimal(hours);

        const updatedEntry = await prisma.$transaction(async (tx) => {
            const entry = await tx.timesheetEntry.findUnique({
                where: { id: entryId },
                include: { timesheet: true },
            });

            if (!entry || entry.timesheet.userId !== session?.user?.id) {
                throw new Error("Entry not found or unauthorized");
            }

            if (entry.timesheet.status !== 'Draft' && entry.timesheet.status !== 'Rejected') {
                throw new Error("Only Draft or Rejected timesheets can be edited.");
            }

            const updated = await tx.timesheetEntry.update({
                where: { id: entryId },
                data: {
                    date: new Date(date),
                    hours: hoursDecimal,
                    weekNumber: parseInt(weekNumber),
                    description,
                },
            });

            await recalculateTotalHours(tx, entry.timesheetId);

            return updated;
        });

        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error("Error updating timesheet entry:", error);
        if (error.message.includes("approved timesheet")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message.includes("not found or unauthorized")) {
            return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const entryId = parseInt(params.entryId, 10);

        if (isNaN(entryId)) {
            return NextResponse.json({ error: "Invalid entry ID." }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            const entry = await tx.timesheetEntry.findUnique({
                where: { id: entryId },
                include: { timesheet: true },
            });

            if (!entry || entry.timesheet.userId !== session?.user?.id) {
                throw new Error("Entry not found or unauthorized");
            }
            if (entry.timesheet.status !== 'Draft' && entry.timesheet.status !== 'Rejected') {
                throw new Error("Only Draft or Rejected timesheets can be deleted.");
            }

            await tx.timesheetEntry.delete({ where: { id: entryId } });

            const remainingEntries = await tx.timesheetEntry.count({
                where: { timesheetId: entry.timesheetId },
            });

            if (remainingEntries > 0) {
                await recalculateTotalHours(tx, entry.timesheetId);
            } else {
                await tx.timesheet.delete({
                    where: { id: entry.timesheetId },
                });
            }
        });

        return NextResponse.json({ message: "Entry deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting timesheet entry:", error);
        if (error.message.includes("non-draft timesheet")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message.includes("not found or unauthorized")) {
            return NextResponse.json({ error: "Entry not found or access denied" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}

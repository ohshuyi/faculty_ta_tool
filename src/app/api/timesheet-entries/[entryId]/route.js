import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from '@prisma/client';

// Helper function to recalculate and update total hours
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

// PUT handler to update an entry
export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const entryId = parseInt(params.entryId, 10);
        const { date, hours, weekNumber, description } = await req.json();

        if (isNaN(entryId) || !date || !hours) {
            return NextResponse.json({ error: "Invalid ID or missing required fields." }, { status: 400 });
        }
        const hoursDecimal = new Prisma.Decimal(hours);

        // Verify ownership and timesheet status in transaction
        const updatedEntry = await prisma.$transaction(async (tx) => {
            const entry = await tx.timesheetEntry.findUnique({
                where: { id: entryId },
                include: { timesheet: true },
            });

            if (!entry || entry.timesheet.userId !== session?.user?.id) {
                throw new Error("Entry not found or unauthorized"); // Will result in 404/403 below
            }

            if (entry.timesheet.status !== 'Draft') {
                throw new Error("Cannot modify entries of a non-draft timesheet.");
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
            const aggregate = await tx.timesheetEntry.aggregate({ /* ... */ });
            const newTotalHours = aggregate._sum.hours || 0;
            await tx.timesheet.update({
                where: { id: entry.timesheetId },
                data: {
                    totalHours: newTotalHours,
                    // --- NEW LOGIC: Revert status if it was approved ---
                    status: entry.timesheet.status === 'Approved' ? 'Pending' : entry.timesheet.status,
                },
            });
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
            // 1. Find the entry and verify ownership
            const entry = await tx.timesheetEntry.findUnique({
                where: { id: entryId },
                include: { timesheet: true },
            });

            if (!entry || entry.timesheet.userId !== session?.user?.id) {
                throw new Error("Entry not found or unauthorized");
            }
            if (entry.timesheet.status !== 'Draft') {
                throw new Error("Cannot modify entries of a non-draft timesheet.");
            }

            // 2. Delete the entry
            await tx.timesheetEntry.delete({ where: { id: entryId } });

            // --- START: UPDATED LOGIC ---
            // 3. Check for remaining entries on the parent timesheet
            const remainingEntries = await tx.timesheetEntry.count({
                where: { timesheetId: entry.timesheetId },
            });

            if (remainingEntries > 0) {
                // 4a. If entries remain, just update the total hours
                const newTotalHours = await recalculateTotalHours(tx, entry.timesheetId);
                await tx.timesheet.update({
                    where: { id: entry.timesheetId },
                    data: { totalHours: newTotalHours },
                });
            } else {
                // 4b. If no entries remain, delete the parent timesheet
                await tx.timesheet.delete({
                    where: { id: entry.timesheetId },
                });
            }
            // --- END: UPDATED LOGIC ---
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
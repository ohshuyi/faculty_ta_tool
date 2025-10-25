import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAcademicYear } from "@/lib/academicUtils"

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = session.user;
        const url = new URL(req.url);
        const academicYear = url.searchParams.get("ay") || getAcademicYear();

        const period = url.searchParams.get("period") || getCurrentAcademicPeriod();
        const statusFilter = url.searchParams.get("status");

        let whereCondition = { period: period };

        if (user.role === "TA") {
            whereCondition.userId = user.id; // TA sees only their own timesheets
        } else if (user.role === "PROFESSOR") {
            whereCondition.approvers = { some: { id: user.id } };
            whereCondition.status = {
                in: ["Submitted", "Approved", "Rejected"]
            };
        } else {
            return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
        }

        const timesheets = await prisma.timesheet.findMany({
            where: whereCondition,
            include: {
                user: { select: { name: true } }, // TA Name
                approvers: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                entries: true,
            },
            orderBy: [{ courseCode: 'asc' }],
        });

        return NextResponse.json(timesheets);
    } catch (error) {
        console.error("Error fetching timesheets:", error);
        return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 });
    }
}
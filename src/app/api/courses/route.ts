import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const courses = await prisma.course.findMany({
            orderBy: { courseCode: 'asc' }
        });

        return NextResponse.json(courses, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "Failed to fetch courses", details: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseCode, name } = await req.json();

        if (!courseCode) {
            return NextResponse.json({ error: "Course code is required" }, { status: 400 });
        }

        const newCourse = await prisma.course.create({
            data: {
                courseCode: courseCode.toUpperCase(),
                name: name || null,
            },
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
        }
        console.error("Error creating course:", error);
        return NextResponse.json({ error: "Failed to create course", details: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

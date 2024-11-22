// app/api/classes/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        courseCode: true,
        courseName: true,
        groupCode: true,
        groupType: true,
        students: {
          select: {
            id: true,
            name: true,
            studentCode: true,
          },
        },
      },
    });

    // Add student count to each class
    const classesWithStudentCount = classes.map((cls) => ({
      ...cls,
      studentCount: cls.students.length,
    }));

    return NextResponse.json(classesWithStudentCount, { status: 200 });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// app/api/students/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { students } = await req.json();

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { message: "Invalid data format. 'students' must be an array." },
        { status: 400 }
      );
    }

    const results = [];

    for (const student of students) {
      const { name, year, studentCode, classId } = student;

      if (!name || !year || !studentCode || !classId) {
        return NextResponse.json(
          { message: "Missing required fields: name, year, studentCode, or classId." },
          { status: 400 }
        );
      }

      // Check if the student already exists
      let existingStudent = await prisma.student.findUnique({
        where: { studentCode },
      });

      if (!existingStudent) {
        // If the student does not exist, create a new student
        existingStudent = await prisma.student.create({
          data: {
            name,
            year,
            studentCode,
          },
        });

        results.push({
          status: "created",
          message: `Student ${studentCode} created.`,
          student: existingStudent,
        });
      }

      // Ensure the student is linked to the course
      await prisma.class.update({
        where: { id: classId },
        data: {
          students: {
            connect: { id: existingStudent.id }, // Connect existing student to the course
          },
        },
      });

      results.push({
        status: "linked",
        message: `Student ${studentCode} linked to class ${classId}.`,
      });
    }

    return NextResponse.json(
      { message: "Students processed successfully.", results },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing students:", error);
    return NextResponse.json(
      { message: "Error processing students.", error: error.message },
      { status: 500 }
    );
  }
}
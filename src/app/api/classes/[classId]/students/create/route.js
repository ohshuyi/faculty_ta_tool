import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const classId = parseInt(params.classId, 10);
    const { name, studentCode, prog } = await req.json();

    // Validate required fields
    if (!name || !studentCode || !prog) {
      return NextResponse.json({ error: "Name, Student Code, and Program are required." }, { status: 400 });
    }

    // Prevent creating a student with a duplicate student code
    const existingStudent = await prisma.student.findUnique({
      where: { studentCode },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "A student with this code already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    // Use a nested write to create the student and connect them to the class
    await prisma.class.update({
      where: { id: classId },
      data: {
        students: {
          create: {
            name,
            studentCode,
            prog,
          },
        },
      },
    });

    return NextResponse.json({ message: "New student created and added to class." }, { status: 201 });
  } catch (error) {
    console.error("Error creating and adding student:", error);
    return NextResponse.json({ error: "Operation failed." }, { status: 500 });
  }
}
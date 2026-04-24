import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const classId = parseInt(params.classId, 10);
    const { name, studentCode, prog } = await req.json();

    if (!name || !studentCode || !prog) {
      return NextResponse.json({ error: "Name, Student Code, and Program are required." }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { studentCode },
      include: { classes: true },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "DUPLICATE_STUDENT_CODE", existingStudent },
        { status: 409 }
      );
    }

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
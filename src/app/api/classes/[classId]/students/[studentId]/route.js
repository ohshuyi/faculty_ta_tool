import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const classId = parseInt(params.classId, 10);
    const studentId = parseInt(params.studentId, 10);

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        students: {
          disconnect: { id: studentId }, // Disconnect the student from this class
        },
      },
    });

    return NextResponse.json(updatedClass, { status: 200 });
  } catch (error) {
    console.error("Error removing student from class:", error);
    return NextResponse.json({ error: "Failed to remove student" }, { status: 500 });
  }
}
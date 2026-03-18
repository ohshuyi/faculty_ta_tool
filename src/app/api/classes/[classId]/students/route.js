import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const toClassId = parseInt(params.classId, 10);
    const { studentId } = await req.json();

    const targetClass = await prisma.class.findUnique({
      where: { id: toClassId },
    });

    if (!targetClass) {
      return NextResponse.json({ error: "Destination class not found" }, { status: 404 });
    }

    const oldClassesToDisconnect = await prisma.class.findMany({
      where: {
        classType: targetClass.classType, 
        id: { not: toClassId }, 
        students: { some: { id: studentId } }, 
      },
    });

    await prisma.student.update({
      where: { id: studentId },
      data: {
        classes: {
          disconnect: oldClassesToDisconnect.map(cls => ({ id: cls.id })),
          connect: { id: toClassId },
        },
      },
    });

    return NextResponse.json({ message: "Student moved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error moving student to class:", error);
    return NextResponse.json({ error: "Failed to move student" }, { status: 500 });
  }
}
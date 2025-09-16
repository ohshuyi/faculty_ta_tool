import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const toClassId = parseInt(params.classId, 10);
    const { studentId } = await req.json();

    // 1. Get the class type of the destination class (e.g., "Lab")
    const targetClass = await prisma.class.findUnique({
      where: { id: toClassId },
    });

    if (!targetClass) {
      return NextResponse.json({ error: "Destination class not found" }, { status: 404 });
    }

    // 2. Find all other classes of the SAME type that the student is currently in
    const oldClassesToDisconnect = await prisma.class.findMany({
      where: {
        classType: targetClass.classType, // Only look at classes of the same type
        id: { not: toClassId }, // Exclude the class we're moving to
        students: { some: { id: studentId } }, // Filter by classes the student is in
      },
    });
    
    // 3. Perform the "move" in a single, atomic update on the student
    //    This disconnects them from all old groups and connects them to the new one.
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
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const studentId = parseInt(params.studentId, 10);
    const { fromClassId, toClassId } = await req.json();

    if (!fromClassId || !toClassId) {
      return NextResponse.json({ error: "Source and destination class IDs are required." }, { status: 400 });
    }

    // Perform the disconnect and connect in a single transaction
    await prisma.$transaction([
      // Disconnect from the old class
      prisma.class.update({
        where: { id: fromClassId },
        data: {
          students: {
            disconnect: { id: studentId },
          },
        },
      }),
      // Connect to the new class
      prisma.class.update({
        where: { id: toClassId },
        data: {
          students: {
            connect: { id: studentId },
          },
        },
      }),
    ]);

    return NextResponse.json({ message: "Student moved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error moving student:", error);
    return NextResponse.json({ error: "Failed to move student." }, { status: 500 });
  }
}
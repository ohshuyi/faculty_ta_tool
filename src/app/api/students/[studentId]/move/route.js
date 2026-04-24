import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const studentId = parseInt(params.studentId, 10);
    const { fromClassId, toClassId } = await req.json();

    if (!toClassId) {
      return NextResponse.json({ error: "Destination class ID is required." }, { status: 400 });
    }

    if (fromClassId) {
      await prisma.$transaction([
        prisma.class.update({
          where: { id: fromClassId },
          data: {
            students: {
              disconnect: { id: studentId },
            },
          },
        }),
        prisma.class.update({
          where: { id: toClassId },
          data: {
            students: {
              connect: { id: studentId },
            },
          },
        }),
      ]);
    } else {
      await prisma.class.update({
        where: { id: toClassId },
        data: {
          students: {
            connect: { id: studentId },
          },
        },
      });
    }

    return NextResponse.json({ message: "Student moved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error moving student:", error);
    return NextResponse.json({ error: "Failed to move student." }, { status: 500 });
  }
}
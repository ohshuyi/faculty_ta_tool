import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Update with your Prisma client path

export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Class ID is required." }, { status: 400 });
  }

  try {
    // Check if the class group exists
    const classGroup = await prisma.class.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!classGroup) {
      return NextResponse.json({ error: "Class group not found." }, { status: 404 });
    }

    // Delete the class group
    await prisma.class.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "Class group deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting class group:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the class group." },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ message: "This endpoint only supports DELETE." }, { status: 405 });
}

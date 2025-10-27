import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Add auth checks here to ensure only Admins can delete

export async function DELETE(req, { params }) {
  try {
    const labId = parseInt(params.labId, 10);
    if (isNaN(labId)) {
      return NextResponse.json({ error: "Invalid Lab ID" }, { status: 400 });
    }

    await prisma.lab.delete({
      where: { id: labId },
    });

    return NextResponse.json({ message: "Lab deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting lab:", error);
    return NextResponse.json({ error: "Failed to delete lab" }, { status: 500 });
  }
}
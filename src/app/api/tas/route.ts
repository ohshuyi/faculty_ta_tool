import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET method to fetch users with the TA role
export async function GET() {
  try {
    // Fetch all users with the role 'TA'
    const tas = await prisma.user.findMany({
      where: {
        role: 'TA',
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Return the list of TAs as JSON
    return NextResponse.json(tas, { status: 200 });
  } catch (error) {
    console.error("Error fetching TAs:", error);
    return NextResponse.json({ error: "Error fetching TAs" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
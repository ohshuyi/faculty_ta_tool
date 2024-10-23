// pages/api/professors.ts or app/api/professors/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust the path to your prisma client

export async function GET() {
  try {
    const professors = await prisma.user.findMany({
      where: { role: "PROFESSOR" }, // Assuming the role field distinguishes professors
    });
    return NextResponse.json(professors);
  } catch (error) {
    console.error("Error fetching professors:", error);
    return NextResponse.json({ error: "Error fetching professors" }, { status: 500 });
  }
}
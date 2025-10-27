import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch all labs
export async function GET(req) {
  try {
    // Secure this endpoint (optional, but recommended)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const labs = await prisma.lab.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(labs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch labs" }, { status: 500 });
  }
}

// POST: Create a new lab (Admin only)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Lab name is required" }, { status: 400 });
    }
    const newLab = await prisma.lab.create({ data: { name } });
    return NextResponse.json(newLab, { status: 201 });
  } catch (error) {
     if (error.code === 'P2002') {
       return NextResponse.json({ error: "A lab with this name already exists." }, { status: 409 });
     }
    return NextResponse.json({ error: "Failed to create lab" }, { status: 500 });
  }
}
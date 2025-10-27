import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch issues based on user role
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let whereCondition = {};
    if (user.role === "LAB_TECH") {
      if (!user.labId) {
        return NextResponse.json([]); // This tech isn't assigned to any lab
      }
      whereCondition = { labId: user.labId };
    }
    // TAs and Professors see all issues
    
    const issues = await prisma.labIssue.findMany({
      where: whereCondition,
      include: {
        lab: { select: { name: true } },
        createdByUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching lab issues:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

// POST: Create a new lab issue (for TAs/Profs)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const { title, description, labId } = await req.json();
    if (!title || !description || !labId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const newIssue = await prisma.labIssue.create({
      data: {
        title,
        description,
        labId: parseInt(labId, 10),
        createdByUserId: session.user.id,
      },
    });
    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    console.error("Error creating lab issue:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
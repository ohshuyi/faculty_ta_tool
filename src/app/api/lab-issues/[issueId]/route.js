import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { issueId } = params;
    const { status } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only Admins or Lab Techs can update status
    if (user.role !== 'LAB_TECH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const issueToUpdate = await prisma.labIssue.findUnique({
      where: { id: parseInt(issueId, 10) },
    });
    
    if (!issueToUpdate) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Lab tech can only update issues for their *own* lab
    if (user.role === 'LAB_TECH' && issueToUpdate.labId !== user.labId) {
       return NextResponse.json({ error: "You can only update issues for your assigned lab." }, { status: 403 });
    }

    const updatedIssue = await prisma.labIssue.update({
      where: { id: parseInt(issueId, 10) },
      data: { status },
    });
    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
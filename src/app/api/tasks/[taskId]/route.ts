// PATCH method to update the status of a task
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure you have Prisma client setup

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  try {
    // Find the task first
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update the status to 'completed'
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        status: "completed",
        createdAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Task marked as completed", task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

// PATCH method to update the status of a task
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure you have Prisma client setup
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;
  const baseUrl = "https://faculty-ta-v2.azurewebsites.net"

  try {
    // Find the task first
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const status = body.status || "completed";

    const session = await getServerSession(authOptions);
    const authorName = session?.user?.name || "System";

    // Update the status
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        status: status,
        comments: {
          create: {
            author: authorName,
            content: `Task marked as ${status} by ${authorName}.`,
          },
        },
      },
      include: {
        professor: true,
        ta: true,
      },
    });

    if (updatedTask) {
      const subject = `Task Status Updated: ${updatedTask.name}`;
      const body = `
        <html>
          <body>
            <p>The status of task "<strong>${updatedTask.name}</strong>" has been updated to <strong>${updatedTask.status.toUpperCase()}</strong>.</p>
            <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
          </body>
        </html>
      `;

      if (updatedTask.professor.email) {
        await sendEmail(updatedTask.professor.email, subject, body);
      }
      if (updatedTask.ta.email) {
        await sendEmail(updatedTask.ta.email, subject, body);
      }
    }

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

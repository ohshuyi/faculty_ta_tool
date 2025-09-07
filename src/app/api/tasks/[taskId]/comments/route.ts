import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming you have prisma set up
import { sendEmail } from "@/lib/email";

// POST method to add a comment to a specific task
export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const { content, author } = await req.json(); // Extract content and author from the request body
    const { taskId } = params;

    const baseUrl = "https://faculty-ta.azurewebsites.net"

    // Check if the task exists
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        professor: true,
        ta: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create a new comment associated with the task
    const newComment = await prisma.comment.create({
      data: {
        content,
        author,
        taskId: task.id,
        createdAt: new Date(),
      },
    });

    if (task) {
      const subject = `New Comment on Task: ${task.name}`;
      const body = `
        <html>
          <body>
            <p><strong>${author}</strong> added a new comment to task "${task.name}":</p>
            <p style="padding: 10px; border-left: 3px solid #ccc;">${content}</p>
            <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
          </body>
        </html>
      `;

      // Notify the professor (unless they wrote the comment)
      if (task.professor.name !== author && task.professor.email) {
        await sendEmail(task.professor.email, subject, body);
      }

      // Notify the TA (unless they wrote the comment)
      if (task.ta.name !== author && task.ta.email) {
        await sendEmail(task.ta.email, subject, body);
      }
    }


    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

// GET method to fetch comments for a specific task
export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const { taskId } = params;

    // Fetch the comments for the task
    const comments = await prisma.comment.findMany({
      where: { taskId: parseInt(taskId) },
      orderBy: { createdAt: 'asc' }, // Sort comments by creation date
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

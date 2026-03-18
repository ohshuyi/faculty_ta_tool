import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 
import { sendEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const { content, author } = await req.json(); 
    const { taskId } = params;

    const baseUrl = "https://faculty-ta-v2.azurewebsites.net"

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

    const newComment = await prisma.comment.create({
      data: {
        content,
        author,
        taskId: task.id,
        createdAt: new Date(),
      },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { updatedAt: new Date() },
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

      if (task.professor.name !== author && task.professor.email) {
        await sendEmail(task.professor.email, subject, body);
      }

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

export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const { taskId } = params;

    const comments = await prisma.comment.findMany({
      where: { taskId: parseInt(taskId) },
      orderBy: { createdAt: 'asc' }, 
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

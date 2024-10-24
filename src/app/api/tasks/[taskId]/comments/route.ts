import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming you have prisma set up

// POST method to add a comment to a specific task
export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const { content, author } = await req.json(); // Extract content and author from the request body
    const { taskId } = params;

    // Check if the task exists
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
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
  
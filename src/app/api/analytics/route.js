import prisma from '../../../lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const userId = session.user.id;
  try {
    // Fetch Tasks
    const tasks = await prisma.task.findMany({
      where: {
        taId: userId,
      },        
      include: {
        classes: true,
      },
      });
    // Task Analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'open').length;
    const overdueTasks = tasks.filter(
      task => new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;

    const tasksByCourseGroup = tasks.reduce((acc, task) => {
      task.classes.forEach((cls) => {
        // Use courseCode for grouping
        const groupKey = cls.courseCode || 'Unknown';
        acc[groupKey] = (acc[groupKey] || 0) + 1;
      });
      return acc;
    }, {});
    
    // Fetch Tickets
    const tickets = await prisma.ticket.findMany({
      include: {
        classes: true,
        ta: true,
        professor: true,
        student: true,
      },
    });
    
    // Ticket Analytics
    const totalTickets = tickets.length;
    const completedTickets = tickets.filter(ticket => ticket.status === 'completed').length;
    const pendingTickets = tickets.filter(ticket => ticket.status === 'open').length;
    const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;
    console.log('All tasks:', tasks);
    const ticketsByCategory = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});

    // Combine Analytics
    const analytics = {
      taskAnalytics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        tasksByCourseGroup,
      },
      ticketAnalytics: {
        totalTickets,
        completedTickets,
        pendingTickets,
        highPriorityTickets,
        ticketsByCategory,
      },
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: 'Error fetching analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

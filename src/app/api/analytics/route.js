import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const userId = session.user.id;
  const userRole = session.user.role;
  try {
    // Fetch Tasks
 
    let whereClause = {
      include: {
        classes: true,
      },
    };

    // Add conditions based on the role
    if (userRole === "PROFESSOR") {
      whereClause.where = {
        professorId: userId,
      };
    } else if (userRole === "TA") {
      whereClause.where = {
        taId: userId,
      };
    }
    const tasks = await prisma.task.findMany(whereClause);

    // Task Analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const pendingTasks = tasks.filter((task) => task.status === "open").length;

    const tasksByCourseGroup = tasks.reduce((acc, task) => {
      task.classes.forEach((cls) => {
        // Use courseCode for grouping
        const groupKey = cls.courseCode || "Unknown";
        acc[groupKey] = (acc[groupKey] || 0) + 1;
      });
      return acc;
    }, {});

    // Fetch Tickets
    const tickets = await prisma.ticket.findMany(whereClause);
    // Ticket Analytics
    const totalTickets = tickets.length;

    const completedTickets = tickets.filter(
      (ticket) => ticket.status === "completed"
    ).length;
    const pendingTickets = tickets.filter(
      (ticket) => ticket.status === "open"
    ).length;
    const highPriorityTickets = tickets.filter(
      (ticket) => ticket.priority === "high"
    ).length;

    const ticketsByCategory = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});


    const students = await prisma.student.findMany({
      include: {
        classes: true, // Include classes to analyze student-class relationships
      },
    });
   

     // Total Students
     const totalStudents = students.length;

     // Students per Class
     const studentsPerClass = students.reduce((acc, student) => {
       student.classes.forEach((cls) => {
         acc[cls.courseCode] = (acc[cls.courseCode] || 0) + 1;
       });
       return acc;
     }, {});
    
       // Program Distribution
    const studentsByProgram = students.reduce((acc, student) => {
      acc[student.prog] = (acc[student.prog] || 0) + 1;
      return acc;
    }, {});


    // Combine Analytics
    const analytics = {
      taskAnalytics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        tasksByCourseGroup,
      },
      ticketAnalytics: {
        totalTickets,
        completedTickets,
        pendingTickets,
        highPriorityTickets,
        ticketsByCategory,
      },
      studentAnalytics: {
        totalStudents,
        studentsPerClass,
        studentsByProgram,
      },
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: "Error fetching analytics" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

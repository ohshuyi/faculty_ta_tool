import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }
  const userId = session.user.id;
  const userRole = session.user.role;
  try {
    const url = new URL(req.url);
    const courseCode = url.searchParams.get("courseCode");

    let whereClause = {
      where: {},
      include: {
        classes: {
          include: { assignedTAs: true }
        },
      },
    };

    if (courseCode) {
      whereClause.where.classes = {
        some: {
          courseCode: courseCode,
        },
      };

      // For tasks specifically
      if (userRole === "PROFESSOR") {
        // Should we filter by professorId AND courseCode? Yes.
        whereClause.where.professorId = userId;
      } else if (userRole === "TA") {
        whereClause.where.taId = userId;
      }
    } else {
      // Fallback or handle missing courseCode if needed
      if (userRole === "PROFESSOR") {
        whereClause.where.professorId = userId;
      } else if (userRole === "TA") {
        whereClause.where.taId = userId;
      }
    }

    const tasks = await prisma.task.findMany(whereClause);

    // Task Analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const pendingTasks = tasks.filter((task) => task.status === "open").length;

    // Helper function to sort object keys alphanumerically
    const sortObjectKeys = (obj) => {
      return Object.keys(obj).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
    };

    let tasksByClassGroup = tasks.reduce((acc, task) => {
      task.classes.forEach((cls) => {
        // If TA/Tutor, only count the task for the group if they are assigned to that specific class group
        if ((userRole === "TA" || userRole === "TUTOR") && !cls.assignedTAs?.some(ta => ta.id === userId)) {
          return;
        }

        const groupKey = cls.classGroup || "Unknown";
        acc[groupKey] = (acc[groupKey] || 0) + 1;
      });
      return acc;
    }, {});
    tasksByClassGroup = sortObjectKeys(tasksByClassGroup);

    // Fetch Tickets - similar whereClause
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


    // Students
    let studentWhereClause = {
      include: {
        classes: {
          include: {
            assignedTAs: true,
          }
        },
      },
      where: {}
    };

    if (courseCode) {
      if (userRole === "TA" || userRole === "TUTOR") {
        // If TA/Tutor, filter to only students taking classes that this specific TA is assigned to
        studentWhereClause.where = {
          classes: {
            some: {
              courseCode: courseCode,
              assignedTAs: {
                some: { id: userId }
              }
            },
          },
        };
      } else {
        // Otherwise, just filter by the course code
        studentWhereClause.where = {
          classes: {
            some: {
              courseCode: courseCode,
            },
          },
        };
      }
    }

    const students = await prisma.student.findMany(studentWhereClause);

    // Total Students
    const totalStudents = students.length;

    // Students per Class
    let studentsPerClass = students.reduce((acc, student) => {
      student.classes.forEach((cls) => {
        if (!courseCode || cls.courseCode === courseCode) {
          // For TA/Tutor, only count if they are assigned to this specific class
          if ((userRole === "TA" || userRole === "TUTOR") && !cls.assignedTAs?.some(ta => ta.id === userId)) {
            return;
          }
          const groupLabel = cls.classGroup || "Unknown";
          acc[groupLabel] = (acc[groupLabel] || 0) + 1;
        }
      });
      return acc;
    }, {});
    studentsPerClass = sortObjectKeys(studentsPerClass);

    // Program Distribution (Stacked by Year)
    const studentsByProgramStacked = students.reduce((acc, student) => {
      const progStr = student.prog || "Unknown";
      // Pattern: ProgramCode + YearNumber + ... (e.g., ECON1 FT -> ECON, 1)
      const match = progStr.match(/^([A-Za-z]+)(\d)/);

      let program = progStr;
      let year = "Other";

      if (match) {
        program = match[1];
        year = `Year ${match[2]}`;
      }

      if (!acc[program]) {
        acc[program] = {};
      }
      acc[program][year] = (acc[program][year] || 0) + 1;
      return acc;
    }, {});


    // Timesheet Analytics
    let pendingTimesheets = 0;
    let timesheetChartData = {};

    if (courseCode) {
      if (userRole === "PROFESSOR" || userRole === "ADMIN") {
        // Pending approvals
        pendingTimesheets = await prisma.timesheet.count({
          where: {
            courseCode: courseCode,
            status: "Pending",
            approvers: { some: { id: userId } }
          }
        });

        // Chart Data: Total hours per TA
        const timesheets = await prisma.timesheet.findMany({
          where: {
            courseCode: courseCode,
            approvers: { some: { id: userId } }
          },
          include: { user: true }
        });
        timesheetChartData = timesheets.reduce((acc, ts) => {
          const name = ts.user.name;
          acc[name] = (acc[name] || 0) + Number(ts.totalHours);
          return acc;
        }, {});
      } else if (userRole === "TA" || userRole === "TUTOR") {
        // Draft/Pending count
        pendingTimesheets = await prisma.timesheet.count({
          where: {
            userId: userId,
            courseCode: courseCode,
            status: { in: ["Draft", "Pending"] }
          }
        });

        // Chart Data: hours per week
        const entries = await prisma.timesheetEntry.findMany({
          where: {
            timesheet: {
              userId: userId,
              courseCode: courseCode
            }
          },
          orderBy: { weekNumber: 'asc' }
        });
        timesheetChartData = entries.reduce((acc, entry) => {
          const week = `Week ${entry.weekNumber}`;
          acc[week] = (acc[week] || 0) + Number(entry.hours);
          return acc;
        }, {});
      }
    }

    // Combine Analytics
    const analytics = {
      taskAnalytics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        tasksByClassGroup,
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
        studentsByProgramStacked,
      },
      timesheetAnalytics: {
        pendingTimesheets,
        timesheetChartData,
      }
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

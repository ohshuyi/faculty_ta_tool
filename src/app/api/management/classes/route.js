import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get('courseCode');

    const userRole = session.user.role;
    const courseRoles = session.user.courseRoles || [];

    // Admins see everything
    if (userRole === 'ADMIN') {
      const classes = await prisma.class.findMany({
        where: courseCode ? { courseCode } : {},
      });
      return new Response(JSON.stringify(classes), { status: 200 });
    }

    // Determine target courses based on roles
    // We only allow management for courses where the user is PROFESSOR or COURSE_COORDINATOR
    const manageableCourses = courseRoles
      .filter(cr => cr.role === 'PROFESSOR' || cr.role === 'COURSE_COORDINATOR')
      .map(cr => cr.courseCode);

    // If global PROFESSOR, they might expect to manage all their courses, 
    // but we are sticking to "ignore global role" for specific logic.
    // However, if they have NO course roles but are a global Professor, 
    // we should decide if they see nothing or everything.
    // Given the requirement "ignore global role", we rely on courseRoles.

    if (manageableCourses.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const classes = await prisma.class.findMany({
      where: {
        courseCode: {
          in: courseCode ? [courseCode].filter(c => manageableCourses.includes(c)) : manageableCourses,
        },
      },
    });

    return new Response(JSON.stringify(classes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching classes for management:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch classes", error: error.message }),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

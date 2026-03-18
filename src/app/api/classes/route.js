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

    const userRole = session.user.role;
    const userId = session.user.id;

    const url = new URL(req.url);
    const fetchAll = url.searchParams.get("fetchAll") === "true";
    const courseCode = url.searchParams.get("courseCode");

    const allClassRoles = session.user.courseRoles || [];

    let whereClause = {};

    if (courseCode) {
      whereClause.courseCode = courseCode;
    }

    let classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        students: true,
        assignedTAs: true,
      },
    });

    if (userRole !== 'ADMIN' && !fetchAll) {
      classes = classes.filter(cls => {
        const specificRole = allClassRoles.find(cr => cr.courseCode === cls.courseCode);
        const effectiveRole = specificRole ? specificRole.role : userRole;

        if (effectiveRole === 'TA' || effectiveRole === 'TUTOR') {
          return cls.assignedTAs.some(ta => ta.id === userId);
        }
        return true; 
      });
    }

    return new Response(JSON.stringify(classes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching class groups:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch class groups", error: error.message }),
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
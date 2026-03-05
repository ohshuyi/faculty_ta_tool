import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET method to fetch users with the TA role
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get('courseCode');

    const where: any = {
      OR: [
        { role: 'TA' },
        {
          courseRoles: {
            some: {
              role: { in: ['TA', 'TUTOR'] }
            }
          }
        }
      ]
    };

    if (courseCode) {
      where.courseRoles = {
        some: {
          courseCode: courseCode,
          role: { in: ['TA', 'TUTOR'] }
        }
      };
      // Once we filter by specific courseRoles, we remove the global OR
      delete where.OR;
    }

    const tas = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        courseRoles: courseCode ? {
          where: { courseCode: courseCode }
        } : true,
        assignedClasses: {
          where: courseCode ? { courseCode } : {},
          select: {
            id: true,
            courseCode: true,
            classGroup: true,
            classType: true,
          }
        }
      },
    });

    return NextResponse.json(tas, { status: 200 });
  } catch (error) {
    console.error("Error fetching TAs:", error);
    return NextResponse.json({ error: "Error fetching TAs" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
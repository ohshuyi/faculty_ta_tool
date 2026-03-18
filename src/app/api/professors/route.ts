
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get('courseCode');

    const where: any = {
      OR: [
        { role: "PROFESSOR" },
        {
          courseRoles: {
            some: {
              role: "COURSE_COORDINATOR"
            }
          }
        }
      ]
    };

    if (courseCode) {
      where.courseRoles = {
        some: {
          courseCode: courseCode,
          role: "COURSE_COORDINATOR"
        }
      };
      
      delete where.OR;
    }

    const professors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        courseRoles: courseCode ? {
          where: { courseCode: courseCode }
        } : true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(professors);
  } catch (error) {
    console.error("Error fetching professors:", error);
    return NextResponse.json({ error: "Error fetching professors" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
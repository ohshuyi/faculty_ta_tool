import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  console.log("API Route Hit: Fetching fresh data");  

  const users = await prisma.user.findMany({
    include: { courseRoles: true } as any,
  }) as any;  
  console.log()
  
  const response = NextResponse.json(users);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export async function POST(req: Request) {
  try {
    const { name, email: rawEmail, role, courseRoles } = await req.json();

    if (!name || !rawEmail || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required fields" },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email }, 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    let userData: any = {
      name,
      email, 
      role,
    };

    if (courseRoles && Array.isArray(courseRoles)) {
      
      if (role === 'TA') {
        const hasInvalidRole = courseRoles.some((cr: any) => cr.role === 'COURSE_COORDINATOR' || cr.role === 'TUTOR');
        if (hasInvalidRole) {
          return NextResponse.json(
            { error: "A TA cannot be assigned as a COURSE_COORDINATOR or TUTOR." },
            { status: 400 }
          );
        }
      } else if (role === 'PROFESSOR') {
        const hasInvalidRole = courseRoles.some((cr: any) => cr.role === 'TA');
        if (hasInvalidRole) {
          return NextResponse.json(
            { error: "A PROFESSOR cannot be assigned as a TA." },
            { status: 400 }
          );
        }
      }

      userData.courseRoles = {
        create: courseRoles.map((cr: any) => ({
          courseCode: cr.courseCode,
          role: cr.role,
        })),
      };
    }

    const newUser = await prisma.user.create({
      data: userData,
      include: { courseRoles: true } as any,
    }) as any;

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the user" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
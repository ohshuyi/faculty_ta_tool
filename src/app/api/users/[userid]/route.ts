import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { userid: string } }
) {
  const { userid } = params;

  try {
    const body = await req.json();
    
    const { role, courseRoles } = body;

    const validRoles = ["USER", "TA", "PROFESSOR", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided" },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userid, 10);
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {
      role: role,
    };

    let updatedUser;
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

      updatedUser = await prisma.user.update({
        where: { id: userIdInt },
        data: {
          ...dataToUpdate,
          courseRoles: {
            deleteMany: {}, 
            create: courseRoles.map((cr: any) => ({
              courseCode: cr.courseCode,
              role: cr.role,
            })),
          },
        } as any,
        include: { courseRoles: true } as any,
      }) as any;
    } else {
      updatedUser = await prisma.user.update({
        where: { id: userIdInt },
        data: dataToUpdate,
        include: { courseRoles: true } as any,
      }) as any;
    }

    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "An error occurred while updating the user role" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { userid: string } }
) {
  const { userid } = params;

  try {
    
    const userIdInt = parseInt(userid, 10);

    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const deletedUser = await prisma.user.delete({
      where: { id: userIdInt },
    });

    return NextResponse.json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while deleting the user" },
      { status: 500 }
    );
  }
}
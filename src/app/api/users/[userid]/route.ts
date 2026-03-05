import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { userid: string } }
) {
  const { userid } = params;

  try {
    const body = await req.json();
    // 1. Get 'role' and 'courseRoles' from the request body
    const { role, courseRoles } = body;

    // 2. Add valid roles
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

    // 3. Build the data for the update
    const dataToUpdate: any = {
      role: role,
    };

    // 4. Update the user in the database with the new data
    // We must also handle courseRoles if provided
    let updatedUser;
    if (courseRoles && Array.isArray(courseRoles)) {
      // Validate Course Roles against Global Role
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
            deleteMany: {}, // First remove all existing
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

    // Return success response
    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);

    // Handle errors such as user not found
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
    // Convert the user ID to an integer
    const userIdInt = parseInt(userid, 10);

    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Delete the user from the database
    const deletedUser = await prisma.user.delete({
      where: { id: userIdInt },
    });

    // Return success response
    return NextResponse.json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    // Handle specific errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle general errors
    return NextResponse.json(
      { error: "An error occurred while deleting the user" },
      { status: 500 }
    );
  }
}
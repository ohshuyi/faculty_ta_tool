import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { userid: string } }
) {
  const { userid } = params;

  try {
    // Parse the request body
    const body = await req.json();
    const { role } = body;

    // Validate the role
    const validRoles = ["USER", "TA", "PROFESSOR", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided" },
        { status: 400 }
      );
    }
    // Convert userid to an integer
    const userIdInt = parseInt(userid, 10);

    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Update the user's role in the database
    const updatedUser = await prisma.user.update({
      where: { id: userIdInt }, // Use the converted integer
      data: { role },
    });

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
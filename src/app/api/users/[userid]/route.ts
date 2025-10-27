import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { userid: string } }
) {
  const { userid } = params;

  try {
    const body = await req.json();
    // 1. Get BOTH 'role' and 'labId' from the request body
    const { role, labId } = body;

    // 2. Add "LAB_TECH" to the valid roles
    const validRoles = ["USER", "TA", "PROFESSOR", "ADMIN", "LAB_TECH"];
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
    const dataToUpdate: { role: string, labId: number | null } = {
      role: role,
      labId: null, // Default to null (disconnect from lab)
    };

    if (role === 'LAB_TECH') {
      // If the new role is LAB_TECH, the labId is required
      if (!labId) {
        return NextResponse.json(
          { error: "A Lab ID is required for the LAB_TECH role" },
          { status: 400 }
        );
      }
      dataToUpdate.labId = parseInt(labId, 10);
    }
    
    // 4. Update the user in the database with the new data
    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: dataToUpdate, // Use the new data object
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
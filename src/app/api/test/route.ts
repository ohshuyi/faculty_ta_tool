import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET method to fetch users with the TA role
export async function GET() {
    try{

        const databaseUrl = process.env.DATABASE_URL;
        
        // Check if the environment variable is defined
        if (!databaseUrl) {
            return NextResponse.json( { status: "error" });
        }
        
        
    // Return the list of TAs as JSON
    return NextResponse.json( { status: databaseUrl });
  } catch (error) {
    console.error("Error fetching TAs:", error);
    return NextResponse.json({ error: "Error fetching TAs" }, { status: 500 });
  }
}

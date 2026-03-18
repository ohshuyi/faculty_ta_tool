import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const nameQuery = url.searchParams.get("name");
    const classType = url.searchParams.get("classType");

    if (!nameQuery || !classType) {
      return NextResponse.json({ error: "Name query and class type are required." }, { status: 400 });
    }

    const matchingStudents = await prisma.student.findMany({
      where: {
        name: {
          contains: nameQuery,
          mode: 'insensitive', 
        },
        classes: {
          some: {
            classType: {
              equals: classType,
              mode: 'insensitive',
            },
          },
        },
      },
      include: {
        classes: { 
          where: { classType: classType } 
        }
      }
    });

    return NextResponse.json(matchingStudents);
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json({ error: "Failed to search students" }, { status: 500 });
  }
}
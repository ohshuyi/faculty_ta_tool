// api/addticket/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET method to retrieve tickets by email
export async function GET(req: Request) {
  const users = await prisma.user.findMany();

  return NextResponse.json(users);
}

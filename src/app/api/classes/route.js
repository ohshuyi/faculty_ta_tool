import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    const url = new URL(req.url);
    const fetchAll = url.searchParams.get("fetchAll") === "true";

    let classes;

    if (userRole === 'TA' && !fetchAll) {
      classes = await prisma.class.findMany({
        where: {
          assignedTAs: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          students: true,
        },
      });
    } else {
      classes = await prisma.class.findMany({
        include: {
          students: true,
        },
      });
    }

    return new Response(JSON.stringify(classes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching class groups:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch class groups", error: error.message }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = "force-dynamic";
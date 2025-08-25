import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Use groupBy to fetch distinct classGroup
    const classes = await prisma.class.findMany({
      include: {
        students: true,
      },
    });

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
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Use groupBy to fetch distinct classGroup
    const courseCode = await prisma.class.groupBy({
      by: ["courseCode"], // Group by the classGroup field
    });

    return new Response(JSON.stringify(courseCode), {
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

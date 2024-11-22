import prisma from "@/lib/prisma"; // Adjust the path based on your Prisma setup

export async function POST(req) {
  try {
    // Parse the JSON body from the request
    const { classes } = await req.json();

    // Validate the received data
    if (!classes || !Array.isArray(classes)) {
      return new Response(
        JSON.stringify({ message: "Invalid data format. 'classes' must be an array." }),
        { status: 400 }
      );
    }

    // Store results for response
    const results = [];

    // Loop through the classes array
    for (const cls of classes) {
      const { courseCode, courseName, groupCode, groupType } = cls;

      // Ensure all required fields are present
      if (!courseCode || !courseName || !groupCode || !groupType) {
        return new Response(
          JSON.stringify({
            message: "Missing required fields in one or more class objects.",
          }),
          { status: 400 }
        );
      }

      // Check if the class already exists in the database
      const existingClass = await prisma.class.findFirst({
        where: {
          courseCode,
          groupCode,
        },
      });

      if (!existingClass) {
        // Create a new class if it doesn't already exist
        const newClass = await prisma.class.create({
          data: {
            courseCode,
            courseName,
            groupCode,
            groupType,
          },
        });
        results.push({ status: "created", class: newClass });
      } else {
        // Skip if the class already exists
        results.push({
          status: "skipped",
          message: `Class ${courseCode} - ${groupCode} already exists.`,
        });
      }
    }

    // Return the results
    return new Response(
      JSON.stringify({ message: "Classes processed successfully.", results }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing classes:", error);
    return new Response(
      JSON.stringify({ message: "Error processing classes.", error: error.message }),
      { status: 500 }
    );
  }
}

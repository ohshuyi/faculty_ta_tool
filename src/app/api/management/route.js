import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
const prisma = new PrismaClient();


export async function GET(req) {
  try {
    // Fetch all classes with their students
    const classes = await prisma.class.findMany({
      include: {
        students: true, // Include related students for each class
      },
    });

    return new Response(JSON.stringify(classes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch classes", error: error.message }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ message: "No file uploaded" }), {
        status: 400,
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });

    const classCourseGroups = extractClassCourseGroups(rawData); // Use your extraction logic

    for (const classData of classCourseGroups) {
      // Find or create class
      let classRecord = await prisma.class.findFirst({
        where: {
          courseCode: classData.courseCode,
          classType: classData.classType,
          classGroup: classData.classGroup,
        },
      });

      if (!classRecord) {
        classRecord = await prisma.class.create({
          data: {
            courseCode: classData.courseCode,
            classType: classData.classType,
            classGroup: classData.classGroup,
          },
        });
      }

      for (const student of classData.students) {
        await prisma.student.upsert({
          where: { studentCode: student.studentCode },
          update: {
            classes: {
              connect: { id: classRecord.id }, // Connect the student to the class
            },
          },
          create: {
            studentCode: student.studentCode,
            name: student.name,
            prog: student.prog,
            classes: {
              connect: { id: classRecord.id }, // Connect the student to the class
            },
          },
        });
      }
      
    }

    return new Response(
      JSON.stringify({ message: "Data populated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: "Error populating data", error: error.message }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function extractClassCourseGroups(rawData) {
  const metadata = {
    courseCode: rawData[2][0]?.split(":")[1]?.trim().split(" ")[0] || "Unknown",
    classType: rawData[3][0]?.split(":")[1]?.trim() || "Unknown",
  };

  const classCourseGroups = [];
  let studentArray = [];
  let classGroup = "Unknown";

  for (let i = 5; i < rawData.length; i++) {
    const row = rawData[i];

    if (row.some((cell) => typeof cell === "string" && cell.includes("Class Group"))) {
      classGroup = row.find((cell) => typeof cell === "string" && cell.includes("Class Group")) || "Unknown";
      classGroup = classGroup.split(":")[1]?.trim();
    }

    if (row.some((cell) => typeof cell === "number")) {
      const student = {
        studentCode: row[5],
        name: row[1],
        prog: row[2],
      };
      studentArray.push(student);
    }

    if (
      (studentArray.length > 0 && row.every((cell) => !cell)) ||
      (studentArray.length > 0 && i === rawData.length - 1)
    ) {
      classCourseGroups.push({
        ...metadata,
        classGroup: classGroup,
        students: studentArray,
      });
      studentArray = [];
    }
  }

  return classCourseGroups;
}


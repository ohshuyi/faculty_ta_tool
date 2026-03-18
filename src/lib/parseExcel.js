
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const config = {
  api: {
    bodyParser: false, 
  },
};

export async function POST(req) {
  try {
    
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const classesData = jsonData.slice(1).map((row) => ({
      courseCode: row[0],
      courseName: row[1],
      groupCode: row[2],
      groupType: row[3],
      students: row.slice(4).map((student) => ({ name: student })),
    }));

    for (const cls of classesData) {
      await prisma.class.create({
        data: {
          courseCode: cls.courseCode,
          courseName: cls.courseName,
          groupCode: cls.groupCode,
          groupType: cls.groupType,
          students: {
            create: cls.students.map((student) => ({
              name: student.name,
            })),
          },
        },
      });
    }

    return NextResponse.json(
      { message: "Classes and students uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading classes:", error);
    return NextResponse.json({ error: "Failed to upload classes" }, { status: 500 });
  }
}

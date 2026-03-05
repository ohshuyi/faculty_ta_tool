// POST method to create a task
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Assuming you have Prisma setup
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid"; // For generating unique filenames
import { sendEmail } from "@/lib/email";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Extract task details from formData
    const name = formData.get("name");
    const dueDate = formData.get("dueDate");
    const details = formData.get("details");
    const professorId = parseInt(formData.get("professorId"), 10);
    const taId = parseInt(formData.get("taId"), 10);
    const studentId = formData.get("studentId") ? parseInt(formData.get("studentId"), 10) : null;
    const courseCode = formData.get("courseCode"); // Accept a single courseCode
    const classId = formData.get("classId") ? parseInt(formData.get("classId"), 10) : null;
    const file = formData.get("file");
    const baseUrl = "https://faculty-ta-v2.azurewebsites.net"

    let fileUrl = null;

    // Handle file upload if applicable
    if (file) {
      const buffer = await file.arrayBuffer();
      const blobServiceClient = new BlobServiceClient(
        `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        new StorageSharedKeyCredential(
          AZURE_STORAGE_ACCOUNT_NAME,
          AZURE_STORAGE_ACCOUNT_KEY
        )
      );

      const containerClient =
        blobServiceClient.getContainerClient("tasks-files");
      const exists = await containerClient.exists();
      if (!exists) {
        await containerClient.create();
      }

      const blobName = `${Date.now()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(Buffer.from(buffer), {
        blobHTTPHeaders: { blobContentType: file.type },
      });

      fileUrl = blockBlobClient.url;
    }

    // Explicitly set the status
    const status = "open";

    let classIds = [];
    if (classId) {
      classIds = [classId];
    } else if (courseCode) {
      // Find the class matching the courseCode
      const classes = await prisma.class.findMany({
        where: {
          courseCode, // Filter by courseCode
        },
        select: { id: true }, // Select only the `id` field
      });

      // Extract an array of IDs
      classIds = classes.map(cls => cls.id);
    }


    // Create the task and link to multiple classes
    const newTask = await prisma.task.create({
      data: {
        name,
        dueDate: new Date(dueDate),
        details,
        status,
        professorId,
        taId,
        createdAt: new Date(),
        classes: {
          connect: classIds.map((id) => ({ id })), // Connect the task to multiple classes
        },
        ...(studentId && { student: { connect: { id: studentId } } }),
        ...(fileUrl && {
          files: {
            create: [
              {
                url: fileUrl,
                fileName: file.name,
              },
            ],
          },
        }),
        comments: {
          create: {
            author: "System",
            content: "Task created.",
          },
        },
      },
      include: {
        ta: true,
        professor: true,
        files: true,
        classes: true, // Include related classes in the response
      },
    });

    if (newTask && newTask.ta.email) {
      const subject = `New Task Assigned: ${newTask.name}`;
      const body = `
        <html>
          <body>
            <h2>A new task has been assigned to you.</h2>
            <p><strong>Task:</strong> ${newTask.name}</p>
            <p><strong>Details:</strong> ${newTask.details}</p>
            <p><strong>Due Date:</strong> ${new Date(newTask.dueDate).toLocaleDateString()}</p>
            <p>Assigned by: ${newTask.professor.name}</p>
            <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
          </body>
        </html>
      `;

      await sendEmail(newTask.ta.email, subject, body);
    }

    // Construct the response
    const responseTask = {
      id: newTask.id,
      name: newTask.name,
      dueDate: newTask.dueDate,
      details: newTask.details,
      status: newTask.status,
      professor: {
        id: newTask.professor.id,
        name: newTask.professor.name,
        email: newTask.professor.email,
      },
      ta: {
        id: newTask.ta.id,
        name: newTask.ta.name,
        email: newTask.ta.email,
      },
      student: newTask.student ? {
        id: newTask.student.id,
        name: newTask.student.name,
        studentCode: newTask.student.studentCode,
      } : null,
      classes: newTask.classes.map((cls) => ({
        id: cls.id,
        courseCode: cls.courseCode,
      })),
      files: newTask.files.map((file) => ({
        id: file.id,
        url: file.url,
        fileName: file.fileName,
      })),
    };

    return NextResponse.json(responseTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // Ensure the user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the logged-in user's role and ID
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { courseRoles: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the `status` query parameter from the URL
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") || "open"; // Default to "open" if no status is provided

    // Validate the status value
    if (statusParam !== "open" && statusParam !== "completed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const courseCode = url.searchParams.get("courseCode");
    let effectiveRole = user.role;
    if (courseCode) {
      const courseRoleRecord = user.courseRoles.find(r => r.courseCode === courseCode);
      if (courseRoleRecord) {
        effectiveRole = courseRoleRecord.role;
      } else {
        return NextResponse.json({ error: "Unauthorized for this course" }, { status: 403 });
      }
    }

    let whereCondition = {
      status: statusParam,
    };

    if (courseCode) {
      whereCondition.classes = { some: { courseCode } };
    }

    if (effectiveRole === "TA" || effectiveRole === "TUTOR") {
      whereCondition.taId = userId;
    } else if (effectiveRole === "PROFESSOR" || effectiveRole === "COURSE_COORDINATOR") {
      whereCondition.professorId = userId;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: whereCondition,
      include: {
        professor: true,
        ta: true,
        comments: true,
        files: true,
        classes: true,
        student: true,
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error fetching tasks" },
      { status: 500 }
    );
  }
}

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
    const courseCode = formData.get("courseCode"); // Accept a single courseCode
    const file = formData.get("file");
    const baseUrl = "https://faculty-ta.azurewebsites.net"

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
    // Find the class matching the courseCode
    const classes = await prisma.class.findMany({
      where: {
        courseCode, // Filter by courseCode
      },
      select: { id: true }, // Select only the `id` field
    });

    // Extract an array of IDs
    const classIds = classes.map(cls => cls.id);


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
    const userRole = session.user.role;
    const userId = session.user.id;

    // Parse the `status` query parameter from the URL
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") || "open"; // Default to "open" if no status is provided

    // Validate the status value
    if (statusParam !== "open" && statusParam !== "completed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    let tasks;

    if (userRole === "TA") {
      // Fetch tasks based on the `status` for the TA
      tasks = await prisma.task.findMany({
        where: {
          taId: userId,
          status: statusParam, // Filter by the dynamic status parameter
        },
        include: {
          professor: true,
          ta: true,
          comments: true,
          files: true,
          classes: true,
        },
      });
    } else if (userRole === "PROFESSOR") {
      // Fetch tasks based on the `status` for the professor
      tasks = await prisma.task.findMany({
        where: {
          professorId: userId,
          status: statusParam, // Filter by the dynamic status parameter
        },
        include: {
          professor: true,
          ta: true,
          comments: true,
          files: true,
          classes: true,
        },
      });
    }

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error fetching tasks" },
      { status: 500 }
    );
  }
}



// POST method to create a task
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming you have Prisma setup
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';

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
    const file = formData.get("file");

    let fileUrl = null;

    // If a file is uploaded, upload it to Azure Blob Storage
    if (file) {
      const buffer = await file.arrayBuffer();

      // Azure Blob Storage setup
      const blobServiceClient = new BlobServiceClient(
        `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY)
      );

      const containerClient = blobServiceClient.getContainerClient("tasks-files");
      const exists = await containerClient.exists();
      if (!exists) {
        await containerClient.create();
      }

      const blobName = `${Date.now()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload the file to Azure Blob Storage
      await blockBlobClient.uploadData(Buffer.from(buffer), {
        blobHTTPHeaders: { blobContentType: file.type },
      });

      // Generate the URL to access the uploaded file
      fileUrl = blockBlobClient.url;
    }

    // Explicitly set the status (e.g., "open")
    const status = "open"; // You can make this dynamic if needed

    // Create the task in Prisma, including the TA relation
    const newTask = await prisma.task.create({
      data: {
        name,
        dueDate: new Date(dueDate), // Ensure the dueDate is stored as a Date object
        details,
        status, // Include the status field
        professorId,
        taId,
        createdAt: new Date(), // Optional: if not set, Prisma will handle it automatically
        ...(fileUrl && {
          files: {
            create: [
              {
                url: fileUrl,
                fileName: file.name,
              },
            ],
          },
        }), // Conditionally include files if fileUrl exists
      },
      include: {
        ta: true, // Include TA information in the response
        professor: true, // Include Professor information if needed
        files: true, // Include uploaded files if any
      },
    });

    // Construct the response structure
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


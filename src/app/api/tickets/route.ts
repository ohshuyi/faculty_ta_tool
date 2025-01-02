import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming your NextAuth options are in lib/auth.ts
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';
// GET method to retrieve tickets for the logged-in user (where they are the TA)

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

export async function POST(req) {
  try {
    const formData = await req.formData();
    console.log("Form data:", formData);
    const data = {
      ticketDescription: formData.get("ticketDescription"),
      courseCode: formData.get("courseGroupType"), // Accept a single courseCode
      category: formData.get("category"),
      studentId: parseInt(formData.get("studentId")),
      priority: formData.get("priority"),
      professorId: parseInt(formData.get("professorId")),
      taId: parseInt(formData.get("taId")),
    };

    console.log("Course code:", data.courseCode);

    // Find the class associated with the courseGroupType
    // Find the class matching the courseCode
    const classes = await prisma.class.findMany({
      where: {
        courseCode: data?.courseCode // Filter by courseCode
      },
      select: { id: true }, // Select only the `id` field
    });
    console.log(classes)
    if (!classes) {
      return NextResponse.json(
        { error: "Class not found for the specified courseGroupType" },
        { status: 404 }
      );
    }
      // Extract an array of IDs
    const classIds = classes.map(cls => cls.id);
    console.log("Class IDs are: ", classIds);

    const file = formData.get("file");
    let fileUrl = null;

    if (file) {
      const buffer = await file.arrayBuffer();
      
      // Create the BlobServiceClient using SharedKeyCredential
      const credential = new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY);
      const blobServiceClient = new BlobServiceClient(
        `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        credential
      );
      const containerClient = blobServiceClient.getContainerClient("blobstorageta");

      // Ensure the container exists or create it
      const exists = await containerClient.exists();
      if (!exists) {
        await containerClient.create();
      }

      const blobName = `${uuidv4()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload the file buffer as a blob
      await blockBlobClient.uploadData(Buffer.from(buffer), {
        blobHTTPHeaders: { blobContentType: file.type },
      });

      // Set up SAS token options (read-only, valid for 1 hour)
      const sasOptions = {
        containerName: "blobstorageta",
        blobName: blobName,
        permissions: BlobSASPermissions.parse("r"), // Read-only permission
        startsOn: new Date(), // Start immediately
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1-hour expiry
      };

      // Generate SAS Token
      const sasToken = generateBlobSASQueryParameters(sasOptions, credential).toString();
      fileUrl = `${blockBlobClient.url}?${sasToken}`; // Combine URL and SAS token
    }

    // Create the ticket in Prisma
    const newTicket = await prisma.ticket.create({
      data: {
        ticketDescription: data.ticketDescription,
        category: data.category,
        studentId: data.studentId,
        priority: data.priority,
        professorId: data.professorId,
        taId: data.taId,
        classes: {
          connect: classIds.map(id => ({ id })),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
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
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userEmail = session.user?.email;

    // Parse query parameters for status (default to 'open')
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "open";

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define the condition based on the user's role
    let whereCondition = {
      status, // Include the status condition
    };

    if (user.role === "TA") {
      whereCondition.taId = user.id;
    } else if (user.role === "PROFESSOR") {
      whereCondition.professorId = user.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch tickets based on the role and status
    const tickets = await prisma.ticket.findMany({
      where: whereCondition,
      include: {
        ta: true,
        professor: true,
        comments: true,
        files: true,
        student: true,
        classes: true,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Error fetching tickets" }, { status: 500 });
  }
}

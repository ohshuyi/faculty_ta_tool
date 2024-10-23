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
    const data = {
      ticketNumber: formData.get("ticketNumber"),
      ticketDescription: formData.get("ticketDescription"),
      courseGroupType: formData.get("courseGroupType"),
      category: formData.get("category"),
      student: formData.get("student"),
      details: formData.get("details") || "",
      priority: formData.get("priority"),
      professorId: parseInt(formData.get("professorId")),
      taId: parseInt(formData.get("taId")),
    };

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
        ticketNumber: data.ticketNumber,
        ticketDescription: data.ticketDescription,
        courseGroupType: data.courseGroupType,
        category: data.category,
        student: data.student,
        details: data.details,
        priority: data.priority,
        professorId: data.professorId,
        taId: data.taId,
        createdAt: new Date(),
        updatedAt: new Date(),
        files: {
          create: [
            {
              url: fileUrl, // Store the SAS URL
              fileName: file ? file.name : null,
            },
          ],
        },
      },
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

// export async function POST(req: Request) {
//   try {
//     // Parse the incoming request body
//     const data = await req.json();

//     // Create a new ticket using Prisma
//     const newTicket = await prisma.ticket.create({
//       data: {
//         ticketNumber: data.ticketNumber,
//         ticketDescription: data.ticketDescription,
//         courseGroupType: data.courseGroupType,
//         category: data.category,
//         student: data.student,
//         details: data.details || "", // Optional field
//         priority: data.priority,
//         professorId: data.professorId, // Professor selected in the form
//         taId: data.taId, // TA assigned (you might want to get this from session or the logged-in user)
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     // Return a success response
//     return NextResponse.json(newTicket, { status: 201 });
//   } catch (error) {
//     console.error("Error creating ticket:", error);
//     return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
//   }
// }

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userEmail = session.user?.email;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define the condition based on role
    let whereCondition = {};
    if (user.role === "TA") {
      whereCondition = { taId: user.id };
    } else if (user.role === "PROFESSOR") {
      whereCondition = { professorId: user.id };
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch tickets based on the condition (for both TA and Professor)
    const tickets = await prisma.ticket.findMany({
      where: whereCondition,
      include: {
        ta: true,
        professor: true,
        comments: true,
        files: true,
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Error fetching tickets" }, { status: 500 });
  }
}

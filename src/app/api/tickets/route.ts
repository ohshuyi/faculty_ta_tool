import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email";

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const baseUrl = "https://faculty-ta-v2.azurewebsites.net"

    const data = {
      name: formData.get("name"), 
      ticketDescription: formData.get("ticketDescription"),
      courseCode: formData.get("courseGroupType"), 
      classId: formData.get("classId") ? parseInt(formData.get("classId") as string, 10) : null,
      category: formData.get("category"),
      studentId: parseInt(formData.get("studentId") as string),
      priority: formData.get("priority"),
      professorId: parseInt(formData.get("professorId") as string),
      taId: parseInt(formData.get("taId") as string),
    };

    let classIds: number[] = [];
    if (data.classId) {
      classIds = [data.classId];
    } else if (data.courseCode) {
      
      const classes = await prisma.class.findMany({
        where: {
          courseCode: data.courseCode as string, 
        },
        select: { id: true }, 
      });

      if (!classes || classes.length === 0) {
        return NextResponse.json(
          { error: "Class not found for the specified courseGroupType" },
          { status: 404 }
        );
      }

      classIds = classes.map((cls) => cls.id);
    }

    const file = formData.get("file");
    let fileUrl = null;

    if (file) {
      const buffer = await file.arrayBuffer();

      const credential = new StorageSharedKeyCredential(
        AZURE_STORAGE_ACCOUNT_NAME,
        AZURE_STORAGE_ACCOUNT_KEY
      );
      const blobServiceClient = new BlobServiceClient(
        `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        credential
      );
      const containerClient = blobServiceClient.getContainerClient(
        "blobstorageta"
      );

      const exists = await containerClient.exists();
      if (!exists) {
        await containerClient.create();
      }

      const blobName = `${uuidv4()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(Buffer.from(buffer), {
        blobHTTPHeaders: { blobContentType: file.type },
      });

      const sasOptions = {
        containerName: "blobstorageta",
        blobName: blobName,
        permissions: BlobSASPermissions.parse("r"), 
        startsOn: new Date(), 
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), 
      };

      const sasToken = generateBlobSASQueryParameters(sasOptions, credential).toString();
      fileUrl = `${blockBlobClient.url}?${sasToken}`; 
    }

    const newTicket = await prisma.ticket.create({
      data: {
        name: data.name, 
        ticketDescription: data.ticketDescription,
        category: data.category,
        studentId: data.studentId,
        priority: data.priority,
        professorId: data.professorId,
        taId: data.taId,
        classes: {
          connect: classIds.map((id) => ({ id })),
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
        comments: {
          create: {
            author: "System",
            content: "Ticket created.",
          },
        },
      },
      include: { 
        professor: true,
        ta: true,
      },
    });

    if (newTicket) {
      const subject = `New Ticket Created: ${newTicket.name}`;
      const body = `
        <html><body>
          <h2>A new support ticket has been created.</h2>
          <p><strong>Ticket:</strong> ${newTicket.name}</p>
          <p><strong>Category:</strong> ${newTicket.category}</p>
          <p><strong>Priority:</strong> ${newTicket.priority}</p>
          <p><strong>Created by:</strong> ${newTicket.ta.name}</p>
          <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View Ticket
            </a>
        </body></html>
      `;

      if (newTicket.professor.email) {
        await sendEmail(newTicket.professor.email, subject, body);
      }
    }

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

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "open";
    const courseCode = url.searchParams.get("courseCode");

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { courseRoles: true } as any,
    }) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let whereCondition: any = {
      status, 
    };

    if (courseCode) {
      whereCondition.classes = { some: { courseCode } };
    }

    let effectiveRole = user.role;
    if (courseCode) {
      const courseRoleRecord = user.courseRoles.find((r: any) => r.courseCode === courseCode);
      if (courseRoleRecord) {
        effectiveRole = courseRoleRecord.role;
      } else {
        return NextResponse.json({ error: "Unauthorized for this course" }, { status: 403 });
      }
    }

    if (effectiveRole === "TA" || effectiveRole === "TUTOR") {
      whereCondition.taId = user.id;
    } else if (effectiveRole === "PROFESSOR" || effectiveRole === "COURSE_COORDINATOR") {
      whereCondition.professorId = user.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

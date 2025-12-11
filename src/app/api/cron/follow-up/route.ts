import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function GET(req: Request) {
    try {
        // 1. Process Tasks
        const pendingTasks = await prisma.task.findMany({
            where: {
                status: "pending",
            },
            include: {
                professor: true,
                ta: true,
                comments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        let tasksProcessed = 0;
        for (const task of pendingTasks) {
            await processItem(task, "Task", task.professor, task.ta);
            tasksProcessed++;
        }

        // 2. Process Tickets
        const pendingTickets = await prisma.ticket.findMany({
            where: {
                status: { notIn: ["completed", "closed", "resolved"] },
            },
            include: {
                professor: true,
                ta: true,
                comments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        let ticketsProcessed = 0;
        for (const ticket of pendingTickets) {
            await processItem(ticket, "Ticket", ticket.professor, ticket.ta);
            ticketsProcessed++;
        }

        return NextResponse.json({
            message: "Follow-up check completed",
            stats: { tasksProcessed, ticketsProcessed }
        });
    } catch (error) {
        console.error("Error in follow-up cron:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function processItem(item: any, type: string, professor: any, ta: any) {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const baseUrl = "https://faculty-ta.azurewebsites.net";

    let lastActivityAt = new Date(item.updatedAt);
    let lastActorName = null;

    const lastComment = item.comments && item.comments[0];
    if (lastComment) {
        const commentDate = new Date(lastComment.createdAt);
        if (commentDate > lastActivityAt) {
            lastActivityAt = commentDate;
            lastActorName = lastComment.author;
        }
    }

    // Check if inactive for 2 days
    if (lastActivityAt < twoDaysAgo) {
        // Check if we already sent a follow-up since the last activity
        if (item.lastFollowUpAt && new Date(item.lastFollowUpAt) > lastActivityAt) {
            return; // Already followed up since the last activity
        }

        // Determine recipient
        let recipient = null;

        // If we know the last actor, send to the other person
        if (lastActorName) {
            if (professor && lastActorName === professor.name) {
                recipient = ta;
            } else if (ta && lastActorName === ta.name) {
                recipient = professor;
            } else {
                // Actor is neither (e.g. Student, or name mismatch). Default to TA.
                recipient = ta;
            }
        } else {
            // No comments, just updated/created.
            // Default to TA as they are usually the assignee.
            recipient = ta;
        }

        if (recipient && recipient.email) {
            const subject = `Follow-up Reminder: ${type} "${item.name}" is pending`;
            const body = `
        <html>
          <body>
            <p>Hello ${recipient.name},</p>
            <p>This is a reminder that the ${type} "<strong>${item.name}</strong>" has been inactive for over 2 days.</p>
            <p>Last activity was on ${lastActivityAt.toLocaleString()}.</p>
            <p>Please follow up.</p>
            <br>
            <a href="${baseUrl}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View ${type}
            </a>
          </body>
        </html>
      `;

            console.log(`Sending follow-up email to ${recipient.email} for ${type} ${item.id}`);
            await sendEmail(recipient.email, subject, body);

            // Update lastFollowUpAt
            if (type === "Task") {
                await prisma.task.update({
                    where: { id: item.id },
                    data: { lastFollowUpAt: new Date() }
                });
            } else {
                await prisma.ticket.update({
                    where: { id: item.id },
                    data: { lastFollowUpAt: new Date() }
                });
            }
        }
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const timesheetId = parseInt(params.timesheetId, 10);

        if (isNaN(timesheetId)) {
            return NextResponse.json({ error: "Invalid timesheet ID" }, { status: 400 });
        }

        const timesheet = await prisma.timesheet.findFirst({
            where: { id: timesheetId, userId: session.user.id },
            include: {
                approvers: true, // Get approvers to check count and send emails
                user: true,      // Get TA's name for the email
            },
        });

        if (!timesheet || timesheet.userId !== session?.user?.id) {
            return NextResponse.json({ error: "Timesheet not found or unauthorized" }, { status: 404 });
        }
        if (timesheet.status !== 'Draft' && timesheet.status !== 'Rejected') {
            return NextResponse.json({ error: "Only Draft or Rejected timesheets can be submitted." }, { status: 400 });
        }
        if (timesheet.approvers.length === 0) {
            return NextResponse.json({ error: "You must assign at least one approver before submitting." }, { status: 400 });
        }

        // Update status to 'Submitted'
        const updatedTimesheet = await prisma.timesheet.update({
            where: { id: timesheetId },
            data: { status: "Submitted", rejectionReason: null },
            include: {
                approvers: true,
                user: true
            }
        });

        await prisma.timesheetLog.create({
            data: {
                timesheetId: timesheetId,
                actorName: `${session.user.name} (TA)`,
                action: "Submitted",
            }
        });

        try {
            const baseUrl = process.env.NEXTAUTH_URL; // Your app's URL
            const timesheetLink = `${baseUrl}/timesheet`; // Link to the timesheet page
            const taName = updatedTimesheet.user.name;
            const subject = `Timesheet Submitted: ${taName} - ${updatedTimesheet.courseCode}`;

            // Loop through all assigned approvers and send them an email
            for (const professor of updatedTimesheet.approvers) {
                if (professor.email) {
                    const body = `
            <html>
              <body>
                <p>Hello ${professor.name},</p>
                <p>A new timesheet from <strong>${taName}</strong> for <strong>${updatedTimesheet.courseCode} (${updatedTimesheet.period})</strong> has been submitted for your approval.</p>
                <p>Total Hours: ${updatedTimesheet.totalHours}</p>
                <br>
                <a href="${timesheetLink}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                  Review Timesheets
                </a>
              </body>
            </html>
          `;
                    sendEmail(professor.email, subject, body).catch(console.error);
                }
            }
        } catch (emailError) {
            // Log the email error, but don't fail the whole API request
            console.error("Failed to send submission emails:", emailError);
        }

        return NextResponse.json(updatedTimesheet);
    } catch (error) {
        console.error("Error submitting timesheet:", error);
        return NextResponse.json({ error: "Failed to submit timesheet" }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const timesheetId = parseInt(params.timesheetId, 10);
        const { reason } = await req.json();
        const professorId = session?.user?.id;
        const professorName = session?.user?.name || 'Your Professor';

        if (session?.user?.role !== 'PROFESSOR' || !professorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        if (!reason || reason.trim() === "") {
            return NextResponse.json({ error: "A reason for rejection is required." }, { status: 400 });
        }

        // 2. Find the timesheet and include the TA's user info
        const timesheet = await prisma.timesheet.findFirst({
            where: {
                id: timesheetId,
                status: "Submitted",
                approvers: { some: { id: professorId } }
            },
            include: {
                user: true // Include the TA's info
            }
        });

        if (!timesheet) {
            return NextResponse.json({ error: "Timesheet not found, not 'Submitted', or you are not an approver." }, { status: 403 });
        }

        const updatedTimesheet = await prisma.timesheet.update({
            where: { id: timesheetId },
            data: {
                status: "Rejected",
                rejectionReason: reason
            },
        });

        // 3. Send notification email to the TA
        if (timesheet.user && timesheet.user.email) {
            const baseUrl = process.env.NEXTAUTH_URL;
            const timesheetLink = `${baseUrl}/timesheet`;
            const subject = `Timesheet Rejected: ${timesheet.courseCode}`;
            const body = `
        <html>
          <body>
            <p>Hello ${timesheet.user.name},</p>
            <p>Your timesheet for <strong>${timesheet.courseCode} (${timesheet.period})</strong> has been <strong>rejected</strong> by ${professorName}.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <br>
            <a href="${timesheetLink}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              View and Resubmit
            </a>
          </body>
        </html>
      `;
            // Run without await to not block the API response
            sendEmail(timesheet.user.email, subject, body).catch(console.error);
        }

        return NextResponse.json(updatedTimesheet);
    } catch (error) {
        console.error("Error rejecting timesheet:", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to reject timesheet" }, { status: 500 });
    }
}
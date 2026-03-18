import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const professorId = session?.user?.id;
        const professorName = session?.user?.name || 'Your Professor';

        if (session?.user?.role !== 'PROFESSOR' || !professorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const timesheetId = parseInt(params.timesheetId, 10);
        if (isNaN(timesheetId)) {
            return NextResponse.json({ error: "Invalid timesheet ID" }, { status: 400 });
        }

        const timesheet = await prisma.timesheet.findFirst({
            where: {
                id: timesheetId,
                status: "Submitted",
                approvers: { some: { id: professorId } }
            },
            include: {
                user: true, 
                entries: true 
            }
        });

        if (!timesheet) {
            return NextResponse.json({ error: "Timesheet not found or you are not an assigned approver." }, { status: 403 });
        }

        const updatedTimesheet = await prisma.timesheet.update({
            where: { id: timesheetId },
            data: { status: "Approved" },
        });

        await prisma.timesheetLog.create({
            data: {
                timesheetId: timesheetId,
                actorName: `${session.user.name} (Professor)`,
                action: "Approved",
            }
        });

        if (timesheet.user && timesheet.user.email) {
            const baseUrl = process.env.NEXTAUTH_URL;
            const timesheetLink = `${baseUrl}/timesheet`;
            const subject = `Timesheet Approved: ${timesheet.courseCode}`;

            const entriesRows = timesheet.entries.map(entry => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(entry.date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${entry.weekNumber}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${entry.classDetails || 'N/A'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${entry.hours}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${entry.description || '-'}</td>
                </tr>
            `).join('');

            const body = `
                    <html>
                    <body>
                        <p>Hello ${timesheet.user.name},</p>
                        <p>Your timesheet for <strong>${timesheet.courseCode} (${timesheet.period})</strong> has been <strong>approved</strong> by ${professorName}.</p>
                        
                        <h3>Logged Hours</h3>
                        <table style="border-collapse: collapse; width: 100%; max-width: 800px;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Date</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Week</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Class</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Hours</th>
                                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${entriesRows}
                            </tbody>
                            <tfoot>
                                <tr style="font-weight: bold; background-color: #f9f9f9;">
                                    <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total Hours:</td>
                                    <td colspan="2" style="padding: 8px; border: 1px solid #ddd;">${timesheet.totalHours}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <br>
                        <a href="${timesheetLink}" style="display: inline-block; padding: 10px 15px; font-size: 16px; color: #ffffff; background-color: #28a745; text-decoration: none; border-radius: 5px;">
                        View Timesheets
                        </a>
                    </body>
                    </html>
                `;

            // Send to both TA and Professor (if professor email exists)
            const recipients = [timesheet.user.email];
            if (session.user.email) {
                recipients.push(session.user.email);
            }

            // Run without await to not block the API response
            sendEmail(recipients, subject, body).catch(console.error);
        }

        return NextResponse.json(updatedTimesheet);
    } catch (error) {
        console.error("Error approving timesheet:", error);
        if (error.code === 'P2025') { 
            return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to approve timesheet" }, { status: 500 });
    }
}
import { EmailClient } from "@azure/communication-email";

export async function sendEmail(recipientAddress, subject, htmlContent) {
  try {
    const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
    const senderAddress = process.env.EMAIL_SENDER_ADDRESS;

    if (!connectionString || !senderAddress) {
      console.error("Email service environment variables are not configured.");
      return;
    }

    const emailClient = new EmailClient(connectionString);

    const message = {
      senderAddress,
      content: { subject, html: htmlContent },
      recipients: { to: [{ address: recipientAddress }] },
    };

    const poller = await emailClient.beginSend(message);
    await poller.pollUntilDone();
    console.log(`Email sent successfully to ${recipientAddress}`);

  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
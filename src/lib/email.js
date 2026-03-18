import { EmailClient } from "@azure/communication-email";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendEmail(recipientAddress, subject, htmlContent) {
  const connectionString = process.env.COMMUNICATION_SERVICES_CONNECTION_STRING;
  const senderAddress = process.env.EMAIL_SENDER_ADDRESS;
  const adminCcAddress = process.env.ADMIN_EMAIL_ADDRESS;

  if (!connectionString || !senderAddress) {
    console.error("Email service environment variables are not configured.");
    return;
  }

  const emailClient = new EmailClient(connectionString);

  const message = {
    senderAddress,
    content: { subject, html: htmlContent },
    recipients: {
      to: Array.isArray(recipientAddress)
        ? recipientAddress.map((addr) => ({ address: addr }))
        : [{ address: recipientAddress }],
      cc: adminCcAddress ? [{ address: adminCcAddress }] : [],
    },
  };

  let attempt = 0;
  const maxRetries = 5;

  while (attempt < maxRetries) {
    try {
      const poller = await emailClient.beginSend(message);
      await poller.pollUntilDone();
      console.log(`Email sent successfully to ${recipientAddress}`);
      return; 
    } catch (error) {
      attempt++;
      console.error(`Email send attempt ${attempt} failed:`, error.message);

      if (attempt >= maxRetries) {
        console.error("Max retries reached. Sending error report to admin.");
        try {
          
          if (adminCcAddress) {
            const adminMessage = {
              senderAddress,
              content: {
                subject: `[FAILURE] Email Sending Failed: ${subject}`,
                html: `
                  <p>Failed to send email to: ${JSON.stringify(recipientAddress)}</p>
                  <p>Subject: ${subject}</p>
                  <p>Error Details:</p>
                  <pre>${JSON.stringify(error, null, 2)}</pre>
                `,
              },
              recipients: {
                to: [{ address: adminCcAddress }],
              },
            };
            const adminPoller = await emailClient.beginSend(adminMessage);
            await adminPoller.pollUntilDone();
            console.log("Admin notification sent.");
          }
        } catch (adminError) {
          console.error("Failed to send admin notification:", adminError);
        }
      } else {
        
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await wait(delay);
      }
    }
  }
}
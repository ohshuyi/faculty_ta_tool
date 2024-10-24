// lib/calendar.js
import { Client } from '@microsoft/microsoft-graph-client';

// Helper function to create a Microsoft Graph client with the access token
function getAuthenticatedClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken); // Pass the access token for authentication
    },
  });
}

// Function to add an event to the TA's Outlook calendar
export async function addEventToCalendar(accessToken, eventDetails) {
  try {
    const client = getAuthenticatedClient(accessToken);

    // Prepare the event object to send to Microsoft Graph API
    const event = {
      subject: eventDetails.taskName,
      body: {
        contentType: 'HTML',
        content: eventDetails.details,
      },
      start: {
        dateTime: eventDetails.dueDate, // Task due date
        timeZone: 'UTC', // Adjust to the correct time zone if necessary
      },
      end: {
        dateTime: eventDetails.dueDate, // Same due date as end time
        timeZone: 'UTC', // Adjust to the correct time zone if necessary
      },
      attendees: [
        {
          emailAddress: {
            address: eventDetails.taEmail,
            name: eventDetails.taName,
          },
          type: 'required',
        },
      ],
    };

    // Send the request to create the event on the TA's calendar
    await client.api(`/users/${eventDetails.taEmail}/events`).post(event); // Use the TA's email to target their calendar
    console.log('Event created successfully on TA’s calendar.');
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    throw new Error('Failed to add event to calendar.');
  }
}


import { Client } from '@microsoft/microsoft-graph-client';

function getAuthenticatedClient(accessToken) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken); 
    },
  });
}

export async function addEventToCalendar(accessToken, eventDetails) {
  try {
    const client = getAuthenticatedClient(accessToken);

    const event = {
      subject: eventDetails.taskName,
      body: {
        contentType: 'HTML',
        content: eventDetails.details,
      },
      start: {
        dateTime: eventDetails.dueDate, 
        timeZone: 'UTC', 
      },
      end: {
        dateTime: eventDetails.dueDate, 
        timeZone: 'UTC', 
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

    await client.api(`/users/${eventDetails.taEmail}/events`).post(event); 
    console.log('Event created successfully on TA’s calendar.');
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    throw new Error('Failed to add event to calendar.');
  }
}

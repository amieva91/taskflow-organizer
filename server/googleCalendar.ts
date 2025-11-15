import { google } from 'googleapis';
import { getGoogleClient } from './googleAuth';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export async function listCalendarEvents(
  accessToken: string,
  refreshToken: string,
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 250
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

export async function getCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.get({
    calendarId: 'primary',
    eventId,
  });

  return response.data;
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: CalendarEvent
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  event: Partial<CalendarEvent>
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event,
  });

  return response.data;
}

export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });

  return { success: true };
}

export async function importExistingEvents(
  accessToken: string,
  refreshToken: string,
  timeMin?: Date,
  timeMax?: Date
) {
  const events = await listCalendarEvents(accessToken, refreshToken, timeMin, timeMax);
  return events;
}

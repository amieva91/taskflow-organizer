import { google } from 'googleapis';
import { getGoogleClient } from './googleAuth';

export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

function createEmailContent(message: EmailMessage): string {
  const lines = [
    `To: ${message.to.join(', ')}`,
  ];

  if (message.cc && message.cc.length > 0) {
    lines.push(`Cc: ${message.cc.join(', ')}`);
  }

  if (message.bcc && message.bcc.length > 0) {
    lines.push(`Bcc: ${message.bcc.join(', ')}`);
  }

  lines.push(`Subject: ${message.subject}`);
  
  if (message.isHtml) {
    lines.push('Content-Type: text/html; charset=utf-8');
  } else {
    lines.push('Content-Type: text/plain; charset=utf-8');
  }

  lines.push('');
  lines.push(message.body);

  return lines.join('\r\n');
}

export async function sendEmail(
  accessToken: string,
  refreshToken: string,
  message: EmailMessage
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const emailContent = createEmailContent(message);
  const encodedMessage = Buffer.from(emailContent)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data;
}

export async function listEmails(
  accessToken: string,
  refreshToken: string,
  maxResults: number = 20,
  query?: string
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });

  return response.data.messages || [];
}

export async function getEmail(
  accessToken: string,
  refreshToken: string,
  messageId: string
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

export async function getUserProfile(
  accessToken: string,
  refreshToken: string
) {
  const oauth2Client = getGoogleClient(accessToken, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const response = await gmail.users.getProfile({
    userId: 'me',
  });

  return response.data;
}

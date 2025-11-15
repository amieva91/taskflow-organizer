import * as googleGmail from './googleGmail';
import * as db from './db';

interface TaskNotificationData {
  taskTitle: string;
  taskDescription?: string;
  priority: string;
  dueDate?: Date;
  assignedBy: string;
  taskUrl?: string;
}

const priorityLabels: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

function generateTaskNotificationHTML(data: TaskNotificationData): string {
  const priorityLabel = priorityLabels[data.priority] || data.priority;
  const priorityColor = priorityColors[data.priority] || '#6b7280';
  const dueDateText = data.dueDate 
    ? new Date(data.dueDate).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Sin fecha límite';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Tarea Asignada</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                📋 Nueva Tarea Asignada
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Hola,
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                <strong>${data.assignedBy}</strong> te ha asignado una nueva tarea en <strong>TaskFlow Organizer</strong>.
              </p>
              
              <!-- Task Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827; font-weight: 600;">
                      ${data.taskTitle}
                    </h2>
                    
                    ${data.taskDescription ? `
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                      ${data.taskDescription}
                    </p>
                    ` : ''}
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right: 8px;">
                                <span style="font-size: 14px; color: #6b7280;">
                                  🎯 Prioridad:
                                </span>
                              </td>
                              <td>
                                <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}20; color: ${priorityColor}; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                  ${priorityLabel}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #6b7280;">
                            📅 Fecha límite: <strong style="color: #111827;">${dueDateText}</strong>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${data.taskUrl ? `
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.taskUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Ver Tarea Completa
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Puedes gestionar esta tarea y todas tus asignaciones desde <strong>TaskFlow Organizer</strong>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Este correo fue enviado automáticamente por TaskFlow Organizer
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Si no esperabas este correo, puedes ignorarlo de forma segura
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendTaskAssignmentNotification(
  userId: number,
  taskId: number,
  contactIds: number[]
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  const user = await db.getUserById(userId);
  
  if (!user?.googleAccessToken || !user?.googleRefreshToken) {
    return {
      success: false,
      sent: 0,
      failed: contactIds.length,
      errors: ['Usuario no tiene Google conectado'],
    };
  }

  const task = await db.getTaskById(taskId);
  if (!task) {
    return {
      success: false,
      sent: 0,
      failed: contactIds.length,
      errors: ['Tarea no encontrada'],
    };
  }

  const contacts = await Promise.all(
    contactIds.map(id => db.getContactById(id))
  );

  // Filtrar contactos válidos (no ficticios y con email)
  const validContacts = contacts.filter(
    contact => contact && !contact.isFictional && contact.email
  );

  if (validContacts.length === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      errors: ['No hay contactos reales con email para notificar'],
    };
  }

  const notificationData: TaskNotificationData = {
    taskTitle: task.title,
    taskDescription: task.description || undefined,
    priority: task.priority,
    dueDate: task.dueDate || undefined,
    assignedBy: user.name || user.email || 'Un usuario',
  };

  const htmlBody = generateTaskNotificationHTML(notificationData);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Enviar emails individualmente
  for (const contact of validContacts) {
    if (!contact?.email) continue;

    try {
      await googleGmail.sendEmail(
        user.googleAccessToken,
        user.googleRefreshToken,
        {
          to: [contact.email],
          subject: `Nueva tarea asignada: ${task.title}`,
          body: htmlBody,
          isHtml: true,
        }
      );
      sent++;
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      errors.push(`Error enviando a ${contact.email}: ${errorMessage}`);
      console.error(`Error sending email to ${contact.email}:`, error);
    }
  }

  return {
    success: sent > 0,
    sent,
    failed,
    errors,
  };
}

export async function sendTaskUpdateNotification(
  userId: number,
  taskId: number,
  updateType: 'status_changed' | 'due_date_changed' | 'priority_changed',
  oldValue: string,
  newValue: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  const user = await db.getUserById(userId);
  
  if (!user?.googleAccessToken || !user?.googleRefreshToken) {
    return { success: false, sent: 0, failed: 0 };
  }

  const task = await db.getTaskById(taskId);
  if (!task) {
    return { success: false, sent: 0, failed: 0 };
  }

  const assignments = await db.getAssignmentsByTaskId(taskId);
  const contactIds = assignments.map(a => a.contactId);
  
  if (contactIds.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const contacts = await Promise.all(
    contactIds.map(id => db.getContactById(id))
  );

  const validContacts = contacts.filter(
    contact => contact && !contact.isFictional && contact.email
  );

  if (validContacts.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  const updateMessages: Record<typeof updateType, string> = {
    status_changed: `El estado de la tarea ha cambiado de "${oldValue}" a "${newValue}"`,
    due_date_changed: `La fecha límite ha cambiado de "${oldValue}" a "${newValue}"`,
    priority_changed: `La prioridad ha cambiado de "${oldValue}" a "${newValue}"`,
  };

  const subject = `Actualización de tarea: ${task.title}`;
  const body = `
    <h2>Actualización de Tarea</h2>
    <p><strong>${task.title}</strong></p>
    <p>${updateMessages[updateType]}</p>
    <p>Revisa los detalles completos en TaskFlow Organizer.</p>
  `;

  let sent = 0;
  let failed = 0;

  for (const contact of validContacts) {
    if (!contact?.email) continue;

    try {
      await googleGmail.sendEmail(
        user.googleAccessToken,
        user.googleRefreshToken,
        {
          to: [contact.email],
          subject,
          body,
          isHtml: true,
        }
      );
      sent++;
    } catch (error) {
      failed++;
      console.error(`Error sending update email to ${contact.email}:`, error);
    }
  }

  return { success: sent > 0, sent, failed };
}

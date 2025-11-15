import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { getAuthUrl, getTokensFromCode } from "./googleAuth";
import * as googleCalendar from "./googleCalendar";
import * as googleGmail from "./googleGmail";
import * as emailNotifications from "./emailNotifications";
import * as aiSuggestions from "./aiSuggestions";
import * as reminders from "./reminders";
import * as workload from "./workload";
import * as quickNotesModule from "./quickNotes";
import * as calendarEventsModule from "./calendarEvents";
import { storagePut } from "./storage";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  google: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return {
        isConnected: !!(user?.googleAccessToken && user?.googleRefreshToken),
      };
    }),
    
    getAuthUrl: protectedProcedure.query(() => {
      return { url: getAuthUrl() };
    }),
    
    handleCallback: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const tokens = await getTokensFromCode(input.code);
        
        if (!tokens.access_token) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No se pudo obtener el token de acceso',
          });
        }

        const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
        
        await db.updateUserGoogleTokens(
          ctx.user.id,
          tokens.access_token,
          tokens.refresh_token || undefined,
          expiry
        );

        return { success: true };
      }),
  }),

  calendar: router({
    list: protectedProcedure
      .input(z.object({
        timeMin: z.string().optional(),
        timeMax: z.string().optional(),
        maxResults: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const timeMin = input.timeMin ? new Date(input.timeMin) : undefined;
        const timeMax = input.timeMax ? new Date(input.timeMax) : undefined;

        const events = await googleCalendar.listCalendarEvents(
          user.googleAccessToken,
          user.googleRefreshToken,
          timeMin,
          timeMax,
          input.maxResults
        );

        return events;
      }),

    create: protectedProcedure
      .input(z.object({
        summary: z.string(),
        description: z.string().optional(),
        start: z.object({
          dateTime: z.string().optional(),
          date: z.string().optional(),
          timeZone: z.string().optional(),
        }),
        end: z.object({
          dateTime: z.string().optional(),
          date: z.string().optional(),
          timeZone: z.string().optional(),
        }),
        attendees: z.array(z.object({
          email: z.string(),
          displayName: z.string().optional(),
        })).optional(),
        colorId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const event = await googleCalendar.createCalendarEvent(
          user.googleAccessToken,
          user.googleRefreshToken,
          input
        );

        return event;
      }),

    update: protectedProcedure
      .input(z.object({
        eventId: z.string(),
        summary: z.string().optional(),
        description: z.string().optional(),
        start: z.object({
          dateTime: z.string().optional(),
          date: z.string().optional(),
          timeZone: z.string().optional(),
        }).optional(),
        end: z.object({
          dateTime: z.string().optional(),
          date: z.string().optional(),
          timeZone: z.string().optional(),
        }).optional(),
        attendees: z.array(z.object({
          email: z.string(),
          displayName: z.string().optional(),
        })).optional(),
        colorId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const { eventId, ...updateData } = input;
        const event = await googleCalendar.updateCalendarEvent(
          user.googleAccessToken,
          user.googleRefreshToken,
          eventId,
          updateData
        );

        return event;
      }),

    delete: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        await googleCalendar.deleteCalendarEvent(
          user.googleAccessToken,
          user.googleRefreshToken,
          input.eventId
        );

        return { success: true };
      }),

    import: protectedProcedure
      .input(z.object({
        timeMin: z.string().optional(),
        timeMax: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const timeMin = input.timeMin ? new Date(input.timeMin) : undefined;
        const timeMax = input.timeMax ? new Date(input.timeMax) : undefined;

        const events = await googleCalendar.importExistingEvents(
          user.googleAccessToken,
          user.googleRefreshToken,
          timeMin,
          timeMax
        );

        return { events, count: events.length };
      }),
  }),

  gmail: router({
    send: protectedProcedure
      .input(z.object({
        to: z.array(z.string().email()),
        cc: z.array(z.string().email()).optional(),
        bcc: z.array(z.string().email()).optional(),
        subject: z.string(),
        body: z.string(),
        isHtml: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const result = await googleGmail.sendEmail(
          user.googleAccessToken,
          user.googleRefreshToken,
          input
        );

        return result;
      }),

    list: protectedProcedure
      .input(z.object({
        maxResults: z.number().optional(),
        query: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const messages = await googleGmail.listEmails(
          user.googleAccessToken,
          user.googleRefreshToken,
          input.maxResults,
          input.query
        );

        return messages;
      }),
  }),

  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTasksWithAssignments(ctx.user.id);
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),

    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTasksByProjectId(input.projectId);
      }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        return await db.getTasksByDateRange(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        projectId: z.number().optional(),
        phaseId: z.number().optional(),
        status: z.enum(["todo", "in_progress", "completed", "blocked"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
        estimatedHours: z.number().optional(),
        type: z.enum(["personal", "professional", "meeting", "event", "class", "training"]).optional(),
        color: z.string().optional(),
        googleCalendarEventId: z.string().optional(),
        assignedContactIds: z.array(z.number()).optional(),
        sendNotifications: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { assignedContactIds, sendNotifications, ...taskData } = input;
        const result = await db.createTask({
          ...taskData,
          userId: ctx.user.id,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
        
        // Crear asignaciones de contactos
        if (result && result.insertId && assignedContactIds && assignedContactIds.length > 0) {
          const taskId = Number(result.insertId);
          await Promise.all(
            assignedContactIds.map(contactId =>
              db.createTaskAssignment({
                taskId,
                contactId,
              })
            )
          );
          
          // Enviar notificaciones si está habilitado
          if (sendNotifications) {
            try {
              await emailNotifications.sendTaskAssignmentNotification(
                ctx.user.id,
                taskId,
                assignedContactIds
              );
            } catch (error) {
              console.error('Error sending notifications:', error);
              // No fallar la creación de la tarea si falla el envío de notificaciones
            }
          }
        }
        
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in_progress", "completed", "blocked"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
        completedDate: z.string().optional(),
        estimatedHours: z.number().optional(),
        actualHours: z.number().optional(),
        color: z.string().optional(),
        assignedContactIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, assignedContactIds, ...data } = input;
        await db.updateTask(id, {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
        });
        
        // Actualizar asignaciones de contactos
        if (assignedContactIds !== undefined) {
          // Eliminar asignaciones existentes
          await db.deleteTaskAssignmentsByTaskId(id);
          
          // Crear nuevas asignaciones
          if (assignedContactIds.length > 0) {
            await Promise.all(
              assignedContactIds.map(contactId =>
                db.createTaskAssignment({
                  taskId: id,
                  contactId,
                })
              )
            );
          }
        }
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProjectsByUserId(ctx.user.id);
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        color: z.string().optional(),
        type: z.enum(["personal", "professional"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createProject({
          ...input,
          userId: ctx.user.id,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  contacts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getContactsByUserId(ctx.user.id);
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        isFictional: z.boolean().optional(),
        avatar: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createContact({
          ...input,
          userId: ctx.user.id,
        });
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        avatar: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateContact(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContact(input.id);
        return { success: true };
      }),
  }),

  departments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDepartmentsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createDepartment({
          ...input,
          userId: ctx.user.id,
        });
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDepartment(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDepartment(input.id);
        return { success: true };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationsByUserId(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNotification(input.id);
        return { success: true };
      }),
  }),

  attachments: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(),
        mimeType: z.string(),
        taskId: z.number().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `${ctx.user.id}/attachments/${Date.now()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const result = await db.createAttachment({
          fileName: input.fileName,
          fileUrl: url,
          fileKey,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          taskId: input.taskId,
          projectId: input.projectId,
        });

        return result;
      }),

    byTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAttachmentsByTaskId(input.taskId);
      }),

    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAttachmentsByProjectId(input.projectId);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAttachment(input.id);
        return { success: true };
      }),
  }),

  ai: router({
    suggestTimeSlots: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        estimatedHours: z.number().optional(),
        assignedContactIds: z.array(z.number()).optional(),
        type: z.enum(["personal", "professional", "meeting", "event", "class", "training"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const suggestions = await aiSuggestions.generateTimeSlotSuggestions(
          ctx.user.id,
          input
        );
        return suggestions;
      }),
  }),

  reminders: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return await reminders.getReminderSettings(ctx.user.id);
    }),

    updateSettings: protectedProcedure
      .input(z.object({
        enabled: z.boolean().optional(),
        defaultMinutesBefore: z.number().optional(),
        emailEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await reminders.upsertReminderSettings(ctx.user.id, input);
      }),

    getUpcoming: protectedProcedure.query(async ({ ctx }) => {
      return await reminders.getTasksNeedingReminder(ctx.user.id);
    }),

    sendPending: protectedProcedure.mutation(async ({ ctx }) => {
      return await reminders.sendPendingReminders(ctx.user.id);
    }),
  }),

  workload: router({
    getAllContacts: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        return await workload.getAllContactsWorkload(ctx.user.id, start, end);
      }),

    getContactWorkload: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        return await workload.getContactWorkload(ctx.user.id, input.contactId, start, end);
      }),

    getDailyAvailability: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        return await workload.getContactDailyAvailability(ctx.user.id, input.contactId, start, end);
      }),
  }),

  quickNotes: router({
    getByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input, ctx }) => {
        const date = new Date(input.date);
        return await quickNotesModule.getQuickNotesByDate(ctx.user.id, date);
      }),

    getPending: protectedProcedure.query(async ({ ctx }) => {
      return await quickNotesModule.getPendingQuickNotes(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        content: z.string(),
        date: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const date = input.date ? new Date(input.date) : undefined;
        return await quickNotesModule.createQuickNote(ctx.user.id, input.content, date);
      }),

    toggle: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await quickNotesModule.toggleQuickNoteComplete(ctx.user.id, input.noteId);
      }),

    delete: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await quickNotesModule.deleteQuickNote(ctx.user.id, input.noteId);
      }),

    moveToDate: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        newDate: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const date = new Date(input.newDate);
        return await quickNotesModule.moveQuickNoteToDate(ctx.user.id, input.noteId, date);
      }),

    convertToTask: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await quickNotesModule.convertQuickNoteToTask(ctx.user.id, input.noteId, {
          title: input.title,
          description: input.description,
          priority: input.priority,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
      }),

    updateContent: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await quickNotesModule.updateQuickNoteContent(ctx.user.id, input.noteId, input.content);
      }),

    reorder: protectedProcedure
      .input(z.object({
        noteOrders: z.array(z.object({
          noteId: z.number(),
          sortOrder: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        return await quickNotesModule.reorderQuickNotes(ctx.user.id, input.noteOrders);
      }),
  }),

  calendarEvents: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        return await calendarEventsModule.getCalendarEvents(ctx.user.id, start, end);
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await calendarEventsModule.getAllCalendarEvents(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await calendarEventsModule.getCalendarEventById(ctx.user.id, input.eventId);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        allDay: z.boolean().optional(),
        location: z.string().optional(),
        color: z.string().optional(),
        type: z.enum(["personal", "professional", "meeting", "reminder"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await calendarEventsModule.createCalendarEvent(ctx.user.id, {
          title: input.title,
          description: input.description,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          allDay: input.allDay,
          location: input.location,
          color: input.color,
          type: input.type,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        allDay: z.boolean().optional(),
        location: z.string().optional(),
        color: z.string().optional(),
        type: z.enum(["personal", "professional", "meeting", "reminder"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await calendarEventsModule.updateCalendarEvent(ctx.user.id, input.eventId, {
          title: input.title,
          description: input.description,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          allDay: input.allDay,
          location: input.location,
          color: input.color,
          type: input.type,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await calendarEventsModule.deleteCalendarEvent(ctx.user.id, input.eventId);
      }),

    getUnsynced: protectedProcedure.query(async ({ ctx }) => {
      return await calendarEventsModule.getUnsyncedEvents(ctx.user.id);
    }),

    syncFromGoogle: protectedProcedure
      .input(z.object({
        timeMin: z.string().optional(),
        timeMax: z.string().optional(),
        maxResults: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes conectar tu cuenta de Google primero',
          });
        }

        const timeMin = input.timeMin ? new Date(input.timeMin) : undefined;
        const timeMax = input.timeMax ? new Date(input.timeMax) : undefined;

        // Obtener eventos de Google Calendar
        const googleEvents = await googleCalendar.listCalendarEvents(
          user.googleAccessToken,
          user.googleRefreshToken,
          timeMin,
          timeMax,
          input.maxResults
        );

        // Sincronizar a base de datos local
        const result = await calendarEventsModule.syncFromGoogleCalendar(
          ctx.user.id,
          googleEvents
        );

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;

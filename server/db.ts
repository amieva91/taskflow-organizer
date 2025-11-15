import { eq, and, desc, asc, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  departments,
  contacts,
  projects,
  projectPhases,
  tasks,
  taskDependencies,
  taskAssignments,
  labels,
  taskLabels,
  milestones,
  sprints,
  sprintTasks,
  attachments,
  notifications,
  InsertDepartment,
  InsertContact,
  InsertProject,
  InsertProjectPhase,
  InsertTask,
  InsertTaskDependency,
  InsertTaskAssignment,
  InsertLabel,
  InsertTaskLabel,
  InsertMilestone,
  InsertSprint,
  InsertSprintTask,
  InsertAttachment,
  InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "googleAccessToken", "googleRefreshToken"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.googleTokenExpiry !== undefined) {
      values.googleTokenExpiry = user.googleTokenExpiry;
      updateSet.googleTokenExpiry = user.googleTokenExpiry;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserGoogleTokens(userId: number, accessToken: string, refreshToken?: string, expiry?: Date) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiry: expiry,
    })
    .where(eq(users.id, userId));
}

// ============= DEPARTMENT FUNCTIONS =============

export async function createDepartment(department: InsertDepartment) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(departments).values(department);
  return result;
}

export async function getDepartmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(departments).where(eq(departments.userId, userId));
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(departments).where(eq(departments.id, id));
}

// ============= CONTACT FUNCTIONS =============

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(contacts).values(contact);
  return result;
}

export async function getContactsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(contacts).where(eq(contacts.userId, userId));
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(contacts).where(eq(contacts.id, id));
}

// ============= PROJECT FUNCTIONS =============

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(projects).values(project);
  return result;
}

export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(projects).where(eq(projects.id, id));
}

// ============= PROJECT PHASE FUNCTIONS =============

export async function createProjectPhase(phase: InsertProjectPhase) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(projectPhases).values(phase);
  return result;
}

export async function getPhasesByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId)).orderBy(asc(projectPhases.order));
}

export async function updateProjectPhase(id: number, data: Partial<InsertProjectPhase>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(projectPhases).set(data).where(eq(projectPhases.id, id));
}

export async function deleteProjectPhase(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(projectPhases).where(eq(projectPhases.id, id));
}

// ============= TASK FUNCTIONS =============

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(tasks).values(task);
  return result;
}

export async function getTasksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTasksByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

export async function getTasksByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        or(
          and(gte(tasks.startDate, startDate), lte(tasks.startDate, endDate)),
          and(gte(tasks.dueDate, startDate), lte(tasks.dueDate, endDate))
        )
      )
    );
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ============= TASK ASSIGNMENT FUNCTIONS =============

export async function createTaskAssignment(assignment: InsertTaskAssignment) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(taskAssignments).values(assignment);
  return result;
}

export async function getAssignmentsByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, taskId));
}

export async function getAssignmentsByContactId(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(taskAssignments).where(eq(taskAssignments.contactId, contactId));
}

export async function updateTaskAssignment(id: number, data: Partial<InsertTaskAssignment>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(taskAssignments).set(data).where(eq(taskAssignments.id, id));
}

export async function deleteTaskAssignment(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(taskAssignments).where(eq(taskAssignments.id, id));
}

// ============= LABEL FUNCTIONS =============

export async function createLabel(label: InsertLabel) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(labels).values(label);
  return result;
}

export async function getLabelsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(labels).where(eq(labels.userId, userId));
}

export async function deleteLabel(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(labels).where(eq(labels.id, id));
}

// ============= MILESTONE FUNCTIONS =============

export async function createMilestone(milestone: InsertMilestone) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(milestones).values(milestone);
  return result;
}

export async function getMilestonesByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(milestones).where(eq(milestones.projectId, projectId)).orderBy(asc(milestones.dueDate));
}

export async function updateMilestone(id: number, data: Partial<InsertMilestone>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(milestones).set(data).where(eq(milestones.id, id));
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(milestones).where(eq(milestones.id, id));
}

// ============= SPRINT FUNCTIONS =============

export async function createSprint(sprint: InsertSprint) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(sprints).values(sprint);
  return result;
}

export async function getSprintsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(sprints).where(eq(sprints.projectId, projectId)).orderBy(desc(sprints.startDate));
}

export async function updateSprint(id: number, data: Partial<InsertSprint>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(sprints).set(data).where(eq(sprints.id, id));
}

export async function deleteSprint(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(sprints).where(eq(sprints.id, id));
}

// ============= ATTACHMENT FUNCTIONS =============

export async function createAttachment(attachment: InsertAttachment) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(attachments).values(attachment);
  return result;
}

export async function getAttachmentsByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(attachments).where(eq(attachments.taskId, taskId));
}

export async function getAttachmentsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(attachments).where(eq(attachments.projectId, projectId));
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(attachments).where(eq(attachments.id, id));
}

// ============= NOTIFICATION FUNCTIONS =============

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(notifications).where(eq(notifications.id, id));
}

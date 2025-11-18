import {
  users,
  clients,
  certificates,
  notifications,
  auditLogs,
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Certificate,
  type InsertCertificate,
  type Notification,
  type InsertNotification,
  type AuditLog,
  type InsertAuditLog,
  type CertificateWithRelations,
  type NotificationWithRelations,
  type ClientWithCreator,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, like, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: "admin" | "accountant" | "viewer"): Promise<User | undefined>;

  // Client operations
  getAllClients(userId?: string): Promise<ClientWithCreator[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Certificate operations
  getAllCertificates(userId?: string, userRole?: string): Promise<CertificateWithRelations[]>;
  getCertificate(id: string): Promise<CertificateWithRelations | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: string, certificate: Partial<InsertCertificate>): Promise<Certificate | undefined>;
  deleteCertificate(id: string): Promise<void>;
  filterCertificates(filters: {
    search?: string;
    clientId?: string;
    type?: string[];
    status?: string[];
    expiryFrom?: string;
    expiryTo?: string;
    userId?: string;
    userRole?: string;
  }): Promise<CertificateWithRelations[]>;
  getCertificateStatistics(userId?: string, userRole?: string): Promise<{
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;

  // Notification operations
  getAllNotifications(userId: string): Promise<NotificationWithRelations[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  hasUnreadNotificationForCertificate(certificateId: string, userId: string, type: string): Promise<boolean>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: "admin" | "accountant" | "viewer"): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Client operations
  async getAllClients(userId?: string): Promise<ClientWithCreator[]> {
    let query = db
      .select()
      .from(clients)
      .leftJoin(users, eq(clients.createdBy, users.id))
      .orderBy(desc(clients.createdAt));

    // If userId is provided and they're not admin, only show their clients
    if (userId) {
      const user = await this.getUser(userId);
      if (user && user.role !== "admin") {
        query = query.where(eq(clients.createdBy, userId)) as any;
      }
    }

    const results = await query;
    return results.map((row) => ({
      ...row.clients,
      creator: row.users!,
    }));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Certificate operations
  async getAllCertificates(userId?: string, userRole?: string): Promise<CertificateWithRelations[]> {
    let query = db
      .select()
      .from(certificates)
      .leftJoin(clients, eq(certificates.clientId, clients.id))
      .leftJoin(users, eq(certificates.createdBy, users.id))
      .orderBy(desc(certificates.createdAt));

    // If user is not admin, only show certificates they created
    if (userId && userRole !== "admin") {
      query = query.where(eq(certificates.createdBy, userId)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.certificates,
      client: row.clients!,
      creator: row.users!,
    }));
  }

  async getCertificate(id: string): Promise<CertificateWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(certificates)
      .leftJoin(clients, eq(certificates.clientId, clients.id))
      .leftJoin(users, eq(certificates.createdBy, users.id))
      .where(eq(certificates.id, id));

    if (!result) return undefined;

    return {
      ...result.certificates,
      client: result.clients!,
      creator: result.users!,
    };
  }

  async createCertificate(certData: InsertCertificate): Promise<Certificate> {
    const [cert] = await db
      .insert(certificates)
      .values(certData)
      .returning();
    return cert;
  }

  async updateCertificate(id: string, certData: Partial<InsertCertificate>): Promise<Certificate | undefined> {
    const [cert] = await db
      .update(certificates)
      .set({ ...certData, updatedAt: new Date() })
      .where(eq(certificates.id, id))
      .returning();
    return cert || undefined;
  }

  async deleteCertificate(id: string): Promise<void> {
    await db.delete(certificates).where(eq(certificates.id, id));
  }

  async filterCertificates(filters: {
    search?: string;
    clientId?: string;
    type?: string[];
    status?: string[];
    expiryFrom?: string;
    expiryTo?: string;
    userId?: string;
    userRole?: string;
  }): Promise<CertificateWithRelations[]> {
    const conditions = [];

    // Permission check: non-admin users only see their certificates
    if (filters.userId && filters.userRole !== "admin") {
      conditions.push(eq(certificates.createdBy, filters.userId));
    }

    // Search by client name or certificate type
    if (filters.search) {
      conditions.push(
        or(
          like(clients.name, `%${filters.search}%`),
          like(certificates.type, `%${filters.search}%`)
        )
      );
    }

    // Filter by client
    if (filters.clientId) {
      conditions.push(eq(certificates.clientId, filters.clientId));
    }

    // Filter by type
    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(certificates.type, filters.type));
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(certificates.status, filters.status));
    }

    // Filter by expiry date range
    if (filters.expiryFrom) {
      conditions.push(gte(certificates.expiryDate, filters.expiryFrom));
    }
    if (filters.expiryTo) {
      conditions.push(lte(certificates.expiryDate, filters.expiryTo));
    }

    let query = db
      .select()
      .from(certificates)
      .leftJoin(clients, eq(certificates.clientId, clients.id))
      .leftJoin(users, eq(certificates.createdBy, users.id))
      .orderBy(desc(certificates.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map((row) => ({
      ...row.certificates,
      client: row.clients!,
      creator: row.users!,
    }));
  }

  async getCertificateStatistics(userId?: string, userRole?: string): Promise<{
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    // Get only certificates the user is authorized to see
    let query = db.select().from(certificates);
    
    if (userId && userRole !== "admin") {
      query = query.where(eq(certificates.createdBy, userId)) as any;
    }
    
    const allCerts = await query;

    const stats = {
      total: allCerts.length,
      active: 0,
      expiringSoon: 0,
      expired: 0,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    allCerts.forEach((cert) => {
      // Count by status
      if (cert.status === "active") stats.active++;
      if (cert.status === "expiring_soon") stats.expiringSoon++;
      if (cert.status === "expired") stats.expired++;

      // Count by type
      stats.byType[cert.type] = (stats.byType[cert.type] || 0) + 1;

      // Count by status
      stats.byStatus[cert.status] = (stats.byStatus[cert.status] || 0) + 1;
    });

    return stats;
  }

  // Notification operations
  async getAllNotifications(userId: string): Promise<NotificationWithRelations[]> {
    const results = await db
      .select()
      .from(notifications)
      .leftJoin(certificates, eq(notifications.certificateId, certificates.id))
      .leftJoin(clients, eq(certificates.clientId, clients.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return results.map((row) => ({
      ...row.notifications,
      certificate: row.certificates && row.clients ? {
        ...row.certificates,
        client: row.clients,
      } : undefined,
    }));
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(notifData: InsertNotification): Promise<Notification> {
    const [notif] = await db
      .insert(notifications)
      .values(notifData)
      .returning();
    return notif;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: "true" })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: "true" })
      .where(eq(notifications.userId, userId));
  }

  async hasUnreadNotificationForCertificate(
    certificateId: string,
    userId: string,
    type: string
  ): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.certificateId, certificateId),
          eq(notifications.userId, userId),
          eq(notifications.type, type),
          eq(notifications.isRead, "false")
        )
      )
      .limit(1);
    return !!existing;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return auditLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();

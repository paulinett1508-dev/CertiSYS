import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "accountant", "viewer"]);
export const certificateStatusEnum = pgEnum("certificate_status", ["valid", "expiring_soon", "expired"]);
export const notificationTypeEnum = pgEnum("notification_type", ["expiring_soon", "expired", "renewed"]);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  certificates: many(certificates),
  notifications: many(notifications),
  clients: many(clients),
}));

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 20 }).notNull(), // CPF or CNPJ
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  creator: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  certificates: many(certificates),
}));

// Certificates table
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 255 }).notNull(), // e.g., "Federal", "Estadual", "Municipal", "FGTS", "Trabalhista"
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  issuingAuthority: varchar("issuing_authority", { length: 255 }).notNull(), // Órgão emissor
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  documentUrl: text("document_url"), // Object storage path
  status: certificateStatusEnum("status").notNull().default("valid"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  client: one(clients, {
    fields: [certificates.clientId],
    references: [clients.id],
  }),
  creator: one(users, {
    fields: [certificates.createdBy],
    references: [users.id],
  }),
  notifications: many(notifications),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  certificateId: varchar("certificate_id").references(() => certificates.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  isRead: varchar("is_read", { length: 5 }).notNull().default("false"), // Using varchar for boolean
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  certificate: one(certificates, {
    fields: [notifications.certificateId],
    references: [certificates.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateClientSchema = insertClientSchema.partial();
export const updateCertificateSchema = insertCertificateSchema.partial();

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types with relations
export type CertificateWithRelations = Certificate & {
  client: Client;
  creator: User;
};

export type NotificationWithRelations = Notification & {
  certificate?: Certificate & { client: Client };
};

export type ClientWithCreator = Client & {
  creator: User;
};

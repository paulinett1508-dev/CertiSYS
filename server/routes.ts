import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { insertClientSchema, insertCertificateSchema, insertNotificationSchema } from "@shared/schema";
import { getCertificateStatus } from "@shared/utils";
import { createAuditLog } from "./audit";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ========== Auth Routes ==========
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== User Management Routes (Admin only) ==========
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const { role } = req.body;
      if (!["admin", "accountant", "viewer"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const targetUser = await storage.getUser(req.params.id);
      const oldRole = targetUser?.role;

      const updatedUser = await storage.updateUserRole(req.params.id, role);
      
      await createAuditLog(req, "user_role_changed", "user", req.params.id, {
        oldRole,
        newRole: role,
        targetUserEmail: targetUser?.email,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ========== Client Routes ==========
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only show clients based on user role
      const clients = await storage.getAllClients(
        user?.role === "admin" ? undefined : userId
      );
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const client = await storage.getClient(req.params.id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Check access: admin can see all, others only their own
      if (user?.role !== "admin" && client.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Viewers cannot create
      if (user?.role === "viewer") {
        return res.status(403).json({ message: "Forbidden: Viewers cannot create clients" });
      }

      const validatedData = insertClientSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const client = await storage.createClient(validatedData);
      
      await createAuditLog(req, "client_created", "client", client.id, {
        clientName: client.name,
        document: client.document,
      });

      res.status(201).json(client);
    } catch (error: any) {
      console.error("Error creating client:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const client = await storage.getClient(req.params.id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Viewers cannot update
      if (user?.role === "viewer") {
        return res.status(403).json({ message: "Forbidden: Viewers cannot update clients" });
      }

      // Non-admins can only update their own
      if (user?.role !== "admin" && client.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedClient = await storage.updateClient(req.params.id, req.body);
      
      await createAuditLog(req, "client_updated", "client", req.params.id, {
        clientName: updatedClient?.name,
        updatedFields: Object.keys(req.body),
      });

      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const client = await storage.getClient(req.params.id);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Only admin or owner can delete
      if (user?.role !== "admin" && client.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await createAuditLog(req, "client_deleted", "client", req.params.id, {
        clientName: client.name,
        document: client.document,
      });

      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // ========== Certificate Routes ==========
  app.get("/api/certificates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const certificates = await storage.getAllCertificates(userId, user?.role);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.get("/api/certificates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const certificate = await storage.getCertificate(req.params.id);

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      // Check access
      if (user?.role !== "admin" && certificate.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(certificate);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });

  app.post("/api/certificates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role === "viewer") {
        return res.status(403).json({ message: "Forbidden: Viewers cannot create certificates" });
      }

      // Calculate status based on expiry date
      const status = getCertificateStatus(req.body.expiryDate);

      const validatedData = insertCertificateSchema.parse({
        ...req.body,
        createdBy: userId,
        status,
      });

      const certificate = await storage.createCertificate(validatedData);
      
      await createAuditLog(req, "certificate_created", "certificate", certificate.id, {
        type: certificate.type,
        clientId: certificate.clientId,
        expiryDate: certificate.expiryDate,
      });

      res.status(201).json(certificate);
    } catch (error: any) {
      console.error("Error creating certificate:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create certificate" });
    }
  });

  app.patch("/api/certificates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const certificate = await storage.getCertificate(req.params.id);

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      if (user?.role === "viewer") {
        return res.status(403).json({ message: "Forbidden: Viewers cannot update certificates" });
      }

      if (user?.role !== "admin" && certificate.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Recalculate status if expiry date changed
      const updateData = { ...req.body };
      if (updateData.expiryDate) {
        updateData.status = getCertificateStatus(updateData.expiryDate);
      }

      const updatedCertificate = await storage.updateCertificate(req.params.id, updateData);
      
      await createAuditLog(req, "certificate_updated", "certificate", req.params.id, {
        type: updatedCertificate?.type,
        updatedFields: Object.keys(req.body),
      });

      res.json(updatedCertificate);
    } catch (error) {
      console.error("Error updating certificate:", error);
      res.status(500).json({ message: "Failed to update certificate" });
    }
  });

  app.delete("/api/certificates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const certificate = await storage.getCertificate(req.params.id);

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      if (user?.role !== "admin" && certificate.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await createAuditLog(req, "certificate_deleted", "certificate", req.params.id, {
        type: certificate.type,
        clientId: certificate.clientId,
      });

      await storage.deleteCertificate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting certificate:", error);
      res.status(500).json({ message: "Failed to delete certificate" });
    }
  });

  // ========== Notification Routes ==========
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getAllNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notification = await storage.getNotification(req.params.id);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.markNotificationAsRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // ========== Object Storage Routes ==========
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/certificates/:id/document", isAuthenticated, async (req: any, res) => {
    if (!req.body.documentURL) {
      return res.status(400).json({ error: "documentURL is required" });
    }

    const userId = req.user?.claims?.sub;
    const user = await storage.getUser(userId);
    const certificate = await storage.getCertificate(req.params.id);

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (user?.role !== "admin" && certificate.createdBy !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      await storage.updateCertificate(req.params.id, { documentUrl: objectPath });

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting certificate document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

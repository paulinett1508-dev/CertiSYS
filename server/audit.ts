import { storage } from "./storage";
import type { Request } from "express";
import type { InsertAuditLog } from "@shared/schema";

export async function createAuditLog(
  req: Request,
  action: InsertAuditLog["action"],
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
) {
  try {
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      console.warn("[audit] No user ID found, skipping audit log");
      return;
    }

    const ipAddress = 
      (req.headers["x-forwarded-for"] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;

    await storage.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      details: details || null,
      ipAddress,
    });

    console.log(`[audit] ${action} by user ${userId} on ${entityType} ${entityId || ''}`);
  } catch (error) {
    console.error("[audit] Failed to create audit log:", error);
  }
}

import { storage } from "./storage";
import { getCertificateStatus } from "@shared/utils";

export class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    console.log("[scheduler] Starting notification scheduler...");
    
    this.checkAndCreateNotifications();
    
    this.intervalId = setInterval(() => {
      this.checkAndCreateNotifications();
    }, 60 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[scheduler] Notification scheduler stopped");
    }
  }

  private async checkAndCreateNotifications() {
    try {
      console.log("[scheduler] Checking certificates for expiry notifications...");
      
      const certificates = await storage.getAllCertificates();
      
      for (const cert of certificates) {
        if (!cert.client) {
          console.warn(`[scheduler] Certificate ${cert.id} missing client relation, skipping`);
          continue;
        }

        if (!cert.createdBy) {
          console.warn(`[scheduler] Certificate ${cert.id} missing createdBy, skipping`);
          continue;
        }

        const status = getCertificateStatus(cert.expiryDate);
        
        if (status === "expiring_soon" || status === "expired") {
          const notificationType = status === "expiring_soon" ? "expiring_soon" : "expired";
          
          const certOwner = cert.createdBy;
          
          const alreadyNotified = await storage.hasUnreadNotificationForCertificate(
            cert.id,
            certOwner,
            notificationType
          );

          if (!alreadyNotified) {
            let message = "";
            if (status === "expiring_soon") {
              message = `A certidão ${cert.type} do cliente ${cert.client.name} vence em breve (${cert.expiryDate})`;
            } else {
              message = `A certidão ${cert.type} do cliente ${cert.client.name} está vencida desde ${cert.expiryDate}`;
            }

            await storage.createNotification({
              userId: certOwner,
              certificateId: cert.id,
              type: notificationType,
              message,
              isRead: "false",
            });

            console.log(`[scheduler] Created ${notificationType} notification for certificate ${cert.id}`);
          }
        }
      }
      
      console.log("[scheduler] Notification check completed");
    } catch (error) {
      console.error("[scheduler] Error checking certificates:", error);
    }
  }
}

export const notificationScheduler = new NotificationScheduler();

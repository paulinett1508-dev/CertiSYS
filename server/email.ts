import sgMail from '@sendgrid/mail';

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private initialized = false;
  private fromEmail = 'noreply@certidoes.app'; // Você precisará configurar um domínio verificado no SendGrid

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.initialized = true;
      console.log('[email] SendGrid initialized');
    } else {
      console.warn('[email] SENDGRID_API_KEY not found, email notifications disabled');
    }
  }

  async sendNotification(notification: EmailNotification): Promise<boolean> {
    if (!this.initialized) {
      console.warn('[email] SendGrid not initialized, skipping email');
      return false;
    }

    try {
      await sgMail.send({
        to: notification.to,
        from: this.fromEmail,
        subject: notification.subject,
        html: notification.html,
      });
      console.log(`[email] Sent notification to ${notification.to}`);
      return true;
    } catch (error) {
      console.error('[email] Failed to send email:', error);
      return false;
    }
  }

  async sendCertificateExpiringNotification(
    userEmail: string,
    clientName: string,
    certificateType: string,
    expiryDate: string
  ): Promise<boolean> {
    const subject = `Alerta: Certidão próxima do vencimento - ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #92400e; margin: 0;">Atenção: Certidão próxima do vencimento</h2>
        </div>
        <p>Olá,</p>
        <p>A certidão <strong>${certificateType}</strong> do cliente <strong>${clientName}</strong> está próxima do vencimento.</p>
        <p><strong>Data de vencimento:</strong> ${expiryDate}</p>
        <p>Por favor, acesse o sistema para verificar e tomar as ações necessárias.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Esta é uma mensagem automática do Sistema de Gestão de Certidões.
        </p>
      </div>
    `;

    return this.sendNotification({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendCertificateExpiredNotification(
    userEmail: string,
    clientName: string,
    certificateType: string,
    expiryDate: string
  ): Promise<boolean> {
    const subject = `Urgente: Certidão vencida - ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0;">Atenção: Certidão vencida</h2>
        </div>
        <p>Olá,</p>
        <p>A certidão <strong>${certificateType}</strong> do cliente <strong>${clientName}</strong> está <strong>vencida</strong>.</p>
        <p><strong>Data de vencimento:</strong> ${expiryDate}</p>
        <p><strong style="color: #ef4444;">Ação urgente necessária!</strong> Por favor, acesse o sistema para renovar esta certidão o mais rápido possível.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Esta é uma mensagem automática do Sistema de Gestão de Certidões.
        </p>
      </div>
    `;

    return this.sendNotification({
      to: userEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();

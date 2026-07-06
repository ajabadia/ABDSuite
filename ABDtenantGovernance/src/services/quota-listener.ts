'use server';

import { createConsumer, SystemEventType } from '@ajabadia/satellite-sdk/event-bus';
import { sendEmail } from '@/services/email/resend-email-service';

const consumer = createConsumer({ source: 'abdsuite-governance', pollIntervalMs: 30000 });

consumer.on(SystemEventType.TENANT_QUOTA_EXCEEDED, async (event) => {
  const data = event.data as {
    tenantId: string;
    usedBytes: number;
    maxQuotaBytes: number;
    percentage: number;
    threshold: number;
  };

  const subject = `Alerta de cuota de almacenamiento — Tenant ${data.tenantId}`;
  const usedGb = (data.usedBytes / 1073741824).toFixed(2);
  const maxGb = (data.maxQuotaBytes / 1073741824).toFixed(2);
  const html = `
    <h2>Alerta de cuota de almacenamiento</h2>
    <p><strong>Tenant:</strong> ${data.tenantId}</p>
    <p><strong>Uso actual:</strong> ${usedGb} GB / ${maxGb} GB (${data.percentage}%)</p>
    <p><strong>Umbral superado:</strong> ${data.threshold}%</p>
    <p>Se recomienda revisar el plan de almacenamiento o liberar espacio.</p>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@resend.dev>';
  try {
    await sendEmail({ to: fromEmail, subject, html });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[QUOTA_LISTENER] Email sent for tenant ${data.tenantId} (${data.percentage}%)`);
    }
  } catch (err) {
    console.error(`[QUOTA_LISTENER] Failed to send email for tenant ${data.tenantId}:`, err);
  }
});

export async function processQuotaEvents(): Promise<void> {
  await consumer.processPending();
}

import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const resendConfigured = Boolean(env.resendApiKey);
const resend = resendConfigured ? new Resend(env.resendApiKey) : null;

const STATUS_LABELS = {
  open: "Abierto",
  in_progress: "En proceso",
  resolved: "Resuelto",
};

// Falla silenciosamente si Resend no está configurado: nunca debe romper el
// flujo de cambio de estado de un incidente.
export async function sendStatusChangeEmail({ to, incidentTitle, newStatus }) {
  if (!resendConfigured || !to) {
    logger.warn("RESEND_API_KEY no configurada o falta destinatario, no se envía email");
    return;
  }

  try {
    await resend.emails.send({
      from: env.emailFrom,
      to,
      subject: `UrbanLog — Tu reporte cambió de estado`,
      html: `
        <p>Hola,</p>
        <p>Tu reporte <strong>"${incidentTitle}"</strong> ahora está en estado:</p>
        <p style="font-size:18px;font-weight:bold;">${STATUS_LABELS[newStatus] || newStatus}</p>
        <p>Gracias por ayudar a mejorar la ciudad.</p>
        <p style="color:#94a3b8;font-size:12px;">— UrbanLog</p>
      `,
    });
  } catch (err) {
    logger.error("Error enviando email de cambio de estado:", err.message);
  }
}

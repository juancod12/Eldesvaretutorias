const fs = require('fs');
const { Resend } = require('resend');
const { buildEmailHtml, buildEmailSubject } = require('../templates/emailTemplate');
const { MAX_TOTAL_SIZE } = require('../config/limits');

let resend = null;

function getResend() {
  if (resend) return resend;
  resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function sendRequestEmail(request, files) {
  const { requestId } = request;
  const businessEmail = process.env.BUSINESS_EMAIL;
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!businessEmail || !process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY o BUSINESS_EMAIL no configurados. Saltando envío.');
    return { success: false, reason: 'resend_not_configured' };
  }

  const html = buildEmailHtml(request, process.env.SITE_URL);
  const subject = buildEmailSubject(requestId);

  // Adjuntar archivos al correo. El controlador ya valida el total contra
  // MAX_TOTAL_SIZE antes de llegar aquí; esto es una segunda barrera de seguridad.
  const attachments = [];
  let totalSize = 0;

  for (const file of (files || [])) {
    if (totalSize + file.size <= MAX_TOTAL_SIZE) {
      attachments.push({
        filename: file.originalname,
        content: fs.readFileSync(file.path),
      });
      totalSize += file.size;
    } else {
      console.warn(`[Email] Archivo omitido por tamaño: ${file.originalname}`);
    }
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'El Desvare'} <${fromAddress}>`,
      to: businessEmail,
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error('[Email] Error al enviar:', JSON.stringify(error));
      return { success: false, reason: error.message || JSON.stringify(error) };
    }

    console.log(`[Email] Enviado correctamente. MessageId: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[Email] Error al enviar:', err.message);
    return { success: false, reason: err.message };
  }
}

module.exports = { sendRequestEmail };

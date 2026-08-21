const nodemailer = require('nodemailer');
const { buildEmailHtml, buildEmailSubject } = require('../templates/emailTemplate');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

async function sendRequestEmail(request, files) {
  const { requestId, clientEmail } = request;
  const businessEmail = process.env.BUSINESS_EMAIL;

  if (!businessEmail || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('[Email] Credenciales SMTP no configuradas. Saltando envío.');
    return { success: false, reason: 'smtp_not_configured' };
  }

  const html = buildEmailHtml(request, process.env.SITE_URL);
  const subject = buildEmailSubject(requestId);

  // Adjuntar archivos al correo (hasta 15MB total)
  const attachments = [];
  let totalSize = 0;
  const sizeLimit = 15 * 1024 * 1024;

  for (const file of (files || [])) {
    if (totalSize + file.size <= sizeLimit) {
      attachments.push({
        filename: file.originalname,
        path: file.path,
      });
      totalSize += file.size;
    } else {
      console.warn(`[Email] Archivo omitido por tamaño: ${file.originalname}`);
    }
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'El Desvare'}" <${process.env.SMTP_USER}>`,
    to: businessEmail,
    subject,
    html,
    attachments,
  };

  try {
    const t = getTransporter();
    const info = await t.sendMail(mailOptions);
    console.log(`[Email] Enviado correctamente. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Error al enviar:', err.message);
    return { success: false, reason: err.message };
  }
}

module.exports = { sendRequestEmail };

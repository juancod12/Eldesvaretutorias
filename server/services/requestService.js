const { generateRequestId } = require('../utils/idGenerator');
const { sendRequestEmail } = require('./emailService');
const { sendWhatsAppNotification } = require('./whatsappService');
const { sanitizeRequestBody } = require('../utils/validators');

async function processRequest(rawBody, files) {
  const data = sanitizeRequestBody(rawBody);
  const requestId = generateRequestId();

  const request = {
    requestId,
    ...data,
    filesCount: files ? files.length : 0,
    submittedAt: new Date().toISOString(),
  };

  console.log(`[Request] Nueva solicitud: ${requestId} — Servicio: ${data.service} — Cliente: ${data.clientName}`);

  // Enviar notificaciones en paralelo; ninguna debe bloquear la respuesta al cliente
  const [emailResult, whatsappResult] = await Promise.allSettled([
    sendRequestEmail(request, files),
    sendWhatsAppNotification(request),
  ]);

  const emailSent = emailResult.status === 'fulfilled' && emailResult.value?.success === true;
  const whatsappSent = whatsappResult.status === 'fulfilled' && whatsappResult.value?.success === true;

  if (!emailSent) {
    console.warn(`[Request] ${requestId} — Correo NO enviado:`, emailResult.value?.reason || emailResult.reason?.message);
  }

  if (!whatsappSent) {
    console.warn(`[Request] ${requestId} — WhatsApp NO enviado:`, whatsappResult.value?.reason || whatsappResult.reason?.message);
  }

  return {
    requestId,
    submittedAt: request.submittedAt,
    emailSent,
    whatsappSent,
  };
}

module.exports = { processRequest };

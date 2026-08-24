const fs = require('fs');
const { generateRequestId } = require('../utils/idGenerator');
const { sendRequestEmail } = require('./emailService');
const { sendWhatsAppNotification } = require('./whatsappService');
const { sanitizeRequestBody } = require('../utils/validators');

// El correo es el único sistema de registro: no se guarda ningún dato del
// cliente en el servidor. Los archivos se borran del disco apenas termina
// el intento de envío, sin importar si tuvo éxito o no.
function cleanUpFiles(files) {
  for (const file of (files || [])) {
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (err) {
      console.warn('[Request] No se pudo eliminar archivo temporal:', file.path);
    }
  }
}

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

  const [emailResult, whatsappResult] = await Promise.allSettled([
    sendRequestEmail(request, files),
    sendWhatsAppNotification(request),
  ]);

  // Los archivos ya no se necesitan en disco pase lo que pase con el envío.
  cleanUpFiles(files);

  const emailSent = emailResult.status === 'fulfilled' && emailResult.value?.success === true;
  const whatsappSent = whatsappResult.status === 'fulfilled' && whatsappResult.value?.success === true;

  if (!whatsappSent) {
    console.warn(`[Request] ${requestId} — WhatsApp NO enviado:`, whatsappResult.value?.reason || whatsappResult.reason?.message);
  }

  if (!emailSent) {
    // El correo es el único canal real de entrega de la solicitud: si falla,
    // no hay ningún respaldo (a propósito, no se guardan datos del cliente).
    console.error(`[Request] ${requestId} — Correo NO enviado:`, emailResult.value?.reason || emailResult.reason?.message);
    throw new Error('EMAIL_DELIVERY_FAILED');
  }

  return {
    requestId,
    submittedAt: request.submittedAt,
    emailSent,
    whatsappSent,
  };
}

module.exports = { processRequest };

const axios = require('axios');
const { buildWhatsAppMessage, buildTemplateComponents } = require('../templates/whatsappTemplate');

const MOCK_MODE = () => process.env.WHATSAPP_MOCK_MODE === 'true';

async function sendWhatsAppNotification(request) {
  const message = buildWhatsAppMessage(request);

  if (MOCK_MODE()) {
    console.log('\n[WhatsApp MOCK] ---- Mensaje que se enviaría ----');
    console.log(message);
    console.log('[WhatsApp MOCK] ---- Fin del mensaje ----\n');
    return { success: true, mock: true };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const destination = process.env.WHATSAPP_BUSINESS_NUMBER;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!token || !phoneNumberId || !destination) {
    console.warn('[WhatsApp] Credenciales no configuradas. Saltando envío.');
    return { success: false, reason: 'credentials_not_configured' };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Intentar con plantilla aprobada (preferido para mensajes iniciados por negocio)
  if (templateName) {
    return await sendWithTemplate(url, headers, destination, request, templateName);
  }

  // Sin plantilla: solo funciona dentro de ventana de 24h de conversación activa
  return await sendTextMessage(url, headers, destination, message);
}

async function sendWithTemplate(url, headers, destination, request, templateName) {
  const components = buildTemplateComponents(request);

  const payload = {
    messaging_product: 'whatsapp',
    to: destination,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es' },
      components,
    },
  };

  try {
    const res = await axios.post(url, payload, { headers, timeout: 10000 });
    console.log(`[WhatsApp] Plantilla enviada. MessageId: ${res.data?.messages?.[0]?.id}`);
    return { success: true, messageId: res.data?.messages?.[0]?.id, type: 'template' };
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error('[WhatsApp] Error con plantilla:', JSON.stringify(detail));

    // Intentar mensaje de texto como fallback
    console.log('[WhatsApp] Intentando mensaje de texto como alternativa...');
    const message = buildWhatsAppMessage(request);
    return await sendTextMessage(url, headers, destination, message);
  }
}

async function sendTextMessage(url, headers, destination, message) {
  const payload = {
    messaging_product: 'whatsapp',
    to: destination,
    type: 'text',
    text: { body: message },
  };

  try {
    const res = await axios.post(url, payload, { headers, timeout: 10000 });
    console.log(`[WhatsApp] Texto enviado. MessageId: ${res.data?.messages?.[0]?.id}`);
    return { success: true, messageId: res.data?.messages?.[0]?.id, type: 'text' };
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error('[WhatsApp] Error enviando texto:', JSON.stringify(detail));
    return { success: false, reason: JSON.stringify(detail) };
  }
}

module.exports = { sendWhatsAppNotification };

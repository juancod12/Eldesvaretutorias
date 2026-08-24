const SERVICE_LABELS = {
  academico: 'Trabajo académico',
  proyecto: 'Proyecto',
  asesoria: 'Asesoría',
  taller: 'Taller / Ejercicios',
  presentacion: 'Presentación',
  investigacion: 'Investigación',
  programacion: 'Programación / Desarrollo',
  diseno: 'Diseño',
  otro: 'Otro',
};

const URGENCY_LABELS = {
  normal: 'Normal',
  prioritario: 'Prioritario',
  urgente: '🔴 URGENTE',
};

function buildWhatsAppMessage(request) {
  const {
    requestId, service, career, subject, topic, description,
    deliveryDate, deliveryTime, urgency, budget,
    clientName, clientWhatsapp, clientEmail, clientCity,
    filesCount,
  } = request;

  const serviceLabel = SERVICE_LABELS[service] || service;
  const urgencyLabel = URGENCY_LABELS[urgency] || urgency || 'Normal';
  const submittedAt = new Date().toLocaleString('es-CO', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bogota',
  });

  let message = `*🎓 NUEVA SOLICITUD DE COTIZACIÓN*\n`;
  message += `*EL DESVARE — ASESORÍAS Y TRABAJOS*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📋 *ID:* ${requestId}\n`;
  message += `🕐 *Recibida:* ${submittedAt}\n\n`;

  message += `👤 *CLIENTE*\n`;
  message += `Nombre: ${clientName}\n`;
  message += `WhatsApp: ${clientWhatsapp}\n`;
  message += `Correo: ${clientEmail}\n`;
  if (clientCity) message += `Ciudad: ${clientCity}\n`;
  message += `\n`;

  message += `📚 *SERVICIO*\n`;
  message += `Tipo: ${serviceLabel}\n`;
  if (career) message += `Carrera: ${career}\n`;
  if (subject) message += `Materia: ${subject}\n`;
  if (topic) message += `Tema: ${topic}\n`;
  message += `\n`;

  message += `📅 *ENTREGA*\n`;
  message += `Fecha: ${deliveryDate || 'No especificada'}\n`;
  if (deliveryTime) message += `Hora: ${deliveryTime}\n`;
  message += `Urgencia: ${urgencyLabel}\n\n`;

  message += `💰 *PRESUPUESTO*\n`;
  message += `${budget || 'No especificado'}\n\n`;

  message += `📝 *DESCRIPCIÓN*\n`;
  const shortDesc = description && description.length > 200
    ? description.slice(0, 200) + '...'
    : description || '';
  message += `${shortDesc}\n\n`;

  if (filesCount && filesCount > 0) {
    message += `📎 *ARCHIVOS*\n`;
    message += `${filesCount} archivo(s) adjunto(s).\n`;
    message += `Revisa el correo para acceder a ellos.\n\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Mensaje automático de El Desvare_`;

  return message;
}

// Variables para la plantilla aprobada de Meta
// La plantilla debe ser creada en Meta Business con estas variables
function buildTemplateComponents(request) {
  const { requestId, clientName, service, budget } = request;
  const serviceLabel = SERVICE_LABELS[service] || service;

  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: requestId },
        { type: 'text', text: clientName },
        { type: 'text', text: serviceLabel },
        { type: 'text', text: budget || 'No especificado' },
      ],
    },
  ];
}

module.exports = { buildWhatsAppMessage, buildTemplateComponents, SERVICE_LABELS };

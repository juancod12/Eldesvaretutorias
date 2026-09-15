const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.zip',
]);

const VALID_SERVICES = new Set([
  'academico', 'proyecto', 'asesoria', 'taller',
  'presentacion', 'investigacion', 'programacion', 'diseno', 'otro',
]);

// Únicos premios posibles de la ruleta de descuento (paso final del formulario).
const VALID_DISCOUNTS = new Set([5, 10, 15, 20, 25, 30, 35]);

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validateWhatsApp(number) {
  const cleaned = String(number).replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}

function validateFileExtension(filename) {
  const ext = require('path').extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function validateFileMime(mimetype) {
  return ALLOWED_MIME_TYPES.has(mimetype);
}

function validateRequestBody(body) {
  const errors = [];

  if (!body.service || !VALID_SERVICES.has(body.service)) {
    errors.push('Tipo de servicio inválido.');
  }

  if (!body.description || String(body.description).trim().length < 10) {
    errors.push('La descripción es obligatoria (mínimo 10 caracteres).');
  }

  if (!body.deliveryDate) {
    errors.push('La fecha de entrega es obligatoria.');
  }

  if (!body.clientName || String(body.clientName).trim().length < 2) {
    errors.push('El nombre completo es obligatorio.');
  }

  if (!body.clientEmail || !validateEmail(body.clientEmail)) {
    errors.push('El correo electrónico no es válido.');
  }

  if (!body.clientWhatsapp || !validateWhatsApp(body.clientWhatsapp)) {
    errors.push('El número de WhatsApp no es válido.');
  }

  // Honeypot anti-spam
  if (body.website && String(body.website).trim().length > 0) {
    errors.push('Solicitud rechazada.');
  }

  return errors;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 2000);
}

function sanitizeDiscount(value) {
  const n = parseInt(value, 10);
  return VALID_DISCOUNTS.has(n) ? n : '';
}

function sanitizeRequestBody(body) {
  return {
    service: sanitizeString(body.service),
    career: sanitizeString(body.career),
    subject: sanitizeString(body.subject),
    topic: sanitizeString(body.topic),
    description: sanitizeString(body.description),
    deliveryDate: sanitizeString(body.deliveryDate),
    deliveryTime: sanitizeString(body.deliveryTime),
    urgency: sanitizeString(body.urgency),
    budget: sanitizeString(body.budget),
    // Dynamic fields
    language: sanitizeString(body.language),
    technology: sanitizeString(body.technology),
    projectType: sanitizeString(body.projectType),
    technicalDescription: sanitizeString(body.technicalDescription),
    level: sanitizeString(body.level),
    reinforce: sanitizeString(body.reinforce),
    modality: sanitizeString(body.modality),
    designType: sanitizeString(body.designType),
    format: sanitizeString(body.format),
    dimensions: sanitizeString(body.dimensions),
    researchType: sanitizeString(body.researchType),
    requestedFormat: sanitizeString(body.requestedFormat),
    numPages: sanitizeString(body.numPages),
    numSlides: sanitizeString(body.numSlides),
    // Contact
    clientName: sanitizeString(body.clientName),
    clientEmail: sanitizeString(body.clientEmail),
    clientWhatsapp: sanitizeString(body.clientWhatsapp),
    clientCity: sanitizeString(body.clientCity),
    // Ruleta de descuento
    discountPercent: sanitizeDiscount(body.discountPercent),
  };
}

module.exports = {
  validateRequestBody,
  validateEmail,
  validateWhatsApp,
  validateFileExtension,
  validateFileMime,
  sanitizeRequestBody,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};

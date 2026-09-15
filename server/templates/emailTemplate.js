const { SERVICE_LABELS } = require('./whatsappTemplate');

const URGENCY_LABELS = {
  normal: '<span style="color:#10B981;">Normal</span>',
  prioritario: '<span style="color:#F59E0B;font-weight:600;">Prioritario</span>',
  urgente: '<span style="color:#EF4444;font-weight:700;">🔴 URGENTE</span>',
};

function row(label, value) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:8px 16px;color:#6B7280;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:8px 16px;color:#0B1F33;font-size:14px;vertical-align:top;font-weight:500;">${value}</td>
    </tr>`;
}

function section(title, rows) {
  if (!rows.trim()) return '';
  return `
    <div style="margin-bottom:24px;">
      <div style="background:#0B1F33;color:#F7B719;padding:10px 16px;border-radius:8px 8px 0 0;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
        ${title}
      </div>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;">
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function buildEmailHtml(request, siteUrl) {
  const {
    requestId, service, career, subject, topic, description,
    deliveryDate, deliveryTime, urgency, budget,
    language, technology, projectType, technicalDescription,
    level, reinforce, modality,
    designType, format, dimensions,
    researchType, requestedFormat, numPages,
    numSlides,
    clientName, clientEmail, clientWhatsapp, clientCity,
    filesCount, discountPercent,
  } = request;

  const serviceLabel = SERVICE_LABELS[service] || service;
  const urgencyHtml = URGENCY_LABELS[urgency] || urgency || 'Normal';
  const submittedAt = new Date().toLocaleString('es-CO', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota',
  });

  let dynamicRows = '';
  if (service === 'programacion') {
    dynamicRows = row('Lenguaje', language) + row('Tecnología', technology) +
      row('Tipo de proyecto', projectType) + row('Descripción técnica', technicalDescription);
  } else if (service === 'asesoria') {
    dynamicRows = row('Nivel', level) + row('Qué reforzar', reinforce) + row('Modalidad', modality);
  } else if (service === 'diseno') {
    dynamicRows = row('Tipo de diseño', designType) + row('Formato', format) + row('Dimensiones', dimensions);
  } else if (service === 'investigacion') {
    dynamicRows = row('Tipo', researchType) + row('Formato solicitado', requestedFormat) + row('Páginas aprox.', numPages);
  } else if (service === 'presentacion') {
    dynamicRows = row('N.° de diapositivas', numSlides) + row('Formato', format);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nueva solicitud — El Desvare</title>
</head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#F7F8FA;border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#0B1F33;padding:32px 24px;text-align:center;">
      <div style="font-size:28px;font-weight:800;color:#F7B719;letter-spacing:1px;">EL DESVARE</div>
      <div style="color:#94a3b8;font-size:13px;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Asesorías y Trabajos</div>
      <div style="margin-top:20px;background:rgba(247,183,25,0.15);border:1px solid rgba(247,183,25,0.3);border-radius:8px;display:inline-block;padding:8px 24px;">
        <span style="color:#F7B719;font-size:20px;font-weight:700;letter-spacing:2px;">${requestId}</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px 16px;">

      <p style="color:#6B7280;font-size:14px;margin:0 0 24px;text-align:center;">
        Solicitud recibida el <strong style="color:#0B1F33;">${submittedAt}</strong>
      </p>

      ${discountPercent ? `
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;background:#ECFDF5;border:1px solid #10B981;color:#059669;font-weight:800;font-size:15px;padding:10px 20px;border-radius:50px;">
          🎯 Descuento de la ruleta: ${discountPercent}% OFF
        </span>
      </div>` : ''}

      ${section('Cliente',
        row('Nombre', clientName) +
        row('Correo', `<a href="mailto:${clientEmail}" style="color:#0B1F33;">${clientEmail}</a>`) +
        row('WhatsApp', `<a href="https://wa.me/${clientWhatsapp.replace(/\D/g,'')}" style="color:#0B1F33;">${clientWhatsapp}</a>`) +
        row('Ciudad', clientCity)
      )}

      ${section('Servicio solicitado',
        row('Tipo', serviceLabel) +
        row('Carrera', career) +
        row('Materia', subject) +
        row('Tema', topic) +
        dynamicRows
      )}

      ${description ? `
      <div style="margin-bottom:24px;">
        <div style="background:#0B1F33;color:#F7B719;padding:10px 16px;border-radius:8px 8px 0 0;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Descripción</div>
        <div style="background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px;padding:16px;color:#0B1F33;font-size:14px;line-height:1.6;white-space:pre-wrap;">${description}</div>
      </div>` : ''}

      ${section('Entrega y urgencia',
        row('Fecha de entrega', deliveryDate) +
        row('Hora de entrega', deliveryTime) +
        row('Urgencia', urgencyHtml) +
        row('Presupuesto', budget)
      )}

      ${filesCount > 0 ? section('Archivos adjuntos',
        row('Cantidad', `${filesCount} archivo(s) adjunto(s) al correo`)
      ) : ''}

      <!-- CTA WhatsApp -->
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="https://wa.me/${clientWhatsapp.replace(/\D/g,'')}"
           style="display:inline-block;background:#25D366;color:#fff;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;text-decoration:none;">
          💬 Contactar por WhatsApp
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#0B1F33;padding:20px 24px;text-align:center;">
      <div style="color:#F7B719;font-size:13px;font-weight:700;">EL DESVARE</div>
      <div style="color:#64748b;font-size:12px;margin-top:4px;">Asesorías y Trabajos — Correo automático</div>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailSubject(requestId) {
  return `Nueva solicitud de cotización — EL DESVARE — ${requestId}`;
}

module.exports = { buildEmailHtml, buildEmailSubject };

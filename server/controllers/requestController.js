const { validateRequestBody } = require('../utils/validators');
const { processRequest } = require('../services/requestService');
const { MAX_TOTAL_SIZE } = require('../config/limits');
const path = require('path');
const fs = require('fs');

async function createRequest(req, res) {
  try {
    // Validar cuerpo
    const errors = validateRequestBody(req.body);
    if (errors.length > 0) {
      // Limpiar archivos subidos si la validación falla
      cleanUpFiles(req.files);
      return res.status(400).json({ success: false, errors });
    }

    // El correo es el único canal de entrega: si el total de adjuntos supera
    // lo que Gmail acepta, se rechaza aquí en vez de enviar un correo incompleto.
    const totalSize = (req.files || []).reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      cleanUpFiles(req.files);
      return res.status(400).json({
        success: false,
        errors: [`El conjunto de archivos supera el máximo permitido para enviarlos por correo (${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB en total). Reduce el tamaño o la cantidad de archivos e intenta de nuevo.`],
      });
    }

    const result = await processRequest(req.body, req.files);

    return res.status(200).json({
      success: true,
      requestId: result.requestId,
      submittedAt: result.submittedAt,
      notifications: {
        emailSent: result.emailSent,
        whatsappSent: result.whatsappSent,
      },
    });
  } catch (err) {
    cleanUpFiles(req.files);

    if (err.message === 'EMAIL_DELIVERY_FAILED') {
      return res.status(502).json({
        success: false,
        errors: ['No pudimos enviar tu solicitud por correo. Intenta de nuevo en unos minutos o escríbenos directo por WhatsApp.'],
      });
    }

    console.error('[Controller] Error inesperado:', err.message);
    return res.status(500).json({
      success: false,
      errors: ['Ocurrió un error al procesar la solicitud. Intenta de nuevo.'],
    });
  }
}

function cleanUpFiles(files) {
  if (!Array.isArray(files)) return;
  for (const file of files) {
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (e) {
      console.warn('[Controller] No se pudo eliminar archivo temporal:', file.path);
    }
  }
}

module.exports = { createRequest };

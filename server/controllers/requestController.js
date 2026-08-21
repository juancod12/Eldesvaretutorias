const { validateRequestBody } = require('../utils/validators');
const { processRequest } = require('../services/requestService');
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
    console.error('[Controller] Error inesperado:', err.message);
    cleanUpFiles(req.files);
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

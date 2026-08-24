const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validateFileExtension, validateFileMime } = require('../utils/validators');
const { createRequest } = require('../controllers/requestController');
const { MAX_FILE_SIZE, MAX_FILES } = require('../config/limits');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // Nombre seguro: uuid + extensión original (sin path traversal)
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeFilename = `${uuidv4()}${ext}`;
    cb(null, safeFilename);
  },
});

function fileFilter(req, file, cb) {
  const extOk = validateFileExtension(file.originalname);
  const mimeOk = validateFileMime(file.mimetype);

  if (!extOk || !mimeOk) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.originalname}`), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter,
});

router.post('/', upload.array('files', MAX_FILES), createRequest);

// Manejo de errores de Multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      errors: [`El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB).`],
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      errors: [`Se permite un máximo de ${MAX_FILES} archivos.`],
    });
  }
  if (err.message && err.message.startsWith('Tipo de archivo')) {
    return res.status(400).json({ success: false, errors: [err.message] });
  }
  next(err);
});

module.exports = router;

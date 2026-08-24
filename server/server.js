require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const requestRoutes = require('./routes/requestRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Necesario en Render/Railway/Nginx: sin esto, express-rate-limit y req.ip
// ven la IP del proxy en lugar de la del visitante real.
app.set('trust proxy', 1);

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Crear directorio de datos si no existe
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ---- Seguridad ----
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { success: false, errors: ['Demasiadas peticiones. Intenta en unos minutos.'] },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para el endpoint de solicitudes
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { success: false, errors: ['Has enviado demasiadas solicitudes. Espera un momento antes de intentar de nuevo.'] },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

app.use(generalLimiter);

// ---- Parsers ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ---- Archivos estáticos ----
app.use(express.static(path.join(__dirname, '../public'), {
  index: 'index.html',
  maxAge: '1h',
}));

// ---- Rutas API ----
app.use('/api/requests', requestLimiter, requestRoutes);

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'El Desvare',
    timestamp: new Date().toISOString(),
    whatsappMock: process.env.WHATSAPP_MOCK_MODE === 'true',
  });
});

// ---- Ruta fallback (SPA) ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ---- Manejo global de errores ----
app.use((err, req, res, next) => {
  console.error('[Server] Error no manejado:', err.message);
  res.status(500).json({
    success: false,
    errors: ['Error interno del servidor.'],
  });
});

app.listen(PORT, () => {
  console.log(`\n🎓 El Desvare — Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📧 Correo de negocio: ${process.env.BUSINESS_EMAIL || '(no configurado)'}`);
  console.log(`📱 WhatsApp modo mock: ${process.env.WHATSAPP_MOCK_MODE === 'true' ? 'ACTIVADO' : 'DESACTIVADO'}`);
  console.log(`\nPresiona Ctrl+C para detener.\n`);
});

module.exports = app;

// Límites de carga de archivos.
//
// El correo (Gmail SMTP) es el único canal de entrega: no hay base de datos
// ni almacenamiento externo. Gmail rechaza correos de más de ~25MB ya
// codificados, y la codificación base64 de los adjuntos añade ~33% de peso.
// Por eso el total combinado se limita a 18MB en crudo (18MB * 1.33 ≈ 24MB,
// dentro del margen seguro de Gmail).
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 18 * 1024 * 1024;
const MAX_TOTAL_SIZE = parseInt(process.env.UPLOAD_MAX_TOTAL_SIZE, 10) || 18 * 1024 * 1024;
const MAX_FILES = 5;

module.exports = { MAX_FILE_SIZE, MAX_TOTAL_SIZE, MAX_FILES };

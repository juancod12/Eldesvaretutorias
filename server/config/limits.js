// Límites de carga de archivos.
//
// El correo (vía Resend) es el único canal de entrega: no hay base de datos
// ni almacenamiento externo. Resend acepta hasta 40MB por solicitud, y el
// correo llega a la bandeja del negocio en Gmail, que rechaza mensajes de
// más de ~25MB ya codificados. La codificación base64 de los adjuntos añade
// ~33% de peso, así que el total combinado se limita a 18MB en crudo
// (18MB * 1.33 ≈ 24MB, dentro del margen seguro de ambos límites).
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 18 * 1024 * 1024;
const MAX_TOTAL_SIZE = parseInt(process.env.UPLOAD_MAX_TOTAL_SIZE, 10) || 18 * 1024 * 1024;
const MAX_FILES = 5;

module.exports = { MAX_FILE_SIZE, MAX_TOTAL_SIZE, MAX_FILES };

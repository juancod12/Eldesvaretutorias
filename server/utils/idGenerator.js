const fs = require('fs');
const path = require('path');

const counterFile = path.join(__dirname, '../../data/counter.json');

function generateRequestId() {
  const year = new Date().getFullYear();
  let counter = 1;

  try {
    if (fs.existsSync(counterFile)) {
      const raw = fs.readFileSync(counterFile, 'utf8');
      const data = JSON.parse(raw);
      counter = (parseInt(data.counter, 10) || 0) + 1;
    }

    const dir = path.dirname(counterFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(counterFile, JSON.stringify({ counter, updatedAt: new Date().toISOString() }));
  } catch (err) {
    // Si falla el archivo, usar timestamp para garantizar unicidad
    console.error('[ID Generator] Error con contador:', err.message);
    const fallback = Date.now().toString().slice(-6);
    return `ED-${year}-${fallback}`;
  }

  return `ED-${year}-${String(counter).padStart(6, '0')}`;
}

module.exports = { generateRequestId };

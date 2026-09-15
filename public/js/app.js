'use strict';

// ============================================
// EL DESVARE — Aplicación principal
// ============================================

// ---- Configuración (cambia estos valores) ----
const CONFIG = {
  businessWhatsapp: '573044168961', // Número del negocio con código de país
  businessEmail: 'asesoriaseldesvare@gmail.com',
  businessInstagram: 'https://www.instagram.com/asesoriaseldesvare/',
  businessFacebook: 'https://www.facebook.com/profile.php?id=61593985401050',
  maxFileSize: 18 * 1024 * 1024,    // 18MB por archivo (límite real: el total combinado)
  maxTotalSize: 18 * 1024 * 1024,   // 18MB combinado — el correo (Gmail) es el único canal de envío
  maxFiles: 5,
  cardSelectDelay: 350,              // ms de espera antes de avanzar al elegir servicio
};

const ALLOWED_EXTENSIONS = new Set([
  'pdf','doc','docx','xls','xlsx','ppt','pptx','jpg','jpeg','png','zip',
]);

const SERVICE_LABELS = {
  academico: 'Trabajo académico', proyecto: 'Proyecto', asesoria: 'Asesoría',
  taller: 'Taller / Ejercicios', presentacion: 'Presentación',
  investigacion: 'Investigación', programacion: 'Programación / Desarrollo',
  diseno: 'Diseño', otro: 'Otro',
};

const DYNAMIC_FIELDS = {
  programacion: 'fields-programacion',
  asesoria: 'fields-asesoria',
  diseno: 'fields-diseno',
  investigacion: 'fields-investigacion',
  presentacion: 'fields-presentacion',
};

// ---- Ruleta de descuento (paso final antes de enviar) ----
// Los premios menores (incluido "sin premio", 0%) se repiten más veces en el
// arreglo de segmentos y además pesan más en la tabla de probabilidades: así
// el 35% (premio mayor) es el resultado menos probable, sin dejar de ser
// alcanzable. Varios segmentos son "perdedores" (0%), como en una ruleta real.
const WHEEL_SEGMENTS = [0, 5, 10, 0, 15, 5, 20, 0, 25, 10, 30, 0, 5, 35];
const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;
const DISCOUNT_WEIGHTS = [
  { value: 0, weight: 30 },
  { value: 5, weight: 25 },
  { value: 10, weight: 18 },
  { value: 15, weight: 12 },
  { value: 20, weight: 8 },
  { value: 25, weight: 4 },
  { value: 30, weight: 2 },
  { value: 35, weight: 1 },
];

// ---- Estado ----
let currentStep = 1;
const TOTAL_STEPS = 6;
let selectedService = null;
let uploadedFiles = [];
let selectedDiscount = null;
let wheelSpun = false; // true solo cuando la animación terminó y el premio quedó fijo
let wheelSpinning = false;

// ---- DOM Referencias ----
const formSteps = () => document.querySelectorAll('.form-step');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const progressTrack = document.getElementById('progress-track');
const formNav = document.getElementById('form-nav');
const confirmationEl = document.getElementById('confirmation');
const serviceError = document.getElementById('service-error');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initConsentGate();
  initHeader();
  initServiceCards();
  initFileUpload();
  initNavButtons();
  initWheel();
  initWheelPopup();
  initScrollAnimations();
  setupWhatsAppLinks();
  updateProgress();
  setMinDeliveryDate();
});

// ============================================
// CONSENTIMIENTO (términos, condiciones y devoluciones)
// ============================================
function initConsentGate() {
  const gate = document.getElementById('consent-gate');
  if (!gate) { initIntro(); return; } // páginas sin gate (ej. /terminos.html)

  const acceptBtn = document.getElementById('consent-accept');
  const rejectBtn = document.getElementById('consent-reject');

  let alreadyAccepted = false;
  try { alreadyAccepted = localStorage.getItem('consentAccepted') === '1'; } catch (e) { /* privacidad/incógnito: se ignora */ }

  if (alreadyAccepted) {
    gate.remove();
    initIntro();
    return;
  }

  document.body.classList.add('consent-locked');

  acceptBtn?.addEventListener('click', () => {
    try { localStorage.setItem('consentAccepted', '1'); } catch (e) { /* privacidad/incógnito: se ignora */ }
    gate.classList.add('consent-hide');
    document.body.classList.remove('consent-locked');
    setTimeout(() => gate.remove(), 500);
    initIntro();
  });

  rejectBtn?.addEventListener('click', () => {
    window.location.href = 'https://google.com';
  });
}

// ============================================
// VIDEO DE BIENVENIDA (tarjeta del logo en el hero)
// ============================================
function initIntro() {
  const video = document.getElementById('hero-intro-video');
  const logo = document.getElementById('hero-intro-logo');
  if (!video || !logo) return;

  let finished = false;
  function showLogo() {
    if (finished) return;
    finished = true;
    // Al terminar, se reemplaza el último frame del video (el logo en relieve)
    // por el logo real del sitio, y queda así de forma permanente.
    video.classList.add('hero-video-hidden');
    logo.classList.add('hero-logo-visible');
  }

  video.muted = true;
  video.addEventListener('ended', showLogo);
  video.addEventListener('error', showLogo);

  video.play().catch(showLogo);
}

// ============================================
// HEADER & MENÚ MÓVIL
// ============================================
function initHeader() {
  const btnMenu = document.getElementById('btn-menu');
  const mobileNav = document.getElementById('mobile-nav');

  if (!btnMenu || !mobileNav) return;

  btnMenu.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    btnMenu.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  document.querySelectorAll('[data-close-menu]').forEach(el => {
    el.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      btnMenu.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// ============================================
// FECHA MÍNIMA DE ENTREGA (HOY)
// ============================================
function setMinDeliveryDate() {
  const dateInput = document.getElementById('deliveryDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
}

// ============================================
// PROGRESS BAR
// ============================================
function updateProgress() {
  const items = document.querySelectorAll('.progress-step-item');
  items.forEach((item, idx) => {
    const step = idx + 1;
    item.classList.remove('active', 'done');
    if (step < currentStep) item.classList.add('done');
    else if (step === currentStep) item.classList.add('active');

    const dot = item.querySelector('.ps-dot');
    if (dot) {
      dot.textContent = step < currentStep ? '✓' : step;
    }
  });

  // Animar la línea de progreso
  if (progressTrack) {
    const pct = TOTAL_STEPS > 1 ? ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100 : 0;
    progressTrack.style.width = pct + '%';
  }

  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.setAttribute('aria-valuenow', currentStep);
  }
}

// ============================================
// SELECCIÓN DE SERVICIO (PASO 1)
// ============================================
function initServiceCards() {
  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
    card.addEventListener('click', () => selectService(card.dataset.service));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectService(card.dataset.service);
      }
    });
  });
}

function selectService(service) {
  // Evita doble-avance si el usuario hace clic varias veces mientras transiciona
  if (currentStep !== 1) return;

  selectedService = service;
  document.querySelectorAll('.service-card').forEach(card => {
    const isSelected = card.dataset.service === service;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', isSelected);
  });
  if (serviceError) serviceError.classList.remove('visible');

  // La tarjeta actúa como activador: avanza automáticamente al paso 2
  setTimeout(() => {
    if (currentStep !== 1 || selectedService !== service) return;
    showDynamicFields(selectedService);
    goToStep(2);
  }, CONFIG.cardSelectDelay);
}

function showDynamicFields(service) {
  // Ocultar todos
  Object.values(DYNAMIC_FIELDS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  });

  // Mostrar el correspondiente
  if (service && DYNAMIC_FIELDS[service]) {
    const el = document.getElementById(DYNAMIC_FIELDS[service]);
    if (el) el.classList.add('visible');
  }
}

// ============================================
// NAVEGACIÓN DE PASOS
// ============================================
function initNavButtons() {
  if (btnPrev) btnPrev.addEventListener('click', prevStep);
  if (btnNext) btnNext.addEventListener('click', nextStep);
  if (btnSubmit) btnSubmit.addEventListener('click', submitForm);
}

function prevStep() {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) {
    if (currentStep === 1) showDynamicFields(selectedService);
    if (currentStep === 4) buildSummary(); // el resumen (paso 5) se arma justo antes de mostrarlo
    goToStep(currentStep + 1);
  }
}

function goToStep(step) {
  const steps = formSteps();
  steps.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(`step-${step}`);
  if (target) target.classList.add('active');

  currentStep = step;
  updateProgress();
  updateNavButtons();

  // Scroll al formulario
  const formWrapper = document.querySelector('.form-wrapper');
  if (formWrapper) {
    formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateNavButtons() {
  if (!btnPrev || !btnNext || !btnSubmit) return;

  // Paso 1: las tarjetas de servicio son el activador, no se muestra "Siguiente".
  // El botón "Atrás" queda disponible desde el paso 2 por si el usuario se equivocó.
  btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
  btnNext.style.display = (currentStep > 1 && currentStep < TOTAL_STEPS) ? 'inline-flex' : 'none';
  btnSubmit.style.display = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
  btnSubmit.disabled = currentStep === TOTAL_STEPS && !wheelSpun;
}

// ============================================
// VALIDACIÓN POR PASO
// ============================================
function validateStep(step) {
  let valid = true;

  if (step === 1) {
    if (!selectedService) {
      if (serviceError) {
        serviceError.classList.add('visible');
        serviceError.focus?.();
      }
      valid = false;
    }
  }

  if (step === 2) {
    const desc = document.getElementById('description');
    const date = document.getElementById('deliveryDate');

    if (!desc || !desc.value.trim() || desc.value.trim().length < 10) {
      showFieldError('description', 'La descripción es obligatoria (mínimo 10 caracteres).');
      valid = false;
    } else {
      clearFieldError('description');
    }

    if (!date || !date.value) {
      showFieldError('deliveryDate', 'Selecciona una fecha de entrega.');
      valid = false;
    } else {
      clearFieldError('deliveryDate');
    }
  }

  if (step === 4) {
    const name = document.getElementById('clientName');
    const email = document.getElementById('clientEmail');
    const whatsapp = document.getElementById('clientWhatsapp');

    if (!name || !name.value.trim() || name.value.trim().length < 2) {
      showFieldError('clientName', 'Ingresa tu nombre completo.');
      valid = false;
    } else clearFieldError('clientName');

    if (!email || !isValidEmail(email.value)) {
      showFieldError('clientEmail', 'Introduce un correo electrónico válido.');
      valid = false;
    } else clearFieldError('clientEmail');

    if (!whatsapp || !isValidWhatsApp(whatsapp.value)) {
      showFieldError('clientWhatsapp', 'Introduce un número de WhatsApp válido (7-15 dígitos).');
      valid = false;
    } else clearFieldError('clientWhatsapp');
  }

  return valid;
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (field) field.classList.add('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (field) field.classList.remove('error');
  if (errorEl) errorEl.classList.remove('visible');
}

// ============================================
// CARGA DE ARCHIVOS
// ============================================
function initFileUpload() {
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files));
  });

  fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = ''; // reset para permitir volver a seleccionar el mismo archivo
  });
}

function currentTotalSize() {
  return uploadedFiles.reduce((sum, f) => sum + f.size, 0);
}

function handleFiles(newFiles) {
  const errEl = document.getElementById('files-error');
  if (errEl) errEl.classList.remove('visible');

  for (const file of newFiles) {
    if (uploadedFiles.length >= CONFIG.maxFiles) {
      showFilesError(`Máximo ${CONFIG.maxFiles} archivos permitidos.`);
      break;
    }

    if (file.size > CONFIG.maxFileSize) {
      showFilesError(`"${file.name}" supera el tamaño máximo por archivo (${formatFileSize(CONFIG.maxFileSize)}).`);
      continue;
    }

    if (currentTotalSize() + file.size > CONFIG.maxTotalSize) {
      showFilesError(`No se pudo agregar "${file.name}": el total de archivos superaría el máximo permitido para enviarlos por correo (${formatFileSize(CONFIG.maxTotalSize)}).`);
      continue;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      showFilesError(`Tipo de archivo no permitido: .${ext}`);
      continue;
    }

    // Evitar duplicados
    const isDup = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
    if (!isDup) uploadedFiles.push(file);
  }

  renderFileList();
}

function showFilesError(msg) {
  const errEl = document.getElementById('files-error');
  if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

function renderFileList() {
  if (!fileList) return;
  fileList.innerHTML = '';

  const totalEl = document.getElementById('file-total');
  if (totalEl) {
    if (uploadedFiles.length === 0) {
      totalEl.textContent = '';
      totalEl.classList.remove('warn');
    } else {
      const total = currentTotalSize();
      totalEl.textContent = `Total: ${formatFileSize(total)} de ${formatFileSize(CONFIG.maxTotalSize)}`;
      totalEl.classList.toggle('warn', total > CONFIG.maxTotalSize * 0.9);
    }
  }

  if (uploadedFiles.length === 0) return;

  uploadedFiles.forEach((file, idx) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const icon = getFileIcon(ext);
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-icon">${icon}</span>
      <div class="file-info">
        <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
        <div class="file-meta">${formatFileSize(file.size)} · ${ext.toUpperCase()}</div>
      </div>
      <button type="button" class="file-remove" aria-label="Eliminar ${escapeHtml(file.name)}">✕</button>
    `;
    item.querySelector('.file-remove').addEventListener('click', () => removeFile(idx));
    fileList.appendChild(item);
  });
}

function getFileIcon(ext) {
  if (['pdf'].includes(ext)) return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📋';
  if (['jpg','jpeg','png'].includes(ext)) return '🖼️';
  if (['zip'].includes(ext)) return '🗜️';
  return '📁';
}

// ============================================
// RESUMEN (PASO 5)
// ============================================
function buildSummary() {
  const container = document.getElementById('summary-content');
  if (!container) return;

  const data = collectAllData();

  const cards = [
    {
      title: 'Servicio',
      rows: [
        ['Tipo', SERVICE_LABELS[data.service] || data.service],
        data.career && ['Carrera', data.career],
        data.subject && ['Materia', data.subject],
        data.topic && ['Tema', data.topic],
      ],
    },
    {
      title: 'Descripción',
      rows: [
        ['Descripción', data.description ? data.description.slice(0, 200) + (data.description.length > 200 ? '...' : '') : '—'],
      ],
    },
    {
      title: 'Entrega',
      rows: [
        ['Fecha', data.deliveryDate ? formatDate(data.deliveryDate) : '—'],
        data.deliveryTime && ['Hora', data.deliveryTime],
        ['Urgencia', capitalize(data.urgency || 'Normal')],
        ['Presupuesto', data.budget || '—'],
      ],
    },
    uploadedFiles.length > 0 && {
      title: 'Archivos',
      rows: [['Cantidad', `${uploadedFiles.length} archivo(s) adjunto(s)`]],
    },
    {
      title: 'Datos de contacto',
      rows: [
        ['Nombre', data.clientName],
        ['Correo', data.clientEmail],
        ['WhatsApp', data.clientWhatsapp],
        data.clientCity && ['Ciudad', data.clientCity],
      ],
    },
  ].filter(Boolean);

  container.innerHTML = cards.map(card => `
    <div class="summary-card">
      <div class="summary-card-header">${card.title}</div>
      <div class="summary-card-body">
        ${card.rows.filter(Boolean).map(([label, value]) =>
          value ? `<div class="summary-row"><span class="summary-label">${label}</span><span class="summary-value">${escapeHtml(String(value))}</span></div>` : ''
        ).join('')}
      </div>
    </div>
  `).join('');

  // Botón editar
  const editHtml = `<div class="summary-edit"><a role="button" tabindex="0" id="btn-edit">✏️ Editar solicitud</a></div>`;
  container.insertAdjacentHTML('beforeend', editHtml);
  const editBtn = document.getElementById('btn-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => goToStep(1));
    editBtn.addEventListener('keydown', e => { if (e.key === 'Enter') goToStep(1); });
  }
}

function collectAllData() {
  const val = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  const radioVal = name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  };

  const budgetOther = val('budgetOther');
  const budgetRadio = radioVal('budget');
  const budget = budgetOther || budgetRadio;

  return {
    service: selectedService,
    career: val('career'),
    subject: val('subject'),
    topic: val('topic'),
    description: val('description'),
    deliveryDate: val('deliveryDate'),
    deliveryTime: val('deliveryTime'),
    urgency: radioVal('urgency'),
    budget,
    // Dynamic
    language: val('language'),
    technology: val('technology'),
    projectType: val('projectType'),
    technicalDescription: val('technicalDescription'),
    level: val('level'),
    reinforce: val('reinforce'),
    modality: val('modality'),
    designType: val('designType'),
    format: val('format') || val('formatPres'),
    dimensions: val('dimensions'),
    researchType: val('researchType'),
    requestedFormat: val('requestedFormat'),
    numPages: val('numPages'),
    numSlides: val('numSlides'),
    // Contact
    clientName: val('clientName'),
    clientEmail: val('clientEmail'),
    clientWhatsapp: val('clientWhatsapp'),
    clientCity: val('clientCity'),
    // Ruleta de descuento
    discountPercent: selectedDiscount || '',
  };
}

// ============================================
// RULETA DE DESCUENTO (PASO 6 — último paso antes de enviar)
// ============================================
function initWheel() {
  const wheelEl = document.getElementById('wheel');
  const labelsEl = document.getElementById('wheel-labels');
  const btnSpin = document.getElementById('btn-spin');
  if (!wheelEl) return;

  const colors = ['#0B1F33', '#F7B719'];
  const stops = WHEEL_SEGMENTS.map((val, i) => {
    const start = i * SEGMENT_ANGLE;
    const end = start + SEGMENT_ANGLE;
    return `${colors[i % 2]} ${start}deg ${end}deg`;
  }).join(', ');
  wheelEl.style.background = `conic-gradient(${stops})`;

  if (labelsEl) {
    labelsEl.innerHTML = WHEEL_SEGMENTS.map((val, i) => {
      const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
      return `<div class="wheel-label" style="transform: rotate(${angle}deg);"><span style="top:-102px;">${val}%</span></div>`;
    }).join('');
  }

  if (btnSpin) btnSpin.addEventListener('click', spinWheel);
}

function pickWeightedDiscount() {
  const total = DISCOUNT_WEIGHTS.reduce((sum, d) => sum + d.weight, 0);
  let r = Math.random() * total;
  for (const d of DISCOUNT_WEIGHTS) {
    if (r < d.weight) return d.value;
    r -= d.weight;
  }
  return DISCOUNT_WEIGHTS[0].value;
}

function spinWheel() {
  if (wheelSpun || wheelSpinning) return;

  const wheelEl = document.getElementById('wheel');
  const btnSpin = document.getElementById('btn-spin');
  const resultEl = document.getElementById('wheel-result');
  if (!wheelEl) return;

  wheelSpinning = true; // se bloquea de inmediato: la ruleta solo se gira una vez
  if (btnSpin) btnSpin.disabled = true;

  const discount = pickWeightedDiscount();

  const matchingIndices = WHEEL_SEGMENTS.reduce((acc, v, i) => {
    if (v === discount) acc.push(i);
    return acc;
  }, []);
  const targetIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
  const targetCenterAngle = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

  const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 vueltas completas
  const finalRotation = extraSpins * 360 + (360 - targetCenterAngle);

  wheelEl.style.transform = `rotate(${finalRotation}deg)`;

  wheelEl.addEventListener('transitionend', function onEnd() {
    wheelEl.removeEventListener('transitionend', onEnd);
    wheelSpinning = false;
    wheelSpun = true;
    selectedDiscount = discount;
    if (resultEl) {
      resultEl.textContent = discount > 0
        ? `🎉 ¡Ganaste ${discount}% de descuento!`
        : '😅 Esta vez no hubo descuento, ¡pero tu solicitud sigue en pie!';
      resultEl.classList.toggle('lose', discount === 0);
      resultEl.classList.add('visible');
    }
    updateNavButtons();
    showWheelPopup(discount);
  }, { once: true });
}

function initWheelPopup() {
  const popup = document.getElementById('wheel-popup');
  const closeBtn = document.getElementById('wheel-popup-close');
  if (closeBtn) closeBtn.addEventListener('click', hideWheelPopup);
  if (popup) {
    popup.addEventListener('click', e => {
      if (e.target === popup) hideWheelPopup();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideWheelPopup();
  });
}

function showWheelPopup(discount) {
  const popup = document.getElementById('wheel-popup');
  if (!popup) return;

  const won = discount > 0;
  const icon = document.getElementById('wheel-popup-icon');
  const title = document.getElementById('wheel-popup-title');
  const value = document.getElementById('wheel-popup-value');
  const sub = document.getElementById('wheel-popup-sub');

  if (icon) icon.textContent = won ? '🎉' : '😅';
  if (title) title.textContent = won ? '¡Ganaste!' : '¡Sigue participando!';
  if (value) value.textContent = won ? `${discount}% OFF` : 'Sin descuento esta vez';
  if (sub) sub.textContent = won
    ? 'Tu descuento se incluirá en la solicitud.'
    : 'No hay problema, tu solicitud sigue en pie igual.';

  popup.classList.toggle('lose', !won);
  popup.classList.add('visible');
}

function hideWheelPopup() {
  const popup = document.getElementById('wheel-popup');
  if (popup) popup.classList.remove('visible');
}

// ============================================
// ENVÍO DEL FORMULARIO
// ============================================
async function submitForm() {
  if (!validateStep(4)) {
    goToStep(4);
    return;
  }

  // wheelSpun es la única señal confiable: selectedDiscount puede ser 0
  // (segmento "perdedor"), que es un resultado válido, no "falta girar".
  if (!wheelSpun) {
    goToStep(6);
    return;
  }

  const data = collectAllData();
  const formData = new FormData();

  // Datos del formulario
  Object.entries(data).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });

  // Honeypot
  const honeypot = document.getElementById('honeypot');
  if (honeypot) formData.append('website', honeypot.value);

  // Archivos
  uploadedFiles.forEach(file => formData.append('files', file));

  // UI: estado de carga
  setBtnLoading(btnSubmit, true);

  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      showConfirmation(result.requestId);
    } else {
      const msgs = result.errors?.join('\n') || 'Ocurrió un error. Intenta de nuevo.';
      alert(msgs);
      setBtnLoading(btnSubmit, false);
    }
  } catch (err) {
    console.error('Error al enviar:', err);
    alert('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
    setBtnLoading(btnSubmit, false);
  }
}

function setBtnLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || 'Enviar solicitud';
  }
}

// ============================================
// CONFIRMACIÓN
// ============================================
function showConfirmation(requestId) {
  // Ocultar form steps y nav
  formSteps().forEach(s => s.classList.remove('active'));
  if (formNav) formNav.style.display = 'none';
  document.querySelector('.progress-bar')?.classList.add('hidden');

  const idEl = document.getElementById('confirmation-id');
  if (idEl) idEl.textContent = requestId;

  const discountEl = document.getElementById('confirmation-discount');
  if (discountEl) {
    if (selectedDiscount) {
      discountEl.textContent = `🎯 Descuento ganado: ${selectedDiscount}% OFF`;
      discountEl.classList.add('visible');
    } else {
      discountEl.classList.remove('visible');
    }
  }

  // Link WhatsApp de contacto directo
  const wa = CONFIG.businessWhatsapp.replace(/\D/g, '');
  const waMsg = encodeURIComponent(`Hola, acabo de enviar una solicitud con el ID: ${requestId}. Quedo atento/a.`);
  const waBtn = document.getElementById('wa-contact-btn');
  if (waBtn && wa) waBtn.href = `https://wa.me/${wa}?text=${waMsg}`;
  else if (waBtn) waBtn.style.display = 'none';

  if (confirmationEl) confirmationEl.classList.add('active');

  const formWrapper = document.querySelector('.form-wrapper');
  if (formWrapper) formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// LINKS DE CONTACTO (WhatsApp, correo, Instagram)
// ============================================
function setHref(id, url) {
  const el = document.getElementById(id);
  if (el) el.href = url;
}

function setupWhatsAppLinks() {
  const wa = CONFIG.businessWhatsapp.replace(/\D/g, '');
  if (wa && !wa.includes('X')) {
    const waUrl = `https://wa.me/${wa}`;
    setHref('wa-fab', waUrl);
    setHref('footer-wa-btn', waUrl);
    setHref('footer-whatsapp', waUrl);
  }

  if (CONFIG.businessEmail) {
    setHref('footer-email', `mailto:${CONFIG.businessEmail}`);
  }

  if (CONFIG.businessInstagram) {
    setHref('footer-instagram', CONFIG.businessInstagram);
  }

  if (CONFIG.businessFacebook) {
    setHref('footer-facebook', CONFIG.businessFacebook);
  }
}

// ============================================
// ANIMACIONES DE SCROLL
// ============================================
function initScrollAnimations() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach(el => observer.observe(el));
  } else {
    // Fallback: mostrar todo
    elements.forEach(el => el.classList.add('visible'));
  }
}

// ============================================
// UTILIDADES
// ============================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

function isValidWhatsApp(number) {
  const cleaned = String(number).replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

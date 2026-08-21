'use strict';

// ============================================
// EL DESVARE — Aplicación principal
// ============================================

// ---- Configuración (cambia estos valores) ----
const CONFIG = {
  businessWhatsapp: '57XXXXXXXXXX', // Número del negocio con código de país
  maxFileSize: 10 * 1024 * 1024,    // 10MB
  maxFiles: 5,
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

// ---- Estado ----
let currentStep = 1;
const TOTAL_STEPS = 5;
let selectedService = null;
let uploadedFiles = [];

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
  initHeader();
  initServiceCards();
  initFileUpload();
  initNavButtons();
  initScrollAnimations();
  setupWhatsAppLinks();
  updateProgress();
  setMinDeliveryDate();
});

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
  selectedService = service;
  document.querySelectorAll('.service-card').forEach(card => {
    const isSelected = card.dataset.service === service;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', isSelected);
  });
  if (serviceError) serviceError.classList.remove('visible');
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
    if (currentStep === TOTAL_STEPS - 1) buildSummary();
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

  btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
  btnNext.style.display = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
  btnSubmit.style.display = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
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

function handleFiles(newFiles) {
  const errEl = document.getElementById('files-error');
  if (errEl) errEl.classList.remove('visible');

  for (const file of newFiles) {
    if (uploadedFiles.length >= CONFIG.maxFiles) {
      showFilesError(`Máximo ${CONFIG.maxFiles} archivos permitidos.`);
      break;
    }

    if (file.size > CONFIG.maxFileSize) {
      showFilesError(`"${file.name}" supera el tamaño máximo (10MB).`);
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
        data.instructions && ['Instrucciones', data.instructions.slice(0, 100) + (data.instructions.length > 100 ? '...' : '')],
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
        data.clientInstagram && ['Instagram', data.clientInstagram],
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
    instructions: val('instructions'),
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
    clientInstagram: val('clientInstagram'),
    clientCity: val('clientCity'),
  };
}

// ============================================
// ENVÍO DEL FORMULARIO
// ============================================
async function submitForm() {
  if (!validateStep(4)) {
    goToStep(4);
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
// LINKS DE WHATSAPP
// ============================================
function setupWhatsAppLinks() {
  const wa = CONFIG.businessWhatsapp.replace(/\D/g, '');
  if (!wa || wa.includes('X')) return; // sin configurar

  const waUrl = `https://wa.me/${wa}`;
  const setHref = (id, url) => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  };

  setHref('wa-fab', waUrl);
  setHref('footer-wa-btn', waUrl);
  setHref('footer-whatsapp', waUrl);
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

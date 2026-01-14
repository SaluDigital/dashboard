import './style.css';
import IMask from 'imask';

// --- CONFIGURATIONS ---
const WEBHOOK_URL = 'https://automato.saludigital.com.br/webhook/63cecb4b-802c-4524-946e-6d800c0172e1';

// --- ELEMENT SELECTION ---
const form = document.getElementById('customerForm');
const submitBtn = document.getElementById('submitBtn');
const toast = document.getElementById('toast');
const cnpjGroup = document.getElementById('cnpjGroup');
const cnpjInput = document.getElementById('cnpj');
const isCnpjRadios = document.querySelectorAll('input[name="isCnpj"]');

// --- MASKS ---
const masks = {
  cpf: IMask(document.getElementById('cpf'), { mask: '000.000.000-00' }),
  cnpj: IMask(cnpjInput, { mask: '00.000.000/0000-00' }),
  cep: IMask(document.getElementById('cep'), { mask: '00000-000' }),
  whatsapp: IMask(document.getElementById('whatsapp'), { mask: '(00) 00000-0000' }),
  phone: IMask(document.getElementById('phone'), { mask: '(00) 0000-0000' }),
};

// --- VALIDATION LOGIC ---

function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  return true;
}

function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
}

function updateValidationUI(input, isValid) {
  const errorMsg = input.nextElementSibling;
  if (!isValid && input.value !== '') {
    input.classList.add('error');
    if (errorMsg && errorMsg.classList.contains('error-message')) {
      errorMsg.style.display = 'block';
    }
  } else {
    input.classList.remove('error');
    if (errorMsg && errorMsg.classList.contains('error-message')) {
      errorMsg.style.display = 'none';
    }
  }
}

function checkFormValidity() {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const isCnpjChecked = data.isCnpj === 'Sim';

  const rules = {
    name: data.name?.trim().length > 0,
    salesRep: !!data.salesRep,
    expertise: data.expertise?.trim().length > 0,
    projectGoal: data.projectGoal?.trim().length > 0,
    birthDate: !!data.birthDate,
    cpf: validateCPF(data.cpf || ''),
    cep: (data.cep || '').replace(/[^\d]/g, '').length === 8,
    address: data.address?.trim().length > 0,
    whatsapp: (data.whatsapp || '').replace(/[^\d]/g, '').length === 11,
    phone: data.phone ? (data.phone.replace(/[^\d]/g, '').length === 10) : true,
    cnpj: isCnpjChecked ? validateCNPJ(data.cnpj || '') : true
  };

  const isFormValid = Object.values(rules).every(Boolean);
  submitBtn.disabled = !isFormValid;
  return isFormValid;
}

// --- EVENT LISTENERS ---

// Toggle CNPJ visibility
isCnpjRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isChecked = e.target.value === 'Sim';
    cnpjGroup.classList.toggle('hidden', !isChecked);
    cnpjInput.required = isChecked;
    checkFormValidity();
  });
});

// Live validation on inputs
form.addEventListener('input', (e) => {
  const target = e.target;

  if (target.id === 'cpf') {
    updateValidationUI(target, validateCPF(target.value));
  } else if (target.id === 'cnpj') {
    updateValidationUI(target, validateCNPJ(target.value));
  } else if (target.id === 'whatsapp') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 11);
  } else if (target.id === 'phone') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 0 || val.length === 10);
  } else if (target.id === 'cep') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 8);
  }

  checkFormValidity();
});

// Toast Helper
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `show ${type}`;
  setTimeout(() => {
    toast.className = '';
  }, 5000);
}

// Form Submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!checkFormValidity()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Clean masks for the final data if needed, or send as is? 
  // Usually, keeping masks in data is fine, but I'll send the raw values inside a "raw" object too if requested. 
  // I'll send exactly what's in the form.

  try {
    // We use URLSearchParams to avoid CORS preflight (OPTIONS) request
    const params = new URLSearchParams();
    for (const key in data) {
      params.append(key, data[key]);
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (response.ok) {
      showToast('Cadastro realizado com sucesso!', 'success');
      form.reset();
      masks.cpf.value = '';
      masks.cnpj.value = '';
      masks.cep.value = '';
      masks.whatsapp.value = '';
      masks.phone.value = '';
      cnpjGroup.classList.add('hidden');
      checkFormValidity();
    } else {
      const errorText = await response.text();
      console.error(`Status: ${response.status} - ${errorText}`);
      throw new Error(`Falha no envio: ${response.status}`);
    }
  } catch (error) {
    showToast('Erro ao enviar dados. Verifique se o webhook do n8n está ativo.', 'error');
    console.error('Erro detalhado:', error);
  } finally {
    submitBtn.textContent = 'Finalizar';
    submitBtn.disabled = false;
  }
});

// Initial check
checkFormValidity();

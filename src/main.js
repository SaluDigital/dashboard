import './style.css';
import IMask from 'imask';

// --- CONFIGURATIONS ---
const WEBHOOK_URL = 'https://automato.saludigital.com.br/webhook/63cecb4b-802c-4524-946e-6d800c0172e1';

// --- ELEMENT SELECTION ---
const formulario = document.getElementById('formularioCliente');
const botaoEnviar = document.getElementById('submitBtn');
const avisoToast = document.getElementById('toast');
const grupoCnpj = document.getElementById('grupoCnpj');
const inputCnpj = document.getElementById('cnpj');
const radiosTemCnpj = document.querySelectorAll('input[name="temCnpj"]');

// Plan value group elements
const chkMidias = document.getElementById('chkMidias');
const chkGoogle = document.getElementById('chkGoogle');
const chkUltra = document.getElementById('chkUltra');
const grupoValorMidias = document.getElementById('grupoValorMidias');
const grupoValorGoogle = document.getElementById('grupoValorGoogle');
const grupoValorUltra = document.getElementById('grupoValorUltra');

// --- MASKS ---
const moneyMaskOptions = {
  mask: 'R$ num',
  blocks: {
    num: {
      mask: Number,
      thousandsSeparator: '.',
      padFractionalZeros: true,
      normalizeZeros: true,
      radix: ',',
      mapToRadix: ['.']
    }
  }
};

const masks = {
  cpf: IMask(document.getElementById('cpf'), { mask: '000.000.000-00' }),
  cnpj: IMask(inputCnpj, { mask: '00.000.000/0000-00' }),
  cep: IMask(document.getElementById('cep'), { mask: '00000-000' }),
  whatsapp: IMask(document.getElementById('whatsapp'), { mask: '(00) 00000-0000' }),
  telefone: IMask(document.getElementById('telefone'), { mask: '(00) 0000-0000' }),
  telefoneFinanceiro: IMask(document.getElementById('telefoneFinanceiro'), { mask: '(00) 00000-0000' }),
  valorMidias: IMask(document.getElementById('valorMidias'), moneyMaskOptions),
  valorGoogle: IMask(document.getElementById('valorGoogle'), moneyMaskOptions),
  valorUltra: IMask(document.getElementById('valorUltra'), moneyMaskOptions),
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
  const formData = new FormData(formulario);
  const data = Object.fromEntries(formData.entries());

  const temCnpjChecked = data.temCnpj === 'Sim';

  const rules = {
    nome: !!data.nome?.trim(),
    vendedor: !!data.vendedor,
    areaAtuacao: !!data.areaAtuacao?.trim(),
    objetivoProjeto: !!data.objetivoProjeto?.trim(),
    dataNascimento: !!data.dataNascimento,
    cpf: validateCPF(data.cpf || ''),
    cep: (data.cep || '').replace(/[^\d]/g, '').length === 8,
    endereco: !!data.endereco?.trim(),
    whatsapp: (data.whatsapp || '').replace(/[^\d]/g, '').length === 11,
    cnpj: temCnpjChecked ? validateCNPJ(data.cnpj || '') : true,
    emailFinanceiro: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailFinanceiro || ''),
    telefoneFinanceiro: (data.telefoneFinanceiro || '').replace(/[^\d]/g, '').length === 11,
    plano: formData.getAll('plano').length > 0,
    entregasExtras: formData.getAll('entregasExtras').length > 0,
    nomeDivulgacao: !!data.nomeDivulgacao?.trim(),
    nomesResponsaveis: !!data.nomesResponsaveis?.trim(),
    possuiDominio: true,
    desejaBlog: true,
    orientadoSetup: true,
    procedimentosFoco: true,
    temRedesSociais: true,
    possuiGoogleNegocio: true,
    metaCliente: true,

    // Conditional values validation
    valorMidias: chkMidias.checked ? !!data.valorMidias?.trim() : true,
    valorGoogle: chkGoogle.checked ? !!data.valorGoogle?.trim() : true,
    valorUltra: chkUltra.checked ? !!data.valorUltra?.trim() : true
  };

  const isFormValid = Object.values(rules).every(Boolean);
  botaoEnviar.disabled = !isFormValid;
  return isFormValid;
}

// --- EVENT LISTENERS ---

radiosTemCnpj.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isChecked = e.target.value === 'Sim';
    grupoCnpj.classList.toggle('hidden', !isChecked);
    inputCnpj.required = isChecked;
    checkFormValidity();
  });
});

[chkMidias, chkGoogle, chkUltra].forEach(chk => {
  chk.addEventListener('change', () => {
    grupoValorMidias.classList.toggle('hidden', !chkMidias.checked);
    grupoValorGoogle.classList.toggle('hidden', !chkGoogle.checked);
    grupoValorUltra.classList.toggle('hidden', !chkUltra.checked);
    checkFormValidity();
  });
});

formulario.addEventListener('input', (e) => {
  const target = e.target;

  if (target.id === 'cpf') {
    updateValidationUI(target, validateCPF(target.value));
  } else if (target.id === 'cnpj') {
    updateValidationUI(target, validateCNPJ(target.value));
  } else if (target.id === 'whatsapp') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 11);
  } else if (target.id === 'telefone') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 0 || val.length === 10);
  } else if (target.id === 'cep') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 8);
  } else if (target.id === 'telefoneFinanceiro') {
    const val = target.value.replace(/[^\d]/g, '');
    updateValidationUI(target, val.length === 11);
  }

  checkFormValidity();
});

function showToast(message, type = 'success') {
  avisoToast.textContent = message;
  avisoToast.className = `show ${type}`;
  setTimeout(() => {
    toast.className = '';
  }, 5000);
}

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!checkFormValidity()) return;

  botaoEnviar.disabled = true;
  botaoEnviar.textContent = 'Enviando...';

  const formData = new FormData(formulario);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      showToast('Cadastro realizado com sucesso!', 'success');
      formulario.reset();
      Object.keys(masks).forEach(key => masks[key].value = '');
      grupoCnpj.classList.add('hidden');
      grupoValorMidias.classList.add('hidden');
      grupoValorGoogle.classList.add('hidden');
      grupoValorUltra.classList.add('hidden');
      checkFormValidity();
    } else {
      throw new Error(`Falha no envio: ${response.status}`);
    }
  } catch (error) {
    showToast('Erro ao enviar dados. Verifique a conexão.', 'error');
    console.error('Erro:', error);
  } finally {
    botaoEnviar.textContent = 'Finalizar';
    botaoEnviar.disabled = false;
  }
});

checkFormValidity();

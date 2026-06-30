/**
 * Cash Report — script.js
 * Features: variance sign toggle, Cash With (dropdown names), Extras, Dojo
 */

/* ── CONFIG ─────────────────────── */
const LS_FORM    = 'cr_v5_form';
const LS_CW      = 'cr_v5_cw';
const LS_EXTRAS  = 'cr_v5_extras';
const LS_SIGN    = 'cr_v5_vsign';

/** Names for Cash With dropdown */
const CW_NAMES = ['Joshua Tree', 'Libin', 'Sebin', 'Bipin', 'Toss', 'Shalu', 'Other'];

/* ── DOM ─────────────────────────── */
const $ = (id) => document.getElementById(id);

const el = {
  shell:        document.querySelector('.shell'),
  screenForm:   $('screen-form'),
  screenOut:    $('screen-out'),
  form:         $('reportForm'),
  date:         $('f-date'),
  shop:         $('f-shop'),
  opening:      $('f-opening'),
  cashSale:     $('f-cash-sale'),
  cardSale:     $('f-card-sale'),
  bankTx:       $('f-bank-tx'),
  totalSale:    $('f-total-sale'),
  variance:     $('f-variance'),
  varianceSign: $('variance-sign'),
  boc:          $('f-boc'),
  cashOut:      $('f-cash-out'),
  paypoint:     $('f-paypoint'),
  dojo:         $('f-dojo'),
  closing:      $('f-closing'),
  unaccounted:  $('f-unaccounted'),
  invoice:      $('f-invoice'),
  cwList:       $('cw-list'),
  extraList:    $('extra-list'),
  extraEmpty:   $('extra-empty'),
  btnAddCw:     $('btn-add-cw'),
  btnAddExtra:  $('btn-add-extra'),
  btnGenerate:  $('btn-generate'),
  btnClear:     $('btn-clear'),
  btnBack:      $('btn-back'),
  btnCopyTop:   $('btn-copy-top'),
  btnCopyMain:  $('btn-copy-main'),
  btnRegen:     $('btn-regen'),
  reportTa:     $('report-ta'),
  outPills:     $('out-pills'),
  topbarDate:   $('topbar-date'),
  toast:        $('toast'),
};

/* ── HELPERS ─────────────────────── */
const todayISO = () => {
  const d = new Date();
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
};

const pad = (n) => String(n).padStart(2, '0');

/** YYYY-MM-DD → DD/MM/YY */
const fmtDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

/** Format number: strip trailing zeros; empty/NaN → '0' */
const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n) || v === '') return '0';
  return parseFloat(n.toFixed(2)).toString();
};

const fmtTopbar = () => new Date().toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
});

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── VARIANCE SIGN ───────────────── */

let vSign = '-'; // default: negative

function applySign(sign) {
  vSign = sign;
  if (sign === '+') {
    el.varianceSign.textContent = '+';
    el.varianceSign.className = 'sign-toggle sign-pos';
  } else {
    el.varianceSign.textContent = '−';
    el.varianceSign.className = 'sign-toggle sign-neg';
  }
}

function getVarSign() {
  return el.varianceSign.classList.contains('sign-pos') ? '+' : '-';
}

/* ── STATIC FORM SAVE / RESTORE ─── */

const STATIC_IDS = [
  'f-date', 'f-shop', 'f-opening',
  'f-cash-sale', 'f-card-sale', 'f-bank-tx', 'f-total-sale',
  'f-variance', 'f-boc', 'f-cash-out',
  'f-paypoint', 'f-dojo', 'f-closing', 'f-unaccounted', 'f-invoice',
];

function saveStatic() {
  const data = {};
  STATIC_IDS.forEach(id => { data[id] = $(id)?.value ?? ''; });
  try { localStorage.setItem(LS_FORM, JSON.stringify(data)); } catch (_) {}
}

function restoreStatic() {
  let data;
  try { data = JSON.parse(localStorage.getItem(LS_FORM) || 'null'); } catch (_) { return; }
  if (!data) return;
  STATIC_IDS.forEach(id => {
    const inp = $(id);
    if (inp && data[id]) inp.value = data[id];
  });
}

/* ── CASH-WITH ROWS ─────────────── */
// Dropdown names: Joshua Tree, Libin, Sebin, Bipin, Toss, Shalu, Other
// When "Other" is selected, a custom text input appears below the dropdown.

/**
 * Build the <select> options HTML for Cash With names
 * @param {string} selected – currently selected value
 */
function cwOptionsHtml(selected) {
  const opts = ['', ...CW_NAMES].map(name => {
    const val = name;
    const label = name || '— select —';
    const sel = selected === name ? 'selected' : '';
    return `<option value="${esc(val)}" ${sel}>${esc(label)}</option>`;
  });
  return opts.join('');
}

function addCwRow(name = '', amount = '', customName = '') {
  const id = `cw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const isOther = name === 'Other';
  const customHidden = isOther ? '' : 'hidden';

  const row = document.createElement('div');
  row.className = 'cw-row';
  row.dataset.id = id;
  row.innerHTML = `
    <div class="field">
      <label class="lbl" for="${id}-sel">Name</label>
      <div class="sel-wrap">
        <select class="inp sel" id="${id}-sel">
          ${cwOptionsHtml(name)}
        </select>
        <svg class="sel-arr" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="4 6 8 10 12 6"/></svg>
      </div>
      <input class="inp cw-custom ${customHidden}" id="${id}-custom"
             type="text" placeholder="Enter name"
             value="${esc(customName)}" autocomplete="off" />
    </div>
    <div class="field">
      <label class="lbl" for="${id}-amt">Amount</label>
      <div class="inp-wrap">
        <span class="pfx">£</span>
        <input class="inp inp-n" id="${id}-amt" type="number"
               placeholder="0.00" value="${esc(amount)}"
               step="0.01" inputmode="decimal" />
      </div>
    </div>
    <button type="button" class="row-remove" title="Remove">×</button>
  `;

  el.cwList.appendChild(row);

  // Show/hide custom input based on dropdown
  const sel    = row.querySelector(`#${id}-sel`);
  const custom = row.querySelector(`#${id}-custom`);

  sel.addEventListener('change', () => {
    if (sel.value === 'Other') custom.classList.remove('hidden');
    else custom.classList.add('hidden');
    saveCw();
  });

  row.querySelector('.row-remove').addEventListener('click', () => {
    row.remove();
    saveCw();
  });

  row.querySelector(`#${id}-amt`).addEventListener('input', saveCw);
  custom.addEventListener('input', saveCw);
}

function saveCw() {
  const rows = [];
  el.cwList.querySelectorAll('.cw-row').forEach(row => {
    const sel    = row.querySelector('select');
    const custom = row.querySelector('.cw-custom');
    const amt    = row.querySelector('input[type="number"]');
    rows.push({
      name:       sel?.value       ?? '',
      customName: custom?.value    ?? '',
      amount:     amt?.value       ?? '',
    });
  });
  try { localStorage.setItem(LS_CW, JSON.stringify(rows)); } catch (_) {}
}

function restoreCw() {
  let data;
  try { data = JSON.parse(localStorage.getItem(LS_CW) || 'null'); } catch (_) {}
  if (Array.isArray(data) && data.length > 0) {
    data.forEach(r => addCwRow(r.name, r.amount, r.customName || ''));
  } else {
    addCwRow(); // start with one empty row
  }
}

/** Collect Cash-With entries for report */
function collectCwEntries() {
  const entries = [];
  el.cwList.querySelectorAll('.cw-row').forEach(row => {
    const sel    = row.querySelector('select');
    const custom = row.querySelector('.cw-custom');
    const amt    = row.querySelector('input[type="number"]');
    const name   = sel?.value === 'Other'
                   ? (custom?.value.trim() || 'Other')
                   : (sel?.value || '');
    if (name) entries.push({ name, amount: amt?.value ?? '' });
  });
  return entries;
}

/* ── EXTRAS ROWS ─────────────────── */
// Each extra: a free-text label + amount

function updateExtraEmpty() {
  const hasRows = el.extraList.querySelectorAll('.extra-row').length > 0;
  el.extraEmpty.style.display = hasRows ? 'none' : '';
}

function addExtraRow(label = '', amount = '') {
  const id = `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const row = document.createElement('div');
  row.className = 'extra-row';
  row.dataset.id = id;
  row.innerHTML = `
    <div class="field">
      <label class="lbl" for="${id}-lbl">Label</label>
      <input class="inp" id="${id}-lbl" type="text"
             placeholder="e.g. Lottery" value="${esc(label)}"
             autocomplete="off" spellcheck="false" />
    </div>
    <div class="field">
      <label class="lbl" for="${id}-amt">Amount</label>
      <div class="inp-wrap">
        <span class="pfx">£</span>
        <input class="inp inp-n" id="${id}-amt" type="number"
               placeholder="0.00" value="${esc(amount)}"
               step="0.01" inputmode="decimal" />
      </div>
    </div>
    <button type="button" class="row-remove" title="Remove">×</button>
  `;

  el.extraList.appendChild(row);
  updateExtraEmpty();

  row.querySelector('.row-remove').addEventListener('click', () => {
    row.remove();
    updateExtraEmpty();
    saveExtras();
  });
  row.querySelector(`#${id}-lbl`).addEventListener('input', saveExtras);
  row.querySelector(`#${id}-amt`).addEventListener('input', saveExtras);
}

function saveExtras() {
  const rows = [];
  el.extraList.querySelectorAll('.extra-row').forEach(row => {
    const lbl = row.querySelector('input[type="text"]');
    const amt = row.querySelector('input[type="number"]');
    rows.push({ label: lbl?.value ?? '', amount: amt?.value ?? '' });
  });
  try { localStorage.setItem(LS_EXTRAS, JSON.stringify(rows)); } catch (_) {}
}

function restoreExtras() {
  let data;
  try { data = JSON.parse(localStorage.getItem(LS_EXTRAS) || 'null'); } catch (_) {}
  if (Array.isArray(data)) {
    data.forEach(r => addExtraRow(r.label, r.amount));
  }
  updateExtraEmpty();
}

function collectExtras() {
  const entries = [];
  el.extraList.querySelectorAll('.extra-row').forEach(row => {
    const lbl = row.querySelector('input[type="text"]')?.value.trim();
    const amt = row.querySelector('input[type="number"]')?.value;
    if (lbl) entries.push({ label: lbl, amount: amt ?? '' });
  });
  return entries;
}

/* ── VALIDATION ─────────────────── */

function clearErrors() {
  document.querySelectorAll('.err').forEach(e => e.classList.remove('err'));
  document.querySelectorAll('.err-msg').forEach(e => e.remove());
}

function markErr(input, msg) {
  input.classList.add('err');
  const parent = input.closest('.field') || input.parentElement;
  if (!parent.querySelector('.err-msg')) {
    const s = document.createElement('span');
    s.className = 'err-msg'; s.textContent = msg;
    parent.appendChild(s);
  }
}

function validate() {
  clearErrors();
  let ok = true;

  // Required text/select fields
  if (!el.date.value)    { markErr(el.date,    'Required'); ok = false; }
  if (!el.shop.value)    { markErr(el.shop,    'Required'); ok = false; }

  // Required numeric fields — must be filled (not empty)
  const reqNums = [
    [el.opening,   'Opening Balance is required'],
    [el.cashSale,  'Cash Sale is required'],
    [el.cardSale,  'Card Sale is required'],
    [el.totalSale, 'Total Sale is required'],
    [el.boc,       'BOC is required'],
    [el.closing,   'Closing Cash is required'],
  ];
  reqNums.forEach(([input, msg]) => {
    if (input.value === '' || input.value === null) {
      markErr(input, msg);
      ok = false;
    }
  });

  if (!ok) {
    const first = document.querySelector('.err');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first?.focus();
  }
  return ok;
}

/* ── REPORT BUILDER ─────────────── */

/**
 * Exact format from spec:
 *  - Bold labels via *Label* (WhatsApp)
 *  - Variance prefixed with sign
 *  - Cash With entries between Cash Out and PayPoint
 *  - Dojo after PayPoint
 *  - Extras before Invoice
 *  - Invoice only if filled in
 */
function buildReport() {
  const sign = getVarSign();
  const lines = [];

  if (el.shop.value) lines.push(`*${el.shop.value}*`);
  lines.push(`*Date: ${fmtDate(el.date.value)}*`);
  lines.push('');

  lines.push(`*Opening balance*: ${fmt(el.opening.value)}`);
  lines.push('');

  lines.push(`*Cash sale*: ${fmt(el.cashSale.value)}`);
  lines.push(`*Card sale*: ${fmt(el.cardSale.value)}`);
  lines.push(`*Bank transfer*: ${fmt(el.bankTx.value)}`);
  lines.push('');

  lines.push(`*Total sale*: ${fmt(el.totalSale.value)}`);
  lines.push('');

  lines.push(`*Variance*: ${sign}${fmt(el.variance.value)}`);
  lines.push('');

  lines.push(`*BOC*: ${fmt(el.boc.value)}`);
  lines.push('');

  lines.push(`*Cash Out*: ${fmt(el.cashOut.value)}`);
  lines.push('');

  // Cash With entries
  const cwEntries = collectCwEntries();
  cwEntries.forEach(e => lines.push(`Cash with ${e.name}: ${fmt(e.amount)}`));
  if (cwEntries.length > 0) lines.push('');

  lines.push(`Paypoint: ${fmt(el.paypoint.value)}`);
  lines.push('');

  lines.push(`Dojo: ${fmt(el.dojo.value)}`);
  lines.push('');

  lines.push(`Closing cash: ${fmt(el.closing.value)}`);
  lines.push('');

  lines.push(`Unaccounted cash: ${fmt(el.unaccounted.value)}`);

  // Extras
  const extras = collectExtras();
  if (extras.length > 0) {
    lines.push('');
    extras.forEach(e => lines.push(`${e.label}: ${fmt(e.amount)}`));
  }

  // Invoice (only if filled)
  const inv = el.invoice.value.trim();
  if (inv && parseFloat(inv) !== 0) {
    lines.push('');
    lines.push(`Invoice: ₹${fmt(inv)}`);
  }

  return lines.join('\n');
}

/* ── PILLS ───────────────────────── */
function renderPills() {
  el.outPills.innerHTML = `
    <span class="pill"><b>${el.shop.value || '—'}</b></span>
    <span class="pill"><b>${fmtDate(el.date.value)}</b></span>
  `;
}

/* ── PAGE NAVIGATION ─────────────── */
function showOutput() {
  el.screenOut.removeAttribute('aria-hidden');
  el.shell.classList.add('show-out');
  el.screenOut.scrollTop = 0;
  history.pushState({ page: 2 }, '');
}

function showForm() {
  el.shell.classList.remove('show-out');
  el.screenOut.setAttribute('aria-hidden', 'true');
}

/* ── ACTIONS ─────────────────────── */
function onGenerate() {
  if (!validate()) { showToast('Fill in the required fields', 'err'); return; }
  el.reportTa.value = buildReport();
  renderPills();
  saveStatic(); saveCw(); saveExtras();
  showOutput();
  showToast('Report ready', 'ok');
}

function onRegen() {
  el.reportTa.value = buildReport();
  renderPills();
  showToast('Refreshed', 'inf');
}

function onClear() {
  const shop = el.shop.value;
  el.form.reset();
  el.shop.value = shop;
  el.date.value = todayISO();
  clearErrors();
  saveStatic();
}

async function onCopy() {
  const text = el.reportTa.value.trim();
  if (!text) { showToast('Nothing to copy', 'err'); return; }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      el.reportTa.select();
      document.execCommand('copy');
    }
    showToast('Copied!', 'ok');
  } catch (e) {
    showToast('Copy failed — select manually', 'err');
  }
}

/* ── TOAST ───────────────────────── */
let _tt = null;
function showToast(msg, type = 'inf', ms = 2500) {
  const t = el.toast;
  if (_tt) { clearTimeout(_tt); t.className = 'toast'; }
  t.textContent = msg;
  t.className = `toast t-${type}`;
  void t.offsetWidth;
  t.classList.add('on');
  _tt = setTimeout(() => { t.classList.remove('on'); _tt = null; }, ms);
}

/* ── ENTER KEY NAVIGATION ─────────── */
function onEnter(e) {
  if (e.key !== 'Enter') return;
  const inputs = Array.from(el.form.querySelectorAll('input:not([type="hidden"]), select'));
  const idx    = inputs.indexOf(e.target);
  if (idx >= 0 && idx < inputs.length - 1) {
    e.preventDefault();
    inputs[idx + 1].focus();
  } else if (idx === inputs.length - 1) {
    e.preventDefault();
    e.target.blur();
  }
}

/* ── INIT ─────────────────────────── */
function init() {
  el.topbarDate.textContent = fmtTopbar();
  el.date.value = todayISO();

  // Restore static form values
  restoreStatic();
  if (!el.date.value) el.date.value = todayISO();

  // Restore variance sign
  applySign(localStorage.getItem(LS_SIGN) || '-');

  // Restore dynamic rows
  restoreCw();
  restoreExtras();

  // Variance sign toggle
  el.varianceSign.addEventListener('click', () => {
    const next = getVarSign() === '-' ? '+' : '-';
    applySign(next);
    try { localStorage.setItem(LS_SIGN, next); } catch (_) {}
  });

  // Auto-save static fields
  el.form.addEventListener('input', saveStatic);
  el.form.addEventListener('change', saveStatic);

  // Clear errors on fix
  el.form.addEventListener('input', (e) => {
    if (e.target.classList.contains('err') && e.target.value) {
      e.target.classList.remove('err');
      e.target.closest('.field')?.querySelector('.err-msg')?.remove();
    }
  });

  // Enter key navigation
  el.form.addEventListener('keydown', onEnter);

  // Add buttons
  el.btnAddCw.addEventListener('click', () => { addCwRow(); saveCw(); });
  el.btnAddExtra.addEventListener('click', () => { addExtraRow(); saveExtras(); });

  // Page 1 actions
  el.btnGenerate.addEventListener('click', onGenerate);
  el.btnClear.addEventListener('click', onClear);

  // Page 2 actions
  el.btnBack.addEventListener('click', showForm);
  el.btnCopyTop.addEventListener('click', onCopy);
  el.btnCopyMain.addEventListener('click', onCopy);
  el.btnRegen.addEventListener('click', onRegen);

  // Browser back button
  history.replaceState({ page: 1 }, '');
  window.addEventListener('popstate', () => {
    if (el.shell.classList.contains('show-out')) showForm();
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();

// Basic lab script: validation, add card + table, remove sync, optional localStorage
(() => {
  const form = document.getElementById('regForm');
  const live = document.getElementById('live');
  const cards = document.getElementById('cards');
  const tbody = document.querySelector('#summary tbody');

  // Toggle persistence
  const USE_STORAGE = true;
  const STORAGE_KEY = 'lab4_profiles_v1';

  // helpers
  const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.floor(Math.random()*9000+1000);
  }

  function getFormData() {
    const data = {
      id: uid(),
      first: form.first.value.trim(),
      last: form.last.value.trim(),
      email: form.email.value.trim(),
      prog: form.prog.value,
      photo: form.photo.value.trim(),
      interests: Array.from(form.querySelectorAll('input[name="interests"]:checked')).map(i => i.value),
      year: (form.querySelector('input[name="year"]:checked') || {}).value || ''
    };
    return data;
  }

  function setError(id, message) {
    const el = document.getElementById('err-' + id);
    if (el) el.textContent = message;
  }
  function clearErrors() {
    ['first','last','email','prog','year','photo'].forEach(k => setError(k,''));
    live.textContent = '';
  }
  // validation
  function validate(data) {
    clearErrors();
    let ok = true;
    if (!data.first) { setError('first','First name is required.'); ok = false; }
    if (!data.last)  { setError('last','Last name is required.'); ok = false; }
    if (!emailRE.test(data.email)) { setError('email','Please enter a valid email.'); ok = false; }
    if (!data.year) { setError('year','Please select your year.'); ok = false; }
    if (!data.prog) { setError('prog','Please select a programme.'); ok = false; }
    if (!ok){
      live.textContent = 'Fix errors before submitting.';
    }
    return ok;
  }

  function createCardDOM(entry) {
    const wrap = document.createElement('article');
    wrap.className = 'card-person';
    wrap.dataset.id = entry.id;

    const img = document.createElement('img');
    img.alt = `${entry.first} ${entry.last}`;
    img.src = entry.photo || 'https://placehold.co/128x128?text=User';
    img.addEventListener('error', () => {
      img.src = 'https://placehold.co/128x128?text=User';
    });

    const body = document.createElement('div');
    body.className = 'card-body';

    body.innerHTML = `<h3>${escapeHtml(entry.first)} ${escapeHtml(entry.last)}</h3>
      <p><span class="badge">${escapeHtml(entry.prog)}</span><span class="badge">Year ${escapeHtml(entry.year)}</span></p>
      <p class="muted">${(entry.interests && entry.interests.length)? escapeHtml(entry.interests.join(', ')) : ''}</p>`;

    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.dataset.action = 'remove';
    btn.dataset.id = entry.id;
    btn.title = 'Remove profile';

    wrap.appendChild(img);
    wrap.appendChild(body);
    wrap.appendChild(btn);

    return wrap;
  }

  function createRowDOM(entry) {
    const tr = document.createElement('tr');
    tr.dataset.id = entry.id;
    tr.innerHTML = `<td>${escapeHtml(entry.first)} ${escapeHtml(entry.last)}</td>
      <td>${escapeHtml(entry.prog)}</td>
      <td>${escapeHtml(entry.year)}</td>
      <td>${escapeHtml((entry.interests||[]).join(', '))}</td>
      <td><button class="action-btn" data-action="remove" data-id="${entry.id}" type="button">Remove</button></td>`;
    return tr;
  }

  // escape for safety
  function escapeHtml(s){
    if (!s) return '';
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function addEntry(entry, save = true) {
    // prepend card + row
    cards.prepend(createCardDOM(entry));
    tbody.prepend(createRowDOM(entry));
    live.textContent = `Added ${entry.first} ${entry.last}`;
    if (USE_STORAGE && save) persistAdd(entry);
  }

  function removeEntryById(id, save = true) {
    // remove card
    const card = cards.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
    // remove row
    const row = tbody.querySelector(`tr[data-id="${id}"]`);
    if (row) row.remove();
    live.textContent = 'Entry removed.';
    if (USE_STORAGE && save) persistRemove(id);
  }

  // Persistence helpers
  function getStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  function persistAdd(entry) {
    const arr = getStored();
    arr.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function persistRemove(id) {
    const arr = getStored().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function restoreAll() {
    const arr = getStored();
    arr.reverse().forEach(e => addEntry(e, false)); // don't re-save
  }

  // events
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = getFormData();
    if (!validate(data)) return;
    addEntry(data);
    form.reset();
    form.first.focus();
  });

  // event delegation for remove
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-action="remove"]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id) removeEntryById(id);
  });

  // restore
  if (USE_STORAGE) restoreAll();

  // expose for debugging (optional)
  window._lab4 = { addEntry, removeEntryById };
})();

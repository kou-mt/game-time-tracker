const STORAGE_KEY = 'gameRecords';

const form = document.getElementById('record-form');
const gameNameInput = document.getElementById('game-name');
const playHoursInput = document.getElementById('play-hours');
const playMinutesInput = document.getElementById('play-minutes');
const playDateInput = document.getElementById('play-date');
const editingIdInput = document.getElementById('editing-id');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const gameOptions = document.getElementById('game-options');
const recordsBody = document.getElementById('records-body');
const totalsList = document.getElementById('totals-list');

function loadRecords() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  const records = JSON.parse(json);
  // 古いデータにidが無い場合に備えて振り直す
  records.forEach((r) => {
    if (!r.id) r.id = Date.now() + Math.random();
  });
  return records;
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function populateTimeSelects() {
  for (let h = 0; h <= 23; h++) {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    playHoursInput.appendChild(opt);
  }
  for (let m = 0; m <= 55; m += 5) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    playMinutesInput.appendChild(opt);
  }
}

function formatDuration(hoursDecimal) {
  const totalMinutes = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}時間${m}分`;
  if (h > 0) return `${h}時間`;
  return `${m}分`;
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function resetForm() {
  form.reset();
  playHoursInput.value = '0';
  playMinutesInput.value = '0';
  playDateInput.value = todayString();
  editingIdInput.value = '';
  submitBtn.textContent = '記録を追加';
  cancelEditBtn.hidden = true;
}

function renderGameOptions(records) {
  const uniqueNames = [...new Set(records.map((r) => r.game))];
  gameOptions.innerHTML = uniqueNames
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join('');
}

function renderTotals(records) {
  const totals = {};
  records.forEach((r) => {
    totals[r.game] = (totals[r.game] || 0) + r.hours;
  });

  const names = Object.keys(totals).sort();
  if (names.length === 0) {
    totalsList.innerHTML = '<li>まだ記録がありません</li>';
    return;
  }

  totalsList.innerHTML = names
    .map((name) => `<li>${escapeHtml(name)}：${formatDuration(totals[name])}</li>`)
    .join('');
}

function renderTable(records) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="4">まだ記録がありません</td></tr>';
    return;
  }

  recordsBody.innerHTML = sorted
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.game)}</td>
      <td>${formatDuration(r.hours)}</td>
      <td>
        <button class="edit-btn" data-id="${r.id}">編集</button>
        <button class="delete-btn" data-id="${r.id}">削除</button>
      </td>
    </tr>`
    )
    .join('');
}

function render() {
  const records = loadRecords();
  renderGameOptions(records);
  renderTotals(records);
  renderTable(records);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const game = gameNameInput.value.trim();
  const h = parseInt(playHoursInput.value, 10);
  const m = parseInt(playMinutesInput.value, 10);
  const hours = h + m / 60;
  const date = playDateInput.value;
  const editingId = editingIdInput.value;

  if (!game || !date || hours <= 0) return;

  const records = loadRecords();

  if (editingId) {
    const target = records.find((r) => String(r.id) === editingId);
    if (target) {
      target.game = game;
      target.hours = hours;
      target.date = date;
    }
  } else {
    records.push({ id: Date.now(), game, hours, date });
  }

  saveRecords(records);
  resetForm();
  render();
});

recordsBody.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('この記録を削除しますか？')) return;
    const records = loadRecords().filter((r) => String(r.id) !== id);
    saveRecords(records);
    render();
  }

  if (e.target.classList.contains('edit-btn')) {
    const record = loadRecords().find((r) => String(r.id) === id);
    if (!record) return;
    gameNameInput.value = record.game;
    const totalMinutes = Math.round(record.hours * 60);
    let h = Math.floor(totalMinutes / 60);
    let m = Math.round((totalMinutes % 60) / 5) * 5;
    if (m === 60) { h += 1; m = 0; }
    playHoursInput.value = String(h);
    playMinutesInput.value = String(m);
    playDateInput.value = record.date;
    editingIdInput.value = record.id;
    submitBtn.textContent = '更新する';
    cancelEditBtn.hidden = false;
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

populateTimeSelects();
playDateInput.value = todayString();
render();

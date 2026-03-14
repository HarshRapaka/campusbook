// CampusBook - Room & Resource Booking System
// app.js - Core application logic

const TIME_SLOTS = [
  '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '17:00-18:00'
];

// Application state (persisted to localStorage)
let state = {
  view: 'user',
  userSection: 'browse',
  adminSection: 'pending',
  selectedResource: null,
  selectedDate: todayStr(),
  selectedSlot: null,
  resourceFilter: 'all',
  resources: [
    { id: 1, name: 'Seminar Hall A', type: 'Seminar Hall', capacity: 120, location: 'Block A, Ground Floor' },
    { id: 2, name: 'Seminar Hall B', type: 'Seminar Hall', capacity: 80, location: 'Block B, First Floor' },
    { id: 3, name: 'Computer Lab 1', type: 'Lab', capacity: 40, location: 'Tech Block, Floor 1' },
    { id: 4, name: 'Computer Lab 2', type: 'Lab', capacity: 40, location: 'Tech Block, Floor 2' },
    { id: 5, name: 'Physics Lab', type: 'Lab', capacity: 30, location: 'Science Block, Floor 1' },
    { id: 6, name: 'Conference Room 1', type: 'Conference', capacity: 20, location: 'Admin Block, Floor 3' },
    { id: 7, name: 'Conference Room 2', type: 'Conference', capacity: 15, location: 'Admin Block, Floor 2' },
    { id: 8, name: 'Basketball Court', type: 'Sports', capacity: 30, location: 'Sports Complex' },
    { id: 9, name: 'Badminton Hall', type: 'Sports', capacity: 20, location: 'Sports Complex' },
  ],
  bookings: [],
  nextId: 100
};

// Utility functions
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function saveState() {
  try {
    localStorage.setItem('campusbook_state', JSON.stringify({
      resources: state.resources,
      bookings: state.bookings,
      nextId: state.nextId
    }));
  } catch (e) { /* storage unavailable */ }
}

function loadState() {
  try {
    const saved = localStorage.getItem('campusbook_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.resources = parsed.resources || state.resources;
      state.bookings = parsed.bookings || state.bookings;
      state.nextId = parsed.nextId || state.nextId;
    }
  } catch (e) { /* use defaults */ }
}

function showAlert(msg, type = 'success') {
  const b = document.getElementById('alertBox');
  b.style.display = 'block';
  b.className = 'alert alert-' + type;
  b.textContent = msg;
  setTimeout(() => { b.style.display = 'none'; }, 4000);
}

// View switching
function switchView(v) {
  state.view = v;
  document.getElementById('userView').style.display = v === 'user' ? '' : 'none';
  document.getElementById('adminView').style.display = v === 'admin' ? '' : 'none';
  document.getElementById('adminBadge').style.display = v === 'admin' ? '' : 'none';
  const btns = document.querySelectorAll('#mainNav button');
  btns[0].classList.toggle('active', v === 'user');
  btns[1].classList.toggle('active', v === 'admin');
  if (v === 'admin') { updateStats(); renderPendingList(); }
  else { renderResources(); }
}

function switchSection(s, view) {
  if (view === 'user') {
    state.userSection = s;
    document.getElementById('browseSection').style.display = s === 'browse' ? '' : 'none';
    document.getElementById('myBookingsSection').style.display = s === 'myBookings' ? '' : 'none';
    document.querySelectorAll('#userView > .section-tabs .section-tab').forEach((b, i) => {
      b.classList.toggle('active', (i === 0 && s === 'browse') || (i === 1 && s === 'myBookings'));
    });
    if (s === 'myBookings') renderMyBookings();
  } else {
    state.adminSection = s;
    document.getElementById('pendingSection').style.display = s === 'pending' ? '' : 'none';
    document.getElementById('allBookingsSection').style.display = s === 'allBookings' ? '' : 'none';
    document.getElementById('resourcesSection').style.display = s === 'resources' ? '' : 'none';
    document.querySelectorAll('#adminView > .section-tabs .section-tab').forEach((b, i) => {
      b.classList.toggle('active',
        (i === 0 && s === 'pending') || (i === 1 && s === 'allBookings') || (i === 2 && s === 'resources'));
    });
    if (s === 'pending') renderPendingList();
    if (s === 'allBookings') renderAllBookings();
    if (s === 'resources') renderAdminResources();
  }
}

// Resource filter
function filterResources(f) {
  state.resourceFilter = f;
  renderResources();
}

// Render resource list
function renderResources() {
  const list = document.getElementById('resourceList');
  const filtered = state.resources.filter(r => state.resourceFilter === 'all' || r.type === state.resourceFilter);
  if (!filtered.length) {
    list.innerHTML = '<div class="empty">No resources found.</div>';
    return;
  }
  list.innerHTML = filtered.map(r => `
    <div class="resource-card ${state.selectedResource === r.id ? 'selected' : ''}" onclick="selectResource(${r.id})">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="name">${r.name}</div>
        <span class="tag">${r.type}</span>
      </div>
      <div class="meta">Capacity: ${r.capacity} &nbsp;|&nbsp; ${r.location}</div>
    </div>
  `).join('');
}

// Select a resource and show availability panel
function selectResource(id) {
  state.selectedResource = id;
  state.selectedSlot = null;
  renderResources();
  const r = state.resources.find(x => x.id === id);
  document.getElementById('noResourceMsg').style.display = 'none';
  document.getElementById('availPanel').style.display = '';
  document.getElementById('selectedResourceName').textContent = `${r.name} — ${r.type} (Capacity: ${r.capacity})`;
  const dp = document.getElementById('datePicker');
  dp.value = state.selectedDate;
  updateDateDisplay();
  renderSlots();
}

function updateDateDisplay() {
  document.getElementById('dateDisplay').textContent = fmtDate(state.selectedDate);
}

function changeDate(d) {
  const dt = new Date(state.selectedDate + 'T00:00:00');
  dt.setDate(dt.getDate() + d);
  state.selectedDate = dt.toISOString().split('T')[0];
  document.getElementById('datePicker').value = state.selectedDate;
  state.selectedSlot = null;
  updateDateDisplay();
  renderSlots();
}

function onDateChange() {
  state.selectedDate = document.getElementById('datePicker').value;
  state.selectedSlot = null;
  updateDateDisplay();
  renderSlots();
}

// Get slot availability status
function getSlotStatus(resourceId, date, slot) {
  const b = state.bookings.find(x =>
    x.resourceId === resourceId && x.date === date && x.slot === slot &&
    (x.status === 'approved' || x.status === 'pending')
  );
  if (!b) return 'free';
  return b.status;
}

// Render time slot grid
function renderSlots() {
  if (!state.selectedResource) return;
  const grid = document.getElementById('slotGrid');
  grid.innerHTML = TIME_SLOTS.map(s => {
    const st = getSlotStatus(state.selectedResource, state.selectedDate, s);
    const sel = state.selectedSlot === s && st === 'free';
    return `<div class="slot ${sel ? 'selected' : st}" onclick="selectSlot('${s}','${st}')" title="${s}: ${st}">
      ${s}<br><span style="font-size:10px;opacity:0.8">${st}</span>
    </div>`;
  }).join('');
  const selPanel = document.getElementById('slotSelection');
  if (state.selectedSlot) {
    selPanel.style.display = '';
    document.getElementById('selectedSlotLabel').textContent = `${fmtDate(state.selectedDate)}, ${state.selectedSlot}`;
  } else {
    selPanel.style.display = 'none';
  }
}

function selectSlot(slot, status) {
  if (status !== 'free') return;
  state.selectedSlot = slot;
  renderSlots();
}

// Submit booking request
function submitBooking() {
  const name = document.getElementById('reqName').value.trim();
  const desc = document.getElementById('reqDesc').value.trim();
  const att = document.getElementById('reqAttendees').value.trim();
  if (!name) { showAlert('Please enter your name', 'danger'); return; }
  if (!desc) { showAlert('Please enter the purpose', 'danger'); return; }
  if (!state.selectedSlot) { showAlert('Please select a time slot', 'danger'); return; }

  // Double-booking prevention check
  const conflict = state.bookings.find(b =>
    b.resourceId === state.selectedResource &&
    b.date === state.selectedDate &&
    b.slot === state.selectedSlot &&
    (b.status === 'approved' || b.status === 'pending')
  );
  if (conflict) {
    showAlert('This slot was just taken. Please choose another.', 'danger');
    renderSlots();
    return;
  }

  state.bookings.push({
    id: state.nextId++,
    resourceId: state.selectedResource,
    date: state.selectedDate,
    slot: state.selectedSlot,
    name, desc,
    attendees: att || 'N/A',
    status: 'pending',
    time: Date.now()
  });

  document.getElementById('reqName').value = '';
  document.getElementById('reqDesc').value = '';
  document.getElementById('reqAttendees').value = '';
  state.selectedSlot = null;
  saveState();
  renderSlots();
  showAlert('Booking request submitted! Awaiting admin approval.', 'success');
}

// Render user's booking history
function renderMyBookings() {
  const list = document.getElementById('myBookingsList');
  const all = [...state.bookings].sort((a, b) => b.time - a.time);
  if (!all.length) { list.innerHTML = '<div class="empty">No bookings yet.</div>'; return; }
  list.innerHTML = all.map(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    const badgeClass = { pending: 'badge-warn', approved: 'badge-success', rejected: 'badge-danger' }[b.status] || 'badge-info';
    return `<div class="booking-row">
      <div class="booking-info">
        <div class="title">${r ? r.name : 'Unknown'} <span class="tag">${r ? r.type : ''}</span></div>
        <div class="sub">${fmtDate(b.date)} &nbsp;|&nbsp; ${b.slot}</div>
        <div class="sub">By: ${b.name} &nbsp;|&nbsp; ${b.desc}</div>
        <div class="sub">Attendees: ${b.attendees}</div>
      </div>
      <div class="booking-actions"><span class="badge ${badgeClass}">${b.status}</span></div>
    </div>`;
  }).join('');
}

// Admin: update stats
function updateStats() {
  const pending = state.bookings.filter(b => b.status === 'pending').length;
  const approved = state.bookings.filter(b => b.status === 'approved').length;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statTotal').textContent = state.bookings.length;
}

// Admin: render pending list
function renderPendingList() {
  const list = document.getElementById('pendingList');
  const pending = state.bookings.filter(b => b.status === 'pending').sort((a, b) => a.time - b.time);
  if (!pending.length) { list.innerHTML = '<div class="empty">No pending requests.</div>'; return; }
  list.innerHTML = pending.map(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    return `<div class="booking-row">
      <div class="booking-info">
        <div class="title">${r ? r.name : 'Unknown'} <span class="tag">${r ? r.type : ''}</span></div>
        <div class="sub">${fmtDate(b.date)} &nbsp;|&nbsp; ${b.slot}</div>
        <div class="sub">Requested by: <strong>${b.name}</strong> &nbsp;|&nbsp; ${b.desc}</div>
        <div class="sub">Attendees: ${b.attendees}</div>
      </div>
      <div class="booking-actions">
        <button class="btn btn-success btn-sm" onclick="approveBooking(${b.id})">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectBooking(${b.id})">Reject</button>
      </div>
    </div>`;
  }).join('');
}

// Admin: render all bookings
function renderAllBookings() {
  const list = document.getElementById('allBookingsList');
  const all = [...state.bookings].sort((a, b) => b.time - a.time);
  if (!all.length) { list.innerHTML = '<div class="empty">No bookings found.</div>'; return; }
  list.innerHTML = all.map(b => {
    const r = state.resources.find(x => x.id === b.resourceId);
    const badgeClass = { pending: 'badge-warn', approved: 'badge-success', rejected: 'badge-danger' }[b.status] || 'badge-info';
    return `<div class="booking-row">
      <div class="booking-info">
        <div class="title">${r ? r.name : 'Unknown'} <span class="tag">${r ? r.type : ''}</span></div>
        <div class="sub">${fmtDate(b.date)} &nbsp;|&nbsp; ${b.slot}</div>
        <div class="sub">${b.name} — ${b.desc}</div>
      </div>
      <div class="booking-actions">
        <span class="badge ${badgeClass}">${b.status}</span>
        ${b.status !== 'rejected' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})">Cancel</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

// Admin: approve a booking (with conflict detection)
function approveBooking(id) {
  const b = state.bookings.find(x => x.id === id);
  if (!b) return;
  const conflict = state.bookings.find(x =>
    x.id !== id && x.resourceId === b.resourceId &&
    x.date === b.date && x.slot === b.slot && x.status === 'approved'
  );
  if (conflict) {
    showAlert('Cannot approve — this slot is already approved for another booking!', 'danger');
    return;
  }
  b.status = 'approved';
  saveState();
  updateStats(); renderPendingList(); renderAllBookings();
  if (state.selectedResource) renderSlots();
  showAlert('Booking approved!', 'success');
}

// Admin: reject a booking
function rejectBooking(id) {
  const b = state.bookings.find(x => x.id === id);
  if (b) b.status = 'rejected';
  saveState();
  updateStats(); renderPendingList(); renderAllBookings();
  if (state.selectedResource) renderSlots();
  showAlert('Booking rejected.', 'success');
}

// Admin: cancel any booking
function cancelBooking(id) {
  const b = state.bookings.find(x => x.id === id);
  if (b) b.status = 'rejected';
  saveState();
  updateStats(); renderAllBookings();
  if (state.selectedResource) renderSlots();
  showAlert('Booking cancelled.', 'success');
}

// Admin: render resource management list
function renderAdminResources() {
  const list = document.getElementById('adminResourceList');
  list.innerHTML = state.resources.map(r => `
    <div class="booking-row">
      <div class="booking-info">
        <div class="title">${r.name} <span class="tag">${r.type}</span></div>
        <div class="meta" style="font-size:12px;color:#666;margin-top:2px">Capacity: ${r.capacity} &nbsp;|&nbsp; ${r.location}</div>
      </div>
      <div class="booking-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteResource(${r.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

// Admin: add a new resource
function addResource() {
  const name = document.getElementById('newResName').value.trim();
  const type = document.getElementById('newResType').value;
  const cap = document.getElementById('newResCap').value.trim();
  const loc = document.getElementById('newResLoc').value.trim();
  if (!name) { showAlert('Enter a resource name', 'danger'); return; }
  const newId = Math.max(...state.resources.map(r => r.id), 0) + 1;
  state.resources.push({ id: newId, name, type, capacity: cap || 'N/A', location: loc || 'TBD' });
  document.getElementById('newResName').value = '';
  document.getElementById('newResCap').value = '';
  document.getElementById('newResLoc').value = '';
  saveState();
  renderAdminResources(); renderResources();
  showAlert('Resource added!', 'success');
}

// Admin: remove a resource
function deleteResource(id) {
  if (!confirm('Remove this resource? All its bookings will remain in history.')) return;
  state.resources = state.resources.filter(r => r.id !== id);
  if (state.selectedResource === id) {
    state.selectedResource = null;
    document.getElementById('noResourceMsg').style.display = '';
    document.getElementById('availPanel').style.display = 'none';
  }
  saveState();
  renderAdminResources(); renderResources();
  showAlert('Resource removed.', 'success');
}

// Initialize app
loadState();
renderResources();
updateStats();


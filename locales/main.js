document.addEventListener('DOMContentLoaded', async () => {
  /* Signal that JS is alive — CSS fade-in only hides elements when this class exists */
  document.body.classList.add('js-ready');

  /* ── Storage shim: use localStorage when miniappsAI.storage is unavailable ── */
  if (!window.miniappsAI) {
    window.miniappsAI = {};
  }
  if (!window.miniappsAI.storage) {
    window.miniappsAI.storage = {
      async getItem(key) { return localStorage.getItem(key); },
      async setItem(key, value) { localStorage.setItem(key, value); },
      async removeItem(key) { localStorage.removeItem(key); },
    };
  }
  const DISCORD_WEBHOOK_URL = 'https://canary.discord.com/api/webhooks/1512183878146719946/KuqpmFiE_3EdKhtZvgvI0orgWtcEslIex-qDAKeeOHhjAcaQDDWSiaah0u25KrRPgrZx';
  const ADMIN_EMAIL = 'parazyteek@gmail.com';

  /* ── Shared video storage config ── */
  /* This is the npoint.io bin ID shared by ALL visitors.
     When admin adds the first video, a bin is created automatically.
     Admin then gives you this code and you hardcode it here. */
  const DEFAULT_SHARED_BIN_ID = null; // e.g. 'a1b2c3d4e5f6'
  const NPOINT_API = 'https://api.npoint.io';

  function getSharedBinId() {
    return DEFAULT_SHARED_BIN_ID || localStorage.getItem('pz_shared_bin_id');
  }

  async function fetchSharedVideos() {
    const binId = getSharedBinId();
    if (!binId) return [];
    try {
      const res = await fetch(NPOINT_API + '/' + binId);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.videos) ? data.videos : [];
    } catch { return []; }
  }

  async function saveSharedVideos(videos) {
    const binId = getSharedBinId();
    const url = binId ? NPOINT_API + '/' + binId : NPOINT_API;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          localStorage.setItem('pz_shared_bin_id', data.id);
          console.log('[Sync] Nouveau bin créé. Code de partage:', data.id);
          return data.id;
        }
      }
    } catch (e) { console.warn('[Sync] Erreur sauvegarde partagée:', e); }
    return null;
  }

  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const navToggle = document.getElementById('navToggle');
  const navLinksContainer = document.getElementById('navLinks');

  /* ── Stores ── */
  const logStore = {
    async getLogs() { const r = await miniappsAI.storage.getItem('pz_logs'); return r ? JSON.parse(r) : []; },
    async saveLogs(l) { await miniappsAI.storage.setItem('pz_logs', JSON.stringify(l.slice(-200))); },
    async addLog(type, action, detail) {
      const l = await this.getLogs(); l.push({ type, action, detail, ts: Date.now() }); await this.saveLogs(l);
      const p = document.getElementById('panel-logs'); if (p?.classList.contains('active')) renderLogsPanel();
    },
  };

  const authStore = {
    async getUsers() { const r = await miniappsAI.storage.getItem('pz_users'); return r ? JSON.parse(r) : []; },
    async saveUsers(u) { await miniappsAI.storage.setItem('pz_users', JSON.stringify(u)); },
    async getSession() { const r = await miniappsAI.storage.getItem('pz_session'); return r ? JSON.parse(r) : null; },
    async setSession(s) { await miniappsAI.storage.setItem('pz_session', JSON.stringify(s)); },
    async clearSession() { await miniappsAI.storage.removeItem('pz_session'); },
  };

  const videoStore = {
    async getCustomVideos() {
      return await fetchSharedVideos();
    },
    async saveCustomVideos(v) {
      const newBinId = await saveSharedVideos(v);
      if (newBinId) updateSyncPanel(newBinId);
    },
  };

  const orderStore = {
    async getOrders() { const r = await miniappsAI.storage.getItem('pz_orders'); return r ? JSON.parse(r) : []; },
    async saveOrders(o) { await miniappsAI.storage.setItem('pz_orders', JSON.stringify(o)); },
    async addOrder(order) { const orders = await this.getOrders(); orders.push(order); await this.saveOrders(orders); },
    async updateOrder(id, updates) {
      const orders = await this.getOrders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) Object.assign(orders[idx], updates, { updatedAt: Date.now() });
      await this.saveOrders(orders);
    },
  };

  const chatStore = {
    async getAll() { const r = await miniappsAI.storage.getItem('pz_chats'); return r ? JSON.parse(r) : {}; },
    async getMessages(orderId) { return (await this.getAll())[orderId] || []; },
    async addMessage(orderId, msg) {
      const all = await this.getAll(); if (!all[orderId]) all[orderId] = []; all[orderId].push(msg);
      try { await miniappsAI.storage.setItem('pz_chats', JSON.stringify(all)); }
      catch (e) { console.warn('[chat] storage write failed:', e); }
    },
  };

  logStore.addLog('visit', 'Visite du site', window.location.href).catch(() => {});

  /* ── Tab Navigation ── */
  function switchTab(tabName) {
    navLinks.forEach(l => l.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    const link = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
    const panel = document.getElementById(`panel-${tabName}`);
    if (link) link.classList.add('active');
    if (panel) {
      panel.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      observeFadeIns(panel);
      if (tabName === 'commandes') renderOrdersList();
    }
    navToggle.classList.remove('open');
    navLinksContainer.classList.remove('open');
  }

  navLinks.forEach(link => link.addEventListener('click', e => { e.preventDefault(); switchTab(link.dataset.tab); }));

  document.querySelectorAll('[data-tab-nav]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      let target = btn.dataset.tabNav;
      if (target === 'contact' && btn.closest('.pricing-card')) {
        target = 'commandes';
        const svc = btn.closest('.pricing-card').dataset.pricing;
        const sel = document.getElementById('order-service');
        if (sel && svc) { sel.value = svc; sel.dispatchEvent(new Event('change')); }
        setTimeout(() => {
          const form = document.getElementById('newOrderForm');
          if (form) { form.classList.remove('hidden'); observeFadeIns(form); }
        }, 150);
      }
      switchTab(target);
    });
  });

  /* ── Mobile Menu ── */
  navToggle.addEventListener('click', () => { navToggle.classList.toggle('open'); navLinksContainer.classList.toggle('open'); });

  /* ── Scroll Fade-in ── */
  let fadeObserver = null;

  function observeFadeIns(container) {
    if (!container || !fadeObserver) return;
    container.querySelectorAll('.fade-in').forEach(el => {
      if (!el.classList.contains('visible')) fadeObserver.observe(el);
    });
  }

  /* Initialize IntersectionObserver safely — runs even if late async calls fail */
  try {
    fadeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observeFadeIns(document.querySelector('.tab-panel.active'));
  } catch (e) {
    console.warn('[fade] observer failed, forcing visibility', e);
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  }

  /* ── Pricing Expand ── */
  document.querySelectorAll('.pricing-clickable').forEach(card => {
    card.querySelector('.pricing-card-front').addEventListener('click', () => {
      const wasOpen = card.classList.contains('open');
      document.querySelectorAll('.pricing-clickable.open').forEach(c => c.classList.remove('open'));
      if (!wasOpen) card.classList.add('open');
    });
  });

  /* ── Lightbox ── */
  const lightbox = document.getElementById('videoLightbox');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  function extractYouTubeId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function openLightbox(videoId) {
    if (!lightbox || !videoId) return;
    lightboxVideo.innerHTML = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    lightbox.classList.remove('hidden'); document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightboxVideo.innerHTML = ''; lightbox.classList.add('hidden'); document.body.style.overflow = '';
  }

  /* ── Admin Sync Panel ── */
  function updateSyncPanel(binId) {
    const el = document.getElementById('syncCodeDisplay');
    if (el) el.textContent = binId || 'Aucun — ajoute ta première vidéo';
  }

  document.getElementById('syncCopyBtn')?.addEventListener('click', () => {
    const binId = getSharedBinId();
    if (binId) {
      navigator.clipboard.writeText(binId).then(() => {
        const btn = document.getElementById('syncCopyBtn');
        btn.textContent = '✅ Copié !';
        setTimeout(() => { btn.textContent = '📋 Copier le code'; }, 2000);
      });
    }
  });

  document.getElementById('syncApplyBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('syncCodeInput');
    const code = input?.value.trim();
    if (!code) { alert('Entre un code de sync.'); return; }
    try {
      const res = await fetch(NPOINT_API + '/' + code);
      if (!res.ok) { alert('Code invalide.'); return; }
      const data = await res.json();
      if (!Array.isArray(data.videos)) { alert('Ce code ne contient pas de vidéos.'); return; }
      localStorage.setItem('pz_shared_bin_id', code);
      updateSyncPanel(code);
      input.value = '';
      alert('✅ Sync activé ! ' + data.videos.length + ' vidéo(s) chargée(s).');
      renderCustomVideos();
    } catch { alert('Erreur de connexion.'); }
  });

  /* ── Custom Videos (visible to ALL visitors, admin-only controls) ── */
  async function renderCustomVideos() {
    const session = await authStore.getSession();
    const isAdmin = session?.email === ADMIN_EMAIL;
    const videos = await videoStore.getCustomVideos();
    const grid = document.getElementById('customVideosGrid');
    const section = document.getElementById('customVideosSection');
    if (!grid || !section) return;
    if (!videos.length) { section.classList.add('hidden'); grid.innerHTML = ''; return; }
    section.classList.remove('hidden');
    grid.innerHTML = videos.map(function(v) {
      var deleteBtn = isAdmin ? '<button class="admin-delete-btn" data-delete-id="' + v.id + '" aria-label="Supprimer">✕</button>' : '';
      var label = v.type === 'youtube' ? 'YouTube' : 'TikTok';
      return '<a href="' + v.url + '" target="_blank" rel="noopener" class="portfolio-item fade-in" data-type="' + v.type + '" data-custom-id="' + v.id + '">' +
        deleteBtn +
        '<div class="portfolio-img" data-label="' + label + '"><div class="portfolio-play">▶</div></div>' +
        '<h3 class="portfolio-name">' + v.title + '</h3>' +
        '<p class="portfolio-cat">' + v.category + '</p>' +
      '</a>';
    }).join('');
    observeFadeIns(grid);
    grid.querySelectorAll('[data-type="youtube"]').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.closest('.admin-delete-btn')) return;
        e.preventDefault();
        const vid = extractYouTubeId(item.getAttribute('href'));
        vid ? openLightbox(vid) : window.open(item.getAttribute('href'), '_blank');
      });
    });
    grid.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Supprimer cette vidéo ?')) return;
        const vids = await videoStore.getCustomVideos();
        const vid = vids.find(v => v.id === btn.dataset.deleteId);
        await videoStore.saveCustomVideos(vids.filter(v => v.id !== btn.dataset.deleteId));
        logStore.addLog('video', 'Vidéo supprimée', vid?.title || btn.dataset.deleteId);
        renderCustomVideos();
      });
    });
  }

  /* ── Orders ── */
  const STATUS_MAP = { pending: 'Pas commencé', in_progress: 'En cours', done: 'Terminé' };
  const STATUS_CLS = { pending: 'status-pending', in_progress: 'status-progress', done: 'status-done' };
  const SERVICE_MAP = { tiktok: 'TikTok / Shorts', youtube: 'YouTube', fivem: 'FiveM', rockstar: 'Rockstar Editor' };
  const TIER_MAP = { standard: 'Standard', pro: 'Pro', premium: 'Premium' };

  function renderOrderCard(order, isAdmin) {
    var st = STATUS_MAP[order.status] || STATUS_MAP.pending;
    var cls = STATUS_CLS[order.status] || STATUS_CLS.pending;
    var date = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    var tierHtml = order.tier ? '<span class="order-tier-badge">' + (TIER_MAP[order.tier] || order.tier) + '</span>' : '';
    var discordHtml = order.discord ? '<span class="order-discord-badge">💬 ' + order.discord + '</span>' : '';
    var clientHtml = isAdmin ? '<span class="order-client-badge">👤 ' + order.userName + ' (' + order.userEmail + ')</span>' : '';
    var adminCtrlHtml = '';
    if (isAdmin) {
      adminCtrlHtml = '<div class="order-admin-ctrl">' +
        '<div class="form-row">' +
          '<div class="form-group"><label>Statut</label>' +
            '<select class="form-input order-status-sel" data-oid="' + order.id + '">' +
              '<option value="pending"' + (order.status === 'pending' ? ' selected' : '') + '>Pas commencé</option>' +
              '<option value="in_progress"' + (order.status === 'in_progress' ? ' selected' : '') + '>En cours</option>' +
              '<option value="done"' + (order.status === 'done' ? ' selected' : '') + '>Terminé</option>' +
            '</select></div>' +
          '<div class="form-group"><label>Lien vidéo</label>' +
            '<input type="url" class="form-input order-video-url" data-oid="' + order.id + '" value="' + (order.videoUrl || '') + '" placeholder="https://..."></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm order-save-btn" data-oid="' + order.id + '">💾 Sauvegarder</button>' +
      '</div>';
    }
    var deliveryHtml = '';
    if (order.status === 'done' && order.videoUrl) {
      deliveryHtml = '<div class="order-delivery"><div class="delivery-banner"><span>✅ Livraison prête !</span><a href="' + order.videoUrl + '" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Voir la vidéo</a></div></div>';
    }
    return '<div class="order-card fade-in" data-order-id="' + order.id + '">' +
      '<div class="order-header">' +
        '<div class="order-meta">' +
          '<span class="order-badge">' + (SERVICE_MAP[order.service] || order.service) + '</span>' +
          tierHtml + discordHtml + clientHtml +
        '</div>' +
        '<div class="order-status ' + cls + '"><span class="status-dot"></span>' + st + '</div>' +
      '</div>' +
      '<p class="order-desc">' + (order.description || 'Pas de description') + '</p>' +
      '<span class="order-date">📅 ' + date + '</span>' +
      adminCtrlHtml + deliveryHtml +
      '<button class="btn btn-outline btn-sm chat-toggle-btn" data-oid="' + order.id + '">💬 Discussion</button>' +
      '<div class="order-chat hidden" data-chat-for="' + order.id + '">' +
        '<div class="chat-messages" data-msgs-for="' + order.id + '"></div>' +
        '<div class="chat-input-row">' +
          '<input type="text" class="form-input chat-msg-input" data-input-for="' + order.id + '" placeholder="Ton message...">' +
          '<button class="btn btn-primary btn-sm chat-send-btn" data-send-for="' + order.id + '">→</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function renderChatMessages(orderId) {
    const messages = await chatStore.getMessages(orderId);
    const el = document.querySelector('[data-msgs-for="' + orderId + '"]');
    if (!el) return;
    if (!messages.length) { el.innerHTML = '<div class="chat-empty"><p>💬 Aucun message encore.</p></div>'; return; }
    const session = await authStore.getSession();
    const email = session?.email || '';
    el.innerHTML = messages.map(msg => {
      const mine = msg.senderEmail === email;
      const time = new Date(msg.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return '<div class="chat-msg ' + (msg.isAdmin ? 'chat-msg-admin' : 'chat-msg-client') + ' ' + (mine ? 'chat-msg-mine' : '') + '">' +
        '<span class="chat-sender">' + msg.senderName + (msg.isAdmin ? ' 👑' : '') + '</span>' +
        '<p class="chat-text">' + msg.text + '</p>' +
        '<span class="chat-time">' + time + '</span>' +
      '</div>';
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  async function renderOrdersList() {
    const session = await authStore.getSession();
    const isAdmin = session?.email === ADMIN_EMAIL;
    const container = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    const loginPrompt = document.getElementById('ordersLoginPrompt');
    const newBtn = document.getElementById('newOrderBtn');

    if (!session) {
      if (container) container.innerHTML = '';
      if (empty) empty.classList.add('hidden');
      if (loginPrompt) loginPrompt.classList.remove('hidden');
      if (newBtn) newBtn.classList.add('hidden');
      return;
    }
    if (loginPrompt) loginPrompt.classList.add('hidden');
    if (newBtn) newBtn.classList.toggle('hidden', isAdmin);

    const all = await orderStore.getOrders();
    const orders = isAdmin ? all : all.filter(o => o.userEmail === session.email);
    if (!orders.length) {
      if (container) container.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
    container.innerHTML = (isAdmin ? '<h3 class="orders-admin-title">👑 Toutes les commandes</h3>' : '') + sorted.map(o => renderOrderCard(o, isAdmin)).join('');
    observeFadeIns(container);
    for (const o of sorted) await renderChatMessages(o.id);
    attachOrderListeners();
  }

  function attachOrderListeners() {
    const c = document.getElementById('ordersList');
    if (!c) return;

    c.querySelectorAll('.chat-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chat = c.querySelector('[data-chat-for="' + btn.dataset.oid + '"]');
        if (chat) { chat.classList.toggle('hidden'); if (!chat.classList.contains('hidden')) chat.querySelector('.chat-msg-input')?.focus(); }
      });
    });

    c.querySelectorAll('.chat-send-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const oid = btn.dataset.sendFor;
        const input = c.querySelector('[data-input-for="' + oid + '"]');
        const text = input?.value.trim(); if (!text) return;
        const session = await authStore.getSession();
        await chatStore.addMessage(oid, { senderEmail: session.email, senderName: session.name, isAdmin: session.email === ADMIN_EMAIL, text, ts: Date.now() });
        input.value = '';
        await renderChatMessages(oid);
        logStore.addLog('contact', 'Message chat', session.name + ' → #' + oid);
      });
    });

    c.querySelectorAll('.chat-msg-input').forEach(input => {
      input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); c.querySelector('[data-send-for="' + input.dataset.inputFor + '"]')?.click(); } });
    });

    c.querySelectorAll('.order-save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const oid = btn.dataset.oid;
        const status = c.querySelector('.order-status-sel[data-oid="' + oid + '"]');
        const video = c.querySelector('.order-video-url[data-oid="' + oid + '"]');
        if (!status) return;
        await orderStore.updateOrder(oid, { status: status.value, videoUrl: video?.value.trim() || '' });
        logStore.addLog('order', 'Commande mise à jour', '#' + oid + ' → ' + (STATUS_MAP[status.value] || status.value));
        await renderOrdersList();
      });
    });
  }

  /* ── Admin UI ── */
  async function updateAdminUI() {
    const session = await authStore.getSession();
    const isAdmin = session?.email === ADMIN_EMAIL;
    document.getElementById('adminControls')?.classList.toggle('hidden', !isAdmin);
    document.getElementById('adminUserBadge')?.classList.toggle('hidden', !isAdmin);
    document.getElementById('navLogs')?.classList.toggle('hidden', !isAdmin);
    document.getElementById('adminSyncPanel')?.classList.toggle('hidden', !isAdmin);
    if (isAdmin) updateSyncPanel(getSharedBinId());
    renderCustomVideos();
    if (isAdmin) renderLogsPanel();
    renderOrdersList();
  }

  /* ── Logs Panel ── */
  let currentLogFilter = 'all';

  function formatLogTime(ts) {
    const d = new Date(ts); const now = new Date();
    const t = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return d.toDateString() === now.toDateString() ? t : d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + t;
  }

  function getLogIcon(type) { return { visit: '📄', auth: '👤', video: '🎬', contact: '📩', order: '📦' }[type] || '📋'; }

  async function renderLogsPanel() {
    const logs = await logStore.getLogs();
    const list = document.getElementById('logsList');
    const empty = document.getElementById('logsEmpty');
    if (!list) return;
    const counts = { total: logs.length, visit: 0, auth: 0, video: 0, contact: 0, order: 0 };
    logs.forEach(l => { if (counts[l.type] !== undefined) counts[l.type]++; });
    const setStat = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setStat('statTotal', counts.total); setStat('statVisits', counts.visit); setStat('statUsers', counts.auth);
    setStat('statMessages', counts.contact); setStat('statVideos', counts.video); setStat('statOrders', counts.order);
    const filtered = currentLogFilter === 'all' ? logs : logs.filter(l => l.type === currentLogFilter);
    const sorted = [...filtered].reverse();
    if (!sorted.length) { list.innerHTML = ''; if (empty) { list.appendChild(empty); empty.style.display = ''; } return; }
    if (empty) empty.style.display = 'none';
    list.innerHTML = sorted.map(l => '<div class="log-entry" data-type="' + l.type + '">' +
      '<div class="log-icon">' + getLogIcon(l.type) + '</div>' +
      '<div class="log-body"><p class="log-action">' + l.action + '</p>' + (l.detail ? '<p class="log-detail">' + l.detail + '</p>' : '') + '</div>' +
      '<span class="log-time">' + formatLogTime(l.ts) + '</span>' +
    '</div>').join('');
  }

  document.querySelectorAll('.logs-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.logs-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); currentLogFilter = btn.dataset.filter; renderLogsPanel();
    });
  });

  document.getElementById('clearLogsBtn')?.addEventListener('click', async () => {
    if (!confirm('Supprimer tous les logs ?')) return;
    await miniappsAI.storage.removeItem('pz_logs'); renderLogsPanel();
  });

  /* ── Auth ── */
  const authTabs = document.querySelectorAll('.auth-tab[data-auth]');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.auth === 'login') { loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); }
      else { loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); }
    });
  });

  async function updateAuthUI() {
    const session = await authStore.getSession();
    const guest = document.getElementById('authGuest');
    const user = document.getElementById('authUser');
    if (session) {
      guest.classList.add('hidden'); user.classList.remove('hidden');
      document.getElementById('avatarLetter').textContent = (session.name || 'U')[0].toUpperCase();
      document.getElementById('authUsername').textContent = session.name;
      document.getElementById('authEmail').textContent = session.email;
      document.getElementById('authSince').textContent = session.since || '—';
      observeFadeIns(user);
    } else {
      guest.classList.remove('hidden'); user.classList.add('hidden');
      observeFadeIns(guest);
    }
    updateAdminUI();
  }

  const regError = document.getElementById('registerError');
  const regErrorText = document.getElementById('registerErrorText');
  const regSuccess = document.getElementById('registerSuccess');

  if (registerForm) registerForm.addEventListener('submit', async e => {
    e.preventDefault(); regError.classList.add('hidden'); regSuccess.classList.add('hidden');
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pw = document.getElementById('reg-password').value;
    const pw2 = document.getElementById('reg-password2').value;
    if (pw !== pw2) { regErrorText.textContent = 'Les mots de passe ne correspondent pas.'; regError.classList.remove('hidden'); return; }
    if (pw.length < 6) { regErrorText.textContent = 'Le mot de passe doit faire au moins 6 caractères.'; regError.classList.remove('hidden'); return; }
    const users = await authStore.getUsers();
    if (users.find(u => u.email === email)) { regErrorText.textContent = 'Cet email est déjà utilisé.'; regError.classList.remove('hidden'); return; }
    const since = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    users.push({ name, email, password: btoa(pw), since });
    await authStore.saveUsers(users);
    await authStore.setSession({ name, email, since });
    logStore.addLog('auth', 'Nouvelle inscription', name + ' (' + email + ')');
    registerForm.reset(); regSuccess.classList.remove('hidden');
    setTimeout(() => updateAuthUI(), 800);
  });

  const loginError = document.getElementById('loginError');

  if (loginForm) loginForm.addEventListener('submit', async e => {
    e.preventDefault(); loginError.classList.add('hidden');
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-password').value;
    const users = await authStore.getUsers();
    const user = users.find(u => u.email === email && atob(u.password) === pw);
    if (!user) { loginError.classList.remove('hidden'); logStore.addLog('auth', 'Connexion échouée', email); return; }
    await authStore.setSession({ name: user.name, email: user.email, since: user.since });
    logStore.addLog('auth', 'Connexion réussie', user.name + ' (' + user.email + ')');
    loginForm.reset(); updateAuthUI();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const s = await authStore.getSession();
    await authStore.clearSession();
    logStore.addLog('auth', 'Déconnexion', s ? s.name + ' (' + s.email + ')' : '—');
    updateAuthUI();
  });

  updateAuthUI().catch(e => { console.warn('[auth] UI init failed:', e); });

  /* ── Admin: Add Video ── */
  document.getElementById('addVideoBtn')?.addEventListener('click', () => document.getElementById('addVideoForm').classList.toggle('hidden'));
  document.getElementById('cancelAddVideo')?.addEventListener('click', () => document.getElementById('addVideoForm').classList.add('hidden'));
  document.getElementById('confirmAddVideo')?.addEventListener('click', async () => {
    const type = document.getElementById('video-type').value;
    const title = document.getElementById('video-title').value.trim();
    const url = document.getElementById('video-url').value.trim();
    const cat = document.getElementById('video-cat').value.trim() || (type === 'youtube' ? 'YouTube' : 'TikTok / Shorts');
    if (!title || !url) { alert('Remplis le titre et le lien.'); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const videos = await videoStore.getCustomVideos();
    videos.push({ id, type, title, url, category: cat });
    await videoStore.saveCustomVideos(videos);
    logStore.addLog('video', 'Vidéo ajoutée', title + ' (' + type + ')');
    document.getElementById('video-title').value = '';
    document.getElementById('video-url').value = '';
    document.getElementById('video-cat').value = '';
    document.getElementById('addVideoForm').classList.add('hidden');
    renderCustomVideos();
    const binId = getSharedBinId();
    if (binId) {
      alert('✅ Vidéo ajoutée !\n\n📋 Code de sync: ' + binId + '\n\nDonne ce code à MiMo pour que toutes les vidéos soient visibles par tout le monde.');
    }
  });

  /* ── Orders: New Order Form ── */
  const newOrderForm = document.getElementById('newOrderForm');
  const orderService = document.getElementById('order-service');
  const orderTierGroup = document.getElementById('orderTierGroup');

  document.getElementById('newOrderBtn')?.addEventListener('click', () => {
    newOrderForm.classList.toggle('hidden');
    if (!newOrderForm.classList.contains('hidden')) observeFadeIns(newOrderForm);
  });
  orderService?.addEventListener('change', () => orderTierGroup?.classList.toggle('hidden', orderService.value !== 'tiktok'));
  document.getElementById('cancelOrder')?.addEventListener('click', () => newOrderForm.classList.add('hidden'));
  document.getElementById('confirmOrder')?.addEventListener('click', async () => {
    const session = await authStore.getSession();
    if (!session) return;
    const discord = document.getElementById('order-discord').value.trim();
    if (!discord) { alert('Indique ton pseudo Discord !'); return; }
    const service = document.getElementById('order-service').value;
    const tier = document.getElementById('order-tier').value;
    const desc = document.getElementById('order-desc').value.trim();
    if (!desc) { alert('Décris ton projet !'); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await orderStore.addOrder({
      id, userEmail: session.email, userName: session.name, service,
      tier: service === 'tiktok' ? tier : null, description: desc, discord,
      status: 'pending', videoUrl: '', createdAt: Date.now(), updatedAt: Date.now(),
    });
    logStore.addLog('order', 'Nouvelle commande', session.name + ' (' + discord + ') — ' + (SERVICE_MAP[service] || service));
    document.getElementById('order-desc').value = '';
    document.getElementById('order-discord').value = '';
    newOrderForm.classList.add('hidden');
    await renderOrdersList();
  });

  /* ── Contact Form ── */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');
  const formLoading = document.getElementById('formLoading');
  const submitBtn = document.getElementById('contactSubmit');

  if (contactForm) contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    formSuccess.classList.add('hidden'); formError.classList.add('hidden');
    formLoading.classList.remove('hidden'); submitBtn.disabled = true;
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const serviceEl = document.getElementById('contact-service');
    const serviceName = serviceEl.options[serviceEl.selectedIndex]?.text || '—';
    const message = document.getElementById('contact-msg').value.trim();
    const payload = { embeds: [{ title: '📩 Nouveau message — Parazyte', color: 0xffffff, fields: [
      { name: '👤 Nom', value: name || '—', inline: true },
      { name: '📧 Email', value: email || '—', inline: true },
      { name: '🎬 Service', value: serviceName, inline: true },
      { name: '💬 Message', value: message || '—' },
    ], timestamp: new Date().toISOString(), footer: { text: 'Parazyte — Formulaire de contact' } }] };
    try {
      const res = await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      logStore.addLog('contact', 'Message envoyé', name + ' — ' + serviceName + ' (' + email + ')');
      contactForm.reset(); formSuccess.classList.remove('hidden');
      setTimeout(() => formSuccess.classList.add('hidden'), 5000);
    } catch (err) {
      logStore.addLog('contact', 'Erreur envoi message', name + ' — ' + err.message);
      formError.classList.remove('hidden'); setTimeout(() => formError.classList.add('hidden'), 6000);
    } finally { formLoading.classList.add('hidden'); submitBtn.disabled = false; }
  });

  /* ── Portfolio Lightbox for static videos ── */
  document.querySelectorAll('.portfolio-item[data-type="youtube"]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const vid = extractYouTubeId(item.getAttribute('href'));
      vid ? openLightbox(vid) : window.open(item.getAttribute('href'), '_blank');
    });
  });
  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxBackdrop?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
});

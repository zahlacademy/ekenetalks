// Theme toggle
const toggleBtn = document.getElementById('themeToggle');
const body = document.body;

toggleBtn?.addEventListener('click', () => {
  const current = body.getAttribute('data-theme');
  body.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  toggleBtn.innerHTML = current === 'dark' 
    ? '<i class="fas fa-moon"></i>' 
    : '<i class="fas fa-sun"></i>';
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

// Search filter
const searchInput = document.getElementById('searchInput');
searchInput?.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase().trim();
  document.querySelectorAll('.card').forEach(card => {
    const title = card.getAttribute('data-title')?.toLowerCase() || '';
    card.classList.toggle('hidden', !title.includes(term));
  });
});

function closeModal(id) { 
  document.getElementById(id).style.display = 'none'; 
}

function openInfo(title, desc) {
  const titleEl = document.getElementById('infoTitle');
  const bodyEl = document.getElementById('infoBody');
  const modal = document.getElementById('infoModal');

  if (titleEl && bodyEl && modal) {
    titleEl.textContent = title;
    bodyEl.textContent = desc;
    modal.style.display = 'flex';
  }
}

// Global stores (only audiobookActs needed now)
window.audiobookActs = {};

// Load content from Firebase (removed duplicate JSON version)
async function loadContent() {
  try {
    if (!window.db || !window.firebaseRef) {
      throw new Error("Firebase Database not initialized. Check index.html script.");
    }

    const dbRef = window.firebaseRef(window.db);
    const snapshot = await window.firebaseGet(window.firebaseChild(dbRef, 'content'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();

      // Convert Firebase numeric-key objects to arrays if needed
      const music      = Array.isArray(data?.music)      ? data.music      : Object.values(data?.music      || {});
      const audiobooks = Array.isArray(data?.audiobooks) ? data.audiobooks : Object.values(data?.audiobooks || {});
      const videos     = Array.isArray(data?.videos)     ? data.videos     : Object.values(data?.videos     || {});

      renderSection('music',      music);
      renderSection('audiobooks', audiobooks);
      renderSection('videos',     videos);
    } else {
      throw new Error('No content data found at /content');
    }
  } catch (err) {
    console.error('Failed to load from Firebase:', err);
    document.querySelectorAll('.card-grid').forEach(grid => {
      grid.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-secondary);">
        Failed to load content from Firebase.<br>Error: ${err.message}
      </p>`;
    });
  }
}

function renderSection(category, items) {
  const grid = document.getElementById(`${category}-grid`);
  if (!grid) return;

  grid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id || '';
    card.dataset.title = (item.title || '').toLowerCase();

    let buttonsHTML = `
      <button class="btn btn-secondary" onclick="openInfo('${(item.title || '').replace(/'/g, "\\'")}', '${(item.description || '').replace(/'/g, "\\'")}')">
        <i class="fas fa-info-circle"></i> ${category === 'music' ? 'Description' : 'About'}
      </button>
    `;

    if (category === 'music') {
      if (item.lyrics && item.lyrics.trim()) {
        buttonsHTML += `
          <button class="btn btn-outline" onclick="showLyrics(this)">
            <i class="fas fa-file-alt"></i> Lyrics
          </button>
        `;
      }
      if (item.downloadUrl) {
        buttonsHTML += `
          <a href="${item.downloadUrl}" target="_blank" class="btn btn-primary">
            <i class="fas fa-download"></i> Download
          </a>
        `;
      }

      const contentHTML = item.lyrics && item.lyrics.trim() ? `
        <div class="card-content" style="display:none;">
          <div class="lyrics">
            <button class="close-btn" onclick="this.closest('.card-content').style.display='none'">×</button>
            ${item.lyrics.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : '';

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${item.title || 'Untitled'}</div>
          <div class="card-buttons">${buttonsHTML}</div>
        </div>
        ${contentHTML}
      `;
    } else if (category === 'audiobooks') {
      window.audiobookActs[item.id] = item.acts || [];

      if (window.audiobookActs[item.id].length > 0) {
        buttonsHTML += `
          <button class="btn btn-outline" onclick="openAudiobookActs(this)">
            <i class="fas fa-podcast"></i> Open
          </button>
        `;
      } else if (item.listenUrl) {
        buttonsHTML += `
          <a href="${item.listenUrl}" target="_blank" class="btn btn-outline">
            <i class="fas fa-podcast"></i> Listen →
          </a>
        `;
      }

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${item.title || 'Untitled'}</div>
          <div class="card-buttons">${buttonsHTML}</div>
        </div>
      `;
    } else if (category === 'videos') {
      if (item.watchUrl) {
        buttonsHTML += `
          <a href="${item.watchUrl}" target="_blank" class="btn btn-outline">
            <i class="fas fa-play-circle"></i> Watch →
          </a>
        `;
      }

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${item.title || 'Untitled'}</div>
          <div class="card-buttons">${buttonsHTML}</div>
        </div>
      `;
    }

    grid.appendChild(card);
  });
}

function showLyrics(btn) {
  const card = btn.closest('.card');
  const content = card.querySelector('.card-content');

  if (!content) return;

  document.querySelectorAll('.card-content').forEach(el => {
    if (el !== content) el.style.display = 'none';
  });

  content.style.display = content.style.display === 'block' ? 'none' : 'block';

  if (content.style.display === 'block') {
    setTimeout(() => {
      content.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

function openAudiobookActs(btn) {
  const card = btn.closest('.card');
  const bookId = card.dataset.id;
  const modal = document.getElementById('actsModal');
  const optionsEl = document.getElementById('actsOptions');

  if (!modal || !optionsEl) {
    console.warn('Audiobook acts modal or options element not found');
    return;
  }

  optionsEl.innerHTML = '';

  const acts = window.audiobookActs?.[bookId] || [];

  if (acts.length === 0) {
    optionsEl.innerHTML = '<p style="padding:20px; text-align:center;">No acts available yet.</p>';
  } else {
    acts.forEach(act => {
      const b = document.createElement('a');
      b.className = 'platform-btn';
      b.href = act.listenUrl || '#';
      b.target = '_blank';
      b.innerHTML = `<i class="fas fa-podcast"></i> Listen to ${act.name}`;
      optionsEl.appendChild(b);
    });
  }

  modal.style.display = 'flex';
}

// Load content when page is ready
document.addEventListener('DOMContentLoaded', loadContent);
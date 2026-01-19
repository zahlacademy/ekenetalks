// Theme toggle
const toggleBtn = document.getElementById('themeToggle');
const body = document.body;

toggleBtn.addEventListener('click', () => {
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
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Search filter
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => {
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
  document.getElementById('infoTitle').textContent = title;
  document.getElementById('infoBody').textContent = desc;
  document.getElementById('infoModal').style.display = 'flex';
}

// Global store for music platform embeds
window.musicEmbeds = {};

// Load content from JSON
async function loadContent() {
  try {
    const response = await fetch('content.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    renderSection('music', data.music || []);
    renderSection('audiobooks', data.audiobooks || []);
    renderSection('videos', data.videos || []);

  } catch (err) {
    console.error('Failed to load content.json:', err);
    document.querySelectorAll('.card-grid').forEach(grid => {
      grid.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-secondary);">
        Failed to load content.<br>Please check content.json file.
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
      buttonsHTML += `
        <button class="btn btn-outline" onclick="openMusicPlatforms(this)">
          <i class="fas fa-headphones"></i> Listen
        </button>
      `;
      if (item.downloadUrl) {
        buttonsHTML += `
          <a href="${item.downloadUrl}" target="_blank" class="btn btn-primary">
            <i class="fas fa-download"></i> Download
          </a>
        `;
      }

      window.musicEmbeds[item.id] = item.platforms || {};

      const contentHTML = item.lyrics ? `
        <div class="card-content">
          <div class="embed-container" id="embed-${item.id}"></div>
          <div class="lyrics">
            <button class="close-btn" onclick="this.closest('.card-content').style.display='none'">×</button>
            ${item.lyrics.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : `
        <div class="card-content">
          <div class="embed-container" id="embed-${item.id}"></div>
        </div>
      `;

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${item.title || 'Untitled'}</div>
          <div class="card-buttons">${buttonsHTML}</div>
        </div>
        ${contentHTML}
      `;
    } else {
      const icon = category === 'audiobooks' ? 'fas fa-podcast' : 'fas fa-play-circle';
      const label = category === 'audiobooks' ? 'Listen →' : 'Watch →';
      const url = category === 'audiobooks' ? item.listenUrl : item.watchUrl;

      if (url) {
        buttonsHTML += `
          <a href="${url}" target="_blank" class="btn btn-outline">
            <i class="${icon}"></i> ${label}
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

function openMusicPlatforms(btn) {
  const card = btn.closest('.card');
  const trackId = card.dataset.id;
  const optionsEl = document.getElementById('platformOptions');
  optionsEl.innerHTML = '';

  const platforms = [
    { name: 'Spotify',     icon: 'fab fa-spotify',   key: 'spotify'    },
    { name: 'Boomplay',    icon: 'fas fa-play',      key: 'boomplay'   },
    { name: 'Audiomack',   icon: 'fas fa-headphones',key: 'audiomack'  },
    { name: 'Apple Music', icon: 'fab fa-itunes-note',key: 'apple'    }
  ];

  platforms.forEach(p => {
    const b = document.createElement('button');
    b.className = 'platform-btn';
    b.innerHTML = `<i class="${p.icon}"></i> ${p.name}`;
    b.onclick = () => {
      const embedCode = window.musicEmbeds?.[trackId]?.[p.key];
      if (embedCode) {
        const container = card.querySelector(`#embed-${trackId}`);
        if (container) {
          container.innerHTML = embedCode;
          const content = card.querySelector('.card-content');
          document.querySelectorAll('.card-content').forEach(el => el.style.display = 'none');
          content.style.display = 'block';
        }
      } else {
        alert(`No ${p.name} embed available for this track.`);
      }
      closeModal('platformsModal');
    };
    optionsEl.appendChild(b);
  });

  document.getElementById('platformsModal').style.display = 'flex';
}

// Load content when page is ready
document.addEventListener('DOMContentLoaded', loadContent);
const SUPABASE_URL  = 'https://zezigpysakremuredzwj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplemlncHlzYWtyZW11cmVkendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NjkxMzAsImV4cCI6MjA5MzE0NTEzMH0.iH6DMmKH5e28TpnIezvyqn06m7LPyJGmB3bZLHi6Z0s';

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.add('light');
}

document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);

function scaleAll() {
  document.querySelectorAll('.preview-wrap').forEach(wrap => {
    const iframe = wrap.querySelector('iframe');
    if (iframe) iframe.style.transform = `scale(${wrap.clientWidth / 1280})`;
  });
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function loadCommitDates() {
  const els = document.querySelectorAll('.card-updated[data-repo]');
  await Promise.all([...els].map(async el => {
    const repo = el.dataset.repo;
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`);
      if (!res.ok) throw new Error();
      const [row] = await res.json();
      const date = row?.commit?.committer?.date ?? row?.commit?.author?.date;
      el.textContent = `Last commit · ${date ? fmtDate(date) : '—'}`;
    } catch {
      el.textContent = 'Last commit · unavailable';
    }
  }));
}

async function loadVisitCount() {
  const el = document.getElementById('visit-text');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_page_views`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    if (!res.ok) throw new Error();
    const count = await res.json();
    el.textContent = `${Number(count).toLocaleString()} visitor${count === 1 ? '' : 's'}`;
  } catch {
    el.textContent = '— visitors';
  }
}

window.addEventListener('DOMContentLoaded', () => { scaleAll(); loadCommitDates(); loadVisitCount(); });
window.addEventListener('resize', scaleAll);

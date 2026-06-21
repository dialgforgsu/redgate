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

window.addEventListener('DOMContentLoaded', () => { scaleAll(); loadCommitDates(); loadVisitCount(); initChat(); });
window.addEventListener('resize', scaleAll);

// ── chatbot ───────────────────────────────────────────────────────────────────

const FORMSPREE = 'https://formspree.io/f/mgorqnqy';

const TOOLS = {
  checker: {
    name: 'Redgate Release Checker',
    desc: 'An internal aggregator that pulls release notes and maps them onto the Product Roadmap — giving a live view of what Redgate is currently shipping and focused on.',
    link: 'https://dialgforgsu.github.io/re-check/'
  },
  history: {
    name: 'Redgate Visual History',
    desc: 'An interactive visual timeline of Redgate\'s product portfolio — showing where each product came from, how it evolved, and why the lineup looks the way it does today.',
    link: 'https://dialgforgsu.github.io/rg-history/'
  },
  converter: {
    name: 'Redgate Monitor Alert Converter',
    desc: 'A migration tool that converts alert configurations from DPA, SQL Sentry, Idera, and Quest Spotlight into Redgate Monitor format — so customers don\'t have to rebuild their monitoring rules from scratch.',
    link: 'https://dialgforgsu.github.io/alertconverter/'
  }
};

const MENU_ITEMS = [
  { label: 'Release Checker', key: 'checker'  },
  { label: 'Visual History',  key: 'history'  },
  { label: 'Alert Converter', key: 'converter' },
  { label: 'Contact G-Su',    key: 'contact'  },
];

const SUPPORT_ITEMS = [
  {
    label: 'Buy me a coffee',
    sub: 'Support these tools',
    href: 'https://buymeacoffee.com/gsupaek',
    cls: 'chat-support-coffee',
    icon: '<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h9a1 1 0 0 1 1 1v1h1.5a2.5 2.5 0 0 1 0 5H12v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V2zm10 5h1.5a1.5 1.5 0 0 0 0-3H12v3z"/></svg>'
  },
];

let chatState = 'idle';
let contactData = {};

function initChat() {
  const toggle = document.getElementById('chat-toggle');
  const win    = document.getElementById('chat-window');
  const close  = document.getElementById('chat-close');
  const input  = document.getElementById('chat-input');
  const send   = document.getElementById('chat-send');

  toggle.addEventListener('click', () => {
    const open = win.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    if (open) {
      if (!document.querySelector('.chat-msg')) {
        addBotMessage("Hi! What would you like to know?");
        showMainMenu();
      }
      input.focus();
    }
  });

  close.addEventListener('click', () => {
    win.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  });

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function addMessage(role, text) {
  const log  = document.getElementById('chat-log');
  const wrap = document.createElement('div');
  wrap.className = `chat-msg chat-msg-${role}`;
  const p = document.createElement('p');
  p.textContent = text;
  wrap.appendChild(p);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function addBotMessage(text)  { addMessage('bot',  text); }
function addUserMessage(text) { addMessage('user', text); }

function showTyping() {
  const log  = document.getElementById('chat-log');
  const wrap = document.createElement('div');
  wrap.id = 'chat-typing';
  wrap.className = 'chat-msg chat-msg-bot chat-typing';
  const p = document.createElement('p');
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    p.appendChild(dot);
  }
  wrap.appendChild(p);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function hideTyping() { document.getElementById('chat-typing')?.remove(); }

function clearActions() {
  document.querySelectorAll('.chat-actions, .chat-support, .chat-back').forEach(el => el.remove());
}

function showMainMenu() {
  clearActions();
  const log  = document.getElementById('chat-log');
  const wrap = document.createElement('div');
  wrap.className = 'chat-actions';

  MENU_ITEMS.forEach(({ label, key }) => {
    const btn = document.createElement('button');
    btn.className = 'chat-action-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      clearActions();
      addUserMessage(label);
      setTimeout(() => handleMenuKey(key), 80);
    });
    wrap.appendChild(btn);
  });

  log.appendChild(wrap);

  const support = document.createElement('div');
  support.className = 'chat-support';
  SUPPORT_ITEMS.forEach(({ label, sub, href, icon, cls }) => {
    const a = document.createElement('a');
    a.className = `chat-support-card ${cls}`;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const ic = document.createElement('span');
    ic.className = 'chat-support-icon';
    ic.innerHTML = icon;

    const txt = document.createElement('span');
    txt.className = 'chat-support-text';
    const l = document.createElement('span');
    l.className = 'chat-support-label';
    l.textContent = label;
    const s = document.createElement('span');
    s.className = 'chat-support-sub';
    s.textContent = sub;
    txt.append(l, s);

    a.append(ic, txt);
    support.appendChild(a);
  });

  log.appendChild(support);
  log.scrollTop = log.scrollHeight;
}

function showBackButton() {
  clearActions();
  const log  = document.getElementById('chat-log');
  const wrap = document.createElement('div');
  wrap.className = 'chat-back';
  const btn = document.createElement('button');
  btn.className = 'chat-back-btn';
  btn.textContent = 'Main Menu';
  btn.addEventListener('click', () => { clearActions(); showMainMenu(); });
  wrap.appendChild(btn);
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

function botReply(text, showBack = false, delay = 480) {
  showTyping();
  setTimeout(() => {
    hideTyping();
    addBotMessage(text);
    if (showBack) showBackButton();
  }, delay);
}

// ── input handling ────────────────────────────────────────────────────────────

function handleSend() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  clearActions();
  addUserMessage(text);
  setTimeout(() => processInput(text), 80);
}

function handleMenuKey(key) {
  if (key === 'contact') {
    chatState = 'name';
    botReply("Sure! What's your name?");
    return;
  }
  const tool = TOOLS[key];
  botReply(`${tool.name}\n\n${tool.desc}\n\nLink: ${tool.link}`, true);
}

function processInput(raw) {
  const t = raw.toLowerCase().trim();

  // ── contact flow ─────────────────────────────────────────────────────────────
  if (chatState === 'name') {
    contactData.name = raw;
    chatState = 'email';
    botReply(`Nice to meet you, ${raw}! What's your email address?`);
    return;
  }
  if (chatState === 'email') {
    if (!/.+@.+\..+/.test(t)) {
      botReply("That doesn't look like a valid email — could you try again?");
      return;
    }
    contactData.email = raw;
    chatState = 'message';
    botReply("Got it. What would you like to say to G-Su?");
    return;
  }
  if (chatState === 'message') {
    contactData.message = raw;
    chatState = 'submitting';
    submitContact();
    return;
  }

  if (/\b(cancel|stop|never ?mind|quit|exit)\b/.test(t) && chatState !== 'idle') {
    chatState = 'idle';
    contactData = {};
    botReply("No problem.", true);
    return;
  }

  // ── keyword intent ────────────────────────────────────────────────────────────
  if (/\b(contact|message|email|reach|write|talk|ping|get in touch|send)\b/.test(t)) {
    chatState = 'name';
    botReply("Sure! What's your name?");
    return;
  }
  if (/\b(release\s*check|re-?check|roadmap|release\s*note)\b/.test(t)) {
    botReply(`${TOOLS.checker.name}\n\n${TOOLS.checker.desc}\n\nLink: ${TOOLS.checker.link}`, true);
    return;
  }
  if (/\b(visual\s*hist|rg-?hist|timeline|product\s*hist|history)\b/.test(t)) {
    botReply(`${TOOLS.history.name}\n\n${TOOLS.history.desc}\n\nLink: ${TOOLS.history.link}`, true);
    return;
  }
  if (/\b(alert|convert|monitor|sql\s*sentry|idera|dpa|quest|spotlight|migrat)\b/.test(t)) {
    botReply(`${TOOLS.converter.name}\n\n${TOOLS.converter.desc}\n\nLink: ${TOOLS.converter.link}`, true);
    return;
  }
  if (/\b(tools?|help|what|list|show|all|purpose|about|hi+|hey|hello)\b/.test(t)) {
    botReply("Here's what I can help with:", true);
    setTimeout(() => showMainMenu(), 560);
    return;
  }

  botReply("I didn't quite catch that.", true);
}

async function submitContact() {
  showTyping();
  try {
    const res = await fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name: contactData.name, email: contactData.email, message: contactData.message })
    });
    hideTyping();
    addBotMessage(res.ok
      ? `Sent! G-Su will get back to you at ${contactData.email}.`
      : "Something went wrong — please try again in a moment."
    );
  } catch {
    hideTyping();
    addBotMessage("Couldn't send that — check your connection and try again.");
  } finally {
    chatState = 'idle';
    contactData = {};
    showBackButton();
  }
}

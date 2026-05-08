const WATCH_PLUGIN = "signalk-ais-plus-apple-watch";
const AIS_PLUS_PLUGIN = "signalk-ais-plus";

const els = {
  enableSound: document.getElementById("enableSound"),
  status: document.getElementById("status"),
  messages: document.getElementById("messages"),
};

let settings = {
  fontSizePx: 24,
  refreshSeconds: 2,
  maxMessages: 12,
  beepEnabled: true,
  beepFrequencyHz: 880,
  beepDurationMs: 180,
};
let lastMessageKey = "";
let audioContext = null;
let soundEnabled = false;

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

async function requestJson(url) {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401) {
    location.href = "/admin/#/login";
    return null;
  }
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadSettings() {
  const data = await requestJson(`/plugins/${WATCH_PLUGIN}/settings`);
  settings = { ...settings, ...(data?.settings || {}) };
  document.documentElement.style.setProperty(
    "--message-font-size",
    `${settings.fontSizePx}px`,
  );
}

function messageKey(entry) {
  return [
    entry?.announcementId,
    entry?.ts,
    entry?.message,
    entry?.vesselName,
  ]
    .filter(Boolean)
    .join("|");
}

function renderMessages(entries) {
  const messages = entries.slice(0, settings.maxMessages);
  if (!messages.length) {
    els.messages.innerHTML = '<p class="empty">No messages yet.</p>';
    return;
  }
  els.messages.innerHTML = messages
    .map((entry) => {
      const time = entry.ts ? new Date(entry.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) : "";
      return `<article class="message"><time>${escapeHtml(time)}</time>${escapeHtml(
        entry.message || "",
      )}</article>`;
    })
    .join("");
}

async function beep() {
  if (!settings.beepEnabled || !soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") await audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = settings.beepFrequencyHz;
  gain.gain.value = 0.001;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + settings.beepDurationMs / 1000);
  oscillator.start(now);
  oscillator.stop(now + settings.beepDurationMs / 1000 + 0.04);
}

async function loadMessages() {
  const data = await requestJson(`/plugins/${AIS_PLUS_PLUGIN}/announcementLog`);
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const nextKey = messageKey(entries[0]);
  const isFresh = nextKey && lastMessageKey && nextKey !== lastMessageKey;

  renderMessages(entries);
  if (isFresh) {
    els.messages.scrollTop = 0;
    await beep();
  }
  if (nextKey) lastMessageKey = nextKey;
  els.status.textContent = entries.length ? "Live" : "Waiting";
  els.status.classList.remove("error");
}

async function enableSound() {
  soundEnabled = true;
  els.enableSound.classList.add("enabled");
  els.status.textContent = "Sound on";
  await beep();
}

async function refreshLoop() {
  try {
    await loadMessages();
  } catch (error) {
    console.error(error);
    els.status.textContent = error.message;
    els.status.classList.add("error");
  } finally {
    setTimeout(refreshLoop, Math.max(1000, settings.refreshSeconds * 1000));
  }
}

els.enableSound.addEventListener("click", () => {
  enableSound().catch((error) => {
    console.error(error);
    els.status.textContent = "Sound blocked";
    els.status.classList.add("error");
  });
});

loadSettings()
  .then(refreshLoop)
  .catch((error) => {
    console.error(error);
    els.status.textContent = error.message;
    els.status.classList.add("error");
    refreshLoop();
  });

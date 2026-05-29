const WATCH_SETTINGS_PATH = "/signalk/v1/api/vessels/self/plugins/aisPlusAppleWatch/settings";
const WATCH_MESSAGES_PATH = "/signalk/v1/api/vessels/self/plugins/aisPlusAppleWatch/messages";
const AIS_PLUS_COMPACT_FEED_PATH = "/signalk/v1/api/vessels/self/plugins/aisPlus/uiState/compactAlertFeed";

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

function signalKValue(data, fallback) {
  if (
    data &&
    typeof data === "object" &&
    Object.prototype.hasOwnProperty.call(data, "value")
  ) {
    return data.value;
  }
  return data ?? fallback;
}

async function loadSettings() {
  try {
    const data = await requestJson(WATCH_SETTINGS_PATH);
    settings = { ...settings, ...(signalKValue(data, {}) || {}) };
  } catch (error) {
    console.warn("Using default watch settings", error);
  }
  document.documentElement.style.setProperty(
    "--message-font-size",
    `${settings.fontSizePx}px`,
  );
}

function messageKey(entry) {
  return [
    entry?.id,
    entry?.announcementId,
    entry?.path,
    entry?.vesselName,
  ]
    .filter(Boolean)
    .join("|");
}

function renderMessages(entries) {
  const now = Date.now();
  const messages = entries
    .filter((entry) => !isExpired(entry, now))
    .slice(0, settings.maxMessages);
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
        entry.headline || entry.message || "",
      )}</article>`;
    })
    .join("");
}

function isExpired(entry, now = Date.now()) {
  if (!entry?.expiresAt) return false;
  const expiresAt = new Date(entry.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= now;
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
  const entries = await loadCompactMessages();
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

async function loadCompactMessages() {
  try {
    const data = await requestJson(AIS_PLUS_COMPACT_FEED_PATH);
    const feed = signalKValue(data, null);
    if (Array.isArray(feed?.entries)) return feed.entries;
  } catch (error) {
    console.warn("Using legacy watch message feed", error);
  }
  const data = await requestJson(WATCH_MESSAGES_PATH);
  const value = signalKValue(data, []);
  return Array.isArray(value) ? value : [];
}

async function enableSound() {
  soundEnabled = true;
  els.enableSound.classList.add("enabled");
  els.enableSound.setAttribute("aria-pressed", "true");
  els.enableSound.textContent = "Sound off";
  els.status.textContent = "Sound on";
  await beep();
}

async function toggleSound() {
  if (soundEnabled) {
    soundEnabled = false;
    els.enableSound.classList.remove("enabled");
    els.enableSound.setAttribute("aria-pressed", "false");
    els.enableSound.textContent = "Sound on";
    els.status.textContent = "Sound off";
    return;
  }
  await enableSound();
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
  toggleSound().catch((error) => {
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

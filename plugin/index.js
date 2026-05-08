const packageInfo = require("../package.json");

const SETTINGS_PATH = "plugins.aisPlusAppleWatch.settings";
const MESSAGES_PATH = "plugins.aisPlusAppleWatch.messages";
const MAX_STORED_MESSAGES = 50;

module.exports = function aisPlusAppleWatch(app) {
  const plugin = {};
  let options = normalizeOptions({});
  let unsubscribes = [];
  let messages = [];

  plugin.id = "signalk-ais-plus-apple-watch";
  plugin.name = "AIS Plus Alerts";
  plugin.description =
    "Minimal Apple Watch webapp that displays AIS Plus alert announcement messages.";

  plugin.schema = {
    type: "object",
    properties: {
      fontSizePx: {
        type: "integer",
        title: "Message font size (px)",
        description: "White-on-black message text size for the Apple Watch page.",
        default: 24,
        minimum: 12,
        maximum: 48,
      },
      refreshSeconds: {
        type: "number",
        title: "Refresh interval (seconds)",
        description: "How often the watch page polls AIS Plus for new messages.",
        default: 2,
        minimum: 1,
        maximum: 30,
      },
      maxMessages: {
        type: "integer",
        title: "Maximum messages shown",
        default: 12,
        minimum: 1,
        maximum: 50,
      },
      beepEnabled: {
        type: "boolean",
        title: "Enable browser beep on fresh message",
        description:
          "Apple Watch browser audio may still require a tap on the page before sound is allowed.",
        default: true,
      },
      beepFrequencyHz: {
        type: "integer",
        title: "Beep frequency (Hz)",
        default: 880,
        minimum: 220,
        maximum: 2200,
      },
      beepDurationMs: {
        type: "integer",
        title: "Beep duration (ms)",
        default: 180,
        minimum: 40,
        maximum: 1000,
      },
    },
  };

  plugin.start = (pluginOptions = {}) => {
    options = normalizeOptions(pluginOptions);
    publishWatchState();
    subscribeToAisPlusAnnouncements();
    app.setPluginStatus(`Started v${packageInfo.version}`);
  };

  plugin.stop = () => {
    for (const unsubscribe of unsubscribes) {
      try {
        unsubscribe();
      } catch (error) {
        app.debug(`[${plugin.id}] unsubscribe failed: ${error.message}`);
      }
    }
    unsubscribes = [];
  };

  plugin.registerWithRouter = function registerWithRouter(router) {
    router.get("/settings", (_req, res) => {
      res.json({
        ok: true,
        plugin: plugin.id,
        version: packageInfo.version,
        settings: options,
      });
    });
  };

  return plugin;

  function subscribeToAisPlusAnnouncements() {
    if (!app.subscriptionmanager?.subscribe) {
      app.debug(`[${plugin.id}] Signal K subscription manager is not available`);
      return;
    }

    app.subscriptionmanager.subscribe(
      {
        context: "vessels.self",
        subscribe: [
          {
            path: "notifications.collision",
            policy: "instant",
            format: "delta",
          },
          {
            path: "notifications.collision.*",
            policy: "instant",
            format: "delta",
          },
        ],
      },
      unsubscribes,
      (error) => app.error(`[${plugin.id}] subscription error: ${error}`),
      (delta) => handleDelta(delta),
    );
  }

  function handleDelta(delta) {
    for (const update of delta.updates || []) {
      for (const value of update.values || []) {
        handleNotificationValue(value);
      }
    }
  }

  function handleNotificationValue(value) {
    if (!value?.path?.startsWith("notifications.collision")) return;

    if (value.path === "notifications.collision" && value.value && typeof value.value === "object") {
      for (const [id, notification] of Object.entries(value.value)) {
        addMessageFromNotification(`notifications.collision.${id}`, notification);
      }
      return;
    }

    addMessageFromNotification(value.path, value.value);
  }

  function addMessageFromNotification(pathName, value) {
    if (!value || typeof value !== "object") return;
    const alertEvent = value?.data?.alertEvent || {};
    const announcement = value?.data?.announcement || {};
    const message = String(alertEvent.message || value?.message || "").trim();
    if (!message) return;

    const id = String(alertEvent.id || announcement.id || `${pathName}-${Date.now()}`);
    const entry = {
      id,
      ts: alertEvent.ts || announcement.ts || new Date().toISOString(),
      path: pathName,
      vesselName: alertEvent.vesselName || announcement.vesselName || value?.data?.vesselName || "",
      severity: alertEvent.state || value?.state || "normal",
      category: alertEvent.category || value?.data?.category || "",
      message,
    };

    messages = [entry, ...messages.filter((item) => item.id !== id)].slice(
      0,
      MAX_STORED_MESSAGES,
    );
    publishWatchState();
  }

  function publishWatchState() {
    app.handleMessage(plugin.id, {
      context: "vessels.self",
      updates: [
        {
          values: [
            {
              path: SETTINGS_PATH,
              value: options,
            },
            {
              path: MESSAGES_PATH,
              value: messages,
            },
          ],
        },
      ],
    });
  }
};

function normalizeOptions(value = {}) {
  return {
    fontSizePx: clampInteger(value.fontSizePx, 24, 12, 48),
    refreshSeconds: clampNumber(value.refreshSeconds, 2, 1, 30),
    maxMessages: clampInteger(value.maxMessages, 12, 1, 50),
    beepEnabled: value.beepEnabled !== false,
    beepFrequencyHz: clampInteger(value.beepFrequencyHz, 880, 220, 2200),
    beepDurationMs: clampInteger(value.beepDurationMs, 180, 40, 1000),
  };
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

module.exports.normalizeOptions = normalizeOptions;

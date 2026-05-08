const packageInfo = require("../package.json");

module.exports = function aisPlusAppleWatch(app) {
  const plugin = {};
  let options = normalizeOptions({});

  plugin.id = "signalk-ais-plus-apple-watch";
  plugin.name = "AIS Plus Apple Watch";
  plugin.description =
    "Minimal Apple Watch webapp that displays AIS Plus announcement messages.";

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
    app.setPluginStatus(`Started v${packageInfo.version}`);
  };

  plugin.stop = () => {};

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

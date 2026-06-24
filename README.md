# Superseded

This repository is no longer maintained for new Watchkeeper installs. It is retained on GitHub for historical reference only.

Superseded by `signalk-watchkeeper-alerts`, which provides the current crew alert viewer and small-screen alert display over Notifications Plus projections.

# AIS Plus Alerts

AIS Plus Alerts is a very small Signal K webapp for Apple Watch screens.

It displays the compact AIS Plus alert feed as white text on a black background. It is built specifically for AIS Plus alerts and is not a general-purpose AIS app display. When a fresh AIS Plus message appears, the page scrolls back to the newest message at the top and tries to play a short browser beep. Updates to the same active vessel alert, such as changing CPA or TCPA text, refresh the display without beeping again.

The watch browser may require a tap before sound is allowed. Tap **Sound on** after opening the page. Tap **Sound off** to silence browser beeps. If watchOS blocks browser audio, the page still updates visually.

Apple Watch can play media audio to paired Bluetooth headphones or speakers, and supported models can also play some media through the Watch speaker. The watchOS browser is more limited than Safari on iPhone or Mac, so this app treats sound as a best-effort browser beep rather than a guaranteed alarm path.

## Install

```bash
cd ~/.signalk
npm install git+ssh://git@ssh.github.com:443/mcdonaldajr/signalk-ais-plus-apple-watch.git#v1.0.1 --omit=dev --no-package-lock
sudo systemctl restart signalk
```

Then enable **AIS Plus Alerts** in the Signal K admin UI if it is not already enabled.

Open:

```text
https://<your-signal-k-host>:3443/signalk-ais-plus-apple-watch/
```

## Configuration

The plugin configuration controls:

- message font size
- refresh interval
- maximum messages shown
- browser beep enable/disable
- beep frequency and duration

The page deliberately avoids charts, graphics, controls, and colours other than white text on black.

## Requirements

- AIS Plus must be installed and running.
- The watch page reads `vessels.self.plugins.aisPlus.uiState.compactAlertFeed` from AIS Plus.
- If that compact AIS Plus feed is unavailable, the plugin falls back to its older local read-only feed under `vessels.self.plugins.aisPlusAppleWatch`.
- The watch page reads Signal K data API paths, not plugin control routes, so it can work with Signal K **Allow Readonly Access**.
- Browser sound depends on watchOS browser support and user gesture rules.

## Test

```bash
npm test
```

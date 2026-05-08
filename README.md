# AIS Plus Apple Watch

AIS Plus Apple Watch is a very small Signal K webapp for Apple Watch screens.

It displays the AIS Plus announcement log as white text on a black background. When a fresh AIS Plus message appears, the page scrolls back to the newest message at the top and tries to play a short browser beep.

The watch browser may require a tap before sound is allowed. Tap **Tap for sound** after opening the page. If watchOS blocks browser audio, the page still updates visually.

## Install

```bash
cd ~/.signalk
npm install git+ssh://git@ssh.github.com:443/mcdonaldajr/signalk-ais-plus-apple-watch.git#v0.1.0 --omit=dev --no-package-lock
sudo systemctl restart signalk
```

Then enable **AIS Plus Apple Watch** in the Signal K admin UI if it is not already enabled.

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
- The watch page reads `/plugins/signalk-ais-plus/announcementLog`.
- Browser sound depends on watchOS browser support and user gesture rules.

## Test

```bash
npm test
```

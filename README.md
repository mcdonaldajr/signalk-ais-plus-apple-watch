# AIS Plus Alerts

AIS Plus Alerts is a very small Signal K webapp for Apple Watch screens.

It displays the AIS Plus alert announcement log as white text on a black background. It is built specifically for AIS Plus alerts and is not a general-purpose AIS app display. When a fresh AIS Plus message appears, the page scrolls back to the newest message at the top and tries to play a short browser beep.

The watch browser may require a tap before sound is allowed. Tap **Sound** after opening the page. If watchOS blocks browser audio, the page still updates visually.

Apple Watch can play media audio to paired Bluetooth headphones or speakers, and supported models can also play some media through the Watch speaker. The watchOS browser is more limited than Safari on iPhone or Mac, so this app treats sound as a best-effort browser beep rather than a guaranteed alarm path.

## Install

```bash
cd ~/.signalk
npm install git+ssh://git@ssh.github.com:443/mcdonaldajr/signalk-ais-plus-apple-watch.git#v0.1.3 --omit=dev --no-package-lock
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
- The plugin subscribes to AIS Plus collision notifications and republishes a small read-only watch feed under `vessels.self.plugins.aisPlusAppleWatch`.
- The watch page reads Signal K data API paths, not plugin control routes, so it can work with Signal K **Allow Readonly Access**.
- Browser sound depends on watchOS browser support and user gesture rules.

## Test

```bash
npm test
```

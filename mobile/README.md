# CareGesture AI Mobile Monitor

This is the Flutter mobile monitor for the CareGesture AI project.

## What it does
- Connects to the Node/Express server.
- Shows new patient gesture alerts automatically.
- Refreshes every 2 seconds.
- Speaks new alerts using the phone's native TTS.
- Supports acknowledge, resolve and escalate.
- Has a Connection Settings screen where you can enter the computer IP or the deployed server URL.

## Same Wi-Fi (computer + phone)
1. Start the Node server on the computer.
2. Find the computer's local IPv4 address, for example `192.168.1.10`.
3. Make sure Windows Firewall allows the Node server port `10000` on the private network.
4. On the phone open Connection Settings and enter:
   `http://192.168.1.10:10000`
5. Tap Connect.

The server listens on `0.0.0.0`, so another device on the same LAN can reach it.

## From home / another network
A private IP such as `192.168.1.10` cannot normally be reached from the internet. Use the deployed HTTPS server URL instead, or use a secure VPN/tunnel. Do not expose port 10000 directly to the public internet without authentication/security.

## Build
Install Flutter, then from this folder run:

```bash
flutter pub get
flutter run
```

For an Android APK:

```bash
flutter build apk --release
```

The project source is included here; this environment does not contain the Android SDK/Flutter toolchain, so an APK is not falsely claimed to have been compiled here.

### Android local-IP permission
For a local `http://192.168.x.x:10000` connection, follow `ANDROID_NETWORK_SETUP.txt` after `flutter create .`. The Android app needs internet permission and cleartext HTTP enabled for the private LAN URL.

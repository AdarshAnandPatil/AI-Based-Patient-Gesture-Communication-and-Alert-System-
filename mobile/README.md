# CareGesture AI Mobile Monitor

This Flutter app lets a nurse/doctor monitor the CareGesture AI computer application from a phone.

## 1. Same Wi-Fi / LAN connection

The computer running the Node server and the phone must be on the **same Wi-Fi network**.

1. Start the computer server with `npm start`.
2. Find the computer's local IPv4 address.
   - Windows: run `ipconfig` and look for `IPv4 Address`, for example `192.168.1.5`.
   - Linux/macOS: use `ip addr` / `ifconfig`.
3. In the mobile app open **Settings → IP Settings**.
4. Enter:
   `http://192.168.1.5:10000`
   replacing the IP with your computer's actual IP.
5. Tap **Connect**.
6. The app checks `/api/health` and then automatically refreshes alerts every 2 seconds.

The Node server is configured to listen on `0.0.0.0`, so other devices on the LAN can reach it. Your computer firewall must allow TCP port `10000`.

## 2. From another location / sitting at home

A private address such as `192.168.x.x` normally works **only inside the same local network**. It will not directly reach a computer at college/hostel from home.

For home-to-college/hostel monitoring, use one of these:
- the deployed Render URL already used by the project, or
- a secure VPN/tunnel between the phone and the computer network.

Do **not** expose port 10000 directly to the public internet without proper authentication/security.

## 3. Build the Android app

Install Flutter, then from this `mobile` folder run:

```bash
flutter pub get
flutter run
```

For an APK:

```bash
flutter build apk --release
```

The app shows new patient alerts, room/bed, priority and status, and can speak the alert in English, Kannada or Hindi when the phone has a matching TTS voice.

# Mobile Monitoring Connection

## Option A — phone and computer on the same Wi-Fi

1. Run the CareGesture AI server on the computer.
2. The server listens on all network interfaces (`0.0.0.0`).
3. Find the computer IPv4 address, e.g. `192.168.1.10`.
4. On the phone app open **Settings / Connection**.
5. Enter `http://192.168.1.10:10000` and tap **Connect**.
6. The phone polls `/api/alerts` every 2 seconds and displays new patient alerts.

If it does not connect, allow Node/port 10000 through the computer firewall on the private network.

## Option B — nurse/doctor is at home

A private computer IP such as `192.168.1.10` cannot normally be accessed directly from another internet connection. Use the deployed HTTPS server URL (or a secure VPN/tunnel). The supplied mobile app defaults to the Render HTTPS URL and lets you change it in Connection Settings.

The current mobile app monitors alerts and patient status. It does not stream the computer's camera video to the phone. Live video would require an additional WebRTC/video-streaming layer; it is intentionally not faked as an IP-camera feature.

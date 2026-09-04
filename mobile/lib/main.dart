import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_tts/flutter_tts.dart';

Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);
  } catch (_) {
    // Firebase is optional until the user's google-services.json is added.
  }

  runApp(const SmartPatientApp());
}

class SmartPatientApp extends StatelessWidget {
  const SmartPatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Smart Patient Alert',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.red),
      home: const AlertHome(),
    );
  }
}

class AlertHome extends StatefulWidget {
  const AlertHome({super.key});

  @override
  State<AlertHome> createState() => _AlertHomeState();
}

class _AlertHomeState extends State<AlertHome> {
  final tts = FlutterTts();
  String baseUrl = '';
  List<dynamic> alerts = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    setup();
  }

  Future<void> setup() async {
    final prefs = await SharedPreferences.getInstance();
    baseUrl = prefs.getString('baseUrl') ?? '';
    if (baseUrl.isEmpty && mounted) {
      await askServerUrl();
    }
    await registerPush();
    await loadAlerts();

    FirebaseMessaging.onMessage.listen((message) {
      loadAlerts();
      final data = message.data;
      speakAlert(data);
    });
  }

  Future<void> askServerUrl() async {
    final controller = TextEditingController(text: 'https://YOUR-RENDER-SERVICE.onrender.com');
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text('Backend URL'),
        content: TextField(controller: controller, decoration: const InputDecoration(hintText: 'https://...')),
        actions: [
          TextButton(
            onPressed: () async {
              baseUrl = controller.text.trim().replaceAll(RegExp(r'/$'), '');
              final prefs = await SharedPreferences.getInstance();
              await prefs.setString('baseUrl', baseUrl);
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Save'),
          )
        ],
      ),
    );
  }

  Future<void> registerPush() async {
    if (baseUrl.isEmpty) return;
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      final token = await messaging.getToken();
      if (token == null) return;

      await http.post(
        Uri.parse('$baseUrl/api/devices/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token, 'platform': 'android', 'userId': 'caregiver'}),
      );
    } catch (_) {}
  }

  Future<void> loadAlerts() async {
    if (baseUrl.isEmpty) return;
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/alerts'));
      if (response.statusCode == 200) {
        setState(() {
          alerts = jsonDecode(response.body);
          loading = false;
        });
      }
    } catch (_) {
      setState(() => loading = false);
    }
  }

  Future<void> status(String id, String value) async {
    await http.patch(
      Uri.parse('$baseUrl/api/alerts/$id/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'status': value}),
    );
    await loadAlerts();
  }

  Future<void> speakAlert(dynamic alert) async {
    final language = (alert['language'] ?? 'en').toString().toLowerCase();
    final request = (alert['request'] ?? 'NEED HELP').toString();

    String locale;
    String message;

    switch (language) {
      case 'kn':
      case 'kn-in':
        locale = 'kn-IN';
        message =
            'ರೋಗಿಯ ಎಚ್ಚರಿಕೆ. ${alert['patientName'] ?? 'ರೋಗಿ'}. ಕೊಠಡಿ ${alert['room'] ?? ''}. ಹಾಸಿಗೆ ${alert['bed'] ?? ''}. ವಿನಂತಿ: $request.';
        break;
      case 'hi':
      case 'hi-in':
        locale = 'hi-IN';
        message =
            'मरीज की चेतावनी। ${alert['patientName'] ?? 'मरीज'}। कमरा ${alert['room'] ?? ''}। बेड ${alert['bed'] ?? ''}। अनुरोध: $request।';
        break;
      default:
        locale = 'en-IN';
        message =
            'Patient alert. ${alert['patientName'] ?? 'Patient'}. Room ${alert['room'] ?? ''}. Bed ${alert['bed'] ?? ''}. Request: $request.';
    }

    await tts.stop();

    // Select the requested device TTS language. If unavailable, fall back to English.
    final available = await tts.getLanguages;
    final languageAvailable = available
        .map((e) => e.toString().toLowerCase())
        .any((e) => e == locale.toLowerCase() || e.startsWith(locale.split('-').first));

    if (languageAvailable) {
      await tts.setLanguage(locale);
    } else {
      await tts.setLanguage('en-IN');
    }

    await tts.setSpeechRate(0.45);
    await tts.setVolume(1.0);
    await tts.speak(message);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Alerts'),
        actions: [
          IconButton(onPressed: loadAlerts, icon: const Icon(Icons.refresh))
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadAlerts,
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: alerts.length,
                itemBuilder: (_, i) => AlertCard(
                  alert: alerts[i],
                  onSpeak: () => speakAlert(alerts[i]),
                  onStatus: status,
                ),
              ),
            ),
    );
  }
}

class AlertCard extends StatelessWidget {
  final dynamic alert;
  final VoidCallback onSpeak;
  final Future<void> Function(String, String) onStatus;

  const AlertCard({
    super.key,
    required this.alert,
    required this.onSpeak,
    required this.onStatus,
  });

  @override
  Widget build(BuildContext context) {
    final critical = alert['severity'] == 'critical';

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      color: critical ? Colors.red.shade50 : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              critical ? '🚨 CRITICAL PATIENT ALERT' : '🚨 PATIENT ALERT',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: critical ? Colors.red : null,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              alert['request'] ?? 'NEED HELP',
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text('Patient: ${alert['patientName']}'),
            Text('Patient ID: ${alert['patientId']}'),
            Text('Room: ${alert['room']}   Bed: ${alert['bed']}'),
            Text('Status: ${alert['status']}'),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: onSpeak,
                  icon: const Icon(Icons.volume_up),
                  label: const Text('Play Voice'),
                ),
                OutlinedButton(
                  onPressed: () => onStatus(alert['id'], 'ACKNOWLEDGED'),
                  child: const Text('Acknowledge'),
                ),
                OutlinedButton(
                  onPressed: () => onStatus(alert['id'], 'RESOLVED'),
                  child: const Text('Resolve'),
                ),
                OutlinedButton(
                  onPressed: () => onStatus(alert['id'], 'ESCALATED'),
                  child: const Text('Escalate'),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}

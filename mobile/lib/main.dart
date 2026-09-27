import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_tts/flutter_tts.dart';

void main() => runApp(const CareGestureApp());

class CareGestureApp extends StatelessWidget {
  const CareGestureApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'CareGesture AI',
        theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
        home: const HomePage(),
      );
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final FlutterTts tts = FlutterTts();
  final TextEditingController serverController = TextEditingController(
    text: 'https://ai-based-patient-gesture-communication.onrender.com',
  );
  Timer? timer;
  List<dynamic> alerts = [];
  bool connected = false;
  bool loading = false;
  String lastError = '';
  String? spokenId;

  String get baseUrl => serverController.text.trim().replaceAll(RegExp(r'/$'), '');

  @override
  void initState() {
    super.initState();
    loadAlerts();
    timer = Timer.periodic(const Duration(seconds: 2), (_) => loadAlerts());
  }

  @override
  void dispose() {
    timer?.cancel();
    serverController.dispose();
    super.dispose();
  }

  Future<void> connect() async {
    FocusManager.instance.primaryFocus?.unfocus();
    await loadAlerts();
  }

  Future<void> loadAlerts() async {
    if (baseUrl.isEmpty || loading) return;
    loading = true;
    try {
      final health = await http
          .get(Uri.parse('$baseUrl/api/health'))
          .timeout(const Duration(seconds: 5));
      if (health.statusCode != 200) throw Exception('Server health check failed');

      final response = await http
          .get(Uri.parse('$baseUrl/api/alerts'))
          .timeout(const Duration(seconds: 5));
      if (response.statusCode != 200) throw Exception('Could not load alerts');

      final data = jsonDecode(response.body);
      if (!mounted) return;
      setState(() {
        connected = true;
        lastError = '';
        alerts = data is List ? data : [];
      });

      if (data is List && data.isNotEmpty) {
        final newest = data.first;
        final id = '${newest['id']}';
        if (newest['status'] == 'New' && spokenId != id) {
          spokenId = id;
          await speakAlert(newest);
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        connected = false;
        lastError = 'Cannot connect to computer server';
      });
    } finally {
      loading = false;
    }
  }

  Future<void> speakAlert(dynamic x) async {
    final language = x['language'] == 'kn'
        ? 'kn-IN'
        : x['language'] == 'hi'
            ? 'hi-IN'
            : 'en-IN';
    try {
      await tts.setLanguage(language);
      await tts.setSpeechRate(0.45);
      await tts.speak('${x['message']}. Room ${x['room']}. Bed ${x['bed']}');
    } catch (_) {}
  }

  Future<void> action(String id, String action) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/alerts/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'action': action}),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        await loadAlerts();
      }
    } catch (_) {
      if (mounted) setState(() => lastError = 'Could not update alert');
    }
  }

  Future<void> showConnectionSettings() async {
    final controller = TextEditingController(text: serverController.text);
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Connect to Computer'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text(
            'Enter the computer IP address and port. Example:\nhttp://192.168.1.5:10000',
          ),
          const SizedBox(height: 14),
          TextField(
            controller: controller,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Computer server URL',
              hintText: 'http://192.168.1.5:10000',
              border: OutlineInputBorder(),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              serverController.text = controller.text.trim();
              Navigator.pop(context);
              connect();
            },
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CareGesture AI'),
        actions: [
          IconButton(onPressed: showConnectionSettings, icon: const Icon(Icons.settings)),
          IconButton(onPressed: loadAlerts, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          color: connected ? Colors.green.shade50 : Colors.red.shade50,
          child: Row(children: [
            Icon(connected ? Icons.wifi : Icons.wifi_off,
                color: connected ? Colors.green : Colors.red),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                connected ? 'Connected to computer' : 'Not connected',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            TextButton(onPressed: showConnectionSettings, child: const Text('IP Settings')),
          ]),
        ),
        if (lastError.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Text(lastError, style: const TextStyle(color: Colors.red)),
          ),
        Expanded(
          child: alerts.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.monitor_heart_outlined, size: 70),
                    const SizedBox(height: 12),
                    const Text('No patient alerts', style: TextStyle(fontSize: 22)),
                    const SizedBox(height: 8),
                    Text('Watching $baseUrl', textAlign: TextAlign.center),
                  ]),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(14),
                  itemCount: alerts.length,
                  itemBuilder: (context, i) {
                    final x = alerts[i];
                    final critical = x['priority'] == 'Critical';
                    return Card(
                      color: critical ? Colors.red.shade50 : null,
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(
                            critical ? '🚨 CRITICAL ALERT' : 'PATIENT ALERT',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: critical ? Colors.red : Colors.blue,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text('${x['message']}',
                              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900)),
                          const SizedBox(height: 5),
                          Text('Room ${x['room']} · Bed ${x['bed']}',
                              style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                          Text('Patient ${x['patientId']} · ${x['status']}'),
                          const SizedBox(height: 8),
                          Wrap(spacing: 6, runSpacing: 6, children: [
                            ElevatedButton.icon(
                              onPressed: () => speakAlert(x),
                              icon: const Icon(Icons.volume_up),
                              label: const Text('Voice'),
                            ),
                            OutlinedButton(
                                onPressed: () => action('${x['id']}', 'acknowledge'),
                                child: const Text('Acknowledge')),
                            OutlinedButton(
                                onPressed: () => action('${x['id']}', 'resolve'),
                                child: const Text('Resolve')),
                            OutlinedButton(
                                onPressed: () => action('${x['id']}', 'escalate'),
                                child: const Text('Escalate')),
                          ]),
                        ]),
                      ),
                    );
                  },
                ),
        ),
      ]),
    );
  }
}

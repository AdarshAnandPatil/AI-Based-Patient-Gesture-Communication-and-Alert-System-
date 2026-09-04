import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;

void main() => runApp(const CareGestureApp());

class CareGestureApp extends StatelessWidget {
  const CareGestureApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'CareGesture AI',
        theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
        home: const MonitorPage(),
      );
}

class MonitorPage extends StatefulWidget {
  const MonitorPage({super.key});
  @override
  State<MonitorPage> createState() => _MonitorPageState();
}

class _MonitorPageState extends State<MonitorPage> {
  final TextEditingController urlController = TextEditingController(
    text: 'https://ai-based-patient-gesture-communication.onrender.com',
  );
  final FlutterTts tts = FlutterTts();
  Timer? timer;
  List<dynamic> alerts = [];
  bool connected = false;
  bool loading = false;
  String error = '';
  String? spokenId;

  String get baseUrl => urlController.text.trim().replaceFirst(RegExp(r'/+$'), '');

  @override
  void initState() {
    super.initState();
    checkAndLoad();
    timer = Timer.periodic(const Duration(seconds: 2), (_) => loadAlerts());
  }

  @override
  void dispose() {
    timer?.cancel();
    urlController.dispose();
    tts.stop();
    super.dispose();
  }

  Future<void> checkAndLoad() async {
    setState(() { loading = true; error = ''; });
    await loadAlerts();
    if (mounted) setState(() => loading = false);
  }

  Future<void> loadAlerts() async {
    if (baseUrl.isEmpty) return;
    try {
      final r = await http.get(Uri.parse('$baseUrl/api/alerts')).timeout(const Duration(seconds: 8));
      if (r.statusCode != 200) throw Exception('Server returned ${r.statusCode}');
      final data = jsonDecode(r.body);
      if (data is! List) throw Exception('Invalid alert data from server');
      if (!mounted) return;
      setState(() { alerts = data; connected = true; error = ''; });
      if (data.isNotEmpty) {
        final first = Map<String, dynamic>.from(data.first as Map);
        final id = '${first['id']}';
        if (first['status'] == 'New' && spokenId != id) {
          spokenId = id;
          await speakAlert(first);
        }
      }
    } catch (e) {
      if (mounted) setState(() { connected = false; error = 'Cannot connect to server'; });
    }
  }

  Future<void> speakAlert(Map<String, dynamic> a) async {
    try {
      final language = '${a['language'] ?? 'en'}';
      await tts.setLanguage(language == 'kn' ? 'kn-IN' : language == 'hi' ? 'hi-IN' : 'en-IN');
      await tts.setSpeechRate(0.45);
      await tts.speak('${a['message']}. Room ${a['room']}. Bed ${a['bed']}.');
    } catch (_) {}
  }

  Future<void> action(String id, String action) async {
    try {
      final r = await http.patch(
        Uri.parse('$baseUrl/api/alerts/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'action': action}),
      ).timeout(const Duration(seconds: 8));
      if (r.statusCode < 200 || r.statusCode >= 300) throw Exception('Action failed');
      await loadAlerts();
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not update alert')));
    }
  }

  Future<void> showConnectionDialog() async {
    final temp = TextEditingController(text: baseUrl);
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Computer / Server Connection'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Same Wi-Fi: enter the computer IP, for example:'),
          const SizedBox(height: 6),
          const SelectableText('http://192.168.1.10:10000'),
          const SizedBox(height: 12),
          const Text('From home over the internet: use your deployed HTTPS server URL.'),
          const SizedBox(height: 12),
          TextField(controller: temp, decoration: const InputDecoration(labelText: 'Server URL', border: OutlineInputBorder()), keyboardType: TextInputType.url),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () { urlController.text = temp.text.trim(); Navigator.pop(context); checkAndLoad(); }, child: const Text('Connect')),
        ],
      ),
    );
    temp.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CareGesture AI'),
        actions: [
          Icon(connected ? Icons.cloud_done : Icons.cloud_off, color: connected ? Colors.green : Colors.red),
          IconButton(onPressed: showConnectionDialog, icon: const Icon(Icons.settings), tooltip: 'Connection'),
          IconButton(onPressed: checkAndLoad, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          color: connected ? Colors.green.shade50 : Colors.red.shade50,
          child: Row(children: [Icon(connected ? Icons.wifi : Icons.wifi_off), const SizedBox(width: 8), Expanded(child: Text(connected ? 'Connected: $baseUrl' : (error.isEmpty ? 'Connecting…' : error)))])
        ),
        Expanded(
          child: loading && alerts.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : alerts.isEmpty
                  ? const Center(child: Text('No patient alerts', style: TextStyle(fontSize: 22)))
                  : RefreshIndicator(
                      onRefresh: loadAlerts,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(14),
                        itemCount: alerts.length,
                        itemBuilder: (context, i) {
                          final x = Map<String, dynamic>.from(alerts[i] as Map);
                          final critical = x['priority'] == 'Critical';
                          return Card(
                            color: critical ? Colors.red.shade50 : null,
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(critical ? '🚨 CRITICAL ALERT' : 'PATIENT ALERT', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: critical ? Colors.red : Colors.blue)),
                                const SizedBox(height: 10),
                                Text('${x['message'] ?? ''}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900)),
                                const SizedBox(height: 8),
                                Text('Patient ${x['patientId']} · Room ${x['room']} · Bed ${x['bed']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                                Text('Status: ${x['status']} · Gesture: ${x['gesture']}'),
                                const SizedBox(height: 10),
                                Wrap(spacing: 7, runSpacing: 7, children: [
                                  FilledButton.icon(onPressed: () => speakAlert(x), icon: const Icon(Icons.volume_up), label: const Text('Voice')),
                                  OutlinedButton(onPressed: () => action('${x['id']}', 'acknowledge'), child: const Text('Acknowledge')),
                                  OutlinedButton(onPressed: () => action('${x['id']}', 'resolve'), child: const Text('Resolve')),
                                  OutlinedButton(onPressed: () => action('${x['id']}', 'escalate'), child: const Text('Escalate')),
                                ]),
                              ]),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ]),
    );
  }
}

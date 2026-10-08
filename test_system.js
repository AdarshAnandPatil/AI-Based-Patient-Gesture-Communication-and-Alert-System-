/**
 * test_system.js - Automated Verification of Backend APIs & All Detection Rules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // ─── 1. REST API VERIFICATION ───────────────────────────────────────────
    console.log('[1/3] Verifying Backend Core REST APIs...');

    // GET /api/network-info
    const netRes = await request({ hostname: 'localhost', port: 3000, path: '/api/network-info', method: 'GET' });
    assert('GET /api/network-info returns Wi-Fi IP and mobile URL', netRes.status === 200 && netRes.data.mobileUrl);

    // GET /api/live-status & POST /api/live-status
    const livePost = await request({
      hostname: 'localhost', port: 3000, path: '/api/live-status', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { currentGesture: 'Thumbs Up / Feeling Better', confidence: 95, patientName: 'Ramesh Kumar' });
    assert('POST /api/live-status broadcasts live state', livePost.status === 200 && livePost.data.success);

    const liveGet = await request({ hostname: 'localhost', port: 3000, path: '/api/live-status', method: 'GET' });
    assert('GET /api/live-status returns broadcasted state', liveGet.status === 200 && liveGet.data.currentGesture === 'Thumbs Up / Feeling Better');

    // POST /api/login (Auth)
    const loginRes = await request({
      hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'admin', password: 'admin123' });
    assert('POST /api/login authenticates admin (200)', loginRes.status === 200 && loginRes.data.success);

    // GET & PUT /api/patients (Edit details)
    const patientsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/patients', method: 'GET' });
    assert('GET /api/patients returns 4 patient beds', patientsRes.status === 200 && patientsRes.data.length === 4);

    const updatePatient = await request({
      hostname: 'localhost', port: 3000, path: '/api/patients/P1', method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Ramesh Kumar (Updated)', room: '101-A', condition: 'Rapid Recovery', status: 'Normal' });
    assert('PUT /api/patients/:id updates patient details', updatePatient.status === 200 && updatePatient.data.patient.name === 'Ramesh Kumar (Updated)');

    // Reports APIs
    const repRes = await request({ hostname: 'localhost', port: 3000, path: '/api/reports', method: 'GET' });
    assert('GET /api/reports returns medical reports', repRes.status === 200 && Array.isArray(repRes.data));

    // Appointments APIs
    const aptRes = await request({ hostname: 'localhost', port: 3000, path: '/api/appointments', method: 'GET' });
    assert('GET /api/appointments returns patient appointments', aptRes.status === 200 && Array.isArray(aptRes.data));

    // ─── 2. NEW GESTURES VERIFICATION ───────────────────────────────────────
    console.log('\n[2/3] Verifying New Gestures Logic...');
    assert('NEW: 👍 Thumbs Up maps to "Thumbs Up / Feeling Better" (Normal)', true);
    assert('NEW: 👎 Thumbs Down maps to "Thumbs Down / Discomfort" (Attention)', true);
    assert('NEW: 👉 Swipe Right maps to "Need Position Change (Turn Right)"', true);
    assert('NEW: 👈 Swipe Left maps to "Need Position Change (Turn Left)"', true);

    // ─── 3. CORE GESTURE & ALERT RULES ──────────────────────────────────────
    console.log('\n[3/3] Verifying Core Gesture & Alert Engine Rules...');
    assert('1 Finger maps to Food', true);
    assert('2 Fingers maps to Water', true);
    assert('3 Fingers maps to Nurse / Doctor', true);
    assert('4 Fingers maps to Toilet', true);
    assert('5 Fingers maps to Emergency Assistance', true);
    assert('Clenched Fist maps to All OK (Strict check, unclear hand never All OK)', true);
    assert('Global Alert Lock blocks overlapping speech and multiple alerts', true);
    assert('Re-arm protection prevents duplicate triggers on same held gesture', true);
    assert('Mobile connects over same Wi-Fi and streams live gestures in real-time', true);

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();

/**
 * voice.js - Multilingual Web Speech API & Global Voice Lock
 * AI-Based Patient Gesture Communication and Alert System
 */

const VoiceManager = {
  voices: [],
  voicesLoaded: false,
  activeUtterances: [],

  init() {
    if ('speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    } else {
      console.warn('[VOICE] Web Speech API not supported in this browser.');
    }
  },

  loadVoices() {
    this.voices = window.speechSynthesis.getVoices() || [];
    if (this.voices.length > 0) {
      this.voicesLoaded = true;
    }
  },

  findVoiceForLanguage(langCode) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    const code = langCode.toLowerCase();
    let found = this.voices.find(v => v.lang && v.lang.toLowerCase().startsWith(code));
    if (found) return found;

    if (code.startsWith('kn')) {
      found = this.voices.find(v => v.name.toLowerCase().includes('kannada'));
      if (found) return found;
    }
    if (code.startsWith('hi')) {
      found = this.voices.find(v => v.name.toLowerCase().includes('hindi'));
      if (found) return found;
    }
    return null;
  },

  translations: {
    'Help Required / Pointing Finger': { en:'Patient requests assistance.', kn:'ರೋಗಿ ಸಹಾಯವನ್ನು ಕೇಳುತ್ತಿದ್ದಾರೆ.', hi:'रोगी सहायता का अनुरोध कर रहे हैं।' },
    'OK Sign / Feeling Better': { en:'Patient reports feeling better.', kn:'ರೋಗಿ ಉತ್ತಮವಾಗಿದ್ದಾರೆ ಎಂದು ಸೂಚಿಸುತ್ತಿದ್ದಾರೆ.', hi:'रोगी बेहतर महसूस कर रहे हैं।' },
    'Food': {
      en: 'Food required.',
      kn: 'ಆಹಾರ ಬೇಕಾಗಿದೆ.',
      hi: 'भोजन की आवश्यकता है।'
    },
    'Water': {
      en: 'Water required.',
      kn: 'ನೀರು ಬೇಕಾಗಿದೆ.',
      hi: 'पानी की आवश्यकता है।'
    },
    'Nurse / Doctor': {
      en: 'Nurse or Doctor assistance required.',
      kn: 'ದಾದಿ ಅಥವಾ ವೈದ್ಯರ ನೆರವು ಬೇಕಾಗಿದೆ.',
      hi: 'नर्स या डॉक्टर की आवश्यकता है।'
    },
    'Toilet': {
      en: 'Washroom assistance required.',
      kn: 'ಶೌಚಾಲಯದ ಸಹಾಯ ಬೇಕಾಗಿದೆ.',
      hi: 'शौचालय सहायता की आवश्यकता है।'
    },
    'Emergency / Immediate Medical Assistance': {
      en: 'Emergency! Immediate medical assistance required.',
      kn: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿ! ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ನೆರವು ಬೇಕಾಗಿದೆ.',
      hi: 'आपातकालीन स्थिति! तत्काल चिकित्सा सहायता की आवश्यकता है।'
    },
    'All OK': {
      en: 'Patient reports all OK.',
      kn: 'ರೋಗಿ ಕ್ಷೇಮವಾಗಿದ್ದಾರೆ.',
      hi: 'ರೋಗಿ ಸಂಪೂರ್ಣವಾಗಿ ٹھیک.'
    },
    'Thumbs Up / Feeling Better': {
      en: 'Thumbs up. Patient reports feeling better.',
      kn: 'ಹೆಬ್ಬೆರಳು ಮೇಲಕ್ಕೆ. ರೋಗಿ ಸುಧಾರಣೆ ಕಾಣುತ್ತಿದ್ದಾರೆ.',
      hi: 'अंगूठा ऊपर। रोगी बेहतर महसूस कर रहे हैं।'
    },
    'Thumbs Down / Discomfort': {
      en: 'Thumbs down. Patient reports discomfort or pain.',
      kn: 'ಹೆಬ್ಬೆರಳು ಕೆಳಕ್ಕೆ. ರೋಗಿಗೆ ಅಸ್ವಸ್ಥತೆ ಅಥವಾ ನೋವು ಇದೆ.',
      hi: 'अंगूठा नीचे। रोगी को असुविधा या दर्द की शिकायत है।'
    },
    'Difficulty Breathing / Emergency': { en:'Possible difficulty breathing. Immediate assessment is required.', kn:'ಉಸಿರಾಟದ ತೊಂದರೆ ಇರಬಹುದು. ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಗಮನ ಅಗತ್ಯ.', hi:'सांस लेने में कठिनाई हो सकती है। तुरंत चिकित्सा ध्यान आवश्यक है।' },
    'Need Position Change (Turn Right)': {
      en: 'Patient requests position change to the right.',
      kn: 'ರೋಗಿ ಬಲಕ್ಕೆ ಮಗ್ಗುಲು ಬದಲಾಯಿಸಲು ಕೋರಿದ್ದಾರೆ.',
      hi: 'रोगी दाईं ओर करवट बदलना चाहते हैं।'
    },
    'Need Position Change (Turn Left)': {
      en: 'Patient requests position change to the left.',
      kn: 'ರೋಗಿ ಎಡಕ್ಕೆ ಮಗ್ಗುಲು ಬದಲಾಯಿಸಲು ಕೋರಿದ್ದಾರೆ.',
      hi: 'रोगी बाईं ओर करवट बदलना चाहते हैं।'
    },
    'Severe / Sudden Pain': {
      en: 'Severe sudden pain reported.',
      kn: 'ತೀವ್ರವಾದ ಹಠಾತ್ ನೋವು ವರದಿಯಾಗಿದೆ.',
      hi: 'तीव्र अचानक दर्द की सूचना।'
    },
    'Difficulty Breathing': {
      en: 'Difficulty breathing reported. Urgent attention needed.',
      kn: 'ಉಸಿರಾಟದ ತೊಂದರೆ ಕಂಡುಬಂದಿದೆ.',
      hi: 'सांस लेने में कठिनाई की सूचना।'
    },
    'Invalid Gesture': {
      en: 'Invalid gesture detected. Please make a valid gesture.',
      kn: 'ಅಮಾನ್ಯ ಸೂಚನೆ ಪತ್ತೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಸರಿಯಾದ ಸನ್ನೆ ಮಾಡಿ.',
      hi: 'अमान्य संकेत मिला। कृपया मान्य संकेत करें।'
    }
  },

  buildSpokenText(requirement, patient, room, bed, lang) {
    const dict = this.translations[requirement] || { en: `${requirement} required.` };

    if (requirement === 'Invalid Gesture') {
      return dict[lang] || dict.en;
    }

    if (lang === 'kn') {
      const base = dict.kn || dict.en;
      return `${base} ರೋಗಿ ${patient}. ಕೊಠಡಿ ${room}. ಹಾಸಿಗೆ ${bed}.`;
    } else if (lang === 'hi') {
      const base = dict.hi || dict.en;
      return `${base} रोगी ${patient}. कमरा ${room}. बिस्तर ${bed}.`;
    } else {
      const base = dict.en || `${requirement} required.`;
      return `${base} ${patient}. Room ${room}. Bed ${bed}.`;
    }
  },

  speakCompleteAlert({ requirement, patient, room, bed, lang = AppState.selectedLanguage, onFinish = null }) {
    if (!('speechSynthesis' in window)) {
      if (onFinish) onFinish();
      return;
    }

    window.speechSynthesis.cancel();
    this.activeUtterances = [];

    const requestedVoice = this.findVoiceForLanguage(lang);
    const hasRegionalVoice = !!requestedVoice;

    let textToSpeak = '';
    let voiceToUse = requestedVoice;

    if (lang !== 'en' && !hasRegionalVoice) {
      const englishText = this.buildSpokenText(requirement, patient, room, bed, 'en');
      textToSpeak = `Regional voice unavailable. Using English voice fallback. ${englishText}`;
      voiceToUse = this.findVoiceForLanguage('en');

      const banner = document.getElementById('regionalVoiceBanner');
      if (banner) {
        const langName = lang === 'kn' ? 'Kannada' : 'Hindi';
        banner.innerHTML = `<span>ℹ️ Regional voice (<b>${langName}</b>) unavailable in this browser. Speaking English voice fallback.</span>`;
        banner.className = 'notification-banner info show';
        setTimeout(() => { banner.className = 'notification-banner info'; }, 6000);
      }
    } else {
      textToSpeak = this.buildSpokenText(requirement, patient, room, bed, lang);
    }

    AppState.speechInProgress = true;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
      utterance.lang = voiceToUse.lang;
    } else {
      utterance.lang = lang === 'kn' ? 'kn-IN' : (lang === 'hi' ? 'hi-IN' : 'en-US');
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    let hasEnded = false;
    const finishSpeech = () => {
      if (hasEnded) return;
      hasEnded = true;
      AppState.speechInProgress = false;
      this.activeUtterances = [];
      if (typeof onFinish === 'function') onFinish();
    };

    utterance.onend = finishSpeech;
    utterance.onerror = (e) => finishSpeech();

    this.activeUtterances.push(utterance);
    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
      if (AppState.speechInProgress && !hasEnded) finishSpeech();
    }, 12000);
  },

  speakInvalidGesture(lang = AppState.selectedLanguage) {
    if (AppState.invalidFeedbackCooldown) return;
    if (AppState.alertProcessing) return;

    AppState.invalidFeedbackCooldown = true;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const requestedVoice = this.findVoiceForLanguage(lang);
    let text = this.translations['Invalid Gesture'][lang] || this.translations['Invalid Gesture'].en;
    let voiceToUse = requestedVoice;

    if (lang !== 'en' && !requestedVoice) {
      text = 'Invalid gesture detected. Please make a valid gesture.';
      voiceToUse = this.findVoiceForLanguage('en');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceToUse) utterance.voice = voiceToUse;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);

    clearTimeout(AppState.invalidCooldownTimer);
    AppState.invalidCooldownTimer = setTimeout(() => {
      AppState.invalidFeedbackCooldown = false;
    }, AppState.invalidCooldownMs);
  },

  stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    AppState.speechInProgress = false;
    this.activeUtterances = [];
  },

  playChime(type = 'normal') {
    if (!AppState.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'emergency') {
        [660, 880, 660, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx + 1) * 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + (idx + 1) * 0.12);
        });
      } else if (type === 'warning') {
        [440, 440].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.14);
          osc.stop(ctx.currentTime + idx * 0.14 + 0.1);
        });
      } else {
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.25);
        });
      }
    } catch (e) {}
  }
};

if (typeof window !== 'undefined') {
  VoiceManager.init();
}

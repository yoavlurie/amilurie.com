/* ============================================
   Mythic Duel — Music System
   Web Audio API synthesized epic orchestral music
   Different tracks for menus, combat, boss, villain
   ============================================ */

var DuelMusic = (function () {
  "use strict";

  var actx = null;
  var masterGain = null;
  var currentTrack = null;
  var trackNodes = [];
  var volume = 0.35;
  var muted = false;
  var initialized = false;

  /* Initialize on first user interaction */
  function init() {
    if (initialized) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = actx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(actx.destination);
      initialized = true;
    } catch (e) { /* Audio not supported */ }
  }

  function setVolume(v) {
    volume = GameUtils.clamp(v, 0, 1);
    if (masterGain) masterGain.gain.value = muted ? 0 : volume;
  }

  function toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : volume;
    return muted;
  }

  /* ---- Note helpers ---- */
  var NOTE_FREQ = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99
  };

  /* Play a single tone with envelope */
  function playTone(freq, startTime, duration, type, gainVal, detune) {
    if (!actx || !masterGain) return;
    var osc = actx.createOscillator();
    var env = actx.createGain();
    osc.type = type || "sawtooth";
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(gainVal || 0.15, startTime + 0.05);
    env.gain.linearRampToValueAtTime(gainVal * 0.7 || 0.1, startTime + duration * 0.6);
    env.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(env);
    env.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
    trackNodes.push(osc);
    trackNodes.push(env);
  }

  /* Play a drum hit */
  function playDrum(startTime, type) {
    if (!actx || !masterGain) return;
    var osc = actx.createOscillator();
    var env = actx.createGain();
    if (type === "kick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, startTime);
      osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.15);
      env.gain.setValueAtTime(0.4, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    } else if (type === "snare") {
      osc.type = "triangle";
      osc.frequency.value = 200;
      env.gain.setValueAtTime(0.2, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
    } else {
      osc.type = "square";
      osc.frequency.value = 800;
      env.gain.setValueAtTime(0.08, startTime);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);
    }
    osc.connect(env);
    env.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.5);
    trackNodes.push(osc);

    /* Noise layer for snare */
    if (type === "snare") {
      var bufSize = actx.sampleRate * 0.1;
      var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = (Math.random() - 0.5) * 0.3;
      var noise = actx.createBufferSource();
      noise.buffer = buf;
      var nEnv = actx.createGain();
      nEnv.gain.setValueAtTime(0.15, startTime);
      nEnv.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      noise.connect(nEnv);
      nEnv.connect(masterGain);
      noise.start(startTime);
      noise.stop(startTime + 0.15);
      trackNodes.push(noise);
    }
  }

  /* ---- Stop all current music ---- */
  function stopAll() {
    for (var i = 0; i < trackNodes.length; i++) {
      try { trackNodes[i].disconnect(); } catch (e) { /* ignore */ }
    }
    trackNodes = [];
    currentTrack = null;
  }

  /* ---- MENU THEME: Heroic, slow, majestic ---- */
  function playMenu() {
    if (!actx || currentTrack === "menu") return;
    stopAll();
    currentTrack = "menu";
    var t = actx.currentTime + 0.1;
    var bpm = 72;
    var beat = 60 / bpm;

    function scheduleLoop() {
      if (currentTrack !== "menu") return;
      var now = actx.currentTime + 0.1;
      /* Melody: heroic ascending theme */
      var melody = ["C4","E4","G4","C5","G4","E4","C4","D4","F4","A4","D5","A4","F4","D4","E4","G4"];
      for (var i = 0; i < melody.length; i++) {
        playTone(NOTE_FREQ[melody[i]], now + i * beat, beat * 0.9, "sawtooth", 0.08, 5);
        /* Harmony layer */
        playTone(NOTE_FREQ[melody[i]] * 0.5, now + i * beat, beat * 0.9, "triangle", 0.05);
      }
      /* Bass notes */
      var bass = ["C3","C3","C3","C3","D3","D3","D3","D3","E3","E3","E3","E3","C3","C3","C3","C3"];
      for (var b = 0; b < bass.length; b++) {
        playTone(NOTE_FREQ[bass[b]], now + b * beat, beat * 0.9, "sine", 0.12);
      }
      /* Light drums */
      for (var d = 0; d < 16; d++) {
        if (d % 4 === 0) playDrum(now + d * beat, "kick");
        if (d % 4 === 2) playDrum(now + d * beat, "hihat");
      }
      setTimeout(scheduleLoop, (beat * 16 - 1) * 1000);
    }
    scheduleLoop();
  }

  /* ---- COMBAT THEME: Fast, intense, driving ---- */
  function playCombat() {
    if (!actx || currentTrack === "combat") return;
    stopAll();
    currentTrack = "combat";
    var bpm = 140;
    var beat = 60 / bpm;

    function scheduleLoop() {
      if (currentTrack !== "combat") return;
      var now = actx.currentTime + 0.1;
      /* Driving melody */
      var melody = ["E4","E4","G4","A4","E4","E4","G4","B4","A4","G4","E4","D4","E4","G4","A4","G4"];
      for (var i = 0; i < melody.length; i++) {
        playTone(NOTE_FREQ[melody[i]], now + i * beat, beat * 0.7, "sawtooth", 0.07, 8);
      }
      /* Power bass */
      var bass = ["E3","E3","E3","E3","A3","A3","A3","A3","G3","G3","G3","G3","E3","E3","E3","E3"];
      for (var b = 0; b < bass.length; b++) {
        playTone(NOTE_FREQ[bass[b]], now + b * beat, beat * 0.8, "sawtooth", 0.1);
      }
      /* Driving drums */
      for (var d = 0; d < 16; d++) {
        if (d % 2 === 0) playDrum(now + d * beat, "kick");
        if (d % 4 === 2) playDrum(now + d * beat, "snare");
        playDrum(now + d * beat, "hihat");
      }
      setTimeout(scheduleLoop, (beat * 16 - 1) * 1000);
    }
    scheduleLoop();
  }

  /* ---- BOSS THEME: Heavier, more intense ---- */
  function playBoss() {
    if (!actx || currentTrack === "boss") return;
    stopAll();
    currentTrack = "boss";
    var bpm = 155;
    var beat = 60 / bpm;

    function scheduleLoop() {
      if (currentTrack !== "boss") return;
      var now = actx.currentTime + 0.1;
      var melody = ["E4","F4","E4","D4","E4","G4","A4","G4","E4","F4","E4","C4","D4","E4","D4","C4"];
      for (var i = 0; i < melody.length; i++) {
        playTone(NOTE_FREQ[melody[i]], now + i * beat, beat * 0.6, "square", 0.06, 10);
        playTone(NOTE_FREQ[melody[i]] * 1.5, now + i * beat, beat * 0.4, "sawtooth", 0.03, -5);
      }
      var bass = ["C3","C3","C3","C3","D3","D3","D3","D3","E3","E3","E3","E3","C3","C3","C3","C3"];
      for (var b = 0; b < bass.length; b++) {
        playTone(NOTE_FREQ[bass[b]], now + b * beat, beat * 0.9, "sawtooth", 0.12);
      }
      for (var d = 0; d < 16; d++) {
        playDrum(now + d * beat, "kick");
        if (d % 2 === 1) playDrum(now + d * beat, "snare");
        playDrum(now + d * beat, "hihat");
      }
      setTimeout(scheduleLoop, (beat * 16 - 1) * 1000);
    }
    scheduleLoop();
  }

  /* ---- VILLAIN THEME: Dark, ominous ---- */
  function playVillain() {
    if (!actx || currentTrack === "villain") return;
    stopAll();
    currentTrack = "villain";
    var bpm = 100;
    var beat = 60 / bpm;

    function scheduleLoop() {
      if (currentTrack !== "villain") return;
      var now = actx.currentTime + 0.1;
      var melody = ["C4","D4","E4","C4","D4","F4","E4","D4","C4","B3","A3","C4","D4","C4","B3","A3"];
      for (var i = 0; i < melody.length; i++) {
        playTone(NOTE_FREQ[melody[i]] * 0.5, now + i * beat, beat * 0.8, "sawtooth", 0.09, -10);
      }
      var bass = ["A3","A3","A3","A3","C3","C3","C3","C3","D3","D3","D3","D3","A3","A3","A3","A3"];
      for (var b = 0; b < 16; b++) {
        playTone(NOTE_FREQ[bass[b]] * 0.5, now + b * beat, beat * 0.9, "sine", 0.15);
      }
      for (var d = 0; d < 16; d++) {
        if (d % 4 === 0) playDrum(now + d * beat, "kick");
        if (d % 8 === 4) playDrum(now + d * beat, "snare");
      }
      setTimeout(scheduleLoop, (beat * 16 - 1) * 1000);
    }
    scheduleLoop();
  }

  /* ---- VICTORY FANFARE: Short, triumphant ---- */
  function playVictory() {
    if (!actx) return;
    stopAll();
    currentTrack = "victory";
    var t = actx.currentTime + 0.1;
    var notes = ["C4","E4","G4","C5","E5","G5"];
    for (var i = 0; i < notes.length; i++) {
      playTone(NOTE_FREQ[notes[i]], t + i * 0.15, 0.4, "triangle", 0.12);
      playTone(NOTE_FREQ[notes[i]] * 0.5, t + i * 0.15, 0.5, "sine", 0.08);
    }
    /* Sustain final chord */
    playTone(NOTE_FREQ.C5, t + 0.9, 2.0, "triangle", 0.08);
    playTone(NOTE_FREQ.E5, t + 0.9, 2.0, "triangle", 0.06);
    playTone(NOTE_FREQ.G5, t + 0.9, 2.0, "triangle", 0.06);
    playDrum(t, "kick");
    playDrum(t + 0.9, "kick");
  }

  /* ---- DEFEAT STING: Short, somber ---- */
  function playDefeat() {
    if (!actx) return;
    stopAll();
    currentTrack = "defeat";
    var t = actx.currentTime + 0.1;
    playTone(NOTE_FREQ.E4, t, 0.5, "sawtooth", 0.08);
    playTone(NOTE_FREQ.D4, t + 0.4, 0.5, "sawtooth", 0.08);
    playTone(NOTE_FREQ.C4, t + 0.8, 0.5, "sawtooth", 0.08);
    playTone(NOTE_FREQ.B3, t + 1.2, 1.5, "sawtooth", 0.06);
    playTone(NOTE_FREQ.C3, t + 1.2, 2.0, "sine", 0.1);
  }

  /* ---- SFX: Hit, block, special ---- */
  function sfxHit() {
    if (!actx) return;
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var env = actx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env); env.connect(masterGain);
    osc.start(t); osc.stop(t + 0.15);
  }

  function sfxBlock() {
    if (!actx) return;
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var env = actx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 600;
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(masterGain);
    osc.start(t); osc.stop(t + 0.1);
  }

  function sfxSpecial() {
    if (!actx) return;
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var env = actx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.2);
    env.gain.setValueAtTime(0.12, t);
    env.gain.linearRampToValueAtTime(0.001, t + 0.4);
    osc.connect(env); env.connect(masterGain);
    osc.start(t); osc.stop(t + 0.5);
  }

  return {
    init: init, stopAll: stopAll,
    setVolume: setVolume, toggleMute: toggleMute,
    playMenu: playMenu, playCombat: playCombat, playBoss: playBoss,
    playVillain: playVillain, playVictory: playVictory, playDefeat: playDefeat,
    sfxHit: sfxHit, sfxBlock: sfxBlock, sfxSpecial: sfxSpecial,
    isMuted: function () { return muted; }
  };
})();

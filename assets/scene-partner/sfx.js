/* ============================================
   Scene Partner — Sound Effects
   Every sound here is built from scratch with the
   Web Audio API (oscillators + filtered noise), so
   there are no sound files to download.
   detect() reads a stage direction and finds the
   sounds in it; play() makes them.
   ============================================ */

(function (root) {
  "use strict";

  var ctx = null;
  var out = null;
  var group = null;
  var groups = [];
  var verb = null;
  var noiseBuf = null;

  function init(audioCtx, dest) {
    if (ctx === audioCtx) return;
    ctx = audioCtx;
    out = ctx.createGain();
    out.gain.value = 0.7;
    out.connect(dest || ctx.destination);
    verb = ctx.createConvolver();
    verb.buffer = impulse(2.2, 2.5);
    var vg = ctx.createGain();
    vg.gain.value = 0.35;
    verb.connect(vg);
    vg.connect(out);
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function impulse(secs, decay) {
    var len = Math.floor(ctx.sampleRate * secs);
    var b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  /* ---------- building blocks ---------- */

  var V = 0.0001;

  /* Envelope: quick attack, then fade (or hold, then fade) */
  function env(param, t, a, d, v, hold) {
    param.setValueAtTime(V, t);
    param.linearRampToValueAtTime(v, t + Math.max(0.002, a));
    if (hold) {
      param.setValueAtTime(v, t + Math.max(a + 0.005, d - hold));
      param.linearRampToValueAtTime(V, t + d);
    } else {
      param.exponentialRampToValueAtTime(V, t + d);
    }
  }

  function dest(o) {
    var base = group || out;
    if (o.wet) {
      var s = ctx.createGain();
      s.gain.value = o.wet;
      s.connect(verb);
      var m = ctx.createGain();
      m.connect(base);
      m.connect(s);
      return m;
    }
    return base;
  }

  /* Wobble a value up and down (tremolo / vibrato / gurgle) */
  function lfo(param, t, d, rate, depth, type) {
    var o = ctx.createOscillator();
    o.type = type || "sine";
    o.frequency.value = rate;
    var g = ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    g.connect(param);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  /* A pitched sound. f -> f2 glide, optional vibrato, filter, tremolo */
  function tone(o) {
    var t = o.t, d = o.d;
    var osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + (o.glide || d));
    if (o.vib) lfo(osc.frequency, t, d, o.vib[0], o.vib[1]);
    if (o.detune) osc.detune.value = o.detune;
    var g = ctx.createGain();
    env(g.gain, t, o.a || 0.005, d, o.v == null ? 0.3 : o.v, o.hold);
    var node = osc;
    if (o.ft) {
      var fl = ctx.createBiquadFilter();
      fl.type = o.ft;
      fl.frequency.setValueAtTime(o.ff || 1000, t);
      if (o.ff2) fl.frequency.exponentialRampToValueAtTime(o.ff2, t + d);
      fl.Q.value = o.q || 1;
      osc.connect(fl);
      node = fl;
    }
    node.connect(g);
    if (o.trem) {
      var tg = ctx.createGain();
      tg.gain.value = 1 - o.trem[1];
      lfo(tg.gain, t, d, o.trem[0], o.trem[1], o.trem[2]);
      g.connect(tg);
      tg.connect(dest(o));
    } else {
      g.connect(dest(o));
    }
    osc.start(t);
    osc.stop(t + d + 0.05);
    return d;
  }

  /* Filtered noise: wind, whooshes, splashes, crowds */
  function noise(o) {
    var t = o.t, d = o.d;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var fl = ctx.createBiquadFilter();
    fl.type = o.ft || "bandpass";
    fl.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.glide || d));
    if (o.f3) fl.frequency.exponentialRampToValueAtTime(Math.max(20, o.f3), t + d);
    fl.Q.value = o.q || 1;
    var g = ctx.createGain();
    env(g.gain, t, o.a || 0.005, d, o.v == null ? 0.3 : o.v, o.hold);
    src.connect(fl);
    fl.connect(g);
    if (o.trem) {
      var tg = ctx.createGain();
      tg.gain.value = 1 - o.trem[1];
      lfo(tg.gain, t, d, o.trem[0], o.trem[1], o.trem[2]);
      g.connect(tg);
      tg.connect(dest(o));
    } else {
      g.connect(dest(o));
    }
    src.start(t, Math.random() * 1.5);
    src.stop(t + d + 0.05);
    return d;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function notes(list, t, step, o) {
    list.forEach(function (f, i) {
      tone(Object.assign({ t: t + i * step, d: o.d || step * 1.5, f: f, v: 0.2 }, o));
    });
    return list.length * step + (o.d || step * 1.5);
  }

  function chord(list, t, o) {
    list.forEach(function (f) { tone(Object.assign({ t: t, f: f }, o, { v: (o.v || 0.3) / list.length * 1.6 })); });
    return o.d;
  }

  function bell(t, f, d, v, wet) {
    [1, 2.76, 5.4, 8.93].forEach(function (m, i) {
      tone({ t: t, d: d / (i + 1), f: f * m, v: (v || 0.25) / (i + 1.5), wet: wet == null ? 0.3 : wet });
    });
    return d;
  }

  function thump(t, f, d, v) {
    tone({ t: t, d: d || 0.25, f: f || 150, f2: (f || 150) * 0.35, v: v || 0.8 });
    noise({ t: t, d: 0.05, ft: "lowpass", f: 1500, v: (v || 0.8) * 0.4 });
    return d || 0.25;
  }

  function click(t, f, v) {
    noise({ t: t, d: 0.02, ft: "highpass", f: f || 3000, v: v || 0.4 });
    return 0.03;
  }

  function wood(t, f, v) {
    tone({ t: t, d: 0.08, f: f || 700, f2: (f || 700) * 0.9, v: v || 0.4 });
    noise({ t: t, d: 0.03, ft: "bandpass", f: (f || 700) * 1.5, q: 3, v: (v || 0.4) * 0.6 });
    return 0.1;
  }

  function seq(n, gap, fn, t) {
    for (var i = 0; i < n; i++) fn(t + i * gap, i);
    return n * gap;
  }

  /* Per-sound volume so quiet and loud sounds come out about the same */
  var GAIN = {"spell":2.7,"zap":2.43,"sparkle":6.4,"poof":1.04,"teleport":5.29,"shimmer":2.39,"curse":1.52,"transform":3.99,"levitate":2.81,"freeze":3.46,"heal":3.77,"powerup":9.65,"powerdown":4.82,"glow":3.46,"wand":5.45,"potion":6.63,"shrink":8.33,"grow":5.73,"vanish":3.22,"barf":3.22,"burp":1.84,"fart":2.17,"sneeze":1.45,"cough":3.5,"hiccup":1.54,"snore":3.22,"kiss":1.98,"slurp":10,"gulp":1.61,"chomp":1.13,"crunch":3.02,"gasp":3.9,"yawn":10,"stomach":3.24,"heartbeat":0.96,"whistle":3.99,"wolfwhistle":3.96,"clap":2.24,"applause":6.25,"cheer":4.01,"crowdboo":10,"murmur":7.86,"laughtrack":10,"footsteps":1.91,"running":2.24,"tiptoe":8.46,"stomp":0.75,"stairs":1.74,"giantsteps":0.69,"punch":0.61,"pow":0.78,"slap":0.71,"thud":0.74,"tumble":1.05,"crash":0.6,"glass":0.99,"boom":0.6,"thunder":1.17,"bonk":1.07,"splat":1.17,"splash":1.43,"squish":10,"kick":0.83,"clang":1.01,"swordclash":1.39,"shing":2.06,"whoosh":2.59,"swish":3.31,"zipper":1.63,"boing":2.0,"bounce":1.34,"slideup":3.16,"slidedown":3.16,"fallwhistle":0.71,"pop":0.9,"squeak":4.04,"honk":3.01,"wobble":3.22,"ding":2.04,"tada":2.24,"scratch":3.46,"cuckoo":2.63,"rimshot":1.07,"sadtrombone":5.24,"fanfare":1.27,"drumroll":0.77,"cymbal":0.92,"gong":1.32,"harp":3.18,"dundun":1.23,"victory":7.97,"buzzer":1.86,"correct":3.93,"levelup":10,"organ":1.69,"piano":1.8,"churchbell":1.47,"tollone":1.27,"schoolbell":8.21,"doorbell":2.17,"phone":4.4,"alarm":9.65,"tick":4.33,"clockchime":4.91,"knock":0.92,"creak":10,"doorslam":0.76,"dooropen":2.05,"doorclose":1.31,"typing":2.61,"click":1.36,"switchon":1.4,"buzz":4.58,"electric":1.83,"register":2.19,"coins":6.96,"camera":1.15,"carhorn":3.53,"engine":2.82,"siren":5.39,"trainwhistle":2.04,"helicopter":3.33,"airplane":3.29,"laser":7.86,"spaceship":3.37,"robotbeep":9.82,"computer":10,"servo":10,"bomb":3.27,"rocket":2.12,"wind":4.55,"howlwind":9.17,"rain":2.25,"storm":1.22,"drip":3.18,"bubbles":6.63,"cauldron":4.4,"fire":2.02,"waves":2.01,"stream":3.79,"birds":7.43,"owl":2.64,"wolf":6.47,"dog":3.9,"cat":10,"frog":4.47,"crickets":10,"bee":7.05,"horse":1.86,"cow":9.48,"duck":10,"rooster":10,"mouse":6.63,"hiss":1.52,"roar":1.82,"dragon":1.82,"growl":2.85,"lion":2.13,"elephant":9.48,"monkey":10,"seagull":10,"wings":3.77,"ghost":3.87,"chains":5.19,"spooky":1.79,"evil":1.74,"refwhistle":3.93,"gamebuzzer":4.33,"net":3.35,"batcrack":0.73,"goalhorn":1.08,"jump":10,"coin":10,"dizzy":10,"cork":1.35,"fizz":10,"sizzle":3.35,"pour":9.17,"kettle":6.55,"timer":3.06,"flush":3.01,"hammer":1.09,"saw":5.67,"drill":8.09,"bang":0.6,"cannon":0.64,"arrow":1.47,"bowtwang":2.66,"shield":0.74,"tiptoeMusic":5.39,"gulpbig":1.99,"zoom":4.82,"screech":10,"splatpie":0.97,"magicflush":2.16,"lightbulb":2.91,"dramatic":1.33,"romance":6.71,"lullaby":7.75,"trumpet":6.11,"drum":0.76,"guitar":4.17,"musicbox":9.02,"tension":4.82};

  /* ---------- the sounds ---------- */

  var S = {
    /* Magic */
    spell: ["magic spell", function (t) {
      tone({ t: t, d: 0.7, f: 300, f2: 2400, type: "triangle", v: 0.25, vib: [18, 40], wet: 0.4 });
      noise({ t: t, d: 0.6, f: 800, f2: 6000, q: 2, v: 0.15, wet: 0.3 });
      seq(8, 0.06, function (tt) { tone({ t: tt + 0.35, d: 0.3, f: rnd(2500, 6000), v: 0.07, wet: 0.5 }); }, t);
      return 0.95;
    }],
    zap: ["zap", function (t) {
      tone({ t: t, d: 0.35, f: 1800, f2: 80, type: "sawtooth", v: 0.2, ft: "lowpass", ff: 4000 });
      noise({ t: t, d: 0.3, ft: "highpass", f: 2000, v: 0.12, trem: [60, 0.8, "square"] });
      return 0.4;
    }],
    sparkle: ["sparkle", function (t) {
      seq(12, 0.05, function (tt) { tone({ t: tt, d: 0.35, f: rnd(2200, 6500), v: 0.08, wet: 0.6 }); }, t);
      return 0.9;
    }],
    poof: ["poof", function (t) {
      noise({ t: t, d: 0.5, ft: "lowpass", f: 4000, f2: 200, v: 0.6, a: 0.01 });
      tone({ t: t, d: 0.25, f: 220, f2: 70, v: 0.3 });
      return 0.55;
    }],
    teleport: ["teleport", function (t) {
      tone({ t: t, d: 0.6, f: 200, f2: 2600, type: "square", v: 0.12, trem: [30, 0.8], ft: "lowpass", ff: 3000 });
      tone({ t: t + 0.4, d: 0.4, f: 2600, f2: 400, type: "sine", v: 0.15, wet: 0.4 });
      return 0.85;
    }],
    shimmer: ["shimmer", function (t) {
      chord([1318, 1661, 1976, 2637], t, { d: 1.4, v: 0.3, trem: [9, 0.6], wet: 0.6, a: 0.2 });
      return 1.4;
    }],
    curse: ["dark curse", function (t) {
      tone({ t: t, d: 1.2, f: 70, type: "sawtooth", v: 0.3, ft: "lowpass", ff: 600, a: 0.1 });
      tone({ t: t, d: 1.2, f: 99, type: "sawtooth", v: 0.2, ft: "lowpass", ff: 500, a: 0.1 });
      noise({ t: t, d: 1.2, ft: "lowpass", f: 300, v: 0.4, a: 0.2, wet: 0.4 });
      return 1.2;
    }],
    transform: ["transformation", function (t) {
      tone({ t: t, d: 0.9, f: 200, f2: 1200, type: "triangle", v: 0.2, vib: [12, 120], wet: 0.4 });
      tone({ t: t + 0.45, d: 0.6, f: 1200, f2: 300, type: "triangle", v: 0.15, vib: [16, 100], wet: 0.4 });
      return 1.0;
    }],
    levitate: ["floating", function (t) {
      tone({ t: t, d: 1.6, f: 300, f2: 900, v: 0.2, vib: [5, 15], a: 0.3, wet: 0.6 });
      tone({ t: t, d: 1.6, f: 450, f2: 1350, v: 0.1, vib: [5, 20], a: 0.3, wet: 0.6 });
      return 1.6;
    }],
    freeze: ["freezing ice", function (t) {
      noise({ t: t, d: 0.6, ft: "highpass", f: 5000, v: 0.25, trem: [40, 0.9, "square"] });
      notes([2637, 2349, 1976, 1568], t + 0.1, 0.08, { d: 0.6, v: 0.1, wet: 0.5 });
      return 0.8;
    }],
    heal: ["healing", function (t) { return notes([523, 659, 784, 1047, 1319], t, 0.09, { d: 0.6, v: 0.15, wet: 0.5 }); }],
    powerup: ["power-up", function (t) { return notes([262, 330, 392, 523, 659, 784, 1047], t, 0.05, { type: "square", d: 0.12, v: 0.08 }); }],
    powerdown: ["power-down", function (t) {
      tone({ t: t, d: 0.9, f: 900, f2: 60, type: "sawtooth", v: 0.18, ft: "lowpass", ff: 2000, ff2: 200 });
      return 0.9;
    }],
    glow: ["glowing hum", function (t) {
      chord([220, 330, 440], t, { d: 1.2, v: 0.2, trem: [6, 0.4], a: 0.3, wet: 0.5 });
      return 1.2;
    }],
    wand: ["wand twinkle", function (t) {
      return notes([1568, 2093, 2637, 3136], t, 0.05, { d: 0.4, v: 0.1, wet: 0.6 });
    }],
    potion: ["potion bubbling", function (t) {
      seq(10, 0.09, function (tt) { tone({ t: tt + rnd(0, 0.04), d: 0.08, f: rnd(300, 600), f2: rnd(800, 1400), v: 0.12 }); }, t);
      return 1.0;
    }],
    shrink: ["shrinking", function (t) { tone({ t: t, d: 0.7, f: 800, f2: 2400, type: "square", v: 0.1, trem: [25, 0.7] }); return 0.7; }],
    grow: ["growing", function (t) { tone({ t: t, d: 0.9, f: 900, f2: 90, type: "square", v: 0.12, trem: [18, 0.6], ft: "lowpass", ff: 2500 }); return 0.9; }],
    vanish: ["vanishing", function (t) {
      tone({ t: t, d: 0.5, f: 1200, f2: 4000, v: 0.12, wet: 0.5 });
      noise({ t: t, d: 0.4, ft: "highpass", f: 3000, f2: 9000, v: 0.12 });
      return 0.55;
    }],

    /* Body */
    barf: ["barfing", function (t) {
      [0, 0.5].forEach(function (o) {
        noise({ t: t + o, d: 0.35, ft: "bandpass", f: 500, f2: 260, q: 4, v: 0.5, trem: [24, 0.9] });
        tone({ t: t + o, d: 0.35, f: 160, f2: 70, type: "sawtooth", v: 0.2, ft: "lowpass", ff: 700, trem: [28, 0.8] });
      });
      noise({ t: t + 0.9, d: 0.5, ft: "lowpass", f: 900, f2: 300, v: 0.5, trem: [14, 0.6] });
      seq(4, 0.08, function (tt) { tone({ t: tt + 1.1, d: 0.06, f: rnd(200, 400), f2: 100, v: 0.15 }); }, t);
      return 1.45;
    }],
    burp: ["burp", function (t) {
      tone({ t: t, d: 0.55, f: 110, f2: 80, type: "sawtooth", v: 0.4, ft: "lowpass", ff: 900, trem: [32, 0.7] });
      return 0.55;
    }],
    fart: ["fart", function (t) {
      tone({ t: t, d: 0.6, f: 95, f2: 70, type: "sawtooth", v: 0.4, ft: "lowpass", ff: 500, trem: [rnd(18, 30), 0.85, "square"] });
      return 0.6;
    }],
    sneeze: ["sneeze", function (t) {
      noise({ t: t, d: 0.5, ft: "bandpass", f: 900, f2: 1600, q: 3, v: 0.25, a: 0.4 });
      noise({ t: t + 0.55, d: 0.25, ft: "highpass", f: 2500, v: 0.7 });
      return 0.85;
    }],
    cough: ["cough", function (t) {
      return seq(3, 0.28, function (tt) { noise({ t: tt, d: 0.18, ft: "bandpass", f: 650, q: 2, v: 0.6 }); }, t);
    }],
    hiccup: ["hiccup", function (t) { tone({ t: t, d: 0.12, f: 350, f2: 950, v: 0.4 }); click(t, 1500, 0.2); return 0.2; }],
    snore: ["snoring", function (t) {
      [0, 1.2].forEach(function (o) {
        tone({ t: t + o, d: 0.8, f: 70, type: "sawtooth", v: 0.25, ft: "lowpass", ff: 400, trem: [35, 0.9], a: 0.3 });
        noise({ t: t + o + 0.85, d: 0.3, ft: "highpass", f: 2000, v: 0.08, a: 0.1 });
      });
      return 2.2;
    }],
    kiss: ["kiss", function (t) { noise({ t: t, d: 0.06, ft: "bandpass", f: 2500, q: 2, v: 0.5 }); tone({ t: t, d: 0.08, f: 1200, f2: 1800, v: 0.15 }); return 0.12; }],
    slurp: ["slurp", function (t) { noise({ t: t, d: 0.7, ft: "bandpass", f: 400, f2: 2000, q: 6, v: 0.4, trem: [22, 0.7] }); return 0.7; }],
    gulp: ["gulp", function (t) { tone({ t: t, d: 0.18, f: 400, f2: 120, v: 0.5 }); click(t + 0.12, 800, 0.2); return 0.25; }],
    chomp: ["chomp", function (t) {
      return seq(3, 0.22, function (tt) { noise({ t: tt, d: 0.08, ft: "lowpass", f: 2500, v: 0.6 }); thump(tt, 140, 0.08, 0.4); }, t);
    }],
    crunch: ["crunch", function (t) {
      return seq(10, 0.025, function (tt) { noise({ t: tt, d: 0.03, ft: "bandpass", f: rnd(1500, 4000), q: 2, v: 0.4 }); }, t) + 0.1;
    }],
    gasp: ["gasp", function (t) { noise({ t: t, d: 0.35, ft: "bandpass", f: 1200, f2: 2400, q: 2, v: 0.35, a: 0.25 }); return 0.4; }],
    yawn: ["yawn", function (t) {
      tone({ t: t, d: 1.4, f: 210, f2: 150, type: "sawtooth", v: 0.15, ft: "bandpass", ff: 900, ff2: 400, q: 4, a: 0.3 });
      return 1.4;
    }],
    stomach: ["stomach growl", function (t) {
      tone({ t: t, d: 1.0, f: 60, f2: 95, type: "sawtooth", v: 0.3, ft: "lowpass", ff: 300, trem: [12, 0.9] });
      return 1.0;
    }],
    heartbeat: ["heartbeat", function (t) {
      return seq(3, 0.75, function (tt) { thump(tt, 70, 0.15, 0.7); thump(tt + 0.2, 60, 0.15, 0.5); }, t);
    }],
    whistle: ["whistle", function (t) { tone({ t: t, d: 0.5, f: 1400, f2: 2100, v: 0.2, vib: [6, 20] }); tone({ t: t + 0.5, d: 0.4, f: 2100, f2: 1500, v: 0.18 }); return 0.9; }],
    wolfwhistle: ["wolf whistle", function (t) { tone({ t: t, d: 0.3, f: 1200, f2: 2600, v: 0.2 }); tone({ t: t + 0.35, d: 0.5, f: 2400, f2: 900, v: 0.2 }); return 0.85; }],
    clap: ["clap", function (t) { return seq(3, 0.3, function (tt) { noise({ t: tt, d: 0.06, ft: "bandpass", f: 1800, q: 1, v: 0.7 }); }, t); }],
    applause: ["applause", function (t) {
      for (var i = 0; i < 90; i++) noise({ t: t + rnd(0, 2.5), d: 0.04, ft: "bandpass", f: rnd(1200, 2600), q: 1.5, v: rnd(0.08, 0.2) });
      return 2.6;
    }],
    cheer: ["crowd cheering", function (t) {
      noise({ t: t, d: 2.2, ft: "bandpass", f: 1100, f2: 1600, q: 1.5, v: 0.35, a: 0.2, trem: [7, 0.4], wet: 0.4 });
      for (var i = 0; i < 6; i++) tone({ t: t + rnd(0, 1.2), d: 0.8, f: rnd(400, 700), f2: rnd(700, 1100), type: "sawtooth", v: 0.03, ft: "bandpass", ff: 1200, q: 3, vib: [6, 20] });
      return 2.2;
    }],
    crowdboo: ["crowd booing", function (t) {
      for (var i = 0; i < 6; i++) tone({ t: t + rnd(0, 0.3), d: 1.8, f: rnd(110, 180), f2: rnd(90, 120), type: "sawtooth", v: 0.06, ft: "bandpass", ff: 500, q: 3, a: 0.2 });
      return 2.0;
    }],
    murmur: ["crowd murmuring", function (t) { noise({ t: t, d: 2.5, ft: "bandpass", f: 500, q: 2, v: 0.3, a: 0.4, trem: [3, 0.5], wet: 0.4 }); return 2.5; }],
    laughtrack: ["audience laughing", function (t) {
      for (var i = 0; i < 18; i++) tone({ t: t + i * 0.11 + rnd(0, 0.05), d: 0.12, f: rnd(250, 500), type: "sawtooth", v: 0.05, ft: "bandpass", ff: 900, q: 3 });
      noise({ t: t, d: 2.0, ft: "bandpass", f: 900, q: 1.5, v: 0.15, a: 0.1, trem: [9, 0.6] });
      return 2.1;
    }],
    footsteps: ["footsteps", function (t) { return seq(5, 0.42, function (tt) { thump(tt, 110, 0.12, 0.35); noise({ t: tt, d: 0.05, ft: "bandpass", f: 900, v: 0.12 }); }, t); }],
    running: ["running", function (t) { return seq(8, 0.18, function (tt) { thump(tt, 120, 0.09, 0.35); }, t); }],
    tiptoe: ["tiptoeing", function (t) { return seq(5, 0.35, function (tt) { click(tt, 4000, 0.08); }, t); }],
    stomp: ["stomping", function (t) { return seq(4, 0.5, function (tt) { thump(tt, 70, 0.3, 0.9); }, t); }],
    stairs: ["footsteps on stairs", function (t) { return seq(6, 0.3, function (tt, i) { thump(tt, 100 + i * 12, 0.1, 0.4); }, t); }],
    giantsteps: ["giant footsteps", function (t) { return seq(3, 0.8, function (tt) { thump(tt, 45, 0.6, 1); noise({ t: tt, d: 0.4, ft: "lowpass", f: 200, v: 0.4 }); }, t); }],

    /* Hits */
    punch: ["punch", function (t) { thump(t, 140, 0.18, 1); noise({ t: t, d: 0.06, ft: "highpass", f: 1500, v: 0.4 }); return 0.22; }],
    pow: ["cartoon pow", function (t) { thump(t, 180, 0.2, 1); tone({ t: t, d: 0.25, f: 900, f2: 300, type: "square", v: 0.1 }); return 0.3; }],
    slap: ["slap", function (t) { noise({ t: t, d: 0.09, ft: "highpass", f: 1200, v: 0.9 }); return 0.12; }],
    thud: ["thud", function (t) { thump(t, 90, 0.35, 1); noise({ t: t + 0.02, d: 0.15, ft: "lowpass", f: 600, v: 0.3 }); return 0.4; }],
    tumble: ["tumbling", function (t) { return seq(4, 0.17, function (tt) { thump(tt, rnd(70, 130), 0.15, 0.7); }, t) + 0.2; }],
    crash: ["crash", function (t) {
      noise({ t: t, d: 1.2, ft: "highpass", f: 800, v: 0.6 });
      thump(t, 80, 0.4, 0.8);
      seq(8, 0.07, function (tt) { tone({ t: tt + rnd(0, 0.05), d: 0.3, f: rnd(1500, 4500), v: 0.06 }); }, t + 0.05);
      return 1.2;
    }],
    glass: ["glass breaking", function (t) {
      noise({ t: t, d: 0.5, ft: "highpass", f: 3000, v: 0.6 });
      seq(14, 0.035, function (tt) { tone({ t: tt + rnd(0, 0.03), d: rnd(0.15, 0.5), f: rnd(2500, 7000), v: 0.07 }); }, t);
      return 0.9;
    }],
    boom: ["explosion", function (t) {
      noise({ t: t, d: 2.0, ft: "lowpass", f: 1200, f2: 80, v: 1, a: 0.005, wet: 0.4 });
      tone({ t: t, d: 1.2, f: 70, f2: 30, v: 0.9 });
      return 2.0;
    }],
    thunder: ["thunder", function (t) {
      noise({ t: t, d: 0.3, ft: "highpass", f: 1500, v: 0.5 });
      noise({ t: t + 0.1, d: 3.0, ft: "lowpass", f: 400, f2: 90, v: 0.9, a: 0.2, trem: [5, 0.5], wet: 0.5 });
      return 3.0;
    }],
    bonk: ["bonk", function (t) { tone({ t: t, d: 0.35, f: 900, f2: 450, type: "triangle", v: 0.4 }); wood(t, 600, 0.4); return 0.35; }],
    splat: ["splat", function (t) { noise({ t: t, d: 0.25, ft: "lowpass", f: 1500, f2: 300, v: 0.8 }); tone({ t: t, d: 0.15, f: 200, f2: 60, v: 0.4 }); return 0.3; }],
    splash: ["splash", function (t) {
      noise({ t: t, d: 0.8, ft: "bandpass", f: 2500, f2: 800, q: 0.8, v: 0.7 });
      seq(6, 0.08, function (tt) { tone({ t: tt + 0.3, d: 0.08, f: rnd(800, 1600), f2: rnd(1600, 2600), v: 0.1 }); }, t);
      return 1.0;
    }],
    squish: ["squish", function (t) { noise({ t: t, d: 0.45, ft: "bandpass", f: 300, f2: 1200, q: 5, v: 0.6, trem: [20, 0.6] }); return 0.45; }],
    kick: ["kick", function (t) { thump(t, 120, 0.2, 1); return 0.25; }],
    clang: ["metal clang", function (t) {
      [523, 1187, 1903, 2817].forEach(function (f, i) { tone({ t: t, d: 1.2 / (i + 1), f: f, v: 0.2 / (i + 1), wet: 0.3 }); });
      noise({ t: t, d: 0.05, ft: "highpass", f: 3000, v: 0.6 });
      return 1.2;
    }],
    swordclash: ["sword clash", function (t) {
      [0, 0.35].forEach(function (o) { [1350, 2410, 3770].forEach(function (f, i) { tone({ t: t + o, d: 0.5 / (i + 1), f: f * rnd(0.97, 1.03), v: 0.12, wet: 0.3 }); }); noise({ t: t + o, d: 0.05, ft: "highpass", f: 4000, v: 0.5 }); });
      return 0.9;
    }],
    shing: ["sword drawn", function (t) { noise({ t: t, d: 0.5, ft: "highpass", f: 3000, f2: 8000, v: 0.3 }); tone({ t: t + 0.4, d: 0.8, f: 3200, v: 0.07, wet: 0.4 }); return 1.0; }],
    whoosh: ["whoosh", function (t) { noise({ t: t, d: 0.55, ft: "bandpass", f: 300, f2: 2500, f3: 400, glide: 0.3, q: 1.5, v: 0.6, a: 0.2 }); return 0.55; }],
    swish: ["swish", function (t) { noise({ t: t, d: 0.25, ft: "bandpass", f: 800, f2: 4000, q: 1.5, v: 0.5, a: 0.08 }); return 0.25; }],
    zipper: ["zipper", function (t) { noise({ t: t, d: 0.5, ft: "highpass", f: 2000, f2: 4000, v: 0.3, trem: [70, 0.95, "square"] }); return 0.5; }],
    boing: ["boing", function (t) { tone({ t: t, d: 0.7, f: 180, f2: 500, glide: 0.1, type: "triangle", v: 0.4, vib: [14, 60] }); return 0.7; }],
    bounce: ["bouncing", function (t) { var tt = t, gap = 0.4; for (var i = 0; i < 5; i++) { thump(tt, 160, 0.1, 0.6 - i * 0.1); tt += gap; gap *= 0.7; } return tt - t + 0.1; }],
    slideup: ["slide whistle up", function (t) { tone({ t: t, d: 0.7, f: 400, f2: 2000, v: 0.25, vib: [5, 10] }); return 0.7; }],
    slidedown: ["slide whistle down", function (t) { tone({ t: t, d: 0.8, f: 2000, f2: 300, v: 0.25, vib: [5, 10] }); return 0.8; }],
    fallwhistle: ["falling whistle", function (t) { tone({ t: t, d: 1.4, f: 1800, f2: 400, v: 0.2 }); thump(t + 1.4, 80, 0.4, 1); return 1.8; }],
    pop: ["pop", function (t) { tone({ t: t, d: 0.08, f: 1200, f2: 300, v: 0.6 }); click(t, 2000, 0.4); return 0.1; }],
    squeak: ["squeak", function (t) { tone({ t: t, d: 0.18, f: 1800, f2: 2600, v: 0.2, vib: [30, 100] }); return 0.2; }],
    honk: ["clown horn", function (t) { return seq(2, 0.3, function (tt) { tone({ t: tt, d: 0.22, f: 420, type: "square", v: 0.15, ft: "lowpass", ff: 2000 }); tone({ t: tt, d: 0.22, f: 530, type: "square", v: 0.1, ft: "lowpass", ff: 2000 }); }, t); }],
    wobble: ["wobble", function (t) { tone({ t: t, d: 1.0, f: 300, v: 0.25, vib: [8, 120], type: "triangle" }); return 1.0; }],
    ding: ["ding", function (t) { return bell(t, 1320, 1.2, 0.3); }],
    tada: ["ta-da", function (t) { notes([523, 659], t, 0.12, { type: "sawtooth", v: 0.1, d: 0.15, ft: "lowpass", ff: 3000 }); chord([523, 659, 784, 1047], t + 0.25, { type: "sawtooth", d: 1.0, v: 0.35, ft: "lowpass", ff: 3000, wet: 0.3 }); return 1.25; }],
    scratch: ["record scratch", function (t) { noise({ t: t, d: 0.3, ft: "bandpass", f: 400, f2: 3000, q: 4, v: 0.6 }); noise({ t: t + 0.3, d: 0.25, ft: "bandpass", f: 3000, f2: 500, q: 4, v: 0.6 }); return 0.55; }],
    cuckoo: ["cuckoo", function (t) { return seq(2, 0.6, function (tt) { tone({ t: tt, d: 0.22, f: 784, v: 0.3, a: 0.02 }); tone({ t: tt + 0.25, d: 0.3, f: 622, v: 0.3, a: 0.02 }); }, t); }],
    rimshot: ["ba-dum-tss", function (t) { thump(t, 180, 0.12, 0.6); thump(t + 0.18, 120, 0.15, 0.7); noise({ t: t + 0.45, d: 0.9, ft: "highpass", f: 6000, v: 0.4 }); return 1.35; }],
    sadtrombone: ["sad trombone", function (t) {
      [392, 370, 349].forEach(function (f, i) { tone({ t: t + i * 0.45, d: 0.42, f: f, type: "sawtooth", v: 0.15, ft: "lowpass", ff: 1200, a: 0.03 }); });
      tone({ t: t + 1.35, d: 1.2, f: 330, type: "sawtooth", v: 0.15, ft: "lowpass", ff: 1200, vib: [6, 12], a: 0.03 });
      return 2.55;
    }],
    fanfare: ["fanfare", function (t) {
      notes([392, 392, 392, 523], t, 0.15, { type: "sawtooth", d: 0.18, v: 0.12, ft: "lowpass", ff: 2500 });
      chord([523, 659, 784], t + 0.6, { type: "sawtooth", d: 1.2, v: 0.4, ft: "lowpass", ff: 2500, wet: 0.4, vib: [5, 4] });
      return 1.8;
    }],
    drumroll: ["drumroll", function (t) {
      for (var i = 0; i < 40; i++) noise({ t: t + i * 0.045, d: 0.06, ft: "bandpass", f: 1800, q: 0.8, v: 0.15 + i * 0.006 });
      noise({ t: t + 1.85, d: 1.2, ft: "highpass", f: 5000, v: 0.5 });
      thump(t + 1.85, 90, 0.3, 0.8);
      return 3.0;
    }],
    cymbal: ["cymbal crash", function (t) { noise({ t: t, d: 1.6, ft: "highpass", f: 5000, v: 0.6, wet: 0.4 }); return 1.6; }],
    gong: ["gong", function (t) { [110, 167, 233, 297, 412].forEach(function (f, i) { tone({ t: t, d: 3 / (1 + i * 0.3), f: f, v: 0.25 / (1 + i * 0.5), vib: [0.5, 2], wet: 0.5 }); }); return 3.0; }],
    harp: ["harp glissando", function (t) { return notes([262, 294, 330, 392, 440, 523, 587, 659, 784, 880, 1047, 1175], t, 0.045, { type: "triangle", d: 0.8, v: 0.12, wet: 0.5 }); }],
    dundun: ["dun dun DUNNN", function (t) {
      tone({ t: t, d: 0.35, f: 147, type: "sawtooth", v: 0.25, ft: "lowpass", ff: 800 });
      tone({ t: t + 0.45, d: 0.35, f: 131, type: "sawtooth", v: 0.25, ft: "lowpass", ff: 800 });
      chord([123, 147, 175], t + 0.9, { type: "sawtooth", d: 1.6, v: 0.5, ft: "lowpass", ff: 900, vib: [5, 3], wet: 0.4 });
      return 2.5;
    }],
    victory: ["victory jingle", function (t) { return notes([523, 659, 784, 1047, 784, 1047], t, 0.12, { type: "square", d: 0.14, v: 0.08, ft: "lowpass", ff: 3000 }); }],
    buzzer: ["wrong buzzer", function (t) { tone({ t: t, d: 0.7, f: 110, type: "square", v: 0.2, ft: "lowpass", ff: 1200, hold: 0.05 }); tone({ t: t, d: 0.7, f: 116, type: "square", v: 0.15, ft: "lowpass", ff: 1200, hold: 0.05 }); return 0.7; }],
    correct: ["correct ding", function (t) { tone({ t: t, d: 0.2, f: 880, v: 0.2 }); tone({ t: t + 0.15, d: 0.5, f: 1320, v: 0.2, wet: 0.3 }); return 0.65; }],
    levelup: ["level up", function (t) { return notes([392, 523, 659, 784, 1047, 1319, 1568], t, 0.06, { type: "square", d: 0.1, v: 0.07 }); }],
    organ: ["spooky organ", function (t) { chord([110, 131, 156, 220, 262], t, { d: 2.4, v: 0.4, type: "sawtooth", ft: "lowpass", ff: 1400, vib: [5, 2], a: 0.05, hold: 0.4, wet: 0.6 }); return 2.4; }],
    piano: ["piano chord", function (t) { [262, 330, 392, 523].forEach(function (f) { tone({ t: t, d: 1.6, f: f, type: "triangle", v: 0.1, wet: 0.3 }); tone({ t: t, d: 0.8, f: f * 2, v: 0.03 }); }); return 1.6; }],
    churchbell: ["church bell", function (t) { return seq(3, 1.2, function (tt) { bell(tt, 220, 2.2, 0.35, 0.5); }, t) + 1.0; }],
    tollone: ["bell tolls once", function (t) { return bell(t, 196, 3.0, 0.4, 0.6); }],
    schoolbell: ["school bell", function (t) { tone({ t: t, d: 1.6, f: 2200, type: "square", v: 0.08, trem: [28, 1, "square"], ft: "lowpass", ff: 4000, hold: 0.05 }); return 1.6; }],
    doorbell: ["doorbell", function (t) { bell(t, 659, 1.0, 0.25); bell(t + 0.5, 523, 1.4, 0.25); return 1.9; }],
    phone: ["phone ringing", function (t) { return seq(2, 1.0, function (tt) { tone({ t: tt, d: 0.7, f: 1400, v: 0.12, trem: [20, 1, "square"], hold: 0.05 }); tone({ t: tt, d: 0.7, f: 1750, v: 0.08, trem: [20, 1, "square"], hold: 0.05 }); }, t); }],
    alarm: ["alarm clock", function (t) { return seq(8, 0.18, function (tt) { tone({ t: tt, d: 0.09, f: 2600, type: "square", v: 0.08, hold: 0.01 }); }, t); }],
    tick: ["clock ticking", function (t) { return seq(6, 0.5, function (tt, i) { wood(tt, i % 2 ? 1800 : 1500, 0.15); }, t); }],
    clockchime: ["clock chiming", function (t) { return notes([659, 523, 587, 392], t, 0.5, { d: 1.2, v: 0.15, wet: 0.5 }) && 2.6; }],
    knock: ["knocking", function (t) { return seq(3, 0.22, function (tt) { wood(tt, 220, 0.8); thump(tt, 120, 0.1, 0.4); }, t) + 0.2; }],
    creak: ["door creaking", function (t) { tone({ t: t, d: 1.4, f: 180, f2: 420, type: "sawtooth", v: 0.12, ft: "bandpass", ff: 900, q: 6, trem: [35, 0.8, "square"], a: 0.1 }); return 1.4; }],
    doorslam: ["door slamming", function (t) { thump(t, 80, 0.4, 1); noise({ t: t, d: 0.4, ft: "lowpass", f: 900, v: 0.5, wet: 0.4 }); return 0.5; }],
    dooropen: ["door opening", function (t) { tone({ t: t, d: 0.7, f: 250, f2: 380, type: "sawtooth", v: 0.08, ft: "bandpass", ff: 900, q: 6, trem: [30, 0.8, "square"] }); click(t + 0.7, 1500, 0.3); return 0.8; }],
    doorclose: ["door closing", function (t) { click(t, 1800, 0.3); thump(t + 0.05, 110, 0.2, 0.6); return 0.3; }],
    typing: ["typing", function (t) { return seq(14, 0.09, function (tt) { click(tt + rnd(0, 0.04), rnd(2500, 4500), 0.25); }, t); }],
    click: ["click", function (t) { return click(t, 2500, 0.5) + 0.05; }],
    switchon: ["switch", function (t) { click(t, 2000, 0.5); tone({ t: t, d: 0.05, f: 900, v: 0.1 }); return 0.1; }],
    buzz: ["electric buzz", function (t) { tone({ t: t, d: 1.0, f: 120, type: "sawtooth", v: 0.15, ft: "lowpass", ff: 1500, trem: [50, 0.5], hold: 0.1 }); return 1.0; }],
    electric: ["electric zap", function (t) { for (var i = 0; i < 12; i++) noise({ t: t + rnd(0, 0.6), d: 0.03, ft: "highpass", f: 3000, v: 0.4 }); tone({ t: t, d: 0.6, f: 60, type: "sawtooth", v: 0.15, trem: [90, 0.9, "square"] }); return 0.7; }],
    register: ["cash register", function (t) { click(t, 2000, 0.3); click(t + 0.1, 2500, 0.3); bell(t + 0.2, 2100, 0.8, 0.2); return 1.0; }],
    coins: ["coins jingling", function (t) { return seq(9, 0.06, function (tt) { tone({ t: tt + rnd(0, 0.04), d: 0.25, f: rnd(3000, 5500), v: 0.08 }); }, t) + 0.25; }],
    camera: ["camera click", function (t) { click(t, 2000, 0.5); noise({ t: t + 0.05, d: 0.05, ft: "bandpass", f: 1200, v: 0.3 }); click(t + 0.12, 2500, 0.4); return 0.2; }],
    carhorn: ["car horn", function (t) { return seq(2, 0.35, function (tt) { tone({ t: tt, d: 0.28, f: 400, type: "sawtooth", v: 0.12, ft: "lowpass", ff: 2000, hold: 0.03 }); tone({ t: tt, d: 0.28, f: 500, type: "sawtooth", v: 0.1, ft: "lowpass", ff: 2000, hold: 0.03 }); }, t); }],
    engine: ["engine revving", function (t) { tone({ t: t, d: 1.8, f: 50, f2: 140, glide: 1.0, type: "sawtooth", v: 0.25, ft: "lowpass", ff: 600, trem: [25, 0.6] }); return 1.8; }],
    siren: ["siren", function (t) { tone({ t: t, d: 2.4, f: 900, v: 0.15, vib: [0.8, 300], type: "triangle", hold: 0.2 }); return 2.4; }],
    trainwhistle: ["train whistle", function (t) { chord([523, 622, 784], t, { d: 1.4, v: 0.25, type: "triangle", a: 0.1, hold: 0.2, wet: 0.4 }); return 1.4; }],
    helicopter: ["helicopter", function (t) { noise({ t: t, d: 2.0, ft: "lowpass", f: 500, v: 0.6, trem: [14, 0.9, "square"], a: 0.3 }); return 2.0; }],
    airplane: ["airplane", function (t) { noise({ t: t, d: 2.5, ft: "lowpass", f: 300, f2: 900, f3: 300, glide: 1.25, v: 0.5, a: 0.8 }); return 2.5; }],
    laser: ["laser", function (t) { return seq(3, 0.18, function (tt) { tone({ t: tt, d: 0.16, f: 1800, f2: 300, type: "square", v: 0.1 }); }, t); }],
    spaceship: ["spaceship hum", function (t) { tone({ t: t, d: 2.0, f: 80, type: "sawtooth", v: 0.2, ft: "lowpass", ff: 400, trem: [3, 0.4], a: 0.4 }); tone({ t: t, d: 2.0, f: 1200, v: 0.04, vib: [4, 80], a: 0.4 }); return 2.0; }],
    robotbeep: ["robot beeps", function (t) { return seq(6, 0.1, function (tt) { tone({ t: tt, d: 0.08, f: [880, 1320, 660, 1760, 990, 1180][Math.floor(rnd(0, 6))], type: "square", v: 0.08, hold: 0.01 }); }, t); }],
    computer: ["computer beeping", function (t) { return seq(10, 0.12, function (tt) { tone({ t: tt, d: 0.06, f: rnd(600, 2400), type: "square", v: 0.06, hold: 0.01 }); }, t); }],
    servo: ["robot moving", function (t) { tone({ t: t, d: 0.5, f: 300, f2: 600, type: "sawtooth", v: 0.1, ft: "bandpass", ff: 1200, q: 3 }); tone({ t: t + 0.6, d: 0.5, f: 600, f2: 300, type: "sawtooth", v: 0.1, ft: "bandpass", ff: 1200, q: 3 }); return 1.1; }],
    bomb: ["ticking bomb", function (t) { seq(6, 0.3, function (tt) { wood(tt, 2000, 0.2); }, t); tone({ t: t + 1.8, d: 0.3, f: 1500, type: "square", v: 0.1, hold: 0.02 }); return 2.1; }],
    rocket: ["rocket launch", function (t) { noise({ t: t, d: 3.0, ft: "lowpass", f: 200, f2: 2000, v: 0.8, a: 1.0, wet: 0.3 }); return 3.0; }],

    /* Nature and animals */
    wind: ["wind", function (t) { noise({ t: t, d: 3.0, ft: "bandpass", f: 400, f2: 1200, f3: 500, glide: 1.5, q: 3, v: 0.4, a: 0.8 }); return 3.0; }],
    howlwind: ["howling wind", function (t) { noise({ t: t, d: 3.0, ft: "bandpass", f: 500, f2: 1400, f3: 600, glide: 1.5, q: 12, v: 0.5, a: 0.7 }); return 3.0; }],
    rain: ["rain", function (t) { noise({ t: t, d: 3.0, ft: "highpass", f: 1500, v: 0.2, a: 0.5 }); for (var i = 0; i < 60; i++) click(t + rnd(0, 3), rnd(2000, 6000), 0.06); return 3.0; }],
    storm: ["storm", function (t) { S.rain[1](t); S.thunder[1](t + 0.5); return 3.5; }],
    drip: ["dripping", function (t) { return seq(3, 0.5, function (tt) { tone({ t: tt, d: 0.12, f: 900, f2: 1700, v: 0.25 }); }, t); }],
    bubbles: ["bubbles", function (t) { return seq(10, 0.08, function (tt) { tone({ t: tt + rnd(0, 0.04), d: 0.07, f: rnd(400, 900), f2: rnd(1000, 2200), v: 0.12 }); }, t); }],
    cauldron: ["cauldron bubbling", function (t) { seq(14, 0.11, function (tt) { tone({ t: tt + rnd(0, 0.05), d: 0.1, f: rnd(120, 260), f2: rnd(300, 600), v: 0.18 }); }, t); noise({ t: t, d: 1.6, ft: "lowpass", f: 300, v: 0.2 }); return 1.6; }],
    fire: ["fire crackling", function (t) { noise({ t: t, d: 2.5, ft: "lowpass", f: 500, v: 0.3, a: 0.3 }); for (var i = 0; i < 30; i++) click(t + rnd(0, 2.5), rnd(1500, 5000), rnd(0.1, 0.4)); return 2.5; }],
    waves: ["ocean waves", function (t) { noise({ t: t, d: 3.0, ft: "lowpass", f: 400, f2: 1800, f3: 400, glide: 1.4, v: 0.5, a: 1.2 }); return 3.0; }],
    stream: ["running water", function (t) { noise({ t: t, d: 2.5, ft: "bandpass", f: 1500, q: 0.8, v: 0.3, a: 0.4, trem: [8, 0.3] }); return 2.5; }],
    birds: ["birds chirping", function (t) { return seq(8, 0.22, function (tt) { tone({ t: tt + rnd(0, 0.1), d: 0.1, f: rnd(2800, 4200), f2: rnd(3500, 5500), v: 0.1 }); tone({ t: tt + 0.11, d: 0.08, f: rnd(3500, 5000), f2: rnd(2500, 3500), v: 0.08 }); }, t); }],
    owl: ["owl hooting", function (t) { tone({ t: t, d: 0.3, f: 420, f2: 390, v: 0.3, a: 0.05, wet: 0.5 }); tone({ t: t + 0.5, d: 0.6, f: 430, f2: 380, v: 0.3, a: 0.05, wet: 0.5 }); return 1.2; }],
    wolf: ["wolf howling", function (t) { tone({ t: t, d: 2.4, f: 380, f2: 720, glide: 0.8, type: "sawtooth", v: 0.12, ft: "lowpass", ff: 1600, vib: [5, 10], a: 0.3, wet: 0.6 }); return 2.4; }],
    dog: ["dog barking", function (t) { return seq(2, 0.35, function (tt) { tone({ t: tt, d: 0.14, f: 520, f2: 300, type: "sawtooth", v: 0.3, ft: "bandpass", ff: 900, q: 2 }); noise({ t: tt, d: 0.1, ft: "bandpass", f: 1200, v: 0.3 }); }, t); }],
    cat: ["cat meowing", function (t) { tone({ t: t, d: 0.7, f: 600, f2: 900, glide: 0.3, type: "sawtooth", v: 0.15, ft: "bandpass", ff: 1500, ff2: 800, q: 3, a: 0.05 }); return 0.7; }],
    frog: ["frog croaking", function (t) { return seq(2, 0.45, function (tt) { tone({ t: tt, d: 0.3, f: 140, type: "square", v: 0.15, ft: "lowpass", ff: 800, trem: [40, 0.9] }); }, t); }],
    crickets: ["crickets", function (t) { return seq(5, 0.5, function (tt) { tone({ t: tt, d: 0.25, f: 4500, v: 0.05, trem: [40, 1, "square"], hold: 0.02 }); }, t); }],
    bee: ["buzzing bee", function (t) { tone({ t: t, d: 1.5, f: 220, type: "sawtooth", v: 0.1, vib: [9, 15], ft: "lowpass", ff: 1500, a: 0.1, hold: 0.2 }); return 1.5; }],
    horse: ["horse galloping", function (t) { return seq(4, 0.42, function (tt) { wood(tt, 500, 0.4); wood(tt + 0.1, 450, 0.3); wood(tt + 0.2, 520, 0.35); }, t); }],
    cow: ["cow mooing", function (t) { tone({ t: t, d: 1.2, f: 140, f2: 110, type: "sawtooth", v: 0.2, ft: "bandpass", ff: 500, ff2: 800, q: 3, a: 0.1 }); return 1.2; }],
    duck: ["duck quacking", function (t) { return seq(2, 0.3, function (tt) { tone({ t: tt, d: 0.15, f: 600, f2: 450, type: "sawtooth", v: 0.2, ft: "bandpass", ff: 1800, q: 4 }); }, t); }],
    rooster: ["rooster crowing", function (t) { tone({ t: t, d: 1.2, f: 500, f2: 900, glide: 0.4, type: "sawtooth", v: 0.12, ft: "bandpass", ff: 1500, q: 3, vib: [8, 30] }); return 1.2; }],
    mouse: ["mouse squeaking", function (t) { return seq(3, 0.15, function (tt) { tone({ t: tt, d: 0.08, f: 3500, f2: 4200, v: 0.12 }); }, t); }],
    hiss: ["snake hissing", function (t) { noise({ t: t, d: 1.4, ft: "highpass", f: 4500, v: 0.4, a: 0.1 }); return 1.4; }],
    roar: ["monster roar", function (t) { tone({ t: t, d: 1.6, f: 90, f2: 60, type: "sawtooth", v: 0.4, ft: "lowpass", ff: 900, trem: [30, 0.5], a: 0.1 }); noise({ t: t, d: 1.6, ft: "bandpass", f: 400, q: 1, v: 0.5, trem: [25, 0.5], a: 0.1, wet: 0.3 }); return 1.6; }],
    dragon: ["dragon roar", function (t) { S.roar[1](t); noise({ t: t + 0.3, d: 1.5, ft: "bandpass", f: 1500, f2: 400, v: 0.4 }); return 1.9; }],
    growl: ["growling", function (t) { tone({ t: t, d: 1.2, f: 70, type: "sawtooth", v: 0.3, ft: "lowpass", ff: 500, trem: [18, 0.8], a: 0.1 }); return 1.2; }],
    lion: ["lion roar", function (t) { tone({ t: t, d: 1.8, f: 140, f2: 80, type: "sawtooth", v: 0.35, ft: "lowpass", ff: 1100, ff2: 400, trem: [20, 0.4], a: 0.2, wet: 0.3 }); return 1.8; }],
    elephant: ["elephant trumpeting", function (t) { tone({ t: t, d: 1.2, f: 600, f2: 900, glide: 0.2, type: "sawtooth", v: 0.15, ft: "bandpass", ff: 1500, q: 2, vib: [7, 40], a: 0.05 }); return 1.2; }],
    monkey: ["monkey chattering", function (t) { return seq(8, 0.1, function (tt) { tone({ t: tt, d: 0.08, f: rnd(800, 1400), f2: rnd(1400, 2000), type: "sawtooth", v: 0.08, ft: "bandpass", ff: 1800, q: 3 }); }, t); }],
    seagull: ["seagulls", function (t) { return seq(3, 0.4, function (tt) { tone({ t: tt, d: 0.3, f: 1400, f2: 900, type: "sawtooth", v: 0.06, ft: "bandpass", ff: 2000, q: 4 }); }, t); }],
    wings: ["wings flapping", function (t) { return seq(6, 0.16, function (tt) { noise({ t: tt, d: 0.12, ft: "lowpass", f: 800, v: 0.4, a: 0.04 }); }, t); }],
    ghost: ["ghostly wail", function (t) { tone({ t: t, d: 2.4, f: 400, f2: 800, glide: 1.2, v: 0.2, vib: [6, 25], a: 0.5, wet: 0.7 }); return 2.4; }],
    chains: ["chains rattling", function (t) { for (var i = 0; i < 25; i++) tone({ t: t + rnd(0, 1.4), d: 0.12, f: rnd(1800, 4500), v: 0.06 }); noise({ t: t, d: 1.4, ft: "highpass", f: 3000, v: 0.1, trem: [12, 0.8] }); return 1.5; }],
    spooky: ["spooky music", function (t) { chord([220, 233, 311], t, { d: 2.5, v: 0.3, type: "triangle", vib: [4, 8], a: 0.6, wet: 0.7 }); return 2.5; }],
    evil: ["evil music sting", function (t) { chord([73, 78, 110], t, { d: 2.0, v: 0.5, type: "sawtooth", ft: "lowpass", ff: 700, a: 0.05, wet: 0.5 }); return 2.0; }],

    /* Sports and games */
    refwhistle: ["referee whistle", function (t) { tone({ t: t, d: 0.8, f: 2700, v: 0.2, trem: [35, 0.7], hold: 0.05 }); return 0.8; }],
    gamebuzzer: ["game buzzer", function (t) { tone({ t: t, d: 1.0, f: 220, type: "square", v: 0.15, ft: "lowpass", ff: 2000, hold: 0.05 }); return 1.0; }],
    net: ["basketball swish", function (t) { noise({ t: t, d: 0.3, ft: "bandpass", f: 3000, f2: 1500, q: 1, v: 0.3 }); return 0.3; }],
    batcrack: ["bat cracking a ball", function (t) { click(t, 1800, 0.9); tone({ t: t, d: 0.1, f: 1100, v: 0.3 }); return 0.15; }],
    goalhorn: ["goal horn", function (t) { chord([110, 138, 165], t, { d: 2.0, v: 0.5, type: "sawtooth", ft: "lowpass", ff: 1200, hold: 0.2, a: 0.05 }); return 2.0; }],
    jump: ["jump", function (t) { tone({ t: t, d: 0.25, f: 300, f2: 900, type: "square", v: 0.08 }); return 0.25; }],
    coin: ["coin", function (t) { tone({ t: t, d: 0.08, f: 988, type: "square", v: 0.07 }); tone({ t: t + 0.08, d: 0.35, f: 1319, type: "square", v: 0.07 }); return 0.45; }],
    dizzy: ["dizzy birds", function (t) { return seq(6, 0.18, function (tt, i) { tone({ t: tt, d: 0.12, f: i % 2 ? 2600 : 3200, f2: i % 2 ? 3200 : 2600, v: 0.08 }); }, t); }],

    /* Food and kitchen */
    cork: ["cork popping", function (t) { tone({ t: t, d: 0.1, f: 600, f2: 250, v: 0.6 }); noise({ t: t + 0.08, d: 0.6, ft: "highpass", f: 4000, v: 0.12 }); return 0.7; }],
    fizz: ["fizzing", function (t) { for (var i = 0; i < 50; i++) click(t + rnd(0, 1.2), rnd(5000, 9000), 0.05); return 1.2; }],
    sizzle: ["sizzling", function (t) { noise({ t: t, d: 2.0, ft: "highpass", f: 4000, v: 0.25, a: 0.1, trem: [6, 0.3] }); return 2.0; }],
    pour: ["pouring", function (t) { noise({ t: t, d: 1.4, ft: "bandpass", f: 500, f2: 1800, q: 3, v: 0.3, a: 0.1 }); return 1.4; }],
    kettle: ["kettle whistling", function (t) { tone({ t: t, d: 1.8, f: 1700, f2: 2300, v: 0.12, a: 0.6, vib: [7, 15] }); return 1.8; }],
    timer: ["timer ding", function (t) { return bell(t, 2400, 1.0, 0.25); }],
    flush: ["toilet flush", function (t) { noise({ t: t, d: 2.2, ft: "bandpass", f: 1500, f2: 400, q: 1, v: 0.5, a: 0.1, trem: [5, 0.4] }); return 2.2; }],

    /* Tools and weapons (cartoony) */
    hammer: ["hammering", function (t) { return seq(3, 0.35, function (tt) { [800, 1700, 2600].forEach(function (f) { tone({ t: tt, d: 0.15, f: f, v: 0.1 }); }); thump(tt, 200, 0.08, 0.4); }, t); }],
    saw: ["sawing", function (t) { return seq(3, 0.4, function (tt) { noise({ t: tt, d: 0.35, ft: "bandpass", f: 2500, q: 3, v: 0.3, trem: [40, 0.8] }); }, t); }],
    drill: ["drilling", function (t) { tone({ t: t, d: 1.2, f: 300, type: "square", v: 0.08, trem: [60, 0.5], ft: "lowpass", ff: 2000, hold: 0.1 }); return 1.2; }],
    bang: ["bang", function (t) { noise({ t: t, d: 0.4, ft: "lowpass", f: 3000, f2: 300, v: 0.9 }); thump(t, 100, 0.3, 0.8); return 0.5; }],
    cannon: ["cannon boom", function (t) { noise({ t: t, d: 1.5, ft: "lowpass", f: 800, f2: 60, v: 1, wet: 0.5 }); tone({ t: t, d: 1.0, f: 55, f2: 30, v: 0.9 }); return 1.5; }],
    arrow: ["arrow", function (t) { noise({ t: t, d: 0.3, ft: "bandpass", f: 3000, f2: 1500, q: 2, v: 0.4 }); wood(t + 0.3, 300, 0.6); return 0.45; }],
    bowtwang: ["bow twang", function (t) { tone({ t: t, d: 0.4, f: 220, f2: 180, type: "triangle", v: 0.3, vib: [30, 10] }); return 0.4; }],
    shield: ["shield block", function (t) { S.clang[1](t); thump(t, 120, 0.15, 0.6); return 1.0; }],

    /* Cartoon extras */
    tiptoeMusic: ["sneaky music", function (t) { return notes([196, 0.0001, 220, 0.0001, 247, 0.0001, 196], t, 0.18, { type: "triangle", d: 0.1, v: 0.15 }); }],
    gulpbig: ["nervous gulp", function (t) { tone({ t: t, d: 0.3, f: 600, f2: 150, v: 0.4 }); return 0.35; }],
    zoom: ["zooming away", function (t) { tone({ t: t, d: 0.5, f: 300, f2: 1500, type: "sawtooth", v: 0.08, ft: "lowpass", ff: 3000 }); noise({ t: t, d: 0.5, ft: "bandpass", f: 500, f2: 3000, v: 0.3 }); return 0.5; }],
    screech: ["tires screeching", function (t) { tone({ t: t, d: 1.0, f: 2200, f2: 1800, type: "sawtooth", v: 0.08, ft: "bandpass", ff: 2500, q: 5, vib: [20, 60] }); return 1.0; }],
    splatpie: ["pie in the face", function (t) { S.splat[1](t); S.squish[1](t + 0.15); return 0.6; }],
    magicflush: ["sucked into a portal", function (t) { tone({ t: t, d: 1.2, f: 1500, f2: 100, v: 0.2, vib: [12, 80], wet: 0.5 }); noise({ t: t, d: 1.2, ft: "bandpass", f: 3000, f2: 300, q: 2, v: 0.3 }); return 1.2; }],
    lightbulb: ["idea ding", function (t) { tone({ t: t, d: 0.6, f: 1568, v: 0.18, wet: 0.4 }); tone({ t: t, d: 0.6, f: 2093, v: 0.1, wet: 0.4 }); return 0.6; }],
    dramatic: ["dramatic sting", function (t) { chord([147, 175, 208, 247], t, { d: 1.6, v: 0.5, type: "sawtooth", ft: "lowpass", ff: 1500, a: 0.02, wet: 0.5 }); return 1.6; }],
    romance: ["romantic music", function (t) { return notes([523, 659, 784, 659, 880], t, 0.3, { type: "triangle", d: 0.7, v: 0.12, vib: [5, 6], wet: 0.6 }); }],
    lullaby: ["lullaby", function (t) { return notes([784, 659, 784, 659, 523], t, 0.4, { d: 0.6, v: 0.1, wet: 0.6 }); }],
    trumpet: ["trumpet call", function (t) { return notes([392, 523, 659, 784], t, 0.2, { type: "sawtooth", d: 0.25, v: 0.12, ft: "lowpass", ff: 2500 }); }],
    drum: ["drum beat", function (t) { return seq(4, 0.3, function (tt, i) { if (i % 2) noise({ t: tt, d: 0.1, ft: "bandpass", f: 1800, v: 0.4 }); else thump(tt, 70, 0.2, 0.9); }, t); }],
    guitar: ["guitar strum", function (t) { [196, 247, 294, 392, 494].forEach(function (f, i) { tone({ t: t + i * 0.02, d: 1.2, f: f, type: "triangle", v: 0.08 }); }); return 1.3; }],
    musicbox: ["music box", function (t) { return notes([1047, 1319, 1568, 1319, 1175, 988], t, 0.22, { d: 0.6, v: 0.08, wet: 0.5 }); }],
    tension: ["suspense", function (t) { tone({ t: t, d: 2.5, f: 110, f2: 220, type: "sawtooth", v: 0.15, ft: "lowpass", ff: 600, ff2: 2000, a: 0.5, vib: [6, 4] }); return 2.5; }]
  };

  /* ============================================
     Words that trigger each sound
     A * after a word adds its verb forms:
     barf* -> barf, barfs, barfed, barfing
     ============================================ */

  var TRIGGERS = {
    spell: "cast* a spell|casts a spell|spell|spells|wand|wands|zaps|hex*|jinx*|curse* him|curse* her|curse* them|enchant*|incantation|abracadabra|bewitch*|magic|magical|wave* (?:his|her|their) wand|point* (?:his|her|their) wand|sorcery|bibbidi|expelliarmus|wingardium|alakazam|hocus pocus|shazam",
    zap: "zap|zapped|blast*|lightning bolt|bolt of lightning|stun*|stunned|petrif*|electrocute*",
    sparkle: "sparkl*|glitter*|twinkl*|fairy dust|pixie dust|stardust|shimmer*",
    poof: "poof|in a puff of smoke|puff of smoke|cloud of smoke|smoke bomb",
    teleport: "teleport*|apparate*|disapparate*|beam* up|portkey|warp*",
    shimmer: "glisten*|gleam*|radiant|dazzl*",
    curse: "dark magic|evil spell|cursed|dark curse|black magic|summon* the dark",
    transform: "transform*|turn* into|turned into|changes into|change* into|morph*|becomes a|become a|shape-shift*|shapeshift*|turns to stone|turn to stone",
    levitate: "levitat*|float*|hover*|rises into the air|lifted into the air|flies up|floating",
    freeze: "freez*|frozen|froze|ice spell|turns to ice|icicle",
    heal: "heal*|cured|potion of healing|feels better",
    powerup: "power* up|powers up|charges up|levels up",
    powerdown: "power* down|shuts down|runs out of power|batteries die",
    glow: "glow*|light* up|lit up|beam of light|shines|shine",
    wand: "flick* (?:his|her|their) wand|swish and flick|waves the wand",
    potion: "potion|potions|brew*|elixir",
    shrink: "shrink*|shrank|shrunk|gets tiny|gets smaller",
    grow: "grows huge|grows giant|gets bigger|grows bigger|enlarg*|engorgio",
    vanish: "vanish*|disappear*|fades away|invisible",

    barf: "barf*|vomit*|puke*|throw* up|throws up|threw up|retch*|gag*|hurl*|upchuck*|spew*|being sick|is sick|sick everywhere|slugs come out",
    burp: "burp*|belch*",
    fart: "fart*|toot*|passes gas|pass gas|breaks wind|break wind",
    sneeze: "sneez*|achoo|ah-choo|atchoo",
    cough: "cough*|splutter*|sputter*|chok*|wheez*",
    hiccup: "hiccup*|hiccough*",
    snore: "snor*|zzz|falls asleep|fall asleep|fast asleep|dozes off|nods off",
    kiss: "kiss*|smooch*|peck on the cheek|mwah",
    slurp: "slurp*|sip*|drinks|drink* loudly|gulps down",
    gulp: "gulp*|swallow*|gobble*",
    chomp: "chomp*|bite*|bites|bit into|munch*|chew*|nibbl*|eat*|eats|ate|devour*",
    crunch: "crunch*|crispy|crackers|crisps",
    gasp: "gasp*|inhal*|sharp breath",
    yawn: "yawn*|stretch* and yawn",
    stomach: "stomach growl*|tummy rumbl*|stomach rumbl*|is hungry",
    heartbeat: "heartbeat|heart pounding|heart beat*|heart racing|heart thumping",
    whistle: "whistl*|whistles a tune",
    wolfwhistle: "wolf whistle|wolf-whistle",
    clap: "clap*|clapping",
    applause: "applaud*|applause|ovation|round of applause|bows to the audience|takes a bow|curtain call",
    cheer: "cheer|cheers|cheering|cheered|hooray|crowd goes wild|celebrat*|whoop*|hurrah",
    crowdboo: "boo|boos|booed|booing|jeer*|crowd boos|hiss* at",
    murmur: "murmur*|whisper among|chatter*|crowd talk*|mutter*",
    laughtrack: "everyone laughs|audience laughs|laughter|crowd laughs|all laugh|they laugh",
    footsteps: "footstep*|walk*|step*|strolls|stroll*|marches|march*|paces|pace*|enters slowly",
    running: "run*|runs|ran|sprint*|dash*|race* off|races in|rush*|hurry|hurries|scurr*|bolt* off|flee*",
    tiptoe: "tiptoe*|sneak*|creeps|creeping|crept|sneaks in|on tiptoe",
    stomp: "stomp*|storm* in|storm* off|storms out",
    stairs: "stairs|staircase|upstairs|downstairs|climbs the|climb* up",
    giantsteps: "giant footsteps|thundering footsteps|ground shakes|earth shakes|earthquake|stomping giant",

    punch: "punch*|hit*|hits|strike*|struck|smack*|whack*|wallop*|sock* him|clobber*|thump*",
    pow: "pow|kapow|bam|wham|biff|ka-pow",
    slap: "slap*|spank*|swat*",
    thud: "thud|falls down|fall* over|falls over|faints|fainted|fainting|collaps*|drop* to the floor|drops dead|falls dead|keels over|falls to the ground|flops",
    tumble: "tumbl*|trip*|stumbl*|rolls down|falls down the stairs|topples|topple*",
    crash: "crash*|collid*|smash* into|wreck*|knocks over|knock* over|clatter*",
    glass: "glass break*|shatter*|smash* the window|broken glass|window breaks|mirror breaks|vase breaks|plate breaks|smash*",
    boom: "explod*|explosion|blows up|blow* up|kaboom|boom|blast|detonat*|bursts into flames",
    thunder: "thunder*|thunderclap|lightning|lightning flash*|thunder and lightning",
    bonk: "bonk*|bump* (?:his|her|their) head|hits (?:his|her|their) head|conk*|bop*",
    splat: "splat*|squash*|falls in the mud|mud",
    splash: "splash*|dives into|jumps into the water|falls into the water|falls in the lake|falls in the pool|soaked|dunk*|plunge*",
    squish: "squish*|squelch*|slime|slimy|goo|gooey",
    kick: "kick*",
    clang: "clang*|clank*|metal|pots and pans|anvil|armor|armour",
    swordclash: "sword fight|swordfight|swords clash|duel*|fenc*|cross swords|parry|parries|parried|clash of swords",
    shing: "draws (?:his|her|their) sword|draw* a sword|unsheath*|sword|swords|dagger",
    whoosh: "whoosh*|swoosh*|swoops|swoop*|flies past|flies by|zooms past|wind rushes|fly|flies|flying|soars|soar*",
    swish: "swish*|swing*|swings|swipe*|slash*|whip*",
    zipper: "zip*|unzip*",
    boing: "boing|spring*|bounc* up|jumps high|leaps|leap*|hops|hopping|hopped|pogo",
    bounce: "bounc*|dribbl*|ball bounces",
    slideup: "climbs up|goes up|rises|rise*|lifts off|stands up quickly",
    slidedown: "slides down|slid* down|sinks|sink*|shrinks down|deflat*",
    fallwhistle: "falls from|falls off a cliff|plummet*|falls from the sky|drops from the sky",
    pop: "pop|pops|popping|popped|balloon pops|bursts|burst*|blip",
    squeak: "squeak*|creaky toy|rubber duck|squeaky",
    honk: "honk*|clown|bike horn",
    wobble: "wobbl*|jiggl*|jelly|dizzy spell|spins around|spins|spinning|spun|twirl*",
    ding: "ding*|bell rings|ring* a bell|rings the bell|ting",
    tada: "ta-da|tada|ta da|voila|presents|unveil*|reveal*|grand entrance",
    scratch: "record scratch|everything stops|music stops|stops dead|freeze frame",
    cuckoo: "cuckoo|cuckoo clock|crazy|bonkers|loony",
    rimshot: "rimshot|ba dum tss|badum tss|tells a joke|bad joke|punchline",
    sadtrombone: "sad trombone|womp womp|fail*|failure|loses|lost the game|disappointed|deflated|hangs (?:his|her|their) head",
    fanfare: "fanfare|announce*|trumpets sound|royal entrance|the king enters|the queen enters|enter the king|enter the queen|herald*",
    drumroll: "drumroll|drum roll|and the winner is|the moment of truth",
    cymbal: "cymbal*",
    gong: "gong*",
    harp: "harp|dream sequence|flashback|dreams|dreaming|daydream*|memory|remembers",
    dundun: "dun dun|dramatic music|dramatic reveal|shocking reveal|plot twist|gasp from the audience",
    victory: "win|wins|winning|won|victory|victorious|triumph*|champion*|first place|gold medal|trophy",
    buzzer: "wrong answer|incorrect|eliminated|disqualified|bzzt",
    correct: "correct answer|right answer|gets it right|correct!",
    levelup: "level up|leveled up|achievement unlocked",
    organ: "organ|creepy music|haunted|haunting|graveyard|cemetery|tomb|crypt",
    piano: "piano|plays a chord",
    churchbell: "church bell*|bells ring|bells toll|wedding bells|chapel",
    tollone: "bell tolls|tolls one|tolls|strikes one|strikes twelve|clock strikes|midnight",
    schoolbell: "school bell|bell rings for class|recess bell|class bell|end of class",
    doorbell: "doorbell|door bell|ding-dong|ding dong|rings the doorbell",
    phone: "phone ring*|telephone|cell phone|phone call|phone buzz*|ring ring|calls on the phone",
    alarm: "alarm clock|alarm goes off|alarm|wakes up|wake* up|beep beep",
    tick: "tick|ticks|ticking|tick tock|tick-tock|clock ticks|countdown|clock",
    clockchime: "clock chimes|chimes|grandfather clock|big ben",
    knock: "knock*|knock knock|raps on the door|bangs on the door|pounds on the door",
    creak: "creak*|squeaky door|door creaks|creepy door|slowly opens",
    doorslam: "slam*|slams the door|door slams|bangs the door",
    dooropen: "opens the door|door opens|open* the door|opens a door",
    doorclose: "closes the door|door closes|close* the door|shuts the door|shut* the door",
    typing: "types|typing|typed|keyboard|types on|hacks|hack*|texting|texts",
    click: "click*|press* a button|presses the button|push* the button|snaps (?:his|her|their) fingers|snap* fingers",
    switchon: "switch*|flip* the switch|turns on the light|turns off the light|lights on|lights off|light switch",
    buzz: "buzz*|hums|humming|hummed|neon",
    electric: "electric*|electric shock|gets shocked|electrocut*|spark*|short-circuit*|power surge|crackles with electricity",
    register: "cash register|ka-ching|cha-ching|pays|paying|paid|buys|buy*|money|sale|sells|sold",
    coins: "coins|coin|gold coins|jingl*|treasure|pocket change|loot",
    camera: "photo|photograph*|takes a picture|camera|selfie|snapshot|flash goes off|paparazzi",
    carhorn: "car horn|beep the horn|honks the horn|traffic|taxi",
    engine: "engine*|car starts|revs|revving|revved|drives off|drives away|motorcycle|motorbike|car",
    siren: "siren*|police car|ambulance|fire truck|fire engine|police arrive",
    trainwhistle: "train|choo choo|choo-choo|locomotive|all aboard|railway",
    helicopter: "helicopter|chopper",
    airplane: "airplane|aeroplane|plane takes off|jet|flies overhead|plane",
    laser: "laser*|pew pew|pew|ray gun|blaster*|phaser",
    spaceship: "spaceship|space ship|ufo|flying saucer|alien ship|mothership|starship",
    robotbeep: "beep*|boop|bleep*|robot beeps|beeps and boops",
    computer: "computer|computing|calculat*|processing|scans|scan*|data",
    servo: "robot walks|robot moves|mechanical|clanks|clank|whirr*|whir*",
    bomb: "bomb|time bomb|fuse|dynamite|ticking",
    rocket: "rocket|blast off|blasts off|lift off|launch*|liftoff",

    wind: "wind|winds|windy|breeze|gust*|blustery|windy",
    howlwind: "howling wind|blizzard|storm rages|gale|hurricane|tornado",
    rain: "rain|rains|rained|raining|downpour|drizzl*|umbrella|puddle",
    storm: "storm*|stormy|thunderstorm",
    drip: "drip*|leak*|droplet|faucet|tap drips",
    bubbles: "bubbl*|blows bubbles|underwater|fish tank|aquarium|gurgl*",
    cauldron: "cauldron|stirs the pot|stir*|witches' brew|boiling",
    fire: "fire|fires|burn*|flame*|blaze*|campfire|fireplace|torch|torches|bonfire|lights a match",
    waves: "waves|ocean|sea|beach|shore|surf|surfing|tide",
    stream: "river|stream|waterfall|fountain|creek|tap|running water|shower|bath|faucet runs",
    birds: "bird*|chirp*|tweet*|songbird|sparrow|robin|morning|dawn|sunrise|spring",
    owl: "owl*|hoot*|night falls|nighttime|at night|forest at night",
    wolf: "wolf|wolves|howl*|werewolf|full moon",
    dog: "dog*|bark*|woof*|puppy|puppies|hound|arf",
    cat: "cat|cats|meow*|kitten*|kitty|purr*",
    frog: "frog*|toad*|croak*|ribbit",
    crickets: "cricket*|awkward silence|silence|nobody laughs|crickets chirp",
    bee: "bee|bees|wasp*|fly buzzes|mosquito|hornet*|beehive|insect*|bug*",
    horse: "horse*|gallop*|pony|ponies|unicorn*|rides off|clip clop|clip-clop",
    cow: "cow|cows|moo|moos|mooing|mooed|cattle|farm|bull",
    duck: "duck*|quack*|goose|geese|honking geese",
    rooster: "rooster|cock-a-doodle|crow* at dawn|chicken*",
    mouse: "mouse|mice|rat|rats|hamster|squeak squeak",
    hiss: "hiss*|snake*|serpent*|python|cobra|rattlesnake|steam",
    roar: "roar*|monster*|beast|creature|troll*|ogre*|yeti",
    dragon: "dragon*|breathes fire|fire-breathing",
    growl: "growl*|snarl*|grr+",
    lion: "lion*|tiger*|big cat|jungle cat",
    elephant: "elephant*|trumpets",
    monkey: "monkey*|ape*|chimp*|baboon*",
    seagull: "seagull*|gull*|harbor|harbour|pier|dock",
    wings: "wing*|flap*|flutter*|bat flies|bats|pigeon*",
    ghost: "ghost*|spirit*|phantom*|spook*|haunt*|wail*|moan*|boo!",
    chains: "chain*|shackle*|rattl*|dungeon|prison|jail|cell door",
    spooky: "spooky|creepy|eerie|scary|shadows|dark and stormy|mysterious|mystery",
    evil: "evil laugh|villain enters|villain appears|bad guy|sinister|menacing|dark lord",

    refwhistle: "referee|whistle blows|blows the whistle|foul|timeout|time out|kickoff|kick-off",
    gamebuzzer: "buzzer|game over|time's up|times up|end of the game|halftime|half-time|final buzzer",
    net: "shoots|scores a basket|basketball|nothing but net|slam dunk|three-pointer|swish",
    batcrack: "home run|baseball|bat hits|cricket bat|swings the bat",
    goalhorn: "goal|scores|score*|touchdown|hockey",
    jump: "jump*|jumps|leap* up|hops up",
    coin: "collects a coin|picks up a coin|video game|arcade",
    dizzy: "dizzy|seeing stars|knocked out|unconscious|stars circle",

    cork: "cork|champagne|opens a bottle|raises a toast|cheers!",
    fizz: "fizz*|soda|pop can|carbonat*|effervesc*|opens a can",
    sizzle: "sizzl*|fry*|frying|bacon|griddle|cooks|cook*|cooking|grill*",
    pour: "pour*|fills a glass|fill* the cup|pours tea|serves tea|pours the tea",
    kettle: "kettle|teapot|tea time|teatime|boils water",
    timer: "oven|timer|microwave|cookies are done|toaster",
    flush: "toilet|flush*|bathroom|loo",

    hammer: "hammer*|nail*|build*|construct*|bangs a nail",
    saw: "saws|sawing|sawed|chops wood|chop*|axe|chainsaw",
    drill: "drill*|screwdriver|dentist",
    bang: "bang|bangs|gunshot|shoots|shot|fires a|pistol|firework*",
    cannon: "cannon*|cannonball|fire the cannon|battle",
    arrow: "arrow*|shoots an arrow|archer*|dart*",
    bowtwang: "bow and arrow|draws the bow|twang*|pluck*",
    shield: "shield*|blocks|block*|deflect*",

    tiptoeMusic: "sneaky|sneakily|creeping|spy|spies|spying|secret agent",
    gulpbig: "gulps nervously|looks nervous|sweats|sweating|uh-oh|uh oh|gulps",
    zoom: "zoom*|zips away|speeds off|races away|takes off|shoots off|whizz*",
    screech: "screech*|skid*|brakes|tires squeal|stops suddenly|halt*",
    splatpie: "pie in the face|cream pie|custard pie|food fight|throws a pie|throw* food",
    magicflush: "portal|vortex|sucked in|wormhole|black hole|whirlpool",
    lightbulb: "has an idea|gets an idea|idea|eureka|lightbulb|light bulb|realizes|realises",
    dramatic: "dramatic|dramatically|shocked|stunned silence|dun",
    romance: "romantic|falls in love|love at first sight|hearts|heart eyes|blushes|blush*|swoon*",
    lullaby: "lullaby|goes to sleep|goodnight|good night|bedtime|sleep*|asleep|tucks in",
    trumpet: "trumpet*|bugle|charge!|calvary|cavalry|army|soldiers march",
    drum: "drum*|beat* the drum|marching band|war drums",
    guitar: "guitar|strums|strum*|ukulele|banjo|serenade*",
    musicbox: "music box|jewelry box|wind-up|toy box|toys",
    tension: "suspense|tense|tension|waits nervously|holds (?:his|her|their) breath|silence falls|slowly turns"
  };

  /* A * at the end of a word matches any ending: barf* -> barf, barfs, barfing, barfed */
  function toRegex(phrase) {
    return phrase.replace(/\./g, "\\.").replace(/\*/g, "[a-z']*");
  }

  /* Split on | but not inside (?:his|her|their) */
  function splitTop(str) {
    var outList = [], depth = 0, cur = "";
    for (var i = 0; i < str.length; i++) {
      var c = str[i];
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (c === "|" && depth === 0) { outList.push(cur); cur = ""; } else cur += c;
    }
    outList.push(cur);
    return outList;
  }

  var MATCHERS = [];
  var TRIGGER_COUNT = 0;
  (function build() {
    var seen = {};
    Object.keys(TRIGGERS).forEach(function (id) {
      splitTop(TRIGGERS[id]).forEach(function (phrase) {
        [phrase.trim()].forEach(function (p) {
          var key = id + "|" + p;
          if (seen[key]) return;
          seen[key] = true;
          TRIGGER_COUNT++;
          var src = toRegex(p);
          MATCHERS.push({ id: id, phrase: p, len: p.length, re: new RegExp("(^|[^a-z'])(" + src + ")(?=[^a-z']|$)", "i") });
        });
      });
    });
    MATCHERS.sort(function (a, b) { return b.len - a.len; });
  })();

  /* Sounds that happen TO someone, so a spell probably caused them */
  var MAGIC_EFFECTS = { barf: 1, transform: 1, freeze: 1, levitate: 1, vanish: 1, poof: 1, shrink: 1, grow: 1, glow: 1, sparkle: 1, teleport: 1, thud: 1, tumble: 1, dizzy: 1, wobble: 1, boing: 1, burp: 1, hiccup: 1, sneeze: 1, fart: 1, splat: 1, squish: 1, magicflush: 1 };
  var MAGIC_WORLD = /\b(wand|spell|magic|wizard|witch|hogwarts|potion|hex|jinx|curse|charm|sorcerer|sorceress|enchant|warlock|mage|fairy godmother|points from|professor|potter)\b/i;
  var SPELL_LINE = /\b([a-z]+us|[a-z]+um|[a-z]+a)\b!|^[A-Z][A-Z\s']{3,}!/;

  /* Find the sounds in a stage direction, in the order they happen */
  function detect(text, ctxInfo) {
    ctxInfo = ctxInfo || {};
    var t = " " + String(text).toLowerCase().replace(/[“”]/g, '"').replace(/[’]/g, "'") + " ";
    var hits = [];
    var masked = t;
    MATCHERS.forEach(function (m) {
      var mm = masked.match(m.re);
      if (!mm) return;
      var at = mm.index + mm[1].length;
      if (hits.some(function (h) { return h.id === m.id; })) return;
      hits.push({ id: m.id, at: at, phrase: mm[2], label: S[m.id][0] });
      masked = masked.slice(0, at) + new Array(mm[2].length + 1).join("_") + masked.slice(at + mm[2].length);
    });
    hits.sort(function (a, b) { return a.at - b.at; });

    /* Leave out sounds that would just be noise for ordinary entrances */
    hits = hits.filter(function (h) {
      if ((h.id === "footsteps" || h.id === "running") && /\b(enter|enters|exit|exits)\b/.test(t) && !/\b(run|runs|ran|running|rush|dash|sprint|march|stomp)/.test(h.phrase)) return false;
      return true;
    });

    /* "EAT SLUGS!" then "(they start barfing slugs)" -> a spell first */
    var hasSpell = hits.some(function (h) { return h.id === "spell" || h.id === "zap" || h.id === "wand"; });
    var effect = hits.some(function (h) { return MAGIC_EFFECTS[h.id]; });
    if (!hasSpell && effect && ctxInfo.prevLine) {
      var pl = ctxInfo.prevLine;
      var shouted = ctxInfo.prevShouted || SPELL_LINE.test(pl);
      var others = ctxInfo.affectsOthers !== false;
      if ((shouted && others) || (ctxInfo.magicWorld && /!\s*$/.test(pl.trim()))) {
        hits.unshift({ id: "spell", at: -1, phrase: "(spell)", label: S.spell[0], implied: true });
      }
    }
    return hits.slice(0, 4);
  }

  function play(id, when) {
    if (!ctx || !S[id]) return 0;
    var t = (when || ctx.currentTime) + 0.02;
    group = ctx.createGain();
    group.gain.value = GAIN[id] || 1;
    group.connect(out);
    groups.push(group);
    try { return S[id][1](t) || 0.5; } catch (e) { return 0; } finally { group = null; }
  }

  /* Silence everything that's playing or scheduled */
  function stopAll() {
    if (!ctx) return;
    groups.forEach(function (g) {
      try { g.gain.setValueAtTime(0, ctx.currentTime); } catch (e) { /* ignore */ }
      setTimeout(function () { try { g.disconnect(); } catch (e) { /* ignore */ } }, 100);
    });
    groups = [];
  }

  /* Play a list one after another (overlapping a little). Returns total seconds. */
  function playAll(list) {
    if (!ctx) return 0;
    var t = ctx.currentTime + 0.03;
    var total = 0;
    list.forEach(function (h, i) {
      var d = play(h.id, t);
      var step = Math.min(d, 1.8) * (i < list.length - 1 ? 0.8 : 1);
      t += step;
      total += step;
    });
    return total;
  }

  function setVolume(v) { if (out) out.gain.value = v; }

  var api = {
    init: init,
    detect: detect,
    play: play,
    playAll: playAll,
    setVolume: setVolume,
    stopAll: stopAll,
    ids: function () { return Object.keys(S); },
    label: function (id) { return S[id] ? S[id][0] : id; },
    triggerCount: function () { return TRIGGER_COUNT; },
    magicWorld: function (text) { return MAGIC_WORLD.test(text); }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SPSfx = api;
})(typeof window !== "undefined" ? window : this);

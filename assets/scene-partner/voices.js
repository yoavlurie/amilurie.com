/* ============================================
   Scene Partner — Voices
   Two ways to perform a line:
   1. Browser voices (free, built into the device)
   2. AI voices (ElevenLabs, through /api/ai) —
      only when the site has an API key set up
   Both take the same "line spec" so the stage
   doesn't care which one is talking.
   ============================================ */

(function (root) {
  "use strict";

  var Director = root.SPDirector;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ============================================
     Shared audio (AI voices + sound effects)
     ============================================ */

  var Audio = (function () {
    var ctx = null;
    function get() {
      if (!ctx) {
        var AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      return ctx;
    }
    /* Must be called from a tap on iPhone/iPad */
    function unlock() {
      var c = get();
      if (!c) return;
      if (c.state === "suspended") c.resume();
      try {
        var b = c.createBuffer(1, 1, 22050);
        var s = c.createBufferSource();
        s.buffer = b;
        s.connect(c.destination);
        s.start(0);
      } catch (e) { /* ignore */ }
    }
    return { get: get, unlock: unlock };
  })();

  /* ============================================
     Browser voices
     ============================================ */

  var Browser = (function () {
    var synth = root.speechSynthesis;
    var supported = !!synth && typeof root.SpeechSynthesisUtterance !== "undefined";
    var voices = [];
    var listeners = [];
    var keep = [];
    var gen = 0;
    var lastCancel = 0;

    var FEMALE = /(female|woman|samantha|karen|moira|tessa|victoria|fiona|veena|serena|allison|ava|susan|zira|hazel|kate|catherine|nicky|zoe|joanna|salli|kimberly|ivy|emma|amy|libby|sonia|aria|jenny|michelle|natasha|clara|kendra|ruth|olivia|isha|heera|ellie|martha|stephanie|nora|flo|sandy|shelley|grandma|aurora|amelie|amélie|audrey|marie|thomas-f|paulina|monica|mónica|marisol|soledad|alice|federica|anna|petra|ellen|xander-f|milena|katya|kyoko|alva|sara|google .*female|siri.*voice [24])/i;
    var MALE = /(\bmale|\bman\b|daniel|alex\b|fred|rishi|oliver|\btom\b|aaron|arthur|gordon|\blee\b|david|mark|george|james|ryan|guy|eric|christopher|brian|matthew|joey|justin|evan|nathan|reed|ralph|junior|thomas|william|liam|noah|ravi|prabhat|grandpa|rocko|eddy|steffan|andrew|roger|jacques|jorge|juan|diego|carlos|luca|markus|xander|yuri|otoya|google .*male|siri.*voice [13])/i;
    var NOVELTY = /(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|eloquence)/i;
    var ROBOT = /(zarvox|trinoids|fred|ralph|robot)/i;
    var GHOST = /(whisper)/i;

    function load() {
      if (!supported) return;
      var v = synth.getVoices() || [];
      if (v.length && v.length !== voices.length) {
        voices = v.slice();
        listeners.forEach(function (f) { f(); });
      }
    }
    if (supported) {
      load();
      if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", load);
      else synth.onvoiceschanged = load;
      setTimeout(load, 400);
      setTimeout(load, 1500);
      setTimeout(load, 4000);
    }

    function gender(v) {
      var n = v.name + " " + (v.voiceURI || "");
      if (FEMALE.test(n)) return "f";
      if (MALE.test(n)) return "m";
      return "";
    }

    function score(v) {
      var s = 0;
      if (/natural|neural|premium|enhanced|siri/i.test(v.name)) s += 4;
      if (/google/i.test(v.name)) s += 2;
      if (/^en[-_]US/i.test(v.lang)) s += 1;
      if (/^en[-_](GB|AU|IE|CA)/i.test(v.lang)) s += 0.7;
      if (v.localService) s += 0.3;
      if (NOVELTY.test(v.name)) s -= 20;
      return s;
    }

    function lang(v) { return String(v.lang || "").replace("_", "-").toLowerCase(); }

    function ranked() {
      var en = voices.filter(function (v) { return /^en/i.test(v.lang); });
      var pool = en.length ? en : voices.slice();
      return pool.sort(function (a, b) { return score(b) - score(a); }).filter(function (v) { return score(v) > -10; });
    }

    function byURI(uri) {
      for (var i = 0; i < voices.length; i++) if (voices[i].voiceURI === uri) return voices[i];
      return null;
    }

    /* Pick the device voice that best fits a character */
    function pick(persona, used, override) {
      if (override) { var o = byURI(override); if (o) return o; }
      var styles = persona.styles || [];
      var pool = null;
      if (styles.indexOf("robotic") >= 0) {
        pool = voices.filter(function (v) { return ROBOT.test(v.name) && /^en/i.test(v.lang); });
      }
      if (!pool || !pool.length) {
        if (styles.indexOf("ghostly") >= 0) pool = voices.filter(function (v) { return GHOST.test(v.name); });
      }
      if ((!pool || !pool.length) && persona.accent && Director) {
        var langs = (Director.accentLangs[persona.accent] || []).map(function (l) { return l.toLowerCase(); });
        pool = [];
        langs.forEach(function (l) {
          voices.forEach(function (v) {
            if (pool.indexOf(v) < 0 && (lang(v) === l || lang(v).indexOf(l + "-") === 0 || (l.length === 2 && lang(v).indexOf(l) === 0))) pool.push(v);
          });
        });
        pool = pool.filter(function (v) { return !NOVELTY.test(v.name); }).sort(function (a, b) { return score(b) - score(a) + (b.localService ? 0.1 : 0); });
      }
      if (!pool || !pool.length) pool = ranked();
      if (!pool.length) return null;

      var g = persona.gender;
      var gp = g ? pool.filter(function (v) { return gender(v) === g; }) : [];
      var list = gp.length ? gp : pool;
      for (var i = 0; i < list.length; i++) if (!used[list[i].voiceURI]) return list[i];
      return list[Object.keys(used).length % list.length];
    }

    function sentenceChunks(text) {
      var flat = text.replace(/\s*\n\s*/g, " ").trim();
      if (!flat) return [];
      var parts = flat.match(/[^.!?;:]+[.!?;:]*["'’”)\]]*\s*/g) || [flat];
      var outList = [];
      var buf = "";
      parts.forEach(function (p) {
        if ((buf + p).length > 180 && buf) { outList.push(buf.trim()); buf = ""; }
        buf += p;
      });
      if (buf.trim()) outList.push(buf.trim());
      return outList;
    }

    function lyricChunks(text) {
      return text.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }

    function cancel() {
      gen++;
      lastCancel = Date.now();
      if (!supported) return;
      try { synth.cancel(); } catch (e) { /* ignore */ }
    }

    function speak(text, o) {
      o = o || {};
      var myGen = gen;
      var chunks = o.lyric ? lyricChunks(text) : sentenceChunks(text);
      return new Promise(function (resolve) {
        if (!supported || !chunks.length) { resolve(); return; }
        var i = 0;
        function nextChunk() {
          if (myGen !== gen || i >= chunks.length) { resolve(); return; }
          var c = chunks[i];
          var k = i;
          i++;
          var u = new root.SpeechSynthesisUtterance(c);
          if (o.voice) { u.voice = o.voice; u.lang = o.voice.lang; } else u.lang = "en-US";
          u.rate = clamp(o.rate || 1, 0.5, 2);
          u.pitch = clamp((o.pitch || 1) * (o.lyric ? (k % 2 ? 1.07 : 0.95) : 1), 0.1, 2);
          u.volume = o.volume == null ? 1 : o.volume;
          var done = false;
          var words = c.split(/\s+/).length;
          var wd = setTimeout(fin, 5000 + (words * 700) / u.rate);
          function fin() {
            if (done) return;
            done = true;
            clearTimeout(wd);
            var ix = keep.indexOf(u);
            if (ix >= 0) keep.splice(ix, 1);
            nextChunk();
          }
          u.onend = fin;
          u.onerror = fin;
          keep.push(u);
          try { if (synth.paused) synth.resume(); } catch (e) { /* ignore */ }
          synth.speak(u);
        }
        if (Date.now() - lastCancel < 150) setTimeout(nextChunk, 150);
        else nextChunk();
      });
    }

    function unlock() {
      if (!supported) return;
      try {
        var u = new root.SpeechSynthesisUtterance(" ");
        u.volume = 0;
        synth.speak(u);
      } catch (e) { /* ignore */ }
    }

    return {
      supported: supported, speak: speak, cancel: cancel, unlock: unlock, ranked: ranked,
      gender: gender, byURI: byURI, pick: pick,
      hasVoices: function () { return voices.length > 0; },
      onVoices: function (f) { listeners.push(f); }
    };
  })();

  /* ============================================
     AI voices (ElevenLabs via /api/ai)
     ============================================ */

  var AI = (function () {
    var ENDPOINT = "/api/ai";
    var state = { checked: false, available: false, voices: [], failed: false, reason: "" };
    var cache = {};
    var playing = [];
    var gen = 0;
    var listeners = [];

    function check() {
      if (state.checked) return Promise.resolve(state.available);
      if (typeof fetch === "undefined" || location.protocol === "file:") {
        state.checked = true;
        return Promise.resolve(false);
      }
      return fetch(ENDPOINT + "?op=status", { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : { ai: false };
      }).then(function (j) {
        state.checked = true;
        state.available = !!(j && j.ai);
        if (state.available) return loadVoices();
      }).catch(function () {
        state.checked = true;
        state.available = false;
      }).then(function () {
        listeners.forEach(function (f) { f(); });
        return state.available;
      });
    }

    function loadVoices() {
      return fetch(ENDPOINT + "?op=voices").then(function (r) { return r.ok ? r.json() : { voices: [] }; })
        .then(function (j) { state.voices = (j && j.voices) || []; })
        .catch(function () { state.voices = []; });
    }

    /* How well does an AI voice fit a character? */
    var STYLE_WORDS = {
      squeaky: /high.pitch|squeak|cartoon|anim|cute|tiny|chipmunk/i,
      booming: /deep|boom|gravel|bass|power|resonant|commanding|giant|thunder/i,
      villain: /villain|sinister|dark|menac|evil|cold|creepy|ominous/i,
      bratty: /bratty|brat|snark|sass|whin|annoy|spoil|smug|cocky|mischiev/i,
      robotic: /robot|\bai\b|computer|synthetic|monotone|digital|android/i,
      ghostly: /ethereal|whisper|myster|haunt|ghost|airy|spooky/i,
      raspy: /raspy|gravel|witch|crackl|harsh|crone/i,
      posh: /posh|refined|elegant|sophist|aristocrat|proper|upper.class/i,
      cheerful: /cheer|upbeat|energetic|bright|friendly|happy|bubbly|enthusias|playful/i,
      wise: /wise|calm|warm|grandfather|grandmother|mature|soothing/i,
      narrator: /narrat|story|documentary|audiobook/i,
      pirate: /pirate|gruff|gravel|rough|sailor/i,
      grumpy: /gruff|grump|irritat|cranky|grouch/i,
      nervous: /nervous|anxious|shy|timid|awkward/i,
      sleepy: /sleep|drowsy|slow|relax|lazy/i,
      royal: /regal|royal|authorit|majestic|noble/i,
      silly: /silly|funny|goofy|cartoon|comic|quirky/i,
      hissing: /hiss|whisper|snake|sinister|cold/i,
      sweet: /sweet|gentle|kind|warm|soft/i,
      heroic: /hero|confident|brave|bold/i,
      energetic: /energetic|lively|excited|upbeat/i
    };

    function voiceScore(v, persona) {
      var L = v.labels || {};
      var desc = [v.name, L.description, L.descriptive, L.use_case, v.desc].join(" ");
      var s = 0;
      if (persona.gender) {
        if (L.gender === (persona.gender === "f" ? "female" : "male")) s += 3;
        else if (L.gender && L.gender !== "neutral" && L.gender !== "non-binary") s -= 5;
      }
      var age = String(L.age || "").toLowerCase();
      if (persona.age === "kid") s += (/young/.test(age) ? 2.5 : 0) + (/child|kid|boy|girl|young|teen/i.test(desc) ? 2 : 0);
      if (persona.age === "teen") s += /young/.test(age) ? 2 : 0;
      if (persona.age === "old") s += /old/.test(age) ? 2.5 : /middle/.test(age) ? 1 : 0;
      if (persona.age === "adult") s += /middle|young/.test(age) ? 0.5 : 0;
      var accent = String(L.accent || "").toLowerCase();
      if (persona.accent) {
        var a = persona.accent === "southern" ? "american" : persona.accent === "scottish" ? "british" : persona.accent;
        if (accent.indexOf(a) >= 0) s += 2.5;
      } else if (/american/.test(accent)) s += 0.5;
      (persona.styles || []).forEach(function (st, i) {
        var re = STYLE_WORDS[st];
        if (re && re.test(desc)) s += i === 0 ? 2 : 1;
      });
      return s;
    }

    /* Give each character the best voice, handing out the best matches first
       so a "bratty" voice goes to the bratty character, not whoever came first */
    function castVoices(personas, overrides) {
      var map = {};
      var uses = {};
      var vs = state.voices;
      if (!vs.length) return map;
      var keys = Object.keys(personas);
      keys.forEach(function (k) {
        var ov = overrides && overrides[k];
        if (!ov) return;
        vs.forEach(function (v) { if (v.id === ov) map[k] = v; });
        if (map[k]) uses[map[k].id] = (uses[map[k].id] || 0) + 1;
      });
      var pairs = [];
      keys.forEach(function (k) {
        if (map[k]) return;
        vs.forEach(function (v) { pairs.push({ k: k, v: v, s: voiceScore(v, personas[k]) }); });
      });
      pairs.sort(function (a, b) { return b.s - a.s; });
      pairs.forEach(function (p) {
        if (map[p.k] || uses[p.v.id]) return;
        map[p.k] = p.v;
        uses[p.v.id] = 1;
      });
      /* More characters than voices: share, but keep the best fit */
      keys.forEach(function (k) {
        if (map[k]) return;
        var best = null, bs = -1e9;
        vs.forEach(function (v) {
          var sc = voiceScore(v, personas[k]) - (uses[v.id] || 0) * 2;
          if (sc > bs) { bs = sc; best = v; }
        });
        map[k] = best;
        uses[best.id] = (uses[best.id] || 0) + 1;
      });
      var narr = null, nb = -1e9;
      vs.forEach(function (v) {
        var sc = voiceScore(v, { styles: ["narrator"], age: "adult" }) - (uses[v.id] || 0) * 4;
        if (sc > nb) { nb = sc; narr = v; }
      });
      map.__narrator = narr;
      return map;
    }

    function chunks(text) {
      if (text.length <= 600) return [text];
      var parts = text.match(/[^.!?;:\n]+[.!?;:\n]*\s*/g) || [text];
      var outList = [], buf = "";
      parts.forEach(function (p) {
        if ((buf + p).length > 600 && buf) { outList.push(buf.trim()); buf = ""; }
        buf += p;
      });
      if (buf.trim()) outList.push(buf.trim());
      return outList;
    }

    function fetchAudio(url) {
      if (cache[url]) return cache[url];
      var ctx = Audio.get();
      cache[url] = fetch(url).then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var err = new Error("AI audio failed " + r.status);
            err.status = r.status;
            err.body = t;
            throw err;
          });
        }
        return r.arrayBuffer();
      }).then(function (buf) {
        return new Promise(function (res, rej) {
          var p = ctx.decodeAudioData(buf, res, rej);
          if (p && p.then) p.then(res, rej);
        });
      });
      cache[url].catch(function () { delete cache[url]; });
      return cache[url];
    }

    function ttsUrl(voiceId, text) {
      return ENDPOINT + "?op=tts&voice=" + encodeURIComponent(voiceId) + "&text=" + encodeURIComponent(text);
    }

    function sfxUrl(prompt, secs) {
      return ENDPOINT + "?op=sfx&d=" + (secs ? secs.toFixed(1) : "") + "&text=" + encodeURIComponent(prompt);
    }

    /* Character effects on the real audio: squeaky, booming, robot... */
    var verbBuf = null;
    function effectChain(ctx, styles, emo) {
      var input = ctx.createGain();
      var outNode = ctx.createGain();
      var node = input;
      var rate = 1;
      styles = styles || [];
      if (styles.indexOf("squeaky") >= 0) rate *= 1.16;
      if (styles.indexOf("booming") >= 0) {
        rate *= 0.9;
        var ls = ctx.createBiquadFilter();
        ls.type = "lowshelf"; ls.frequency.value = 220; ls.gain.value = 7;
        node.connect(ls); node = ls;
      }
      if (styles.indexOf("hissing") >= 0) {
        var hs = ctx.createBiquadFilter();
        hs.type = "highshelf"; hs.frequency.value = 4500; hs.gain.value = 6;
        node.connect(hs); node = hs;
      }
      if (styles.indexOf("robotic") >= 0) {
        var ring = ctx.createGain();
        ring.gain.value = 0;
        var osc = ctx.createOscillator();
        osc.frequency.value = 48;
        osc.connect(ring.gain);
        osc.start();
        var dry = ctx.createGain(); dry.gain.value = 0.45;
        node.connect(ring); node.connect(dry);
        var mix = ctx.createGain();
        ring.connect(mix); dry.connect(mix);
        node = mix;
      }
      node.connect(outNode);
      if (styles.indexOf("ghostly") >= 0 || styles.indexOf("booming") >= 0 || (emo && emo.emotion === "dramatic")) {
        if (!verbBuf) {
          var len = Math.floor(ctx.sampleRate * 2);
          verbBuf = ctx.createBuffer(2, len, ctx.sampleRate);
          for (var c = 0; c < 2; c++) {
            var d = verbBuf.getChannelData(c);
            for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
          }
        }
        var conv = ctx.createConvolver();
        conv.buffer = verbBuf;
        var wet = ctx.createGain();
        wet.gain.value = styles.indexOf("ghostly") >= 0 ? 0.6 : 0.2;
        node.connect(conv); conv.connect(wet); wet.connect(outNode);
      }
      outNode.connect(ctx.destination);
      return { input: input, rate: rate };
    }

    function playBuffer(buffer, styles, emo, gainVal, delay, myGen) {
      var ctx = Audio.get();
      return new Promise(function (resolve) {
        if (myGen !== gen) { resolve(); return; }
        var chain = effectChain(ctx, styles, emo);
        var src = ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = chain.rate;
        var g = ctx.createGain();
        g.gain.value = gainVal == null ? 1 : gainVal;
        src.connect(g);
        g.connect(chain.input);
        var done = false;
        function fin() {
          if (done) return;
          done = true;
          var ix = playing.indexOf(src);
          if (ix >= 0) playing.splice(ix, 1);
          resolve();
        }
        src.onended = fin;
        playing.push(src);
        src.start(ctx.currentTime + (delay || 0));
        setTimeout(fin, (buffer.duration / chain.rate + (delay || 0)) * 1000 + 1500);
      });
    }

    function cancel() {
      gen++;
      playing.slice().forEach(function (s) { try { s.stop(); } catch (e) { /* ignore */ } });
      playing = [];
    }

    return {
      check: check,
      state: state,
      castVoices: castVoices,
      chunks: chunks,
      ttsUrl: ttsUrl,
      sfxUrl: sfxUrl,
      fetchAudio: fetchAudio,
      playBuffer: playBuffer,
      cancel: cancel,
      gen: function () { return gen; },
      onChange: function (f) { listeners.push(f); },
      disable: function (reason) { state.failed = true; state.reason = reason || ""; listeners.forEach(function (f) { f(); }); }
    };
  })();

  /* ============================================
     Performer — speaks a line in the chosen engine
     ============================================ */

  function Performer(opts) {
    this.engine = opts.engine;
    this.personas = opts.personas;
    this.rate = opts.rate || 1;
    this.lyric = !!opts.lyric;
    this.browserOverrides = opts.browserOverrides || {};
    this.aiOverrides = opts.aiOverrides || {};
    this.recast();
  }

  Performer.prototype.recast = function () {
    var self = this;
    var used = {};
    this.browserVoices = {};
    Object.keys(this.personas).forEach(function (k) {
      var v = Browser.pick(self.personas[k], used, self.browserOverrides[k]);
      if (v) used[v.voiceURI] = (used[v.voiceURI] || 0) + 1;
      self.browserVoices[k] = v;
    });
    this.browserNarrator = Browser.pick({ styles: [], age: "adult" }, used, null);
    this.aiVoices = this.engine === "ai" ? AI.castVoices(this.personas, this.aiOverrides) : {};
  };

  Performer.prototype.useAI = function () {
    return this.engine === "ai" && AI.state.available && !AI.state.failed && Object.keys(this.aiVoices).length > 0;
  };

  /* What each voice says: [{key, voiceId, text, styles}] */
  Performer.prototype.parts = function (item, emo) {
    var self = this;
    var keys = item.type === "line" ? item.chars.slice() : ["__narrator"];
    if (item.group && keys.length > 3) keys = keys.slice(0, 3);
    return keys.map(function (k) {
      var persona = self.personas[k] || { styles: [], age: "adult" };
      var text = Director.speakable(item.text, "ai");
      if ((persona.styles || []).indexOf("hissing") >= 0) text = Director.hissify(text);
      var tags = item.type === "line" ? Director.aiTags(persona, emo) : "[calm, storyteller]";
      var voice = self.aiVoices[k] || self.aiVoices.__narrator;
      return { key: k, voice: voice, persona: persona, text: text, tags: tags };
    });
  };

  Performer.prototype.urlsFor = function (item, emo) {
    var urls = [];
    this.parts(item, emo).forEach(function (p) {
      if (!p.voice) return;
      AI.chunks(p.text).forEach(function (c) { urls.push(AI.ttsUrl(p.voice.id, (p.tags ? p.tags + " " : "") + c)); });
    });
    return urls;
  };

  Performer.prototype.prefetch = function (item, emo) {
    if (!this.useAI()) return;
    if (item.type !== "line" && item.type !== "dir") return;
    this.urlsFor(item, emo).forEach(function (u) { AI.fetchAudio(u).catch(function () {}); });
  };

  /* Resolves when the line has been performed */
  Performer.prototype.speak = function (item, emo) {
    var self = this;
    if (this.useAI()) {
      var myGen = AI.gen();
      var parts = this.parts(item, emo).filter(function (p) { return p.voice; });
      var perVoice = parts.map(function (p, idx) {
        var urls = AI.chunks(p.text).map(function (c) { return AI.ttsUrl(p.voice.id, (p.tags ? p.tags + " " : "") + c); });
        var chain = Promise.resolve();
        urls.forEach(function (u) {
          chain = chain.then(function () {
            if (myGen !== AI.gen()) return null;
            return AI.fetchAudio(u).then(function (buf) {
              var gain = parts.length > 1 ? 0.75 : 1;
              return AI.playBuffer(buf, p.persona.styles, emo, gain, parts.length > 1 ? idx * 0.04 : 0, myGen);
            });
          });
        });
        return chain;
      });
      return Promise.all(perVoice).catch(function (err) {
        if (myGen !== AI.gen()) return;
        AI.disable(err && err.status ? "status " + err.status : "network");
        if (self.onFallback) self.onFallback(err);
        return self.speakBrowser(item, emo);
      });
    }
    return this.speakBrowser(item, emo);
  };

  Performer.prototype.speakBrowser = function (item, emo) {
    var key = item.type === "line" ? item.chars[0] : null;
    var persona = key ? this.personas[key] : { styles: [], age: "adult" };
    var voice = key ? this.browserVoices[key] : this.browserNarrator;
    var text = Director.speakable(item.text, "browser");
    var p = item.type === "line" ? Director.browserParams(persona, emo) : { pitch: 1, rate: 1.05, volume: 0.85 };
    return Browser.speak(text, {
      voice: voice,
      pitch: p.pitch,
      rate: this.rate * p.rate,
      volume: p.volume,
      lyric: this.lyric && item.type === "line"
    });
  };

  Performer.prototype.cancel = function () {
    Browser.cancel();
    AI.cancel();
  };

  var api = { Audio: Audio, Browser: Browser, AI: AI, Performer: Performer };
  root.SPVoices = api;
})(typeof window !== "undefined" ? window : this);

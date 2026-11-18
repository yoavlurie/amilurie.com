/* ============================================
   Scene Partner — App
   Rehearse: paste a script, pick your part(s),
   and a scene partner performs everyone else —
   with character voices, emotions, and sound effects.
   Performance: pick a scene from the library and
   every part is performed for you.
   ============================================ */

(function () {
  "use strict";

  var LIB = window.SP_LIBRARY || [];
  var Parser = window.SPParser;
  var Director = window.SPDirector;
  var SFX = window.SPSfx;
  var Voices = window.SPVoices;
  var Browser = Voices.Browser;
  var AI = Voices.AI;
  var STORE_KEY = "scenePartner.v1";
  var COLORS = ["#8fb8ff", "#ff9fb2", "#9fe3b4", "#c9a7ff", "#ffc685", "#7fe0e0", "#ff8f8f", "#d8e47f", "#f0a6e8", "#a6c4f0"];

  Director.loadWords("assets/scene-partner/words.txt");

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ============================================
     Storage (best effort)
     ============================================ */

  var Store = {
    load: function () {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
    },
    save: function (obj) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { /* private mode */ }
    }
  };

  /* ============================================
     Speech recognition (for "It listens" mode)
     ============================================ */

  var Listener = (function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = null;
    var active = false;

    function start(cb) {
      stop();
      if (!SR) { cb.error && cb.error("unsupported"); return; }
      active = true;
      var finals = "";
      rec = new SR();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = function (e) {
        var interim = "";
        for (var i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finals += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript + " ";
        }
        cb.update(finals + interim);
      };
      rec.onerror = function (e) {
        if (e.error === "no-speech" || e.error === "aborted") return;
        cb.error && cb.error(e.error);
      };
      rec.onend = function () {
        if (active && rec) { try { rec.start(); } catch (err) { /* ignore */ } }
      };
      try { rec.start(); } catch (err) { cb.error && cb.error("start"); }
    }

    function stop() {
      active = false;
      if (rec) {
        var r = rec;
        rec = null;
        r.onend = null;
        try { r.abort(); } catch (e) { /* ignore */ }
      }
    }

    return { supported: !!SR, start: start, stop: stop };
  })();

  function normWord(w) {
    return w.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, "").replace(/^'+|'+$/g, "");
  }

  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 3;
    var prev = [], cur = [];
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      cur = [i];
      for (var k = 1; k <= n; k++) {
        cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  function similar(a, b) {
    if (a === b) return true;
    var a2 = a.replace(/'/g, ""), b2 = b.replace(/'/g, "");
    if (a2 === b2) return true;
    if (a2.length > 3 && lev(a2, b2) <= 1) return true;
    if (a2.length > 6 && lev(a2, b2) <= 2) return true;
    return false;
  }

  function matchWords(expected, heard) {
    var marks = [];
    var p = 0, matched = 0;
    for (var i = 0; i < expected.length; i++) {
      marks[i] = false;
      for (var j = p; j < Math.min(heard.length, p + 5); j++) {
        if (similar(expected[i], heard[j])) {
          marks[i] = true;
          matched++;
          p = j + 1;
          break;
        }
      }
    }
    return { marks: marks, cov: expected.length ? matched / expected.length : 1 };
  }

  /* ============================================
     State
     ============================================ */

  var saved = Store.load();
  var S = {
    script: saved.script || "",
    mine: saved.mine || [],
    genders: saved.genders || {},
    title: saved.title || "",
    lyric: !!saved.lyric,
    voiceOverrides: saved.voiceOverrides || {},
    aiVoiceOverrides: saved.aiVoiceOverrides || {},
    personaOverrides: saved.personaOverrides || {},
    rate: saved.rate || 1,
    maskMode: saved.maskMode || "show",
    turnMode: saved.turnMode || "tap",
    cueOnly: !!saved.cueOnly,
    readDirs: !!saved.readDirs,
    sfx: saved.sfx !== false,
    engine: saved.engine || "ai"
  };
  if (S.turnMode === "listen" && !Listener.supported) S.turnMode = "tap";

  var parsed = Parser.parse(S.script);

  function persist() { Store.save(S); }

  function aiReady() { return AI.state.available && !AI.state.failed; }
  function engineNow() { return S.engine === "ai" && aiReady() ? "ai" : "browser"; }

  /* Who everyone is, for the current script */
  function personasFor(p, genders, overrides) {
    return Director.cast(p, { genders: genders || {}, overrides: overrides || {} });
  }

  function colorMap(chars) {
    var m = {};
    chars.forEach(function (c, i) { m[c.key] = COLORS[i % COLORS.length]; });
    return m;
  }

  /* ============================================
     Rehearse view
     ============================================ */

  var els = {
    script: $("sp-script"),
    file: $("sp-file"),
    sample: $("sp-sample"),
    clear: $("sp-clear"),
    status: $("sp-parse-status"),
    chips: $("sp-chips"),
    castHint: $("sp-cast-hint"),
    voices: $("sp-voices"),
    voicesBox: $("sp-voices-box"),
    play: $("sp-play"),
    rate: $("sp-rate"),
    rateOut: $("sp-rate-out"),
    readDirs: $("sp-readdirs"),
    sfxBox: $("sp-sfx"),
    turnNote: $("sp-turn-note"),
    engineNote: $("sp-engine-note")
  };

  function fillSamples() {
    LIB.forEach(function (e) {
      var o = document.createElement("option");
      o.value = e.id;
      o.textContent = e.title + " — " + e.scene.replace(/\s*\(abridged\)/, "");
      els.sample.appendChild(o);
    });
  }

  function loadEntryIntoRehearse(entry) {
    S.script = entry.script;
    S.genders = entry.genders || {};
    S.title = entry.title + " · " + entry.scene;
    S.lyric = entry.kind === "musical";
    S.mine = [];
    S.voiceOverrides = {};
    S.aiVoiceOverrides = {};
    S.personaOverrides = {};
    els.script.value = S.script;
    onScriptChange(true);
  }

  var parseTimer = null;

  function onScriptChange(immediate) {
    clearTimeout(parseTimer);
    var run = function () {
      var prevKeys = parsed.characters.map(function (c) { return c.key; }).join("|");
      parsed = Parser.parse(S.script);
      var keys = parsed.characters.map(function (c) { return c.key; });
      S.mine = S.mine.filter(function (k) { return keys.indexOf(k) >= 0; });
      if (keys.join("|") !== prevKeys) renderChips();
      else updateChipState();
      renderStatus();
      renderVoices();
      persist();
    };
    if (immediate === true) run();
    else parseTimer = setTimeout(run, 300);
  }

  function renderStatus() {
    var n = parsed.characters.length;
    var lines = parsed.lineCount;
    els.status.className = "sp-parse-status";
    if (!S.script.trim()) {
      els.status.textContent = "";
    } else if (!lines) {
      els.status.className += " warn";
      els.status.textContent = "Couldn't find any characters yet. Try putting each line on its own row like  NAME: what they say";
    } else {
      els.status.className += " ok";
      els.status.textContent = "✓ Found " + n + " character" + (n === 1 ? "" : "s") + " and " + lines + " line" + (lines === 1 ? "" : "s") + ".";
    }
    els.play.disabled = !lines;
    els.castHint.textContent = lines
      ? "Tap the character (or characters) you're playing. Pick nobody to just watch the whole scene."
      : "Paste a script above and the characters will show up here.";
  }

  function renderChips() {
    els.chips.innerHTML = "";
    parsed.characters.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "sp-chip";
      b.dataset.key = c.key;
      b.style.setProperty("--chip-color", COLORS[i % COLORS.length]);
      b.innerHTML = '<span class="sp-chip-dot"></span>' + esc(c.name) +
        ' <span class="sp-chip-count">' + c.count + " line" + (c.count === 1 ? "" : "s") + "</span>";
      b.addEventListener("click", function () {
        var ix = S.mine.indexOf(c.key);
        if (ix >= 0) S.mine.splice(ix, 1);
        else S.mine.push(c.key);
        updateChipState();
        renderVoices();
        persist();
      });
      els.chips.appendChild(b);
    });
    updateChipState();
  }

  function updateChipState() {
    var chips = els.chips.querySelectorAll(".sp-chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].setAttribute("aria-pressed", S.mine.indexOf(chips[i].dataset.key) >= 0 ? "true" : "false");
    }
    var label = S.mine.length ? "PLAY" : "PLAY SCENE";
    els.play.innerHTML = '<span aria-hidden="true">&#9654;</span> ' + label;
  }

  /* ---------- Cast & voices panel ---------- */

  var ACCENT_OPTIONS = ["american", "british", "french", "spanish", "italian", "german", "dutch", "russian", "irish", "scottish", "australian", "southern", "indian", "swedish", "japanese", "pirate"];
  var STYLE_OPTIONS = ["bratty", "villain", "squeaky", "booming", "hissing", "robotic", "ghostly", "raspy", "posh", "cheerful", "silly", "grumpy", "nervous", "sleepy", "wise", "royal", "sweet", "heroic", "dramatic"];
  var AGE_OPTIONS = ["kid", "teen", "adult", "old"];

  function optionList(list, labels, current, autoLabel) {
    var h = '<option value="">' + esc(autoLabel) + "</option>";
    list.forEach(function (v) {
      h += '<option value="' + v + '"' + (current === v ? " selected" : "") + ">" + esc(labels[v] || v) + "</option>";
    });
    return h;
  }

  function renderVoices() {
    if (!parsed.characters.length) {
      els.voicesBox.classList.add("hidden");
      return;
    }
    els.voicesBox.classList.remove("hidden");
    var engine = engineNow();
    var auto = personasFor(parsed, S.genders, {});
    var personas = personasFor(parsed, S.genders, S.personaOverrides);
    var perf = new Voices.Performer({
      engine: engine, personas: personas, rate: S.rate,
      browserOverrides: S.voiceOverrides, aiOverrides: S.aiVoiceOverrides
    });
    var colors = colorMap(parsed.characters);
    var browserList = Browser.ranked().concat(otherLangVoices());
    var html = '<p class="sp-muted sp-small sp-cast-intro">Scene Partner reads the script to work out who everyone is. Change anything it got wrong.</p>';
    parsed.characters.forEach(function (c) {
      var p = personas[c.key];
      var a = auto[c.key];
      var ov = S.personaOverrides[c.key] || {};
      var mine = S.mine.indexOf(c.key) >= 0;
      var curVoice = engine === "ai" ? perf.aiVoices[c.key] : perf.browserVoices[c.key];
      html += '<div class="sp-cast-row' + (mine ? " is-mine" : "") + '" data-key="' + esc(c.key) + '">';
      html += '<div class="sp-cast-head"><span class="sp-voice-name" style="color:' + colors[c.key] + '">' + esc(c.name) + "</span>";
      html += '<span class="sp-cast-label">' + (mine ? "you" : esc(p.label || "regular voice")) + "</span>";
      if (!mine) html += '<button type="button" class="sp-voice-play" data-key="' + esc(c.key) + '" aria-label="Hear ' + esc(c.name) + '">▶</button>';
      html += "</div>";
      if (!mine) {
        html += '<div class="sp-cast-selects">';
        html += '<select class="sp-select" data-field="accent" aria-label="Accent">' +
          optionList(ACCENT_OPTIONS, Director.accentNames, ov.accent, "Accent: " + (a.accent ? Director.accentNames[a.accent] : "auto")) + "</select>";
        html += '<select class="sp-select" data-field="style" aria-label="Personality">' +
          optionList(STYLE_OPTIONS, Director.styleLabels, ov.style, "Style: " + (a.styles[0] ? (Director.styleLabels[a.styles[0]] || a.styles[0]) : "auto")) + "</select>";
        html += '<select class="sp-select" data-field="age" aria-label="Age">' +
          optionList(AGE_OPTIONS, { kid: "kid", teen: "teen", adult: "grown-up", old: "older" }, ov.age, "Age: " + a.age.replace("adult", "grown-up")) + "</select>";
        html += '<select class="sp-select" data-field="voice" aria-label="Voice">';
        html += '<option value="">Voice: ' + esc(curVoice ? curVoice.name : "auto") + "</option>";
        if (engine === "ai") {
          AI.state.voices.forEach(function (v) {
            var L = v.labels || {};
            var sel = S.aiVoiceOverrides[c.key] === v.id ? " selected" : "";
            html += '<option value="' + esc(v.id) + '"' + sel + ">" + esc(v.name) + (L.accent ? " · " + esc(L.accent) : "") + (L.gender ? " · " + esc(L.gender) : "") + "</option>";
          });
        } else {
          browserList.forEach(function (v) {
            var sel = S.voiceOverrides[c.key] === v.voiceURI ? " selected" : "";
            html += '<option value="' + esc(v.voiceURI) + '"' + sel + ">" + esc(v.name) + " · " + esc(v.lang) + "</option>";
          });
        }
        html += "</select></div>";
      }
      html += "</div>";
    });
    els.voices.innerHTML = html;
  }

  /* Voices in other languages give accents (a French voice reading English) */
  function otherLangVoices() {
    var out = [];
    var seen = {};
    Browser.ranked().forEach(function (v) { seen[v.voiceURI] = 1; });
    var all = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    all.forEach(function (v) { if (!seen[v.voiceURI]) out.push(v); });
    return out.sort(function (a, b) { return a.lang < b.lang ? -1 : 1; });
  }

  els.voices.addEventListener("change", function (e) {
    var t = e.target;
    if (t.tagName !== "SELECT") return;
    var row = t.closest(".sp-cast-row");
    if (!row) return;
    var key = row.dataset.key;
    var field = t.dataset.field;
    if (field === "voice") {
      var store = engineNow() === "ai" ? S.aiVoiceOverrides : S.voiceOverrides;
      if (t.value) store[key] = t.value;
      else delete store[key];
    } else {
      var ov = S.personaOverrides[key] || {};
      if (t.value) ov[field] = t.value;
      else delete ov[field];
      S.personaOverrides[key] = ov;
    }
    persist();
    renderVoices();
  });

  els.voices.addEventListener("click", function (e) {
    var t = e.target.closest(".sp-voice-play");
    if (!t) return;
    previewCharacter(t.dataset.key);
  });

  var previewPerformer = null;
  function previewCharacter(key) {
    Voices.Audio.unlock();
    Browser.unlock();
    if (previewPerformer) previewPerformer.cancel();
    var personas = personasFor(parsed, S.genders, S.personaOverrides);
    var emos = Director.emotions(parsed, personas);
    var idx = -1;
    for (var i = 0; i < parsed.items.length; i++) {
      var it = parsed.items[i];
      if (it.type === "line" && !it.group && it.chars[0] === key) { idx = i; break; }
    }
    var item = idx >= 0 ? parsed.items[idx] : { type: "line", key: key, chars: [key], text: "Hello there!" };
    if (item.text.length > 220) item = { type: "line", key: key, chars: [key], text: item.text.slice(0, 200).replace(/\s+\S*$/, "") + "." };
    previewPerformer = new Voices.Performer({
      engine: engineNow(), personas: personas, rate: S.rate,
      browserOverrides: S.voiceOverrides, aiOverrides: S.aiVoiceOverrides
    });
    previewPerformer.onFallback = onAIFallback;
    previewPerformer.speak(item, idx >= 0 ? emos[idx] : {});
  }

  /* ---------- Settings ---------- */

  function initSegs() {
    var segs = document.querySelectorAll(".sp-seg");
    Array.prototype.forEach.call(segs, function (seg) {
      var setting = seg.dataset.setting;
      function sync() {
        var val = String(setting === "engine" ? engineNow() : S[setting]);
        Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
          b.setAttribute("aria-checked", b.dataset.value === val ? "true" : "false");
        });
        if (setting === "turnMode") renderTurnNote();
        if (setting === "engine") renderEngineNote();
      }
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b || b.disabled) return;
        var v = b.dataset.value;
        S[setting] = v === "true" ? true : v === "false" ? false : v;
        sync();
        persist();
        if (setting === "engine") renderVoices();
      });
      seg._sync = sync;
      sync();
    });
    if (!Listener.supported) {
      var opt = $("sp-listen-opt");
      opt.disabled = true;
      opt.title = "Your browser can't listen. Try Chrome or Edge.";
    }
  }

  function syncSegs() {
    Array.prototype.forEach.call(document.querySelectorAll(".sp-seg"), function (seg) { if (seg._sync) seg._sync(); });
  }

  function renderEngineNote() {
    var aiBtn = $("sp-engine-ai");
    aiBtn.disabled = !aiReady();
    var t = "";
    if (!AI.state.checked) t = "Checking for AI voices…";
    else if (AI.state.failed) t = "AI voices stopped working (" + (AI.state.reason || "error") + "), so the free voices are filling in.";
    else if (!AI.state.available) t = "AI voices aren't switched on for this site yet, so it's using the voices built into this device. They can do accents, speed and pitch, but not real emotions.";
    else if (engineNow() === "ai") t = "AI voices act out every line with emotion, accents and character. The first line can take a second to load.";
    else t = "Free voices are built into this device: quick, but less expressive.";
    els.engineNote.textContent = t;
  }

  function renderTurnNote() {
    var t = "";
    if (S.turnMode === "listen") t = "It'll listen for your line and move on when you've said it. Your browser will ask to use the microphone. Words you miss get underlined afterward.";
    else if (S.turnMode === "timed") t = "It'll give you a pause about as long as your line, then keep going.";
    else if (!Listener.supported) t = "Tip: in Chrome or Edge, “It listens” moves on when you finish your line — hands-free.";
    els.turnNote.textContent = t;
  }

  function fmtRate(r) { return Number(r).toFixed(2).replace(/0$/, "") + "×"; }

  els.rate.value = S.rate;
  els.rateOut.textContent = fmtRate(S.rate);
  els.rate.addEventListener("input", function () {
    S.rate = parseFloat(els.rate.value);
    els.rateOut.textContent = fmtRate(S.rate);
    persist();
  });

  els.readDirs.checked = S.readDirs;
  els.readDirs.addEventListener("change", function () {
    S.readDirs = els.readDirs.checked;
    persist();
  });

  els.sfxBox.checked = S.sfx;
  els.sfxBox.addEventListener("change", function () {
    S.sfx = els.sfxBox.checked;
    persist();
  });

  els.script.value = S.script;
  els.script.addEventListener("input", function () {
    S.script = els.script.value;
    S.title = "";
    S.lyric = false;
    onScriptChange();
  });

  els.file.addEventListener("change", function () {
    var f = els.file.files && els.file.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      S.script = String(r.result || "");
      S.title = f.name.replace(/\.[^.]+$/, "");
      S.genders = {};
      S.lyric = false;
      S.mine = [];
      S.personaOverrides = {};
      els.script.value = S.script;
      onScriptChange(true);
    };
    r.readAsText(f);
    els.file.value = "";
  });

  els.sample.addEventListener("change", function () {
    var e = findEntry(els.sample.value);
    if (e) loadEntryIntoRehearse(e);
    els.sample.value = "";
  });

  els.clear.addEventListener("click", function () {
    S.script = "";
    S.title = "";
    S.genders = {};
    S.mine = [];
    S.voiceOverrides = {};
    S.aiVoiceOverrides = {};
    S.personaOverrides = {};
    S.lyric = false;
    els.script.value = "";
    onScriptChange(true);
    els.script.focus();
  });

  els.play.addEventListener("click", function () {
    if (!parsed.lineCount) return;
    Stage.open({
      parsed: parsed,
      mine: S.mine.slice(),
      genders: S.genders,
      personaOverrides: S.personaOverrides,
      title: S.title || "Your script",
      sub: S.mine.length
        ? "You: " + S.mine.map(function (k) { return Parser.titleCase(k); }).join(", ")
        : "Full performance",
      lyric: S.lyric,
      readDirs: S.mine.length ? S.readDirs : true,
      maskMode: S.maskMode,
      turnMode: S.turnMode,
      cueOnly: S.mine.length ? S.cueOnly : false
    });
  });

  function onAIFallback() {
    toast("AI voices didn't load, so the free voices are taking over.");
    renderEngineNote();
    syncSegs();
  }

  /* ============================================
     Tabs
     ============================================ */

  function showTab(name) {
    var r = name === "rehearse";
    $("tab-rehearse").setAttribute("aria-selected", String(r));
    $("tab-perform").setAttribute("aria-selected", String(!r));
    $("view-rehearse").hidden = !r;
    $("view-perform").hidden = r;
    try { history.replaceState(null, "", r ? location.pathname : "#perform"); } catch (e) { /* ignore */ }
  }

  $("tab-rehearse").addEventListener("click", function () { showTab("rehearse"); });
  $("tab-perform").addEventListener("click", function () { showTab("perform"); });
  $("sp-goto-rehearse").addEventListener("click", function (e) {
    e.preventDefault();
    showTab("rehearse");
    window.scrollTo(0, 0);
    els.script.focus();
  });

  /* ============================================
     Performance library
     ============================================ */

  var kindFilter = "";
  var q = $("sp-q");
  var results = $("sp-results");

  function findEntry(id) {
    for (var i = 0; i < LIB.length; i++) if (LIB[i].id === id) return LIB[i];
    return null;
  }

  function haystack(e) {
    if (!e._hay) {
      e._hay = [e.title, e.author, e.scene, e.kind, e.tags, e.blurb, Object.keys(e.genders).join(" "), e.script]
        .join(" ").toLowerCase().replace(/[’']/g, "");
    }
    return e._hay;
  }

  function searchLib(query, kind) {
    var terms = query.toLowerCase().replace(/[’']/g, "").split(/\s+/).filter(Boolean);
    return LIB.filter(function (e) {
      if (kind && e.kind !== kind) return false;
      var h = haystack(e);
      return terms.every(function (t) { return h.indexOf(t) >= 0; });
    }).map(function (e) {
      var s = 0;
      var head = (e.title + " " + e.scene + " " + e.author).toLowerCase();
      terms.forEach(function (t) { if (head.indexOf(t) >= 0) s += 2; });
      return { e: e, s: s };
    }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.e; });
  }

  function castList(e) {
    if (!e._cast) e._cast = Parser.parse(e.script).characters.map(function (c) { return c.name; });
    return e._cast;
  }

  function renderResults() {
    var list = searchLib(q.value, kindFilter);
    if (!list.length) {
      var qv = q.value.trim();
      results.innerHTML = '<div class="sp-empty"><p><strong>No scenes match “' + esc(qv) + '”.</strong></p>' +
        "<p>The library only has shows that are free for anyone to use (mostly written before 1929). Newer shows and musicals are copyrighted, so they can't be included &mdash; but if you have the script, paste it into Rehearse and it'll perform it for you.</p></div>";
      return;
    }
    results.innerHTML = list.map(function (e) {
      return '<article class="sp-result">' +
        '<span class="sp-result-kind ' + e.kind + '">' + esc(e.kind) + "</span>" +
        "<h3>" + esc(e.title) + "</h3>" +
        '<div class="sp-result-scene">' + esc(e.scene) + "</div>" +
        '<div class="sp-result-meta">' + esc(e.author) + " · " + e.year + "</div>" +
        "<p>" + esc(e.blurb) + "</p>" +
        '<div class="sp-result-cast">Cast: ' + esc(castList(e).join(", ")) + "</div>" +
        '<div class="sp-result-btns">' +
        '<button class="btn btn-primary" type="button" data-perform="' + e.id + '">▶ Perform</button>' +
        '<button class="btn btn-secondary" type="button" data-rehearse="' + e.id + '">Rehearse a part</button>' +
        "</div></article>";
    }).join("");
  }

  results.addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b) return;
    var e = findEntry(b.dataset.perform || b.dataset.rehearse);
    if (!e) return;
    if (b.dataset.perform) performEntry(e);
    else {
      loadEntryIntoRehearse(e);
      showTab("rehearse");
      $("sp-step-cast").scrollIntoView({ behavior: "smooth", block: "start" });
      toast("Loaded “" + e.title + "”. Now pick your character.");
    }
  });

  function performEntry(e) {
    Stage.open({
      parsed: Parser.parse(e.script),
      mine: [],
      genders: e.genders,
      personaOverrides: {},
      title: e.title,
      sub: e.scene,
      lyric: e.kind === "musical",
      readDirs: true,
      maskMode: "show",
      turnMode: "tap",
      cueOnly: false
    });
  }

  q.addEventListener("input", renderResults);
  Array.prototype.forEach.call(document.querySelectorAll(".sp-filter[data-kind]"), function (b) {
    b.addEventListener("click", function () {
      kindFilter = b.dataset.kind;
      Array.prototype.forEach.call(document.querySelectorAll(".sp-filter[data-kind]"), function (x) {
        x.setAttribute("aria-pressed", String(x === b));
      });
      renderResults();
    });
  });
  $("sp-surprise").addEventListener("click", function () {
    var pool = searchLib("", kindFilter);
    if (pool.length) performEntry(pool[Math.floor(Math.random() * pool.length)]);
  });

  /* ============================================
     Stage — the player
     ============================================ */

  var Stage = (function () {
    var stage = $("sp-stage");
    var linesEl = $("sp-stage-lines");
    var scroller = $("sp-stage-scroll");
    var turn = $("sp-turn");
    var turnText = $("sp-turn-text");
    var turnFill = $("sp-turn-fill");
    var nextBtn = $("sp-next");
    var pauseBtn = $("sp-pause");
    var progress = $("sp-progress");
    var curtain = $("sp-curtain");
    var stageRate = $("sp-stage-rate");

    var R = null;
    var wakeLock = null;
    var lastFocus = null;

    function isMine(it) {
      if (!it || it.type !== "line") return false;
      for (var i = 0; i < it.chars.length; i++) if (R.mine[it.chars[i]]) return true;
      return !!R.mine[it.key];
    }

    function colorFor(it) {
      return R.colors[it.chars[0]] || R.colors[it.key] || "var(--sp-stage-muted)";
    }

    /* "Just my cues": skip partner lines that don't lead into one of mine */
    function computeSkips() {
      var skip = [];
      var nextMine = false;
      for (var i = R.items.length - 1; i >= 0; i--) {
        var it = R.items[i];
        if (it.type !== "line") { skip[i] = R.cueOnly; continue; }
        if (isMine(it)) { skip[i] = false; nextMine = true; continue; }
        skip[i] = R.cueOnly && !nextMine;
        nextMine = false;
      }
      return skip;
    }

    /* Find the sound effects in each stage direction (and inside lines) */
    function computeSfx() {
      var out = [];
      var allText = R.items.map(function (x) { return x.text; }).join(" ");
      var magicWorld = SFX.magicWorld(allText);
      var prevLine = null;
      var prevEmo = null;
      R.items.forEach(function (it, i) {
        if (it.type === "dir") {
          var others = true;
          if (prevLine) {
            var names = mentionedKeys(it.text);
            others = names.some(function (k) { return prevLine.chars.indexOf(k) < 0; });
          }
          out[i] = SFX.detect(it.text, {
            prevLine: prevLine ? prevLine.text : "",
            prevShouted: !!(prevEmo && prevEmo.shout),
            affectsOthers: others,
            magicWorld: magicWorld
          });
          prevLine = null;
        } else if (it.type === "line") {
          var cues = (it.text.match(/\(([^)]*)\)|\[([^\]]*)\]/g) || []).join(" ");
          out[i] = cues ? SFX.detect(cues, {}) : [];
          prevLine = it;
          prevEmo = R.emotions[i];
        } else {
          out[i] = [];
        }
      });
      return out;
    }

    function mentionedKeys(text) {
      var up = " " + String(text).toUpperCase() + " ";
      return Object.keys(R.personas).filter(function (k) {
        return k.split(/[\s\-]+/).some(function (t) {
          return t.length >= 3 && new RegExp("[^A-Z]" + t.replace(/[^A-Z0-9]/g, "") + "[^A-Z]").test(up);
        });
      });
    }

    function renderTextHTML(text, mine) {
      var parts = String(text).split(/(\([^)]*\)|\[[^\]]*\])/);
      var html = "";
      var expected = [];
      parts.forEach(function (part) {
        if (!part) return;
        if (/^[\(\[]/.test(part)) {
          html += '<span class="sp-inline-dir">' + esc(part) + "</span>";
          return;
        }
        part.split("\n").forEach(function (ln, li) {
          if (li > 0) html += "<br>";
          ln.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { html += " "; return; }
            if (!mine) { html += esc(tok); return; }
            var n = normWord(tok);
            var hint = tok.replace(/([A-Za-z0-9])[A-Za-z0-9'’\-]*/, "$1");
            var attr = n ? ' data-k="' + expected.length + '"' : "";
            if (n) expected.push(n);
            html += '<span class="w"' + attr + '><span class="f">' + esc(tok) + '</span><span class="h">' + esc(hint) + "</span></span>";
          });
        });
      });
      return { html: html, expected: expected };
    }

    function whoLabel(it, mine) {
      if (it.group) {
        var names = it.chars.filter(function (k) { return R.personas[k]; }).map(function (k) { return Parser.titleCase(k); });
        return esc(Parser.titleCase(it.group)) + (names.length ? ' <span class="sp-who-names">' + esc(names.join(", ")) + "</span>" : "");
      }
      return esc(Parser.titleCase(it.key));
    }

    function render() {
      linesEl.innerHTML = "";
      R.expected = [];
      R.wordEls = [];
      R.nodes = R.items.map(function (it, i) {
        var d = document.createElement("div");
        d.className = "sp-item " + it.type;
        d.dataset.i = i;
        var sfx = R.sfxOn ? R.sfx[i] : [];
        var sfxHtml = sfx.length ? '<div class="sp-sfx-tag" aria-label="Sound effects">🔊 ' + esc(sfx.map(function (h) { return h.label; }).join(" → ")) + "</div>" : "";
        if (it.type === "line") {
          var mine = isMine(it);
          if (mine) d.classList.add("mine");
          d.style.setProperty("--who-color", mine ? "var(--sp-gold)" : colorFor(it));
          var r = renderTextHTML(it.text, mine);
          R.expected[i] = r.expected;
          var emo = R.emotions[i] && R.emotions[i].emotion;
          var emoHtml = emo && !mine ? '<span class="sp-emo">' + esc(emo) + "</span>" : "";
          d.innerHTML = '<div class="sp-who">' + whoLabel(it, mine) + (mine ? '<span class="sp-you">YOU</span>' : "") + emoHtml + "</div>" +
            '<div class="sp-text">' + r.html + "</div>" + sfxHtml;
          if (mine) {
            R.wordEls[i] = d.querySelectorAll(".w[data-k]");
            if (R.maskMode === "hint") d.classList.add("mask-hint");
            if (R.maskMode === "hide") d.classList.add("mask-hide");
          }
        } else {
          d.innerHTML = '<div class="sp-text">' + esc(it.text) + "</div>" + sfxHtml;
        }
        if (R.skip[i]) d.classList.add("skipped");
        linesEl.appendChild(d);
        return d;
      });
    }

    function setCurrent(i) {
      R.nodes.forEach(function (n, k) {
        n.classList.toggle("current", k === i);
        n.classList.toggle("past", k < i);
        n.classList.remove("speaking");
        if (k < i && n.classList.contains("mine")) n.classList.remove("mask-hint", "mask-hide", "peek");
      });
      var node = R.nodes[i];
      if (node) {
        var top = node.offsetTop - scroller.clientHeight * 0.38;
        scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
      var total = R.items.length || 1;
      progress.style.width = Math.round((Math.min(i, total) / total) * 100) + "%";
    }

    function clearWaits() {
      Listener.stop();
      clearTimeout(R.waitTimer);
      clearInterval(R.listenTick);
      R.waitTimer = null;
      R.listenTick = null;
      turn.classList.add("hidden");
      turn.classList.remove("listening");
      turnFill.style.transition = "none";
      turnFill.style.width = "0";
      nextBtn.classList.remove("your-turn");
      nextBtn.innerHTML = "Next &#9654;";
    }

    function stopAll() {
      R.token++;
      R.performer.cancel();
      SFX.stopAll();
      clearWaits();
    }

    function wait(ms, t) {
      return new Promise(function (res) {
        R.waitTimer = setTimeout(function () { res(t === R.token); }, ms);
      });
    }

    /* ---------- sound effects ---------- */

    function sfxPrompt(i) {
      var it = R.items[i];
      var hits = R.sfx[i] || [];
      var bits = [];
      hits.forEach(function (h) {
        if (h.implied) { bits.push("a cartoon magic spell being cast, sparkly zap"); return; }
        var clause = it.type === "dir" ? (it.text.split(/[.;!?]/).filter(function (c) { return c.toLowerCase().indexOf(h.phrase.toLowerCase()) >= 0; })[0] || h.phrase) : h.phrase;
        clause = clause.replace(/\b[A-Z][A-Z'\-]+(?:\s+[A-Z][A-Z'\-]+)*\b/g, "someone").replace(/someone(\s+and\s+someone)+/g, "two kids").replace(/\s+/g, " ").trim();
        bits.push(clause);
      });
      var uniq = bits.filter(function (b, k) { return bits.indexOf(b) === k; });
      return uniq.join(", then ") + ". Funny cartoon sound effects for a kids' play, no music, no talking.";
    }

    function sfxSeconds(i) {
      var n = (R.sfx[i] || []).length;
      return clamp(1.2 + n * 1.0, 1.5, 5);
    }

    function prefetchSfx(i) {
      if (!R.sfxOn || !R.performer.useAI() || !(R.sfx[i] || []).length) return;
      AI.fetchAudio(AI.sfxUrl(sfxPrompt(i), sfxSeconds(i))).catch(function () {});
    }

    function playSfx(i, t) {
      var hits = R.sfx[i] || [];
      if (!R.sfxOn || !hits.length) return Promise.resolve(true);
      R.nodes[i].classList.add("sfx-playing");
      var done = function (ok) {
        if (R && R.nodes[i]) R.nodes[i].classList.remove("sfx-playing");
        return ok;
      };
      if (R.performer.useAI()) {
        var myGen = AI.gen();
        return AI.fetchAudio(AI.sfxUrl(sfxPrompt(i), sfxSeconds(i))).then(function (buf) {
          if (t !== R.token) return false;
          return AI.playBuffer(buf, [], null, 0.9, 0, myGen).then(function () { return done(t === R.token); });
        }).catch(function () {
          return playSynth(hits, t).then(done);
        });
      }
      return playSynth(hits, t).then(done);
    }

    function playSynth(hits, t) {
      var ctx = Voices.Audio.get();
      if (!ctx) return Promise.resolve(true);
      SFX.init(ctx);
      var secs = SFX.playAll(hits);
      return wait(Math.min(secs, 3.5) * 1000 + 100, t);
    }

    /* ---------- running the scene ---------- */

    function prefetchAhead(from) {
      var n = 0;
      for (var j = from; j < R.items.length && n < 4; j++) {
        if (R.skip[j]) continue;
        var it = R.items[j];
        if (it.type === "line" && !isMine(it)) { R.performer.prefetch(it, R.emotions[j]); n++; }
        else if (it.type === "dir" && R.readDirs) { R.performer.prefetch(it, {}); n++; }
        prefetchSfx(j);
      }
    }

    function step() {
      if (!R || !R.playing) return;
      var t = R.token;
      while (R.idx < R.items.length && R.skip[R.idx]) R.idx++;
      if (R.idx >= R.items.length) { finish(); return; }
      var i = R.idx;
      var it = R.items[i];
      setCurrent(i);
      prefetchAhead(i + 1);

      if (it.type === "line" && isMine(it)) {
        playSfx(i, t).then(function (ok) { if (ok && t === R.token) awaitUser(i, t); });
        return;
      }

      var text = it.type === "line" ? Parser.spokenText(it.text) : it.text;
      var hasSfx = R.sfxOn && (R.sfx[i] || []).length;
      var speakIt = it.type === "line" ? !!text : (R.readDirs && !!text);

      var p = playSfx(i, t);
      p.then(function (ok) {
        if (!ok || t !== R.token) return false;
        if (!speakIt) return wait(hasSfx ? 150 : it.type === "heading" ? 700 : 350, t);
        if (it.type === "line" && !Browser.supported && R.performer.engine !== "ai") {
          var secs = 1.2 + text.split(/\s+/).length * 0.33 / R.rate;
          return wait(secs * 1000, t);
        }
        R.nodes[i].classList.add("speaking");
        return R.performer.speak(it, R.emotions[i] || {}).then(function () { return t === R.token; });
      }).then(function (ok) {
        if (!ok || t !== R.token) return;
        R.nodes[i].classList.remove("speaking");
        R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, 180);
      });
    }

    function awaitUser(i, t) {
      turn.classList.remove("hidden");
      nextBtn.classList.add("your-turn");
      nextBtn.innerHTML = "Done &#9654;";
      var it = R.items[i];
      var others = it.group ? it.chars.filter(function (k) { return !R.mine[k]; }) : [];
      var together = others.length ? " Say it together with " + others.map(function (k) { return Parser.titleCase(k); }).join(", ") + "." : "";
      var mode = R.turnMode;

      if (mode === "timed") {
        var words = (R.expected[i] || []).length;
        var ms = (1500 + words * 430) / R.rate;
        turnText.textContent = "Your line!" + together + " Moving on in a moment…";
        requestAnimationFrame(function () {
          turnFill.style.transition = "width " + ms + "ms linear";
          turnFill.style.width = "100%";
        });
        R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, ms);
        return;
      }

      if (mode === "listen" && Listener.supported) {
        turn.classList.add("listening");
        turnText.textContent = "Listening… say your line" + (together ? " (together!)" : "");
        var expected = R.expected[i] || [];
        var spans = R.wordEls[i] || [];
        var st = { heard: false, last: Date.now(), cov: 0, done: false };
        var finishLine = function (delay) {
          if (st.done) return;
          st.done = true;
          R.scores[i] = st.cov;
          Array.prototype.forEach.call(spans, function (s) {
            if (!s.classList.contains("heard")) s.classList.add("missed");
          });
          R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, delay);
        };
        Listener.start({
          update: function (txt) {
            if (t !== R.token) return;
            st.heard = true;
            st.last = Date.now();
            var heard = txt.split(/\s+/).map(normWord).filter(Boolean);
            var m = matchWords(expected, heard);
            st.cov = m.cov;
            for (var k = 0; k < spans.length; k++) {
              var ix = +spans[k].dataset.k;
              spans[k].classList.toggle("heard", !!m.marks[ix]);
            }
            if (m.cov >= 0.85) finishLine(600);
          },
          error: function (err) {
            if (t !== R.token) return;
            if (err === "not-allowed" || err === "service-not-allowed" || err === "unsupported" || err === "start") {
              R.turnMode = "tap";
              toast("Couldn't use the microphone — tap Done after each line instead.");
              turn.classList.remove("listening");
              turnText.textContent = "Your line! Tap Done when you've said it.";
            }
          }
        });
        R.listenTick = setInterval(function () {
          if (t !== R.token) { clearInterval(R.listenTick); return; }
          if (!st.done && st.heard && Date.now() - st.last > 2200 && st.cov >= 0.5) finishLine(0);
        }, 300);
        return;
      }

      turnText.textContent = "Your line!" + together + " Tap Done when you've said it.";
    }

    function advance() {
      if (!R) return;
      clearWaits();
      R.idx++;
      step();
    }

    function goTo(i) {
      stopAll();
      R.idx = clamp(i, 0, R.items.length);
      curtain.classList.add("hidden");
      if (R.playing) step();
      else setCurrent(R.idx);
    }

    function setPlaying(p) {
      R.playing = p;
      pauseBtn.innerHTML = p ? "&#10074;&#10074;" : "&#9654;";
      pauseBtn.setAttribute("aria-label", p ? "Pause" : "Play");
    }

    function finish() {
      stopAll();
      setPlaying(false);
      setCurrent(R.items.length);
      progress.style.width = "100%";
      var mineCount = R.items.filter(isMine).length;
      var msg;
      if (mineCount) {
        msg = "You said " + mineCount + " line" + (mineCount === 1 ? "" : "s") + ".";
        var sc = Object.keys(R.scores).map(function (k) { return R.scores[k]; });
        if (sc.length) {
          var avg = sc.reduce(function (a, b) { return a + b; }, 0) / sc.length;
          msg += " About " + Math.round(avg * 100) + "% of your words were heard — scroll up to see any you missed.";
        }
      } else {
        msg = "That's the end of the scene. Bravo!";
      }
      $("sp-curtain-stats").textContent = msg;
      curtain.classList.remove("hidden");
      if (R.sfxOn) {
        var ctx = Voices.Audio.get();
        if (ctx) { SFX.init(ctx); SFX.play("applause"); }
      }
      setTimeout(function () {
        scroller.scrollTo({ top: curtain.offsetTop - scroller.clientHeight * 0.25, behavior: "smooth" });
      }, 50);
    }

    function prevLineIndex(from) {
      for (var i = from - 1; i >= 0; i--) {
        if (R.items[i].type === "line" && !R.skip[i]) return i;
      }
      return 0;
    }

    function requestWake() {
      try {
        if (navigator.wakeLock && navigator.wakeLock.request) {
          navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; }).catch(function () {});
        }
      } catch (e) { /* ignore */ }
    }

    function open(cfg) {
      lastFocus = document.activeElement;
      /* Unlock audio first: phones only allow sound that starts from a tap */
      Voices.Audio.unlock();
      Browser.unlock();
      var ctx = Voices.Audio.get();
      if (ctx) SFX.init(ctx);

      var mine = {};
      cfg.mine.forEach(function (k) { mine[k] = true; });
      var personas = personasFor(cfg.parsed, cfg.genders, cfg.personaOverrides);
      R = {
        items: cfg.parsed.items,
        mine: mine,
        personas: personas,
        emotions: Director.emotions(cfg.parsed, personas),
        colors: colorMap(cfg.parsed.characters),
        rate: S.rate,
        readDirs: !!cfg.readDirs,
        maskMode: cfg.maskMode,
        turnMode: cfg.turnMode,
        cueOnly: !!cfg.cueOnly,
        sfxOn: S.sfx,
        idx: 0,
        token: 0,
        playing: false,
        scores: {}
      };
      R.performer = new Voices.Performer({
        engine: engineNow(),
        personas: personas,
        rate: S.rate,
        lyric: !!cfg.lyric,
        browserOverrides: S.voiceOverrides,
        aiOverrides: S.aiVoiceOverrides
      });
      R.performer.onFallback = onAIFallback;
      R.skip = computeSkips();
      R.sfx = computeSfx();
      $("sp-stage-title").textContent = cfg.title;
      $("sp-stage-sub").textContent = (cfg.sub || "") + (R.performer.useAI() ? " · ✨ AI voices" : "");
      syncRateSelect();
      curtain.classList.add("hidden");
      render();
      stage.hidden = false;
      document.body.classList.add("sp-stage-open");
      requestWake();
      setPlaying(true);
      scroller.scrollTop = 0;
      step();
      nextBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!R) return;
      stopAll();
      setPlaying(false);
      R = null;
      stage.hidden = true;
      document.body.classList.remove("sp-stage-open");
      if (wakeLock) { try { wakeLock.release(); } catch (e) { /* ignore */ } wakeLock = null; }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function syncRateSelect() {
      var best = null, bd = 9;
      Array.prototype.forEach.call(stageRate.options, function (o) {
        var d = Math.abs(parseFloat(o.value) - R.rate);
        if (d < bd) { bd = d; best = o; }
      });
      if (best) {
        if (bd > 0.02) {
          var o = document.createElement("option");
          o.value = String(R.rate);
          o.textContent = fmtRate(R.rate);
          stageRate.appendChild(o);
          stageRate.value = o.value;
        } else stageRate.value = best.value;
      }
    }

    /* Controls */
    nextBtn.addEventListener("click", function () {
      if (!R) return;
      if (!R.playing) setPlaying(true);
      var it = R.items[R.idx];
      if (it && isMine(it) && R.turnMode === "listen") {
        var spans = R.wordEls[R.idx] || [];
        var heard = 0;
        Array.prototype.forEach.call(spans, function (s) {
          if (s.classList.contains("heard")) heard++;
          else s.classList.add("missed");
        });
        if (spans.length) R.scores[R.idx] = heard / spans.length;
      }
      stopAll();
      R.idx++;
      step();
    });

    pauseBtn.addEventListener("click", function () {
      if (!R) return;
      if (R.playing) {
        stopAll();
        setPlaying(false);
        if (R.nodes[R.idx]) R.nodes[R.idx].classList.remove("speaking");
      } else {
        if (R.idx >= R.items.length) R.idx = 0;
        curtain.classList.add("hidden");
        Voices.Audio.unlock();
        Browser.unlock();
        setPlaying(true);
        step();
      }
    });

    $("sp-back").addEventListener("click", function () {
      if (!R) return;
      goTo(prevLineIndex(R.idx));
    });

    $("sp-restart").addEventListener("click", function () {
      if (!R) return;
      R.scores = {};
      R.nodes.forEach(function (n) {
        Array.prototype.forEach.call(n.querySelectorAll(".w"), function (w) { w.classList.remove("heard", "missed"); });
        if (n.classList.contains("mine")) {
          if (R.maskMode === "hint") n.classList.add("mask-hint");
          if (R.maskMode === "hide") n.classList.add("mask-hide");
        }
      });
      Voices.Audio.unlock();
      Browser.unlock();
      setPlaying(true);
      goTo(0);
    });

    $("sp-exit").addEventListener("click", close);
    $("sp-done").addEventListener("click", close);
    $("sp-again").addEventListener("click", function () { $("sp-restart").click(); });

    stageRate.addEventListener("change", function () {
      if (!R) return;
      R.rate = parseFloat(stageRate.value);
      R.performer.rate = R.rate;
      S.rate = R.rate;
      els.rate.value = S.rate;
      els.rateOut.textContent = fmtRate(S.rate);
      persist();
    });

    linesEl.addEventListener("click", function (e) {
      if (!R) return;
      var node = e.target.closest(".sp-item");
      if (!node) return;
      var i = +node.dataset.i;
      if (i === R.idx && node.classList.contains("mine")) {
        node.classList.toggle("peek");
        return;
      }
      if (node.classList.contains("mine") && (node.classList.contains("mask-hint") || node.classList.contains("mask-hide")) && i > R.idx) {
        node.classList.toggle("peek");
        return;
      }
      Voices.Audio.unlock();
      Browser.unlock();
      setPlaying(true);
      goTo(i);
    });

    document.addEventListener("keydown", function (e) {
      if (!R || stage.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.target && /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        if (e.target && e.target.tagName === "BUTTON" && e.target !== nextBtn) return;
        e.preventDefault();
        nextBtn.click();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        $("sp-back").click();
      } else if (e.key.toLowerCase() === "p") {
        pauseBtn.click();
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && R && !stage.hidden) requestWake();
    });

    return { open: open, close: close };
  })();

  /* ============================================
     Toast
     ============================================ */

  var toastTimer = null;
  function toast(msg) {
    var t = $("sp-toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("hidden"); }, 3600);
  }

  /* ============================================
     Init
     ============================================ */

  if (!Browser.supported) $("sp-no-speech").classList.remove("hidden");
  fillSamples();
  initSegs();
  renderTurnNote();
  renderEngineNote();
  renderChips();
  renderStatus();
  renderVoices();
  renderResults();
  Browser.onVoices(function () { renderVoices(); });
  AI.onChange(function () { syncSegs(); renderEngineNote(); renderVoices(); });
  AI.check();
  if (location.hash === "#perform") showTab("perform");
})();

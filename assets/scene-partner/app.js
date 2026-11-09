/* ============================================
   Scene Partner — App
   Rehearse: paste a script, pick your part(s),
   the browser's voices read everyone else.
   Performance: pick a scene from the library and
   every part is performed for you.
   ============================================ */

(function () {
  "use strict";

  var LIB = window.SP_LIBRARY || [];
  var Parser = window.SPParser;
  var STORE_KEY = "scenePartner.v1";
  var COLORS = ["#8fb8ff", "#ff9fb2", "#9fe3b4", "#c9a7ff", "#ffc685", "#7fe0e0", "#ff8f8f", "#d8e47f", "#f0a6e8", "#a6c4f0"];

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
     Speech synthesis
     ============================================ */

  var Speech = (function () {
    var synth = window.speechSynthesis;
    var supported = !!synth && typeof window.SpeechSynthesisUtterance !== "undefined";
    var voices = [];
    var listeners = [];
    var keep = [];
    var gen = 0;
    var lastCancel = 0;

    var FEMALE = /(female|woman|samantha|karen|moira|tessa|victoria|fiona|veena|serena|allison|ava|susan|zira|hazel|kate|catherine|nicky|zoe|joanna|salli|kimberly|ivy|emma|amy|libby|sonia|aria|jenny|michelle|natasha|clara|kendra|ruth|olivia|isha|heera|ellie|martha|stephanie|nora|flo|sandy|shelley|grandma|aurora|ana\b|siri.*voice [24])/i;
    var MALE = /(\bmale|\bman\b|daniel|alex\b|fred|rishi|oliver|\btom\b|aaron|arthur|gordon|\blee\b|david|mark|george|james|ryan|guy|eric|christopher|brian|matthew|joey|justin|evan|nathan|reed|ralph|junior|thomas|william|liam|noah|ravi|prabhat|grandpa|rocko|eddy|steffan|andrew|roger|siri.*voice [13])/i;
    var NOVELTY = /(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|eloquence)/i;

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

    function ranked() {
      var en = voices.filter(function (v) { return /^en/i.test(v.lang); });
      var pool = en.length ? en : voices.slice();
      return pool.sort(function (a, b) { return score(b) - score(a); }).filter(function (v) { return score(v) > -10; });
    }

    function byURI(uri) {
      for (var i = 0; i < voices.length; i++) if (voices[i].voiceURI === uri) return voices[i];
      return null;
    }

    function sentenceChunks(text) {
      var flat = text.replace(/\s*\n\s*/g, " ").trim();
      if (!flat) return [];
      var parts = flat.match(/[^.!?;:]+[.!?;:]*["'’”)\]]*\s*/g) || [flat];
      var out = [];
      var buf = "";
      parts.forEach(function (p) {
        if ((buf + p).length > 180 && buf) { out.push(buf.trim()); buf = ""; }
        buf += p;
      });
      if (buf.trim()) out.push(buf.trim());
      return out;
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

    /* Resolves when the text has been spoken (or skipped / cancelled). */
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
          var u = new SpeechSynthesisUtterance(c);
          if (o.voice) { u.voice = o.voice; u.lang = o.voice.lang; }
          else u.lang = "en-US";
          u.rate = clamp(o.rate || 1, 0.5, 2);
          var p = (o.pitch || 1) * (o.lyric ? (k % 2 ? 1.07 : 0.95) : 1);
          u.pitch = clamp(p, 0.3, 1.9);
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

    /* iOS needs the first utterance to come from a tap. */
    function unlock() {
      if (!supported) return;
      try {
        var u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        synth.speak(u);
      } catch (e) { /* ignore */ }
    }

    return {
      supported: supported,
      speak: speak,
      cancel: cancel,
      unlock: unlock,
      ranked: ranked,
      gender: gender,
      byURI: byURI,
      hasVoices: function () { return voices.length > 0; },
      onVoices: function (f) { listeners.push(f); }
    };
  })();

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
    rate: saved.rate || 1,
    maskMode: saved.maskMode || "show",
    turnMode: saved.turnMode || "tap",
    cueOnly: !!saved.cueOnly,
    readDirs: !!saved.readDirs
  };
  if (S.turnMode === "listen" && !Listener.supported) S.turnMode = "tap";

  var parsed = Parser.parse(S.script);

  function persist() {
    Store.save(S);
  }

  /* ============================================
     Casting: who gets which voice
     ============================================ */

  function guessGender(key) {
    var k = " " + key.toUpperCase() + " ";
    if (/ (LADY|QUEEN|MRS\.?|MISS|MS\.?|MOTHER|MOM|MUM|MA|GIRL|WOMAN|SISTER|AUNT|PRINCESS|DUCHESS|NURSE|WIFE|DAUGHTER|GRANDMA|GRANNY|MAID|MADAM|MADAME|DAME|NUN|EMPRESS|WITCH|GODDESS|SHE|HER) /.test(k)) return "f";
    if (/ (LORD|KING|MR\.?|SIR|FATHER|DAD|PA|BOY|MAN|BROTHER|UNCLE|PRINCE|DUKE|HUSBAND|SON|GRANDPA|BUTLER|MONK|FRIAR|EMPEROR|GOD|CAPTAIN|KNIGHT|HE|HIM) /.test(k)) return "m";
    if (/ (MARY|JULIET|ALICE|ANNA|ANNE|ANN|EMMA|SARAH|KATE|KATHERINE|ELIZABETH|LIZ|BETH|JANE|LUCY|SOPHIE|SOPHIA|OLIVIA|EMILY|GRACE|ROSE|LILY|HANNAH|LAURA|NORA|WENDY|DOROTHY|BELLE|ELSA|ANNIE|MAYA|MIA|ZOE|CHLOE|ELLA|IDA|LANA|PORTIA|ROSALIND|VIOLA|HERMIA|HELENA|TITANIA|OPHELIA|DESDEMONA|CORDELIA|BEATRICE|HERO|MIRANDA|GWENDOLEN|CECILY|ELIZA|JO|MEG|AMY|SUSAN|MARIA|LISA|JESSICA|EMILIA|PAULINA|HERMIONE|GINNY|LUNA|ARIEL|JASMINE|MOANA|MULAN|TIANA|ANYA|ELPHABA|GLINDA|NALA|DANIELLE|RACHEL|REBECCA|MOLLY|HOLLY|ABIGAIL|ABBY|AVA|ISABELLA|MADISON|NATALIE|SAMANTHA|VICTORIA|ROSALIE|RUTH|ESTHER|MIRIAM|NAOMI|LEAH) /.test(k)) return "f";
    if (/ (ROMEO|HAMLET|MACBETH|OTHELLO|IAGO|LEAR|PUCK|OBERON|BOTTOM|QUINCE|BENVOLIO|MERCUTIO|TYBALT|HORATIO|BRUTUS|CAESAR|ANTONY|CASSIUS|PROSPERO|CALIBAN|BENEDICK|JACK|ALGERNON|SCROOGE|JOHN|JAMES|TOM|SAM|MAX|BEN|DAVID|MICHAEL|PETER|PAUL|GEORGE|HENRY|WILLIAM|HARRY|RON|NEVILLE|DRACO|PERCY|LUKE|LEO|NOAH|JONAH|ETHAN|JACOB|LIAM|MASON|LUCAS|OLIVER|ELI|AMI|YOAV|STEPHEN|MATT|MATTHEW|MARK|JOSH|JOSHUA|DANNY|DANIEL|CHARLIE|FRED|BOB|JIM|JOE|NICK|TONY|SIMBA|ALADDIN|SHREK|FIYERO|HAMILTON|BURR|SEYMOUR|JEAN|MARIUS|JAVERT) /.test(k)) return "m";
    return "";
  }

  function buildCast(chars, genders, overrides) {
    var all = Speech.ranked();
    var female = all.filter(function (v) { return Speech.gender(v) === "f"; });
    var male = all.filter(function (v) { return Speech.gender(v) === "m"; });
    var uses = {};
    var pitchSteps = [1, 0.88, 1.12, 0.78, 1.22, 0.94, 1.06, 0.84, 1.16];
    var cast = {};

    chars.forEach(function (key, i) {
      var g = genders[key] || guessGender(key);
      var v = overrides[key] ? Speech.byURI(overrides[key]) : null;
      if (!v && all.length) {
        var pool = g === "f" && female.length ? female : g === "m" && male.length ? male : all;
        for (var j = 0; j < pool.length; j++) {
          if (!uses[pool[j].voiceURI]) { v = pool[j]; break; }
        }
        if (!v) v = pool[i % pool.length];
      }
      var n = v ? (uses[v.voiceURI] = (uses[v.voiceURI] || 0) + 1) : 1;
      var pitch = pitchSteps[(n - 1) % pitchSteps.length];
      if (v && !overrides[key]) {
        var vg = Speech.gender(v);
        if (g === "f" && vg === "m") pitch *= 1.3;
        if (g === "m" && vg === "f") pitch *= 0.8;
      }
      cast[key] = { voice: v, pitch: pitch, color: COLORS[i % COLORS.length], gender: g };
    });

    var narr = null;
    for (var q = 0; q < all.length; q++) {
      if (!uses[all[q].voiceURI]) { narr = all[q]; break; }
    }
    cast.__narrator = { voice: narr || all[0] || null, pitch: 1, color: "", gender: "" };
    return cast;
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
    turnNote: $("sp-turn-note")
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
    else parseTimer = setTimeout(run, 250);
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
      ? "Tap the character (or characters) you're playing. Pick nobody to just listen to the whole scene."
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
    var label = S.mine.length ? "▶ PLAY" : "▶ PLAY SCENE";
    els.play.innerHTML = '<span aria-hidden="true">' + label.slice(0, 1) + "</span> " + label.slice(2);
  }

  function renderVoices() {
    var others = parsed.characters.filter(function (c) { return S.mine.indexOf(c.key) < 0; });
    if (!others.length || !Speech.supported) {
      els.voicesBox.classList.add("hidden");
      return;
    }
    els.voicesBox.classList.remove("hidden");
    var list = Speech.ranked();
    var cast = buildCast(parsed.characters.map(function (c) { return c.key; }), S.genders, S.voiceOverrides);
    var html = "";
    if (!list.length) html = '<p class="sp-muted sp-small">Loading voices&hellip;</p>';
    others.forEach(function (c) {
      var cur = cast[c.key] && cast[c.key].voice;
      html += '<div class="sp-voice-row"><span class="sp-voice-name" style="color:' + cast[c.key].color + '">' + esc(c.name) + "</span>";
      html += '<select class="sp-select" data-key="' + esc(c.key) + '" aria-label="Voice for ' + esc(c.name) + '">';
      html += '<option value="">Auto' + (cur ? " (" + esc(cur.name) + ")" : "") + "</option>";
      list.forEach(function (v) {
        var sel = S.voiceOverrides[c.key] === v.voiceURI ? " selected" : "";
        html += '<option value="' + esc(v.voiceURI) + '"' + sel + ">" + esc(v.name) + " · " + esc(v.lang) + "</option>";
      });
      html += '</select><button type="button" class="sp-voice-play" data-key="' + esc(c.key) + '" aria-label="Hear ' + esc(c.name) + '">▶</button></div>';
    });
    els.voices.innerHTML = html;
  }

  els.voices.addEventListener("change", function (e) {
    var t = e.target;
    if (t.tagName !== "SELECT") return;
    if (t.value) S.voiceOverrides[t.dataset.key] = t.value;
    else delete S.voiceOverrides[t.dataset.key];
    persist();
  });

  els.voices.addEventListener("click", function (e) {
    var t = e.target.closest(".sp-voice-play");
    if (!t) return;
    var key = t.dataset.key;
    var cast = buildCast(parsed.characters.map(function (c) { return c.key; }), S.genders, S.voiceOverrides);
    var first = null;
    for (var i = 0; i < parsed.items.length; i++) {
      var it = parsed.items[i];
      if (it.type === "line" && (it.key === key || it.chars.indexOf(key) >= 0)) { first = it; break; }
    }
    var text = first ? Parser.spokenText(first.text).split(/\n/).slice(0, 2).join(" ") : "Hello.";
    Speech.cancel();
    Speech.speak(text, { voice: cast[key].voice, pitch: cast[key].pitch, rate: S.rate });
  });

  /* Settings controls */

  function initSegs() {
    var segs = document.querySelectorAll(".sp-seg");
    Array.prototype.forEach.call(segs, function (seg) {
      var setting = seg.dataset.setting;
      function sync() {
        var val = String(S[setting]);
        Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
          b.setAttribute("aria-checked", b.dataset.value === val ? "true" : "false");
        });
        if (setting === "turnMode") renderTurnNote();
      }
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b || b.disabled) return;
        var v = b.dataset.value;
        S[setting] = v === "true" ? true : v === "false" ? false : v;
        sync();
        persist();
      });
      sync();
    });
    if (!Listener.supported) {
      var opt = $("sp-listen-opt");
      opt.disabled = true;
      opt.title = "Your browser can't listen. Try Chrome or Edge.";
    }
  }

  function renderTurnNote() {
    var t = "";
    if (S.turnMode === "listen") t = "It'll listen for your line and move on when you've said it. Your browser will ask to use the microphone. Words you miss get underlined afterward.";
    else if (S.turnMode === "timed") t = "It'll give you a pause about as long as your line, then keep going.";
    else if (!Listener.supported) t = "Tip: in Chrome or Edge, “It listens” moves on when you finish your line — hands-free.";
    els.turnNote.textContent = t;
  }

  els.rate.value = S.rate;
  els.rateOut.textContent = Number(S.rate).toFixed(2).replace(/0$/, "") + "×";
  els.rate.addEventListener("input", function () {
    S.rate = parseFloat(els.rate.value);
    els.rateOut.textContent = S.rate.toFixed(2).replace(/0$/, "") + "×";
    persist();
  });

  els.readDirs.checked = S.readDirs;
  els.readDirs.addEventListener("change", function () {
    S.readDirs = els.readDirs.checked;
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
    S.lyric = false;
    els.script.value = "";
    onScriptChange(true);
    els.script.focus();
  });

  els.play.addEventListener("click", function () {
    if (!parsed.lineCount) return;
    Stage.open({
      items: parsed.items,
      characters: parsed.characters,
      mine: S.mine.slice(),
      genders: S.genders,
      overrides: S.voiceOverrides,
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
    var p = Parser.parse(e.script);
    return p.characters.map(function (c) { return c.name; });
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
    var p = Parser.parse(e.script);
    Stage.open({
      items: p.items,
      characters: p.characters,
      mine: [],
      genders: e.genders,
      overrides: {},
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
      if (it.type !== "line") return false;
      for (var i = 0; i < it.chars.length; i++) if (R.mine[it.chars[i]]) return true;
      return !!R.mine[it.key];
    }

    function voiceFor(it) {
      if (it.type !== "line") return R.cast.__narrator;
      return R.cast[it.chars[0]] || R.cast[it.key] || R.cast.__narrator;
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

    function renderTextHTML(text, i, mine) {
      var parts = String(text).split(/(\([^)]*\)|\[[^\]]*\])/);
      var html = "";
      var expected = [];
      parts.forEach(function (part) {
        if (!part) return;
        if (/^[\(\[]/.test(part)) {
          html += '<span class="sp-inline-dir">' + esc(part) + "</span>";
          return;
        }
        var lines = part.split("\n");
        lines.forEach(function (ln, li) {
          if (li > 0) html += "<br>";
          var toks = ln.split(/(\s+)/);
          toks.forEach(function (tok) {
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

    function render() {
      linesEl.innerHTML = "";
      R.expected = [];
      R.wordEls = [];
      R.nodes = R.items.map(function (it, i) {
        var d = document.createElement("div");
        d.className = "sp-item " + it.type;
        d.dataset.i = i;
        if (it.type === "line") {
          var mine = isMine(it);
          var v = voiceFor(it);
          if (mine) d.classList.add("mine");
          d.style.setProperty("--who-color", mine ? "var(--sp-gold)" : v.color);
          var r = renderTextHTML(it.text, i, mine);
          R.expected[i] = r.expected;
          d.innerHTML = '<div class="sp-who">' + esc(Parser.titleCase(it.key)) + (mine ? '<span class="sp-you">YOU</span>' : "") + "</div>" +
            '<div class="sp-text">' + r.html + "</div>";
          if (mine) {
            R.wordEls[i] = d.querySelectorAll(".w[data-k]");
            if (R.maskMode === "hint") d.classList.add("mask-hint");
            if (R.maskMode === "hide") d.classList.add("mask-hide");
          }
        } else {
          d.innerHTML = '<div class="sp-text">' + esc(it.text) + "</div>";
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
        if (k < i && n.classList.contains("mine")) {
          n.classList.remove("mask-hint", "mask-hide", "peek");
        }
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
      Speech.cancel();
      clearWaits();
    }

    function step() {
      if (!R || !R.playing) return;
      var t = R.token;
      while (R.idx < R.items.length && R.skip[R.idx]) R.idx++;
      if (R.idx >= R.items.length) { finish(); return; }
      var i = R.idx;
      var it = R.items[i];
      setCurrent(i);

      if (it.type === "line" && isMine(it)) {
        awaitUser(i, t);
        return;
      }

      var spoken = it.type === "line" || R.readDirs;
      var text = it.type === "line" ? Parser.spokenText(it.text) : it.text;
      if (!spoken || !text) {
        R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, it.type === "heading" ? 700 : 350);
        return;
      }

      if (!Speech.supported) {
        var secs = 1.2 + text.split(/\s+/).length * 0.33 / R.rate;
        R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, secs * 1000);
        return;
      }

      var v = voiceFor(it);
      R.nodes[i].classList.add("speaking");
      Speech.speak(text, {
        voice: v.voice,
        pitch: v.pitch,
        rate: R.rate * (it.type === "line" ? 1 : 1.05),
        lyric: R.lyric && it.type === "line",
        volume: it.type === "line" ? 1 : 0.85
      }).then(function () {
        if (t !== R.token) return;
        R.nodes[i].classList.remove("speaking");
        R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, 180);
      });
    }

    function awaitUser(i, t) {
      turn.classList.remove("hidden");
      nextBtn.classList.add("your-turn");
      nextBtn.innerHTML = "Done &#9654;";
      var mode = R.turnMode;

      if (mode === "timed") {
        var words = (R.expected[i] || []).length;
        var ms = (1500 + words * 430) / R.rate;
        turnText.textContent = "Your line! Moving on in a moment…";
        requestAnimationFrame(function () {
          turnFill.style.transition = "width " + ms + "ms linear";
          turnFill.style.width = "100%";
        });
        R.waitTimer = setTimeout(function () { if (t === R.token) advance(); }, ms);
        return;
      }

      if (mode === "listen" && Listener.supported) {
        turn.classList.add("listening");
        turnText.textContent = "Listening… say your line";
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

      turnText.textContent = "Your line! Tap Done when you've said it.";
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
      var mine = {};
      cfg.mine.forEach(function (k) { mine[k] = true; });
      R = {
        items: cfg.items,
        mine: mine,
        cast: buildCast(cfg.characters.map(function (c) { return c.key; }), cfg.genders || {}, cfg.overrides || {}),
        rate: S.rate,
        lyric: !!cfg.lyric,
        readDirs: !!cfg.readDirs,
        maskMode: cfg.maskMode,
        turnMode: cfg.turnMode,
        cueOnly: !!cfg.cueOnly,
        idx: 0,
        token: 0,
        playing: false,
        scores: {}
      };
      R.skip = computeSkips();
      $("sp-stage-title").textContent = cfg.title;
      $("sp-stage-sub").textContent = cfg.sub || "";
      syncRateSelect();
      curtain.classList.add("hidden");
      render();
      stage.hidden = false;
      document.body.classList.add("sp-stage-open");
      requestWake();
      Speech.unlock();
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
          o.textContent = R.rate.toFixed(2).replace(/0$/, "") + "×";
          stageRate.appendChild(o);
          stageRate.value = o.value;
        } else stageRate.value = best.value;
      }
    }

    /* Controls */
    nextBtn.addEventListener("click", function () {
      if (!R) return;
      if (!R.playing) { setPlaying(true); }
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
        Speech.unlock();
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
        n.querySelectorAll(".w").forEach(function (w) { w.classList.remove("heard", "missed"); });
        if (n.classList.contains("mine")) {
          if (R.maskMode === "hint") n.classList.add("mask-hint");
          if (R.maskMode === "hide") n.classList.add("mask-hide");
        }
      });
      Speech.unlock();
      setPlaying(true);
      goTo(0);
    });

    $("sp-exit").addEventListener("click", close);
    $("sp-done").addEventListener("click", close);
    $("sp-again").addEventListener("click", function () { $("sp-restart").click(); });

    stageRate.addEventListener("change", function () {
      if (!R) return;
      R.rate = parseFloat(stageRate.value);
      S.rate = R.rate;
      els.rate.value = S.rate;
      els.rateOut.textContent = S.rate.toFixed(2).replace(/0$/, "") + "×";
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
      Speech.unlock();
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
    toastTimer = setTimeout(function () { t.classList.add("hidden"); }, 3200);
  }

  /* ============================================
     Init
     ============================================ */

  if (!Speech.supported) $("sp-no-speech").classList.remove("hidden");
  fillSamples();
  initSegs();
  renderTurnNote();
  renderChips();
  renderStatus();
  renderVoices();
  renderResults();
  Speech.onVoices(function () { renderVoices(); });
  if (location.hash === "#perform") showTab("perform");
})();

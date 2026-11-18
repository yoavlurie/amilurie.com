/* ============================================
   Scene Partner — Script Parser
   Turns pasted text into a list of items:
     { type: "line", key, chars: [KEYS], text }
     { type: "dir",  text }      stage direction
     { type: "heading", text }   ACT / SCENE
   Understands three common formats:
     ROMEO: But soft...          (colon)
     ROMEO. But soft...          (Gutenberg / Folger)
     ROMEO                       (screenplay / cue on its own line)
     But soft...
   ============================================ */

(function (root) {
  "use strict";

  var JOINERS = /^(of|the|de|la|le|von|van|and|&|du|da|del|di|y|in|st\.?)$/i;
  var NOT_NAMES = /^(ACT|SCENE|INT|EXT|NOTE|NOTES|SETTING|TIME|PLACE|CHARACTERS|CAST|CAST OF CHARACTERS|DRAMATIS PERSONAE|SONG|LYRICS|TITLE|BY|PAGE|FADE IN|FADE OUT|CUT TO|THE END|CURTAIN|BLACKOUT|END|PROLOGUE|EPILOGUE|CONTINUED|MORE|LATER|MEANWHILE|SUPER|TRANSITION|MUSIC|SFX|SOUND|LIGHTS|WHERE|WHEN|HTTP|HTTPS|PS|P\.S|TIP|TIPS|SCENE PARTNER)$/;

  var HEADING_RES = [
    /^#{1,3}\s+\S/,
    /^(ACT|SCENE)\s+([IVXLC]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN)\b.{0,70}$/i,
    /^(PROLOGUE|EPILOGUE|INTERLUDE|INTERMISSION|ENTR'?ACTE)\.?$/i,
    /^(INT|EXT|INT\.?\/EXT|I\/E)\.\s+\S/,
    /^(FADE (IN|OUT)|CUT TO|BLACKOUT|CURTAIN|THE END|END OF (ACT|SCENE|PLAY))\b.{0,30}$/i
  ];

  var DIRECTION_RES = [
    /^\(.*\)$/,
    /^\[.*\]$/,
    /^_[^_].*_$/,
    /^\*[^*].*\*$/,
    /^(Enter|Exit|Exeunt|Re-enter|Re-Enter|Flourish|Alarum|Alarums|Thunder|Music|Sennet|Trumpets)\b/
  ];

  function isHeading(line) {
    for (var i = 0; i < HEADING_RES.length; i++) if (HEADING_RES[i].test(line)) return true;
    return false;
  }

  function isDirection(line) {
    for (var i = 0; i < DIRECTION_RES.length; i++) if (DIRECTION_RES[i].test(line)) return true;
    return false;
  }

  function cleanName(s) {
    return s
      .replace(/\*\*/g, "")
      .replace(/\s*\((V\.?\s?O\.?|O\.?\s?S\.?|O\.?\s?C\.?|CONT'?D|CONT’D|CONTINUING|CONT\.)\)\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.:]+$/, "")
      .trim();
  }

  function isCaps(s) {
    return s === s.toUpperCase() && /[A-Z]/.test(s);
  }

  /* strict = name must be ALL CAPS. Otherwise Title Case is OK too. */
  function validName(n, strict) {
    if (!n || n.length > 36) return false;
    if (!/^[A-Za-z]/.test(n)) return false;
    if (/[!?;,"“”]/.test(n.replace(/\s*(&|,)\s*/g, " "))) return false;
    var words = n.split(" ");
    if (words.length > 5) return false;
    if (NOT_NAMES.test(n.toUpperCase())) return false;
    if (strict) return isCaps(n);
    if (isCaps(n)) return true;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (JOINERS.test(w)) continue;
      if (!/^[A-Z0-9]/.test(w)) return false;
    }
    return true;
  }

  function toKey(n) {
    return cleanName(n).toUpperCase();
  }

  function titleCase(key) {
    return key.toLowerCase().replace(/(^|[\s\-'’&(])([a-z])/g, function (m, p, c) {
      return p + c.toUpperCase();
    }).replace(/\b(Of|The|And|De|La|Le|Von|Van)\b/g, function (m, w, off) {
      return off === 0 ? m : m.toLowerCase();
    });
  }

  /* Returns {name, text} for "NAME: text" / "NAME (aside): text" / "NAME. text" */
  function matchInlineCue(line) {
    var m = line.match(/^([A-Za-z][^:()]{0,40}?)\s*(\(([^)]*)\))?\s*:\s*(.*)$/);
    if (m) {
      var name = cleanName(m[1]);
      if (validName(name, false) && !/^https?$/i.test(name)) {
        var text = m[4] || "";
        if (m[3]) text = "(" + m[3] + ") " + text;
        return { name: name, text: text.trim() };
      }
    }
    m = line.match(/^([A-Z][A-Z0-9 '’&\-]*[A-Z0-9])\.\s+(.+)$/);
    if (m) {
      var n2 = cleanName(m[1]);
      if (n2.length >= 2 && validName(n2, true) && !/^[IVXLC]+$/.test(n2)) {
        return { name: n2, text: m[2].trim() };
      }
    }
    return null;
  }

  /* A cue on its own line, e.g. "ROMEO" or "ROMEO." or "ROMEO (V.O.)" */
  function matchBareCue(line) {
    if (line.length > 40) return null;
    if (/[!?]$/.test(line)) return null;
    var name = cleanName(line.replace(/\s*\([^)]*\)\s*$/, ""));
    if (!name || name.length < 1) return null;
    if (!validName(name, true)) return null;
    if (!/^[A-Z][A-Z0-9 .'’&\-,]*$/.test(name)) return null;
    return name;
  }

  function splitCombo(key) {
    if (!/\s(&|AND)\s|,\s/.test(key)) return [key];
    var parts = key.split(/\s*(?:&|,|\bAND\b)\s*/).filter(Boolean);
    return parts.length > 1 ? parts : [key];
  }


  /* ---------- Group lines and who's onstage ---------- */

  var GROUP_RE = /^(ALL|EVERYONE|EVERYBODY|BOTH|TOGETHER|COMPANY|ENSEMBLE|OTHERS|THE OTHERS|THE REST|ALL OTHERS|EVERYONE ELSE|ALL THE OTHERS)(?:\s+(TWO|THREE|FOUR|FIVE|SIX|OF THEM|OF US))?(?:\s+(?:BUT|EXCEPT|MINUS|WITHOUT|APART FROM)\s+(.+))?$/;

  /* Returns {kind, except} if a cue name means a group, else null */
  function groupInfo(key) {
    var m = String(key).toUpperCase().match(GROUP_RE);
    if (!m) return null;
    var kind = m[1] === "BOTH" ? "both" : /OTHER|REST|ELSE/.test(m[1]) ? "others" : "all";
    return { kind: kind, except: m[3] || "" };
  }

  var TITLE_WORDS = /^(THE|OF|A|AN|AND|MR|MRS|MS|MISS|DR|PROFESSOR|PROF|LADY|LORD|SIR|DAME|KING|QUEEN|PRINCE|PRINCESS|CAPTAIN|FIRST|SECOND|THIRD|FOURTH|FIFTH|OLD|YOUNG|LITTLE|BIG|MAJOR|GENERAL|AUNT|UNCLE|SISTER|BROTHER|MOTHER|FATHER|ST|SAINT|HEAD|HEADMASTER|HEADMISTRESS|DUKE|DUCHESS|MADAME|MONSIEUR|SENOR|SENORA|COUNT|BARON)$/;

  /* Build a lookup from words in directions to characters.
     "BLONDO MALFOY" can be called BLONDO or MALFOY. A word several
     characters share (WITCH in FIRST/SECOND/THIRD WITCH) means all of them. */
  function buildAliases(keys) {
    var tokenTo = {};
    keys.forEach(function (k) {
      var toks = k.split(/[\s\-]+/).filter(function (t) { return t.length >= 2; });
      toks.forEach(function (t) {
        (tokenTo[t] = tokenTo[t] || []).push(k);
      });
    });
    var phrases = [];
    keys.forEach(function (k) { phrases.push({ text: k, keys: [k] }); });
    Object.keys(tokenTo).forEach(function (t) {
      var ks = tokenTo[t];
      if (ks.length === 1 && TITLE_WORDS.test(t)) return;
      if (ks.length === 1 && keys.indexOf(t) >= 0) return;
      phrases.push({ text: t, keys: ks });
      if (!/S$/.test(t)) {
        phrases.push({ text: t + "S", keys: ks });
        phrases.push({ text: t + "ES", keys: ks });
      }
    });
    phrases.sort(function (a, b) { return b.text.length - a.text.length; });
    return phrases;
  }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* Which characters does this text mention? Longest names win. */
  function mentions(text, phrases) {
    var up = " " + String(text).toUpperCase().replace(/[^A-Z0-9'\- ]+/g, " ") + " ";
    var found = [];
    phrases.forEach(function (ph) {
      var re = new RegExp("(^|[^A-Z0-9'])" + escRe(ph.text) + "(?=[^A-Z0-9']|$)");
      if (re.test(up)) {
        up = up.replace(new RegExp("(^|[^A-Z0-9'])" + escRe(ph.text) + "(?=[^A-Z0-9']|$)", "g"), "$1 ");
        ph.keys.forEach(function (k) { if (found.indexOf(k) < 0) found.push(k); });
      }
    });
    return found;
  }

  var EXIT_RE = /\b(exit|exits|exiting|exeunt|leave|leaves|leaving|runs? (off|out|away)|walks? (off|out|away)|storms? (off|out)|goes (off|out)|go (off|out)|disappears?|vanish(es)?|flees?|hurries (off|out)|dashes (off|out)|is dragged (off|out)|are dragged (off|out))\b/i;
  var EXEUNT_RE = /\b(exeunt|(all|everyone|everybody) (exit|leave|go|run off|exits|leaves))\b/i;
  var EXCEPT_RE = /\b(but|except|apart from|all but|save)\b/i;

  /* Walk the script once, keeping track of who is onstage,
     and resolve group lines (ALL, BOTH, EVERYONE ELSE...) to real characters. */
  function stage(items, keys) {
    var phrases = buildAliases(keys);
    var onstage = [];
    var spokenSoFar = [];
    var recent = [];

    function add(k) { if (onstage.indexOf(k) < 0) onstage.push(k); }
    function remove(k) { var i = onstage.indexOf(k); if (i >= 0) onstage.splice(i, 1); }

    items.forEach(function (it) {
      if (it.type === "dir") {
        var clauses = it.text.split(/[.;!?]+\s*|\s+then\s+/i).filter(Boolean);
        clauses.forEach(function (c) {
          var names = mentions(c, phrases);
          if (EXEUNT_RE.test(c)) {
            if (names.length && EXCEPT_RE.test(c)) onstage = names.slice();
            else if (names.length && !/\b(all|everyone|everybody)\b/i.test(c)) names.forEach(remove);
            else onstage = [];
          } else if (EXIT_RE.test(c)) {
            if (names.length) names.forEach(remove);
            else if (recent.length) remove(recent[recent.length - 1]);
          } else {
            names.forEach(add);
          }
        });
        it.onstage = onstage.slice();
        return;
      }
      if (it.type !== "line") return;

      var g = groupInfo(it.key);
      if (!g) {
        it.chars.forEach(function (k) {
          add(k);
          if (spokenSoFar.indexOf(k) < 0) spokenSoFar.push(k);
          var ri = recent.indexOf(k);
          if (ri >= 0) recent.splice(ri, 1);
          recent.push(k);
        });
        return;
      }

      /* Everyone onstage... */
      var base = onstage.length ? onstage.slice() : (spokenSoFar.length ? spokenSoFar.slice() : keys.slice());
      if (g.kind === "both") {
        var two = recent.filter(function (k) { return base.indexOf(k) >= 0; }).slice(-2);
        if (two.length < 2) two = recent.slice(-2);
        if (two.length === 2) base = two;
      }
      if (g.kind === "others" && recent.length) {
        var last = recent[recent.length - 1];
        base = base.filter(function (k) { return k !== last; });
      }

      /* ...except anyone named in "ALL BUT X" or "ALL (except X)" */
      var exceptText = g.except;
      var pm = it.text.match(/^\s*\(\s*(?:all\s+|everyone\s+)?(?:except|but|not|minus|without|apart from|save)\s+([^)]*)\)\s*/i);
      if (pm) exceptText += " " + pm[1];
      if (exceptText.trim()) {
        var out = mentions(exceptText, phrases);
        base = base.filter(function (k) { return out.indexOf(k) < 0; });
      }

      it.group = it.key;
      if (base.length) it.chars = base;
      else it.chars = [it.key];
    });
  }

  function parse(raw) {
    var src = String(raw || "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
    var lines = src.split("\n").map(function (l) {
      return l.replace(/ /g, " ").replace(/\*\*([^*]+)\*\*/g, "$1").trim();
    });

    /* Pass 1: which cue style does this script mostly use? */
    var inline = 0, bare = 0;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (!l || isHeading(l) || isDirection(l)) continue;
      var ic = matchInlineCue(l);
      if (ic && ic.text) { inline++; continue; }
      if ((ic && !ic.text) || matchBareCue(l)) {
        var nx = lines[i + 1];
        if (nx && !isHeading(nx) && !matchInlineCue(nx) && !matchBareCue(nx)) bare++;
      }
    }
    var allowBare = bare > 0 && bare >= inline * 0.25;

    /* Pass 2: build items */
    var items = [];
    var cur = null;
    var pending = null;

    function pushDir(text, type) {
      text = text.replace(/^[\(\[_*]+|[\)\]_*]+$/g, "").trim();
      if (!text) return;
      items.push({ type: type || "dir", text: text });
    }

    function startLine(name, text) {
      var key = toKey(name);
      cur = { type: "line", key: key, chars: splitCombo(key), text: text };
      items.push(cur);
    }

    for (var j = 0; j < lines.length; j++) {
      var line = lines[j];
      if (!line) {
        cur = null;
        continue;
      }
      if (isHeading(line)) {
        if (pending) { pushDir(pending, "dir"); pending = null; }
        cur = null;
        items.push({ type: "heading", text: line.replace(/^#{1,3}\s+/, "") });
        continue;
      }
      if (isDirection(line)) {
        /* Screenplay parentheticals right after a cue stay with the speech */
        if (pending && /^\(.*\)$/.test(line)) {
          startLine(pending, line);
          pending = null;
          continue;
        }
        if (cur && /^\(.*\)$/.test(line) && line.length < 40 && lines[j + 1] && !matchInlineCue(lines[j + 1]) && !matchBareCue(lines[j + 1]) && !isDirection(lines[j + 1])) {
          cur.text += "\n" + line;
          continue;
        }
        cur = null;
        pushDir(line, "dir");
        continue;
      }
      var ic2 = matchInlineCue(line);
      if (ic2) {
        if (pending) { pushDir(pending, "dir"); pending = null; }
        if (ic2.text) startLine(ic2.name, ic2.text);
        else { pending = ic2.name; cur = null; }
        continue;
      }
      if (allowBare) {
        var bc = matchBareCue(line);
        if (bc) {
          if (pending) pushDir(pending, "dir");
          pending = bc;
          cur = null;
          continue;
        }
      }
      if (pending) {
        startLine(pending, line);
        pending = null;
        continue;
      }
      if (cur) {
        cur.text += "\n" + line;
        continue;
      }
      pushDir(line, "dir");
    }
    if (pending) pushDir(pending, "dir");

    /* Who's who: everyone with a line of their own */
    var speakers = {};
    items.forEach(function (it) {
      if (it.type === "line" && it.chars.length === 1 && !groupInfo(it.key)) speakers[it.key] = true;
    });

    /* A combo like "HATTER & MARCH HARE" only counts as a shared line
       if each part also speaks on their own somewhere. */
    items.forEach(function (it) {
      if (it.type === "line" && it.chars.length > 1) {
        var ok = it.chars.every(function (k) { return speakers[k]; });
        if (!ok) it.chars = [it.key];
      }
    });

    stage(items, Object.keys(speakers));

    /* Character list (groups like ALL are not characters) */
    var map = {};
    var order = [];
    items.forEach(function (it) {
      if (it.type !== "line") return;
      it.chars.forEach(function (k) {
        if (groupInfo(k)) return;
        if (!map[k]) {
          map[k] = { key: k, name: titleCase(k), count: 0, words: 0 };
          order.push(k);
        }
        map[k].count++;
        map[k].words += spokenText(it.text).split(/\s+/).filter(Boolean).length;
      });
    });

    var characters = order.map(function (k) { return map[k]; }).sort(function (a, b) {
      return b.count - a.count;
    });

    return {
      items: items,
      characters: characters,
      lineCount: items.filter(function (x) { return x.type === "line"; }).length
    };
  }

  /* Text that should be spoken aloud: no (directions) or [brackets] or markdown */
  function spokenText(text) {
    return String(text || "")
      .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
      .replace(/[_*]+/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .trim();
  }

  var api = { parse: parse, spokenText: spokenText, titleCase: titleCase, groupInfo: groupInfo };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SPParser = api;
})(typeof window !== "undefined" ? window : this);

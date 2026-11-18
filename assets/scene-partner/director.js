/* ============================================
   Scene Partner — The Director
   Reads the script like a director would:
   - who each character is (accent, age, personality)
   - how each line should be said (emotion)
   - how to pronounce tricky words (AHH, NOOOO, EAT SLUGS)
   Works with no AI service at all: it's all clues
   from the script itself.
   ============================================ */

(function (root) {
  "use strict";

  /* ============================================
     Pronunciation
     ============================================ */

  var WORDS = null;
  var wordsLoading = null;

  /* Small built-in list so things work before the big dictionary loads */
  var COMMON = new Set(("a ah oh ooh no yes so go what who why how hey hi um uh hm hmm wow ow ouch oops " +
    "please help stop look book cool good food moon soon too zoo see bee tree free three sleep sheep keep feet " +
    "all ball call fall hall small tall wall will still kill hill well bell tell yell sell shell " +
    "off stuff cliff miss kiss boss less mess yes pass class grass glass add odd egg buzz fizz jazz " +
    "eat slugs ha haha wee yay boo ugh eek shh psst brr grr argh yeah yep nope nah").split(" "));

  var ACRONYMS = new Set(("TV OK USA UK US FBI CIA NASA DNA ID CEO AI DJ MVP VIP BFF LOL OMG ASAP RSVP PE ABC TNT SOS UFO IQ " +
    "NYC LA NY HQ RIP PS MC KO BBQ ATM GPS CD DVD PC IT ICU ER EMT CPR SUV RV BC AD AM PM MD MP3 HP XP NPC FYI DIY " +
    "BTW TBH IDK IMO GG YMCA").split(" "));

  function loadWords(url) {
    if (WORDS || wordsLoading) return wordsLoading;
    if (typeof fetch === "undefined") return null;
    wordsLoading = fetch(url).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
      if (t) WORDS = new Set(t.split("\n"));
    }).catch(function () { /* fall back to COMMON */ });
    return wordsLoading;
  }

  function setWords(list) { WORDS = new Set(list); }

  function isWord(w) {
    return (WORDS && WORDS.has(w)) || COMMON.has(w);
  }

  /* "AHHH" -> "ah", "NOOOO" -> "no", "WHAAAT" -> "what".
     Take away one repeated letter at a time until it's a real word. */
  function unstretch(lower) {
    if (!/(.)\1/.test(lower) || isWord(lower)) return { word: lower, stretched: false };
    var w = lower;
    for (var guard = 0; guard < 40; guard++) {
      var runs = w.match(/(.)\1+/g);
      if (!runs) break;
      var longest = runs.reduce(function (a, b) { return b.length > a.length ? b : a; });
      var at = w.indexOf(longest);
      w = w.slice(0, at) + w.slice(at + 1);
      if (isWord(w) && (w.length > 1 || /^[aio]$/.test(w))) return { word: w, stretched: true };
    }
    /* Never became a real word: squash every run down to one letter */
    var squashed = lower.replace(/(.)\1+/g, "$1");
    return { word: isWord(squashed) && squashed.length > 1 ? squashed : lower.replace(/(.)\1{2,}/g, "$1$1"), stretched: true };
  }

  function matchCase(src, word) {
    if (src.charAt(0) === src.charAt(0).toUpperCase() && /[A-Za-z]/.test(src.charAt(0))) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }

  /* mode "browser": stretched words become the plain word (browser voices can't stretch)
     mode "ai": stretched words stay stretched, but in lowercase so they're never spelled out */
  function fixWord(tok, mode) {
    var m = tok.match(/^([^A-Za-z]*)([A-Za-z][A-Za-z'’.\-]*[A-Za-z.]|[A-Za-z])([^A-Za-z]*)$/);
    if (!m) return tok;
    var pre = m[1], core = m[2], post = m[3];

    /* A.H.H. -> spell it out on purpose */
    if (/^([A-Za-z]\.){2,}[A-Za-z]?\.?$/.test(core)) {
      var letters = core.replace(/\./g, "").split("");
      return pre + letters.map(function (l) { return l.toUpperCase() + "."; }).join(" ") + post;
    }

    var trailingDot = /\.$/.test(core) && !/\..*\./.test(core) ? "." : "";
    if (trailingDot) core = core.slice(0, -1);
    if (/[.'’\-]/.test(core) && !/^[A-Za-z]+$/.test(core.replace(/['’\-]/g, ""))) return tok;

    var isCaps = core.length >= 2 && core === core.toUpperCase();
    if (isCaps && ACRONYMS.has(core)) return tok;
    if (core === "I") return tok;

    var lower = core.toLowerCase();
    var parts = lower.split(/(['’\-])/);
    var changed = false;
    var stretched = false;
    parts = parts.map(function (p) {
      if (!/^[a-z]+$/.test(p)) return p;
      var u = unstretch(p);
      if (u.stretched) { stretched = true; changed = true; }
      return mode === "ai" && u.stretched ? p.replace(/(.)\1{3,}/g, "$1$1$1") : u.word;
    });
    var out = parts.join("");
    if (!changed && !isCaps) return tok;
    out = isCaps ? out.charAt(0).toUpperCase() + out.slice(1) : matchCase(core, out);
    return pre + out + trailingDot + post;
  }

  /* Text to send to the voice, without (stage directions) */
  function speakable(text, mode) {
    var t = String(text || "")
      .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
      .replace(/[_*]+/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .trim();
    return t.split(/(\s+)/).map(function (tok) {
      return /^\s+$/.test(tok) ? tok : fixWord(tok, mode);
    }).join("");
  }

  /* ============================================
     Casting: who is each character?
     ============================================ */

  function rule(re, traits) { return { re: re, t: traits }; }

  var ACCENT_NAMES = {
    french: "French", spanish: "Spanish", italian: "Italian", german: "German", dutch: "Dutch",
    russian: "Russian", irish: "Irish", scottish: "Scottish", british: "British", australian: "Australian",
    southern: "Southern US", indian: "Indian", japanese: "Japanese", swedish: "Swedish", american: "American",
    pirate: "pirate"
  };

  /* Clues from the character's NAME */
  var NAME_RULES = [
    rule(/FRENCH|PIERRE|JACQUES|MONSIEUR|MADAME|MADEMOISELLE|BAGUETTE|GASTON|FRANCOIS|FRANÇOIS|LUMIERE|LUMIÈRE|ANTOINE|CROISSANT|PARIS|NAPOLEON|COCO|BRIE|CAMEMBERT|ESCARGOT/, { accent: "french" }),
    rule(/SPANISH|SE[NÑ]OR|SE[NÑ]ORA|SE[NÑ]ORITA|JOS[EÉ]\b|CARLOS|MIGUEL|DIEGO|JUAN\b|PABLO|ZORRO|MATADOR|TORERO|AMIGO|EL\s|LA\s+[A-Z]+A\b|ABUELA|ABUELO|TACO|BURRITO|SALSA|MEXIC|ESPA/, { accent: "spanish" }),
    rule(/ITALIAN|LUIGI|MARIO|GIUSEPPE|NONNA|PAPA\s|ANTONIO|ENZO|PASTA|PIZZA|ROMANO|GELATO|SPAGHETTI|VENICE/, { accent: "italian" }),
    rule(/GERMAN|FRITZ|KLAUS|HERR\b|FRAU\b|GRETEL|HANSEL|WOLFGANG|SCHNITZEL|BRATWURST/, { accent: "german" }),
    rule(/DUTCH|PIETER|\bJAN\b|\bVAN\s|DAAN|SANNE|TULIP|WINDMILL|AMSTERDAM|HOLLAND/, { accent: "dutch" }),
    rule(/RUSSIAN|IVAN|BORIS|NATASHA|OLGA|DMITRI|COMRADE|VLADIMIR|SVETLANA|BORSCHT/, { accent: "russian" }),
    rule(/IRISH|PADDY|SEAMUS|LEPRECHAUN|SHAMROCK|O'[A-Z]|MURPHY|PATRICK/, { accent: "irish" }),
    rule(/SCOT|ANGUS|\bMAC[A-Z]|\bMC[A-Z]|HAGGIS|NESSIE|BAGPIPE|LAIRD/, { accent: "scottish" }),
    rule(/BRIT|ENGLISH|\bLORD\b|\bLADY\b|\bSIR\b|DUKE|DUCHESS|BUTLER|JEEVES|EARL|BARON|COUNTESS|MAJESTY|HEADMASTER|HEADMISTRESS|DUMBLE|NANNY|GOVERNESS|BOBBY|CONSTABLE|INSPECTOR|SHERLOCK|WATSON/, { accent: "british" }),
    rule(/COWBOY|COWGIRL|SHERIFF|TEX\b|BUBBA|RANCHER|HOWDY|DEPUTY|OUTLAW|BANDIT/, { accent: "southern" }),
    rule(/AUSSIE|KANGAROO|CROC\b|DINGO|KOALA|MATE\b/, { accent: "australian" }),
    rule(/SWED|VIKING|BJORN|BJÖRN|SVEN|OLAF|INGRID/, { accent: "swedish" }),
    rule(/PIRATE|CAPTAIN HOOK|BLACKBEARD|SMEE|BUCCANEER|FIRST MATE|PARROT/, { accent: "pirate", styles: ["pirate"] }),
    rule(/ROBOT|ROBO|\bBOT\b|BOT\b|ANDROID|CYBORG|COMPUTER|\bAI\b|A\.I\.|ALEXA|\bSIRI\b|\bHAL\b|DROID|MACHINE|R2|C-?3PO|UNIT\s?\d|TERMINATOR/, { styles: ["robotic"] }),
    rule(/SNAKE|SERPENT|BASILISK|SLYTH|HISS|NAGINI|\bKAA\b|VIPER|COBRA|PYTHON|ASP\b|ADDER|RATTLER/, { styles: ["hissing", "villain"] }),
    rule(/MOUSE|MICE|FAIRY|PIXIE|SPRITE|CHIPMUNK|SQUIRREL|BIRDIE|CHICK\b|TINKER|\bELF\b|ELVES|GNOME|TINY|SQUEAK|HAMSTER|BUNNY|DORMOUSE|BUG\b|ANT\b|MOSQUITO|MUNCHKIN|SMURF|IMP\b/, { styles: ["squeaky"] }),
    rule(/GIANT|TROLL|OGRE|DRAGON|BEAR\b|GOLIATH|THUNDER|ZEUS|\bGOD\b|TITAN|HULK|BOULDER|BRUTE|MONSTER|BEAST|GOLEM|CYCLOPS|KRAKEN|GORILLA|ELEPHANT|HAGRID|ODIN|POSEIDON|HADES/, { styles: ["booming"] }),
    rule(/GHOST|SPIRIT|PHANTOM|SPECTRE|SPECTER|BANSHEE|POLTERGEIST|WRAITH|APPARITION|MARLEY/, { styles: ["ghostly"] }),
    rule(/WITCH|HAG\b|CRONE|SORCERESS/, { styles: ["raspy"] }),
    rule(/GRANDMA|GRANDPA|GRANNY|GRAMPS|\bOLD\b|ELDER|\bGRAN\b|NANA|ANCIENT|WIZARD|SAGE|MERLIN|GANDALF|PROFESSOR|HEADMASTER|HEADMISTRESS/, { age: "old" }),
    rule(/\bKID\b|\bBOY\b|\bGIRL\b|CHILD|BABY|JUNIOR|\bJR\b|\bLIL\b|STUDENT|PUPIL|TODDLER|SON\b|DAUGHTER|LITTLE/, { age: "child" }),
    rule(/TEEN|TEENAGER/, { age: "teen" }),
    rule(/BRAT|BULLY|MEANIE|SPOILED|SPOILT/, { styles: ["bratty"] }),
    rule(/VILLAIN|EVIL|DARK LORD|\bDARK\b|SINISTER|DOOM|DEMON|DEVIL|VOLDEMORT|SAURON|JOKER|WICKED|MALFOY|MAL[A-Z]+/, { styles: ["villain"] }),
    rule(/KING|QUEEN|PRINCE|PRINCESS|EMPEROR|EMPRESS|PHARAOH|MAJESTY|ROYAL/, { styles: ["royal"] }),
    rule(/NARRATOR|STORYTELLER|ANNOUNCER|HOST\b/, { styles: ["narrator"] }),
    rule(/CLOWN|JESTER|FOOL\b|GOOF|SILLY|JOKER/, { styles: ["silly"] }),
    rule(/GRUMP|GRUMPY|SCROOGE|CRANK|GROUCH/, { styles: ["grumpy"] }),
    rule(/SLEEPY|DORMOUSE|SNOOZ|YAWN|SLOTH/, { styles: ["sleepy"] })
  ];

  /* Clues from the WORDS a character uses */
  var LANG_MARKERS = {
    french: /\b(bonjour|bonsoir|je|suis|très|tres|merci|oui|monsieur|madame|mademoiselle|baguette|bagguatte|sacr[eé] bleu|oh la la|ooh la la|voil[aà]|c'est|au revoir|mon ami|mon dieu|n'est-ce pas|croissant|s'il vous pla[iî]t|zut|magnifique|fromage|bien|et|le|la|les|du|des|avec|pour|tr[eè]s)\b/gi,
    spanish: /\b(hola|se[nñ]or|se[nñ]ora|gracias|s[ií]|amigo|amiga|por favor|adi[oó]s|muy|buenos|buenas|d[ií]as|ay caramba|ol[eé]|qu[eé]|mi|vamos|andale|[aá]ndale|arriba|fiesta|bueno|claro|mam[aá]|pap[aá]|ni[nñ]o|perd[oó]n)\b/gi,
    italian: /\b(ciao|mamma mia|bella|bello|grazie|prego|signore|signora|bravo|buongiorno|buonasera|capisce|andiamo|allora|ecco|mangia|delizioso)\b/gi,
    german: /\b(ja|nein|danke|wunderbar|guten|herr|frau|mein gott|achtung|sehr|gut|kinder|schnell|bitte|jawohl|ach|auf wiedersehen)\b/gi,
    dutch: /\b(hallo|dank je|dankjewel|goedemorgen|goedendag|lekker|gezellig|doei|tot ziens|ja hoor|nee|alsjeblieft|hoi)\b/gi,
    russian: /\b(da|nyet|comrade|tovarish|privet|spasibo|babushka|borscht|dasvidaniya)\b/gi,
    pirate: /\b(arr+|arrgh+|matey|ahoy|aye|ye|yer|me hearties|shiver me timbers|landlubber|scallywag|avast|booty|plank|yo ho)\b/gi,
    southern: /\b(howdy|y'all|yall|partner|pardner|reckon|yeehaw|ain't|fixin'|darlin')\b/gi,
    irish: /\b(top o' the|lad|lass|wee|begorrah|me lucky|grand|craic|feck)\b/gi,
    scottish: /\b(och|aye|wee|lassie|laddie|ken|cannae|dinnae|bonnie)\b/gi,
    australian: /\b(g'day|mate|crikey|strewth|arvo|barbie|reckon|fair dinkum)\b/gi,
    british: /\b(jolly|splendid|rather|indeed|old chap|old bean|cheerio|blimey|bloody|brilliant|lovely|quite|whilst|shan't|tea|crumpets|bollocks|innit|mate|tosh|poppycock|ghastly)\b/gi
  };

  var STYLE_MARKERS = {
    robotic: /\b(beep|boop|bzzt|computing|affirmative|negative|does not compute|error|processing|human|humans|initiating|scanning|calculating|unit|protocol|systems?|online|offline|activate|shutting down)\b/gi,
    hissing: /\b(s{3,}\w*|\w*s{3,}|hiss+)\b/gi,
    bratty: /\b(ha!|haha|nyah|neener|loser|losers|stupid|idiot|dummy|dummies|dork|nerd|nerds|baby|babies|whimp\w*|blibber\w*|wimp|ugly|smelly|stinky|pathetic|my father will hear|daddy|mommy will|you've just been|so there|whatever|duh|eat slugs|serves you right|told you so|cry baby|crybaby|scaredy|you can't|i'm better|i'm the best)\b/gi,
    villain: /\b(destroy|rule the world|mwahaha|muahaha|bwahaha|revenge|doom|crush|minions|fool!|fools|pathetic|power|darkness|you will pay|surrender|kneel|obey)\b/gi,
    posh: /\b(indeed|splendid|darling|rather|one must|one does|quite|frightfully|dreadfully|terribly|charming|delightful|my dear|shall|pray|alas)\b/gi,
    nervous: /\b(um+|uh+|er+|i-i|w-w|maybe|sorry|s-sorry|oh dear|oh no|is it safe|i'm scared|help)\b/gi,
    cheerful: /\b(yay|hooray|woohoo|awesome|amazing|fun|love|great|wonderful|best day|happy|hi!|hello!)\b/gi,
    grumpy: /\b(bah|humbug|hmph|harrumph|get off my|kids these days|go away|leave me alone|ugh|whatever)\b/gi,
    pirate: /\b(arr+|matey|ahoy|me hearties|shiver me timbers|landlubber|scallywag)\b/gi
  };

  /* Words that describe a personality, used for "I'm X" and "that X Blondo" */
  var ADJECTIVES = {
    boyish: { age: "kid", gender: "m", styles: ["cheerful"] }, girlish: { age: "kid", gender: "f", styles: ["cheerful"] },
    fun: { styles: ["cheerful"] }, happy: { styles: ["cheerful"] }, cheerful: { styles: ["cheerful"] }, bubbly: { styles: ["cheerful"] },
    jolly: { styles: ["cheerful"] }, silly: { styles: ["silly"] }, goofy: { styles: ["silly"] }, funny: { styles: ["silly"] },
    grumpy: { styles: ["grumpy"] }, cranky: { styles: ["grumpy"] }, mean: { styles: ["bratty"] }, bratty: { styles: ["bratty"] },
    spoiled: { styles: ["bratty"] }, annoying: { styles: ["bratty"] }, rude: { styles: ["bratty"] }, snooty: { styles: ["posh", "bratty"] },
    evil: { styles: ["villain"] }, wicked: { styles: ["villain"] }, sinister: { styles: ["villain"] }, villainous: { styles: ["villain"] },
    brave: { styles: ["heroic"] }, heroic: { styles: ["heroic"] }, mighty: { styles: ["booming"] }, strong: { styles: ["booming"] },
    shy: { styles: ["nervous"] }, nervous: { styles: ["nervous"] }, scared: { styles: ["nervous"] }, timid: { styles: ["nervous"] },
    smart: { styles: ["clever"] }, clever: { styles: ["clever"] }, wise: { age: "old", styles: ["wise"] },
    fancy: { styles: ["posh"] }, posh: { styles: ["posh"] }, rich: { styles: ["posh"] }, royal: { styles: ["royal"] },
    sleepy: { styles: ["sleepy"] }, tired: { styles: ["sleepy"] }, lazy: { styles: ["sleepy"] },
    old: { age: "old" }, ancient: { age: "old" }, young: { age: "kid" }, little: { age: "kid", styles: ["squeaky"] },
    tiny: { styles: ["squeaky"] }, small: { styles: ["squeaky"] }, squeaky: { styles: ["squeaky"] },
    big: { styles: ["booming"] }, huge: { styles: ["booming"] }, giant: { styles: ["booming"] }, loud: { styles: ["booming"] },
    sweet: { styles: ["sweet"] }, kind: { styles: ["sweet"] }, nice: { styles: ["sweet"] }, gentle: { styles: ["sweet"] },
    cool: { styles: ["cool"] }, dramatic: { styles: ["dramatic"] }, spooky: { styles: ["ghostly"] }, creepy: { styles: ["villain"] },
    robotic: { styles: ["robotic"] }, french: { accent: "french" }, spanish: { accent: "spanish" }, mexican: { accent: "spanish" },
    italian: { accent: "italian" }, german: { accent: "german" }, dutch: { accent: "dutch" }, russian: { accent: "russian" },
    british: { accent: "british" }, english: { accent: "british" }, irish: { accent: "irish" }, scottish: { accent: "scottish" },
    australian: { accent: "australian" }, american: { accent: "american" }, southern: { accent: "southern" },
    brat: { styles: ["bratty"] }, bully: { styles: ["bratty"] }, baby: { age: "kid" }, kid: { age: "kid" }, boy: { age: "kid", gender: "m" },
    girl: { age: "kid", gender: "f" }, robot: { styles: ["robotic"] }, snake: { styles: ["hissing"] }, pirate: { accent: "pirate" },
    ghost: { styles: ["ghostly"] }, witch: { styles: ["raspy"] }, wizard: { age: "old" }, monster: { styles: ["booming"] }
  };

  var SCHOOL_RE = /\b(headmaster|headmistress|professor|students?|class|homework|teacher|points from|detention|recess|principal|classroom|school|hogwarts|house cup)\b/i;
  var ADULT_TITLE = /\b(PROFESSOR|HEADMASTER|HEADMISTRESS|MR|MRS|MS|DR|TEACHER|PRINCIPAL|MOTHER|FATHER|MOM|DAD|MUM|AUNT|UNCLE|GRAND\w*|KING|QUEEN|LORD|LADY|SIR|CAPTAIN|COACH|NURSE|DOCTOR|OFFICER|MAYOR|JUDGE|CHEF|BUTLER|MADAME|MONSIEUR|SENOR|SENORA)\b/;

  function guessGender(key) {
    var k = " " + key.toUpperCase().replace(/[^A-Z ]/g, " ") + " ";
    if (/ (LADY|QUEEN|MRS|MISS|MS|MOTHER|MOM|MUM|MA|GIRL|WOMAN|SISTER|AUNT|PRINCESS|DUCHESS|NURSE|WIFE|DAUGHTER|GRANDMA|GRANNY|MAID|MADAM|MADAME|DAME|NUN|EMPRESS|WITCH|GODDESS|HEADMISTRESS|SENORA|MADEMOISELLE|FRAU|COWGIRL|SORCERESS|HAG|CRONE|NANA) /.test(k)) return "f";
    if (/ (LORD|KING|MR|SIR|FATHER|DAD|PA|BOY|MAN|BROTHER|UNCLE|PRINCE|DUKE|HUSBAND|SON|GRANDPA|BUTLER|MONK|FRIAR|EMPEROR|GOD|CAPTAIN|KNIGHT|HEADMASTER|SENOR|MONSIEUR|HERR|COWBOY|WIZARD) /.test(k)) return "m";
    if (/ (MARY|JULIET|ALICE|ANNA|ANNE|ANN|EMMA|SARAH|KATE|KATHERINE|ELIZABETH|LIZ|BETH|JANE|LUCY|SOPHIE|SOPHIA|OLIVIA|EMILY|GRACE|ROSE|LILY|HANNAH|LAURA|NORA|WENDY|DOROTHY|BELLE|ELSA|ANNIE|MAYA|MIA|ZOE|CHLOE|ELLA|IDA|LANA|PORTIA|ROSALIND|VIOLA|HERMIA|HELENA|TITANIA|OPHELIA|DESDEMONA|CORDELIA|BEATRICE|HERO|MIRANDA|GWENDOLEN|CECILY|ELIZA|JO|MEG|AMY|SUSAN|MARIA|LISA|JESSICA|EMILIA|PAULINA|HERMIONE|GINNY|LUNA|ARIEL|JASMINE|MOANA|MULAN|TIANA|ANYA|ELPHABA|GLINDA|NALA|DANIELLE|RACHEL|REBECCA|MOLLY|HOLLY|ABIGAIL|ABBY|AVA|ISABELLA|NATALIE|SAMANTHA|VICTORIA|ROSALIE|RUTH|ESTHER|MIRIAM|NAOMI|LEAH|SPROUTTY|SPROUT|MINERVA|MCGONAGALL|NATASHA|OLGA|GRETEL|SANNE|INGRID|SVETLANA|COCO|NONNA|ABUELA) /.test(k)) return "f";
    if (/ (ROMEO|HAMLET|MACBETH|OTHELLO|IAGO|LEAR|PUCK|OBERON|BOTTOM|QUINCE|BENVOLIO|MERCUTIO|TYBALT|HORATIO|BRUTUS|CAESAR|ANTONY|CASSIUS|PROSPERO|CALIBAN|BENEDICK|JACK|ALGERNON|SCROOGE|JOHN|JAMES|TOM|SAM|MAX|BEN|DAVID|MICHAEL|PETER|PAUL|GEORGE|HENRY|WILLIAM|HARRY|RON|NEVILLE|DRACO|PERCY|LUKE|LEO|NOAH|JONAH|ETHAN|JACOB|LIAM|MASON|LUCAS|OLIVER|ELI|AMI|STEPHEN|MATT|MATTHEW|MARK|JOSH|JOSHUA|DANNY|DANIEL|CHARLIE|FRED|BOB|JIM|JOE|NICK|TONY|SIMBA|ALADDIN|SHREK|FIYERO|HAMILTON|BURR|SEYMOUR|JEAN|MARIUS|JAVERT|WAYNE|BLONDO|MALFOY|POTTER|PIERRE|JACQUES|GASTON|FRANCOIS|CARLOS|MIGUEL|DIEGO|JUAN|PABLO|LUIGI|MARIO|GIUSEPPE|FRITZ|KLAUS|HANS|IVAN|BORIS|DMITRI|SEAMUS|PADDY|ANGUS|SVEN|BJORN|OLAF|HAGRID|DUMBLEDORE|SNAPE|MARLEY|FINCH|FLETCHLY) /.test(k)) return "m";
    return "";
  }

  function mergeTraits(p, t, weight) {
    if (t.accent) p.accentVotes[t.accent] = (p.accentVotes[t.accent] || 0) + (weight || 1);
    if (t.age) p.ageVotes[t.age] = (p.ageVotes[t.age] || 0) + (weight || 1);
    if (t.gender && !p.genderFixed) p.genderVotes[t.gender] = (p.genderVotes[t.gender] || 0) + (weight || 1);
    (t.styles || []).forEach(function (s) { p.styleVotes[s] = (p.styleVotes[s] || 0) + (weight || 1); });
  }

  function top(votes, min) {
    var best = null, bv = min || 0;
    Object.keys(votes).forEach(function (k) { if (votes[k] > bv) { bv = votes[k]; best = k; } });
    return best;
  }

  function nameTokens(key) {
    return key.split(/[\s\-]+/).filter(function (t) { return t.length >= 3 && !/^(THE|AND|FIRST|SECOND|THIRD|PROFESSOR|MR|MRS|LADY|LORD|SIR|KING|QUEEN|OLD|YOUNG)$/.test(t); });
  }

  function countMatches(text, re) {
    re.lastIndex = 0;
    var m = text.match(re);
    return m ? m.length : 0;
  }

  /* Look at every clue in the script and decide who each character is */
  function cast(parsed, opts) {
    opts = opts || {};
    var genders = opts.genders || {};
    var overrides = opts.overrides || {};
    var items = parsed.items;
    var allText = items.map(function (it) { return it.text; }).join("\n");
    var school = SCHOOL_RE.test(allText);
    var personas = {};

    parsed.characters.forEach(function (c) {
      personas[c.key] = {
        key: c.key, accentVotes: {}, ageVotes: {}, genderVotes: {}, styleVotes: {},
        genderFixed: !!genders[c.key], lines: []
      };
    });

    /* 1. Their name */
    parsed.characters.forEach(function (c) {
      var p = personas[c.key];
      NAME_RULES.forEach(function (r) { if (r.re.test(c.key)) mergeTraits(p, r.t, 3); });
      if (school && !ADULT_TITLE.test(c.key) && !p.ageVotes.old) p.ageVotes.kid = (p.ageVotes.kid || 0) + 1.5;
    });

    /* 2. The words they use, and what they say about themselves */
    items.forEach(function (it) {
      if (it.type !== "line" || it.group || it.chars.length !== 1) return;
      var p = personas[it.chars[0]];
      if (!p) return;
      p.lines.push(it.text);
    });

    Object.keys(personas).forEach(function (k) {
      var p = personas[k];
      var text = p.lines.join(" \n ");
      var lower = text.toLowerCase();
      var words = Math.max(1, lower.split(/\s+/).length);

      Object.keys(LANG_MARKERS).forEach(function (accent) {
        var n = countMatches(lower, LANG_MARKERS[accent]);
        var needed = accent === "french" || accent === "german" || accent === "british" ? 2 : 1;
        if (n >= needed) mergeTraits(p, { accent: accent }, Math.min(6, n * 1.2));
      });
      Object.keys(STYLE_MARKERS).forEach(function (style) {
        var n = countMatches(lower, STYLE_MARKERS[style]);
        if (n) mergeTraits(p, { styles: [style] }, Math.min(5, n));
      });

      /* Loud: lots of exclamation marks or SHOUTED WORDS */
      var bangs = (text.match(/!/g) || []).length;
      var caps = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
      if (p.lines.length >= 3 && (bangs + caps) / words > 0.12) mergeTraits(p, { styles: ["energetic"] }, 2);

      /* "I'm J Finch Fletchly, and I'm boyish and fun!" */
      var selfRe = /\b(?:i'm|i am|im|call me|they call me)\b([^.!?\n]{0,60})/gi;
      var m;
      while ((m = selfRe.exec(lower))) {
        m[1].split(/[^a-z]+/).forEach(function (w) { if (ADJECTIVES[w]) mergeTraits(p, ADJECTIVES[w], 3); });
      }

      /* Snake people stretch their s's */
      if ((text.match(/s{3,}/gi) || []).length >= 2) mergeTraits(p, { styles: ["hissing"] }, 4);
    });

    /* 3. What OTHER characters say about them, and stage directions */
    var keys = Object.keys(personas);
    items.forEach(function (it) {
      var lower = String(it.text).toLowerCase();
      keys.forEach(function (k) {
        var toks = nameTokens(k).map(function (t) { return t.toLowerCase(); });
        if (!toks.length) return;
        if (it.type === "line" && it.chars.indexOf(k) >= 0) return;
        toks.forEach(function (t) {
          var re = new RegExp("(?:\\b([a-z]+)\\s+(?:little\\s+|old\\s+)?" + t + "\\b|\\b" + t + "\\b[^.!?\\n]{0,20}?\\b(?:is|was|you|the|so|such)\\s+(?:a\\s+|an\\s+|so\\s+|such\\s+a\\s+)?([a-z]+))", "g");
          var mm;
          while ((mm = re.exec(lower))) {
            [mm[1], mm[2]].forEach(function (w) {
              if (w && ADJECTIVES[w]) mergeTraits(personas[k], ADJECTIVES[w], it.type === "dir" ? 3 : 2);
            });
          }
        });
      });
    });

    /* Decide */
    var out = {};
    keys.forEach(function (k) {
      var p = personas[k];
      var gender = genders[k] || top(p.genderVotes) || guessGender(k) || "";
      var accent = top(p.accentVotes, 1.5) || "";
      var age = top(p.ageVotes, 1) || "adult";
      if (age === "child") age = "kid";
      var styles = Object.keys(p.styleVotes).filter(function (s) { return p.styleVotes[s] >= 2; })
        .sort(function (a, b) { return p.styleVotes[b] - p.styleVotes[a]; }).slice(0, 3);
      var ov = overrides[k] || {};
      if (ov.accent) accent = ov.accent === "none" ? "" : ov.accent;
      if (ov.style) styles = ov.style === "none" ? [] : [ov.style].concat(styles.filter(function (s) { return s !== ov.style; })).slice(0, 2);
      if (ov.age) age = ov.age;
      if (accent === "pirate" && styles.indexOf("pirate") < 0) styles.unshift("pirate");
      out[k] = { key: k, gender: gender, accent: accent, age: age, styles: styles };
      out[k].label = describe(out[k]);
    });
    return out;
  }

  var STYLE_LABELS = {
    bratty: "bratty", villain: "villain", squeaky: "squeaky", booming: "booming", hissing: "hissing", robotic: "robot",
    ghostly: "ghostly", raspy: "raspy", posh: "posh", pirate: "pirate", cheerful: "cheerful", silly: "silly", grumpy: "grumpy",
    nervous: "nervous", sleepy: "sleepy", wise: "wise", royal: "royal", energetic: "energetic", sweet: "sweet", heroic: "heroic",
    clever: "clever", cool: "cool", dramatic: "dramatic", narrator: "narrator"
  };

  function describe(p) {
    var bits = [];
    if (p.age === "kid") bits.push(p.gender === "f" ? "girl" : p.gender === "m" ? "boy" : "kid");
    else if (p.age === "teen") bits.push("teen");
    else if (p.age === "old") bits.push("older");
    if (p.accent && p.accent !== "pirate") bits.push(ACCENT_NAMES[p.accent] || p.accent);
    p.styles.forEach(function (s) { bits.push(STYLE_LABELS[s] || s); });
    return bits.join(" · ");
  }

  /* ============================================
     Emotion: how should this line be said?
     ============================================ */

  /* Words in (parentheses) -> emotion */
  var CUE_EMOTIONS = [
    [/deadpan|flat|monotone|dry(ly)?\b|expressionless|emotionless|blank(ly)?|matter.of.fact/, "deadpan"],
    [/sob|crying|cries|weep|tearful|in tears|sniffl|wail|bawl/, "crying"],
    [/sad|sorrow|glum|gloom|mournful|heartbroken|miserable|upset|quietly|softly sad/, "sad"],
    [/whisper|under (his|her|their) breath|hushed|quietly|softly|aside/, "whispers"],
    [/scream|shriek|wail/, "screams"],
    [/shout|yell|bellow|roar|holler|at the top of/, "shouts"],
    [/angr|furious|fuming|rage|mad\b|irritat|annoyed|through gritted teeth|snaps|snapping|cross(ly)?\b|stern/, "angry"],
    [/terrif|scared|afraid|frighten|fear|panic|trembl|shaking|horrified/, "scared"],
    [/nervous|anxious|worried|hesitant|stammer|stutter|shy|timid|uneasy/, "nervous"],
    [/excit|thrilled|eager|delight|ecstatic|overjoyed|bouncing/, "excited"],
    [/happ|cheer|joyful|joyous|glee|bright(ly)?|smil|beaming|warmly/, "happy"],
    [/laugh|giggl|chuckl|snicker|cackl|hysterical/, "laughs"],
    [/sarcas|mocking|snide|sneer|scoff|dismissive|condescend|smug/, "sarcastic"],
    [/sly|mischiev|sneaky|smirk|devious|cunning|evil|menac|sinister|wicked|gloat/, "mischievous"],
    [/surpris|shock|amaz|astonish|gasp|stunned|startled|taken aback/, "surprised"],
    [/bored|sleepy|yawn|tired|drowsy|lazily|half.asleep|in (its|his|her) sleep/, "sleepy"],
    [/proud|grand|pompous|dramatic|regal|majestic|boastful|triumphant/, "dramatic"],
    [/tender|loving|gentle|gently|fond|sweet(ly)?|caring/, "tender"],
    [/confus|puzzl|baffl|bewilder|curious(ly)?|wonder/, "curious"],
    [/disgust|gross|revolted|grossed out/, "disgusted"],
    [/sing|sung|singing|to the tune/, "sings"],
    [/grumpy|grumbl|mutter|grouch|sulk|pout|whin/, "grumpy"]
  ];

  /* Words in the LINE itself -> emotion (used only when there's no cue) */
  var CONTENT_EMOTIONS = [
    [/^\W*(a+h+|aa+h*|eek+|yikes|help+|noo+)\W*$/i, "screams"],
    [/\b(he's|she's|they're|it's|is|are) (dead|gone|dying)\b|\bdied\b|\bfuneral\b|\bi miss (you|him|her)\b|\bnever see (you|him|her|them) again\b|\bgoodbye forever\b|\balas\b|\bmy heart\b.*\bbreak|\bsob\b|\*sniff|\bboo hoo\b/i, "sad"],
    [/\b(mwa+ha+|muaha+|bwaha+)\w*|\byou've just been\b|\bgotcha\b|\bnyah\b|\bserves you right\b|\bha! you\b|\bmy plan\b/i, "mischievous"],
    [/\b(ha ?){2,}|\bhaha+\b|\bhehe+\b|\blol\b/i, "laughs"],
    [/\bhow dare\b|\bshut up\b|\bget out\b|\byou'll pay\b|\bi hate\b|\benough!|\bfifty points from\b|\bpoints from\b|\bdetention\b|\bstop it!|\bthat's it!/i, "angry"],
    [/\bhelp!|\brun!|\bmonster\b|\bwhat was that\b|\bdon't hurt\b|\bi'm scared\b|\bit's coming\b|\bsave us\b|\bwe're doomed\b/i, "scared"],
    [/\bshh+\b|\bpsst\b|\bquiet!|\bkeep (your )?voice down\b|\bdon't tell\b|\bsecret\b/i, "whispers"],
    [/\byay\b|\bhooray\b|\bhurrah\b|\bwoo+ ?hoo+\b|\bwe won\b|\bwe did it\b|\bawesome\b|\bamazing\b|\bbest day\b|\bi love (it|this)\b|\byes!+/i, "excited"],
    [/\bwhat\?!|\bwhat!\?|\bno way\b|\bwhoa\b|\bwow\b|\breally\?!|\bimpossible\b|\bwhat\?\?/i, "surprised"],
    [/\b(ew+|eww+|yuck|gross|disgusting|blech|bleh)\b/i, "disgusted"],
    [/\bi'm sorry\b|\bplease don't\b|\bi didn't mean\b/i, "nervous"],
    [/\bi love you\b|\bmy dear\b|\bdarling\b|\bsweetheart\b/i, "tender"],
    [/\bsigh\b|\bugh\b|\bwhatever\b|\bboring\b/i, "bored"]
  ];

  var EVENT_MOOD = [
    [/\b(dies|died|falls dead|is dead|collapses|perishes|is killed)\b/i, "sad"],
    [/\b(cries|sobs|weeps|bursts into tears)\b/i, "sad"],
    [/\b(scream|screams|monster|ghost appears|darkness falls|lightning|storm)\b/i, "scared"],
    [/\b(celebrate|cheer|cheers|dance|party|hug)\b/i, "happy"]
  ];

  function firstCue(text) {
    var m = String(text).match(/^\s*\(([^)]*)\)/) || String(text).match(/\(([^)]*)\)/);
    return m ? m[1].trim() : "";
  }

  function emotionFromCue(cue) {
    var c = cue.toLowerCase();
    if (/^(except|but|all but|not)\b/.test(c)) return "";
    for (var i = 0; i < CUE_EMOTIONS.length; i++) if (CUE_EMOTIONS[i][0].test(c)) return CUE_EMOTIONS[i][1];
    return "";
  }

  function isShouted(text) {
    var spoken = String(text).replace(/\([^)]*\)/g, "");
    var letters = spoken.replace(/[^A-Za-z]/g, "");
    var capsWords = (spoken.match(/\b[A-Z]{2,}[A-Z!']*\b/g) || []).filter(function (w) { return !ACRONYMS.has(w.replace(/[!']/g, "")) && w !== "I"; });
    if (letters.length >= 2 && letters === letters.toUpperCase() && /!/.test(spoken)) return true;
    return (letters.length > 3 && letters === letters.toUpperCase()) || capsWords.length >= 2;
  }

  /* One emotion per line, from (cues) first, then what happened, then the words */
  function emotions(parsed, personas) {
    var items = parsed.items;
    var out = [];
    var mood = "";
    var moodLeft = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.type === "dir") {
        for (var e = 0; e < EVENT_MOOD.length; e++) {
          if (EVENT_MOOD[e][0].test(it.text)) { mood = EVENT_MOOD[e][1]; moodLeft = 3; break; }
        }
        /* "(WAYNE bursts into tears)" -> WAYNE's next line is crying */
        out[i] = { emotion: "", cue: "" };
        continue;
      }
      if (it.type !== "line") { out[i] = { emotion: "", cue: "" }; continue; }

      var cue = firstCue(it.text);
      var emo = cue ? emotionFromCue(cue) : "";
      var source = emo ? "cue" : "";

      /* A direction right before the line that names this speaker */
      if (!emo && i > 0 && items[i - 1].type === "dir") {
        var prev = items[i - 1].text.toLowerCase();
        var toks = nameTokens(it.chars[0] || it.key).map(function (t) { return t.toLowerCase(); });
        if (toks.some(function (t) { return prev.indexOf(t) >= 0; })) {
          var e2 = emotionFromCue(prev);
          if (e2) { emo = e2; source = "direction"; }
        }
      }

      var spoken = String(it.text).replace(/\([^)]*\)/g, " ");
      if (!emo) {
        for (var c = 0; c < CONTENT_EMOTIONS.length; c++) {
          if (CONTENT_EMOTIONS[c][0].test(spoken)) { emo = CONTENT_EMOTIONS[c][1]; source = "words"; break; }
        }
      }
      if (!emo && moodLeft > 0) { emo = mood; source = "mood"; }
      if (moodLeft > 0) moodLeft--;

      var shout = isShouted(it.text);
      if (!emo && shout) { emo = "shouts"; source = "caps"; }
      if (!emo && (spoken.match(/!/g) || []).length >= 2) { emo = "excited"; source = "punctuation"; }

      /* Personality colours lines with no clear emotion */
      if (!emo && !it.group) {
        var p = personas[it.chars[0]];
        if (p && p.styles.indexOf("bratty") >= 0 && /!/.test(spoken)) { emo = "mischievous"; source = "persona"; }
        else if (p && p.styles.indexOf("villain") >= 0) { emo = "menacing"; source = "persona"; }
        else if (p && p.styles.indexOf("sleepy") >= 0) { emo = "sleepy"; source = "persona"; }
        else if (p && p.styles.indexOf("grumpy") >= 0) { emo = "grumpy"; source = "persona"; }
        else if (p && p.styles.indexOf("nervous") >= 0 && /\?|\.\.\./.test(spoken)) { emo = "nervous"; source = "persona"; }
      }

      out[i] = { emotion: emo, cue: cue && !/^(except|but|all but)\b/i.test(cue) ? cue : "", shout: shout, source: source };
    }
    return out;
  }

  /* ============================================
     Turning persona + emotion into a performance
     ============================================ */

  /* For the browser's built-in voices: pitch, speed, volume */
  var EMO_BROWSER = {
    sad: { rate: 0.82, pitch: 0.88 }, crying: { rate: 0.78, pitch: 1.05 }, deadpan: { rate: 0.88, pitch: 0.92 },
    angry: { rate: 1.08, pitch: 0.92 }, shouts: { rate: 1.05, pitch: 1.08 }, whispers: { rate: 0.9, pitch: 1, volume: 0.45 },
    excited: { rate: 1.15, pitch: 1.18 }, happy: { rate: 1.06, pitch: 1.1 }, scared: { rate: 1.2, pitch: 1.2 },
    nervous: { rate: 1.12, pitch: 1.12 }, laughs: { rate: 1.1, pitch: 1.15 }, sarcastic: { rate: 0.92, pitch: 0.95 },
    mischievous: { rate: 1.04, pitch: 1.12 }, menacing: { rate: 0.86, pitch: 0.8 }, surprised: { rate: 1.1, pitch: 1.25 },
    sleepy: { rate: 0.75, pitch: 0.9 }, dramatic: { rate: 0.9, pitch: 1.0 }, tender: { rate: 0.9, pitch: 1.02 },
    curious: { rate: 1.0, pitch: 1.1 }, disgusted: { rate: 0.95, pitch: 0.95 }, grumpy: { rate: 0.9, pitch: 0.85 },
    bored: { rate: 0.8, pitch: 0.9 }, sings: { rate: 0.95, pitch: 1.1 }, screams: { rate: 1.1, pitch: 1.35 }
  };

  var STYLE_BROWSER = {
    squeaky: { pitch: 1.9, rate: 1.15 }, booming: { pitch: 0.45, rate: 0.85 }, robotic: { pitch: 0.7, rate: 0.9 },
    hissing: { pitch: 0.85, rate: 0.85 }, ghostly: { pitch: 0.6, rate: 0.78 }, raspy: { pitch: 0.75, rate: 0.95 },
    bratty: { pitch: 1.3, rate: 1.1 }, villain: { pitch: 0.72, rate: 0.9 }, posh: { pitch: 1.05, rate: 0.92 },
    pirate: { pitch: 0.75, rate: 0.95 }, cheerful: { pitch: 1.15, rate: 1.08 }, silly: { pitch: 1.35, rate: 1.12 },
    grumpy: { pitch: 0.8, rate: 0.9 }, nervous: { pitch: 1.15, rate: 1.15 }, sleepy: { pitch: 0.85, rate: 0.75 },
    wise: { pitch: 0.85, rate: 0.88 }, royal: { pitch: 0.9, rate: 0.9 }, energetic: { pitch: 1.1, rate: 1.1 },
    sweet: { pitch: 1.12, rate: 0.98 }, heroic: { pitch: 0.92, rate: 1.0 }, dramatic: { pitch: 0.95, rate: 0.9 }
  };

  var AGE_BROWSER = { kid: { pitch: 1.45, rate: 1.08 }, teen: { pitch: 1.15, rate: 1.05 }, old: { pitch: 0.8, rate: 0.86 }, adult: {} };

  /* Which system voice language gives this accent */
  var ACCENT_LANGS = {
    french: ["fr-FR", "fr-CA", "fr"], spanish: ["es-ES", "es-MX", "es-US", "es"], italian: ["it-IT", "it"], german: ["de-DE", "de"],
    dutch: ["nl-NL", "nl-BE", "nl"], russian: ["ru-RU", "ru"], irish: ["en-IE"], scottish: ["en-GB-u-sd-gbsct", "en-SC", "en-GB"],
    british: ["en-GB"], australian: ["en-AU"], southern: ["en-US"], indian: ["en-IN"], japanese: ["ja-JP"],
    swedish: ["sv-SE"], american: ["en-US"], pirate: ["en-GB", "en-IE"]
  };

  function browserParams(persona, emo) {
    var pitch = 1, rate = 1, volume = 1;
    function apply(m) { if (!m) return; if (m.pitch) pitch *= m.pitch; if (m.rate) rate *= m.rate; if (m.volume != null) volume *= m.volume; }
    if (persona) {
      apply(AGE_BROWSER[persona.age]);
      (persona.styles || []).slice(0, 2).forEach(function (s, i) {
        var m = STYLE_BROWSER[s];
        if (!m) return;
        apply(i === 0 ? m : { pitch: 1 + (m.pitch - 1) * 0.5, rate: 1 + (m.rate - 1) * 0.5 });
      });
    }
    apply(EMO_BROWSER[emo && emo.emotion]);
    if (emo && emo.shout && emo.emotion !== "shouts") { rate *= 1.04; pitch *= 1.05; }
    return { pitch: Math.max(0.1, Math.min(2, pitch)), rate: Math.max(0.5, Math.min(1.8, rate)), volume: volume };
  }

  /* For AI voices: bracketed audio tags that the voice model reads as direction */
  var EMO_TAG = {
    sad: "sad", crying: "crying", deadpan: "deadpan", angry: "angry", shouts: "shouts", whispers: "whispers",
    excited: "excited", happy: "happily", scared: "scared", nervous: "nervously", laughs: "laughs", sarcastic: "sarcastic",
    mischievous: "mischievously", menacing: "menacingly", surprised: "surprised", sleepy: "sleepy", dramatic: "dramatically",
    tender: "tenderly", curious: "curious", disgusted: "disgusted", grumpy: "grumpy", bored: "bored", sings: "sings", screams: "screams"
  };

  var STYLE_TAG = {
    bratty: "bratty, whiny", villain: "villainous", squeaky: "squeaky high voice", booming: "deep booming voice",
    hissing: "hissing like a snake", robotic: "robotic monotone", ghostly: "ghostly, echoing", raspy: "raspy cackling voice",
    posh: "posh", pirate: "pirate voice", cheerful: "cheerful", silly: "silly", grumpy: "grumpy", nervous: "nervous",
    sleepy: "sleepy", wise: "wise", royal: "regal", energetic: "energetic", sweet: "sweet", heroic: "heroic",
    dramatic: "dramatic", cool: "cool", clever: "clever"
  };

  function aiTags(persona, emo) {
    var tags = [];
    if (persona) {
      if (persona.accent && persona.accent !== "american" && persona.accent !== "pirate") {
        tags.push("strong " + (ACCENT_NAMES[persona.accent] || persona.accent) + " accent");
      }
      (persona.styles || []).filter(function (s) { return s !== "energetic"; }).slice(0, 2).forEach(function (s) { if (STYLE_TAG[s]) tags.push(STYLE_TAG[s]); });
    }
    if (emo && emo.cue && !emotionFromCue(emo.cue) && emo.cue.length < 40) tags.push(emo.cue.toLowerCase());
    else if (emo && emo.emotion && EMO_TAG[emo.emotion]) tags.push(EMO_TAG[emo.emotion]);
    if (emo && emo.shout && emo.emotion !== "shouts" && emo.emotion !== "screams") tags.push("shouts");
    return tags.map(function (t) { return "[" + t + "]"; }).join(" ");
  }

  /* Snake characters: stretch the s sounds */
  function hissify(text) {
    return text.replace(/s+(?=[a-z\s.,!?]|$)/gi, function (m) { return m.length >= 3 ? m : m + "ss"; });
  }

  var api = {
    loadWords: loadWords,
    setWords: setWords,
    speakable: speakable,
    unstretch: unstretch,
    cast: cast,
    emotions: emotions,
    guessGender: guessGender,
    browserParams: browserParams,
    aiTags: aiTags,
    hissify: hissify,
    accentLangs: ACCENT_LANGS,
    accentNames: ACCENT_NAMES,
    styleLabels: STYLE_LABELS,
    emotionFromCue: emotionFromCue
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SPDirector = api;
})(typeof window !== "undefined" ? window : this);

/* ============================================
   Mythic Duel — Sprite Data
   Pixel art characters as 2D color arrays.
   Each frame is [row][col] of hex colors or 0 (transparent).
   Characters are 16w x 24h pixels, rendered at 4x scale.
   ============================================ */

var DuelSprites = (function () {
  "use strict";

  var SCALE = 4;
  var CHAR_W = 16;
  var CHAR_H = 24;
  var cache = {};

  /* ---- Color palettes ---- */
  var P = {
    /* Skin */
    skin: "#f0c8a0", skinD: "#d4a878",
    /* Percy */
    pHair: "#1a1a2e", pShirt: "#2a6496", pShirtD: "#1e4a70", pPants: "#3a3a5c", pTrident: "#7ac4e8",
    /* Jason */
    jHair: "#c8a832", jShirt: "#7832a0", jShirtD: "#5a2478", jPants: "#3a3a50", jSword: "#c0c0d0",
    /* Magnus */
    mHair: "#c8783c", mShirt: "#2a8a4e", mShirtD: "#1e6438", mPants: "#4a4a3c", mSword: "#e8d44a",
    /* Enemies */
    eFire: "#e85020", eFireD: "#c83010", eYellow: "#e8c832", eBrown: "#8a6432", eBrownD: "#6a4a20",
    eGreen: "#3a8a3a", eGreenD: "#286428", ePurple: "#6432a0", ePurpleD: "#4a2478",
    eDark: "#2a2a3c", eDarkD: "#1a1a28", eRed: "#c83030", eRedD: "#a02020",
    eBlue: "#2050a0", eBlueD: "#183878", eGold: "#d4a017", eGoldD: "#a07810",
    eGray: "#6a6a7a", eGrayD: "#4a4a5a",
    /* Common */
    black: "#1a1a2e", white: "#e8e6f0", outline: "#282840"
  };

  /* ---- Helper: build simple character frames ---- */
  /* Rather than 768 values per frame, we use a compact row-string format
     where each char maps to a palette color. Much easier to author. */

  function parseFrame(rows, palette) {
    var frame = [];
    for (var r = 0; r < rows.length; r++) {
      var row = [];
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r][c];
        row.push(palette[ch] || 0);
      }
      frame.push(row);
    }
    return frame;
  }

  /* ---- PERCY JACKSON ---- */
  var percyPal = {
    ".": 0, "o": P.outline, "s": P.skin, "d": P.skinD,
    "h": P.pHair, "t": P.pShirt, "T": P.pShirtD, "p": P.pPants,
    "w": P.pTrident, "b": P.black, "W": P.white
  };

  var percyIdle = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....otttttto....",
    "...ottttttto....",
    "...otTtttTto....",
    "..ootttttttoo...",
    "..sdtttttttds...",
    "..ss.ttttt.ss...",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "....op...po.....",
    "....op...po.....",
    "...oop...poo....",
    "...ooo...ooo....",
    "................"
  ], percyPal);

  var percyWalk = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....otttttto....",
    "...ottttttto....",
    "...otTtttTto....",
    "..ootttttttoo...",
    "..sdtttttttds...",
    "..ss.ttttt.ss...",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....op..ppo.....",
    "....op....po....",
    "...oop....po....",
    "...ooo...oop....",
    "..........ooo...",
    "................",
    "................"
  ], percyPal);

  var percyAttack = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....ottttttoswww",
    "...otttttttoswww",
    "...otTtttTto.www",
    "..ootttttttoo...",
    "...ttttttttt....",
    ".....ttttt......",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "...oop...po.....",
    "...ooo..oop.....",
    ".........ooo....",
    "................",
    "................"
  ], percyPal);

  var percyBlock = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "oo.otttttto.....",
    "oootttttttto....",
    "oo.otTtttTto....",
    "..ootttttttoo...",
    "...ttttttttt....",
    ".....ttttt......",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "...oop...po.....",
    "...ooo...ooo....",
    "................",
    "................",
    "................"
  ], percyPal);

  var percyHurt = parseFrame([
    ".....ohhhhho....",
    "....ohhhhhhho...",
    "....ohhhhhhhho..",
    "....osssssssso..",
    "....osWsssWsso..",
    "....ossdssdss...",
    ".....osssssso...",
    "......odddo.....",
    ".....otttttto...",
    "....ottttttto...",
    "....otTtttTto...",
    "...ootttttttoo..",
    "..sdtttttttds...",
    "..ss.ttttt.ss...",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "...oop...poo....",
    "...ooo...ooo....",
    "................",
    "................",
    "................",
    "................"
  ], percyPal);

  /* ---- JASON GRACE ---- */
  var jasonPal = {
    ".": 0, "o": P.outline, "s": P.skin, "d": P.skinD,
    "h": P.jHair, "t": P.jShirt, "T": P.jShirtD, "p": P.jPants,
    "w": P.jSword, "b": P.black, "W": P.white
  };

  var jasonIdle = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....otttttto....",
    "...ottttttto....",
    "...otTtttTto....",
    "..ootttttttoo...",
    "..sdtttttttds...",
    "..ss.ttttt.ss...",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "....op...po.....",
    "....op...po.....",
    "...oop...poo....",
    "...ooo...ooo....",
    "................"
  ], jasonPal);

  var jasonAttack = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....ottttttoswww",
    "...otttttttoswww",
    "...otTtttTto..ww",
    "..ootttttttoo...",
    "...ttttttttt....",
    ".....ttttt......",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "...oop...po.....",
    "...ooo..oop.....",
    ".........ooo....",
    "................",
    "................"
  ], jasonPal);

  /* ---- MAGNUS CHASE ---- */
  var magnusPal = {
    ".": 0, "o": P.outline, "s": P.skin, "d": P.skinD,
    "h": P.mHair, "t": P.mShirt, "T": P.mShirtD, "p": P.mPants,
    "w": P.mSword, "b": P.black, "W": P.white
  };

  var magnusIdle = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....otttttto....",
    "...ottttttto....",
    "...otTtttTto....",
    "..ootttttttoo...",
    "..sdtttttttds...",
    "..ss.ttttt.ss...",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "....op...po.....",
    "....op...po.....",
    "...oop...poo....",
    "...ooo...ooo....",
    "................"
  ], magnusPal);

  var magnusAttack = parseFrame([
    "....ohhhhho.....",
    "...ohhhhhhho....",
    "...ohhhhhhhho...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossdssdss....",
    "....osssssso....",
    ".....odddo......",
    "....ottttttoswww",
    "...otttttttoswww",
    "...otTtttTto..ww",
    "..ootttttttoo...",
    "...ttttttttt....",
    ".....ttttt......",
    ".....ttttt......",
    ".....ppppp......",
    "....opppppo.....",
    "....opppppo.....",
    "....op...po.....",
    "...oop...po.....",
    "...ooo..oop.....",
    ".........ooo....",
    "................",
    "................"
  ], magnusPal);

  /* ---- ENEMY SPRITES ---- */
  /* Enemies use simpler designs - distinctive silhouettes */

  var enemyPal = {
    ".": 0, "o": P.outline,
    "r": P.eFire, "R": P.eFireD, "y": P.eYellow, "Y": P.eGoldD,
    "b": P.eBrown, "B": P.eBrownD, "g": P.eGreen, "G": P.eGreenD,
    "p": P.ePurple, "P": P.ePurpleD, "k": P.eDark, "K": P.eDarkD,
    "d": P.eRed, "D": P.eRedD, "u": P.eBlue, "U": P.eBlueD,
    "w": P.eGold, "W": P.white, "x": P.eGray, "X": P.eGrayD,
    "s": P.skin, "S": P.skinD
  };

  /* 1. Chimera - lion body, goat head on back, snake tail */
  var chimeraIdle = parseFrame([
    "................",
    "..oyyo...........",
    ".oyyyyy..........",
    ".oyyyyy..........",
    "oyWyrWyo.........",
    "oyyyyyyyo.obb...",
    ".oyyyoo.oobBBo..",
    "..ooo..obbBBBbo.",
    ".......obBBBBbo.",
    "......obBBBBBbo.",
    "......obBBBBBbo.",
    ".....oobBBBBBoo.",
    "....orrBBBBBBrr.",
    "....ob.bBBBb.bo.",
    "....ob.bBBBb.bo.",
    "....ob..bBb..bo.",
    "....oo..obo..oo.",
    "........ogrgo...",
    ".........oggo...",
    "..........ogo...",
    "...........oo...",
    "................",
    "................",
    "................"
  ], enemyPal);

  /* 2. Cerberus - three-headed dog */
  var cerberusIdle = parseFrame([
    ".okkko.okkko....",
    "okkkkkokkkkkoo..",
    "okWkkokokWkkko..",
    "okkkkkkkkkkko...",
    ".okkkkkkkkko....",
    "..okkkkkkko.....",
    "..okkkkkkkko....",
    "..okkkkkkkkko...",
    ".okkkkkkkkkko...",
    ".okkkkkkkkkkko..",
    ".okkkkkkkkkkko..",
    "..okkkkkkkkko...",
    "..ok.okkko.ko...",
    "..ok.okkko.ko...",
    "..ok..oko..ko...",
    "..oo..ooo..oo...",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"
  ], enemyPal);

  /* 3. Loki - humanoid trickster */
  var lokiIdle = parseFrame([
    "....ogggggo.....",
    "...oggggggggo...",
    "...oggggggggo...",
    "...osssssssso...",
    "...osWsssWsso...",
    "...ossssssss....",
    "....osssssso....",
    ".....ossso......",
    "....ogggggo.....",
    "...oggggggo.....",
    "...oGggggGo.....",
    "..oogggggggoo...",
    "..ssgggggggss...",
    "..ss.ggggg.ss...",
    ".....ggggg......",
    ".....kkkkk......",
    "....okkkkko.....",
    "....okkkkko.....",
    "....ok...ko.....",
    "....ok...ko.....",
    "....ok...ko.....",
    "...ook...koo....",
    "...ooo...ooo....",
    "................"
  ], enemyPal);

  /* 4. Medusa - snake hair, green-tinged */
  var medusaIdle = parseFrame([
    "..ggoggoggoggo..",
    "..goggoggoggog..",
    "..ogggggggggggo.",
    "...oggggggggo...",
    "...osSssssSso...",
    "...ossssssss....",
    "....osssssso....",
    ".....ossso......",
    "....oGGGGGGo....",
    "...oGGGGGGGo....",
    "...oGGgggGGo....",
    "..ooGGGGGGGoo...",
    "..ssGGGGGGGss...",
    "..ss.GGGGG.ss...",
    ".....GGGGG......",
    ".....ggggg......",
    "....ogggggo.....",
    "....ogggggo.....",
    "....og...go.....",
    "....og...go.....",
    "...oog...goo....",
    "...ooo...ooo....",
    "................",
    "................"
  ], enemyPal);

  /* 5. Sobek - crocodile god, bulky */
  var sobekIdle = parseFrame([
    "....ogggggo.....",
    "...oGGGGGGGo....",
    "..oGGGGGGGGGo...",
    "..oGWGGGWGGGo...",
    "..oGGGGGGGGGo...",
    "..oGGGyyGGGGo...",
    "...oGGGGGGGo....",
    "....oGGGGGo.....",
    "...ouuuuuuuo....",
    "..ouuuuuuuuo....",
    "..ouUuuuuUuo....",
    ".oouuuuuuuuoo...",
    ".ssuuuuuuuuss...",
    ".ss.uuuuuu.ss...",
    ".....uuuuu......",
    ".....ggggg......",
    "....ogggggo.....",
    "....ogggggo.....",
    "....og...go.....",
    "....og...go.....",
    "...oog...goo....",
    "...ooo...ooo....",
    "................",
    "................"
  ], enemyPal);

  /* 6. Set - chaos god with strange animal head */
  var setIdle = parseFrame([
    "....oddddo......",
    "...oddddddo.....",
    "..oddddddddoo...",
    "..odddddddddo...",
    "..odWdddWdddo...",
    "..odddddddddo...",
    "...oddddddddo...",
    "....odddddo.....",
    "...okkkkkkko....",
    "..okkkkkkkkko...",
    "..okKkkkkKkko...",
    ".ookkkkkkkkkooo.",
    ".sskkkkkkkkkss..",
    ".ss.kkkkkkk.ss..",
    ".....kkkkk......",
    ".....ddddd......",
    "....odddddo.....",
    "....odddddo.....",
    "....od...do.....",
    "....od...do.....",
    "...ood...doo....",
    "...ooo...ooo....",
    "................",
    "................"
  ], enemyPal);

  /* 7. Nyx - dark ethereal figure */
  var nyxIdle = parseFrame([
    "....oppppo......",
    "...opppppppo....",
    "...oppppppppo...",
    "...oWpppppWpo...",
    "...opppppppp....",
    "....oppppppo....",
    ".....opppo......",
    "....okkkkko.....",
    "...okkkkkkkko...",
    "..okkkkkkkkko...",
    "..okKkkkkkKko...",
    ".ookkkkkkkkkoo..",
    "..kkkkkkkkkk....",
    "....kkkkkkk.....",
    "....kkkkkkk.....",
    "....ppppppp.....",
    "...oppppppo.....",
    "...oppppppo.....",
    "...op...ppo.....",
    "...op....po.....",
    "..oop....poo....",
    "..ooo....ooo....",
    "................",
    "................"
  ], enemyPal);

  /* 8. Apophis - giant serpent */
  var apophisIdle = parseFrame([
    "................",
    "....odddddo.....",
    "...odddddddoo...",
    "..odddddddddo...",
    "..odWddddWddo...",
    "..odddddddddo...",
    "..odddyydddddo..",
    "...odddddddddo..",
    "....odddddddo...",
    ".....odddddo....",
    "......odddo.....",
    ".......oddo.....",
    "........oddo....",
    ".........oddo...",
    "..........oddo..",
    "...........oddo.",
    "............oddo",
    ".............odd",
    "..............od",
    "...............o",
    "................",
    "................",
    "................",
    "................"
  ], enemyPal);

  /* 9. Kronos - armored titan with hourglass */
  var kronosIdle = parseFrame([
    "...oxxxxxxo.....",
    "..oxxxxxxxxxxo..",
    "..oxxxxxxxxxxo..",
    "..osssssssssso..",
    "..osWssssWssso..",
    "..ossssssssss...",
    "...osssssssso...",
    "....osssso......",
    "..owwxxxxxxwo...",
    ".owwxxxxxxxxwo..",
    ".owXxxxxxxxXwo..",
    "oowxxxxxxxxxxoo.",
    "osxxxxxxxxxx.so.",
    "os..xxxxxxx..so.",
    "....xxxxxxx.....",
    "....xxxxxxx.....",
    "...oxxxxxxo.....",
    "...oxxxxxxo.....",
    "...ox...xxo.....",
    "...ox...xxo.....",
    "..oox...xxoo....",
    "..ooo...oooo....",
    "................",
    "................"
  ], enemyPal);

  /* 10. Typhon - massive monster, wider */
  var typhonIdle = parseFrame([
    "..oddddddddddo.",
    ".odddddddddddo.",
    ".oddddddddddddo",
    ".odWddddddWdddo",
    ".odddddddddddo.",
    ".oddddrrddddddo",
    "..odddddddddo..",
    "...oddddddo....",
    "..odddddddddo..",
    ".odddddddddddo.",
    ".odDdddddddDdo.",
    "ooddddddddddoo.",
    "odddddddddddddo",
    "od..ddddddd..do",
    "....ddddddd....",
    "....ddddddd....",
    "...odddddddo...",
    "...odddddddo...",
    "...od....ddo...",
    "...od....ddo...",
    "..ood....ddoo..",
    "..ooo....oooo..",
    "................",
    "................"
  ], enemyPal);

  /* ---- Sprite caching ---- */
  function cacheFrame(frame, scale, flipX) {
    var h = frame.length;
    var w = frame[0].length;
    var off = document.createElement("canvas");
    off.width = w * scale;
    off.height = h * scale;
    var oc = off.getContext("2d");
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        var color = frame[r][c];
        if (!color) continue;
        oc.fillStyle = color;
        var px = flipX ? (w - 1 - c) : c;
        oc.fillRect(px * scale, r * scale, scale, scale);
      }
    }
    return off;
  }

  function getCached(name, frame, scale, flipX) {
    var key = name + (flipX ? "_flip" : "");
    if (!cache[key]) {
      cache[key] = cacheFrame(frame, scale, flipX);
    }
    return cache[key];
  }

  /* ---- Hero definitions ---- */
  var heroes = {
    percy: {
      name: "Percy Jackson",
      desc: "Son of Poseidon. Water powers.",
      specialName: "Water Wave",
      color: P.pShirt,
      frames: {
        idle: percyIdle, walk: percyWalk, attack: percyAttack,
        block: percyBlock, hurt: percyHurt
      },
      stats: { hp: 100, atk: 12, def: 6, speed: 160 },
      specialCharges: 3
    },
    jason: {
      name: "Jason Grace",
      desc: "Son of Jupiter. Lightning strikes.",
      specialName: "Lightning Bolt",
      color: P.jShirt,
      frames: {
        idle: jasonIdle, walk: percyWalk, attack: jasonAttack,
        block: percyBlock, hurt: percyHurt
      },
      stats: { hp: 90, atk: 14, def: 5, speed: 170 },
      specialCharges: 3
    },
    magnus: {
      name: "Magnus Chase",
      desc: "Son of Frey. Healing power.",
      specialName: "Heal Burst",
      color: P.mShirt,
      frames: {
        idle: magnusIdle, walk: percyWalk, attack: magnusAttack,
        block: percyBlock, hurt: percyHurt
      },
      stats: { hp: 110, atk: 10, def: 7, speed: 150 },
      specialCharges: 4
    }
  };

  /* ---- Enemy sprite map ---- */
  var enemySprites = {
    chimera:  { idle: chimeraIdle, attack: chimeraIdle, hurt: chimeraIdle },
    cerberus: { idle: cerberusIdle, attack: cerberusIdle, hurt: cerberusIdle },
    loki:     { idle: lokiIdle, attack: lokiIdle, hurt: lokiIdle },
    medusa:   { idle: medusaIdle, attack: medusaIdle, hurt: medusaIdle },
    sobek:    { idle: sobekIdle, attack: sobekIdle, hurt: sobekIdle },
    set:      { idle: setIdle, attack: setIdle, hurt: setIdle },
    nyx:      { idle: nyxIdle, attack: nyxIdle, hurt: nyxIdle },
    apophis:  { idle: apophisIdle, attack: apophisIdle, hurt: apophisIdle },
    kronos:   { idle: kronosIdle, attack: kronosIdle, hurt: kronosIdle },
    typhon:   { idle: typhonIdle, attack: typhonIdle, hurt: typhonIdle }
  };

  return {
    SCALE: SCALE,
    CHAR_W: CHAR_W,
    CHAR_H: CHAR_H,
    heroes: heroes,
    enemySprites: enemySprites,
    cacheFrame: cacheFrame,
    getCached: getCached
  };
})();

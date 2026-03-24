/* ============================================
   Mythic Duel — Hero Sprite Definitions
   15 heroes using template-based sprite system
   ============================================ */

var DuelHeroSprites = (function () {
  "use strict";

  var C = DuelPalettes.C;
  var hft = DuelPalettes.heroFromTemplate;
  var cache = {};

  /* Standard palette mapping: .=transparent, o=outline, s=skin, d=skinDark, h=hair, t=shirt, T=shirtDark, p=pants, w=weapon, W=white(eyes) */
  function pal(hair, shirt, shirtD, pants, weapon) {
    return {
      ".": 0, "o": C.outline, "s": C.skin, "d": C.skinD, "W": C.white,
      "h": hair, "t": shirt, "T": shirtD, "p": pants, "w": weapon
    };
  }

  /* Dark-skinned heroes */
  function palDark(hair, shirt, shirtD, pants, weapon) {
    return {
      ".": 0, "o": C.outline, "s": C.skinDark, "d": C.skinDarkD, "W": C.white,
      "h": hair, "t": shirt, "T": shirtD, "p": pants, "w": weapon
    };
  }

  var sprites = {
    percy:    hft(pal(C.black, C.blue, C.blueD, "#3a3a5c", C.cyan)),
    annabeth: hft(pal(C.gold, C.grayD, "#3a3a4a", "#3a3a50", C.silver)),
    jason:    hft(pal(C.gold, C.purple, C.purpleD, "#3a3a50", C.silver)),
    piper:    hft(pal(C.brownD, C.pink, C.pinkD, "#3a3a50", C.silver)),
    leo:      hft(pal(C.black, C.orange, C.orangeD, "#4a4a3c", C.gray)),
    frank:    hft(palDark(C.black, C.purple, C.purpleD, "#3a3a50", C.igold)),
    hazel:    hft(palDark(C.copper, C.gold, C.goldD, "#4a4a3c", C.igold)),
    nico:     hft(pal("#1a1a1a", C.dark, C.darkD, "#1a1a28", C.darkD)),
    reyna:    hft(pal(C.black, C.igold, C.igoldD, "#3a3a50", C.igold)),
    will:     hft(pal(C.gold, C.yellow, C.goldD, "#4a4a3c", C.goldD)),
    carter:   hft(palDark(C.black, C.blue, C.blueD, "#3a3a50", C.cyan)),
    sadie:    hft(pal(C.copper, C.purpleL, C.purple, "#3a3a50", C.gold)),
    magnus:   hft(pal(C.copper, C.green, C.greenD, "#4a4a3c", C.yellow)),
    alex:     hft(pal(C.greenL, C.pink, C.pinkD, "#3a3a50", C.silver)),
    meg:      hft(pal(C.black, C.greenL, C.green, "#3a3a50", C.greenD))
  };

  /* Sprite caching */
  function cacheFrame(frame, scale, flipX) {
    var h = frame.length, w = frame[0].length;
    var off = document.createElement("canvas");
    off.width = w * scale; off.height = h * scale;
    var oc = off.getContext("2d");
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (!frame[r][c]) continue;
        oc.fillStyle = frame[r][c];
        var px = flipX ? (w - 1 - c) : c;
        oc.fillRect(px * scale, r * scale, scale, scale);
      }
    }
    return off;
  }

  function getCached(key, frame, scale, flipX) {
    var cacheKey = key + (flipX ? "_flip" : "");
    if (!cache[cacheKey]) cache[cacheKey] = cacheFrame(frame, scale, flipX);
    return cache[cacheKey];
  }

  return { sprites: sprites, getCached: getCached, cacheFrame: cacheFrame };
})();

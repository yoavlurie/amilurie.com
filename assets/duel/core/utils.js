/* ============================================
   Mythic Duel — Core Utilities
   Shared constants and helpers
   ============================================ */

var DuelUtils = (function () {
  "use strict";

  var SCALE = 4;
  var CHAR_W = 16;
  var CHAR_H = 24;
  var CW = 720;
  var CH = 400;
  var GRAVITY = 900;
  var JUMP_VEL = -380;
  var ATTACK_DURATION = 0.35;
  var ATTACK_COOLDOWN = 0.3;
  var BLOCK_REDUCTION = 0.15;
  var DUCK_HITBOX_MULT = 0.6;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lighten(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
    c.fill();
    c.stroke();
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  return {
    SCALE: SCALE, CHAR_W: CHAR_W, CHAR_H: CHAR_H,
    CW: CW, CH: CH, GRAVITY: GRAVITY, JUMP_VEL: JUMP_VEL,
    ATTACK_DURATION: ATTACK_DURATION, ATTACK_COOLDOWN: ATTACK_COOLDOWN,
    BLOCK_REDUCTION: BLOCK_REDUCTION, DUCK_HITBOX_MULT: DUCK_HITBOX_MULT,
    lerp: lerp, lighten: lighten, roundRect: roundRect, rectsOverlap: rectsOverlap
  };
})();

/* ============================================
   Mythic Duel — Camera Module
   Scrolling for wide arenas + screen shake
   ============================================ */

var DuelCamera = (function () {
  "use strict";

  var cx = 0, cy = 0;
  var shake = { x: 0, y: 0, timer: 0, intensity: 0 };

  function update(target, arenaWidth, dt) {
    var CW = DuelUtils.CW;
    var targetCX = target.x - CW / 2 + target.w * 2;
    cx += (targetCX - cx) * 0.08;
    cx = GameUtils.clamp(cx, 0, Math.max(0, arenaWidth - CW));
    cy = 0;

    if (shake.timer > 0) {
      shake.timer -= dt;
      shake.x = (Math.random() - 0.5) * shake.intensity * 2;
      shake.y = (Math.random() - 0.5) * shake.intensity * 2;
    } else {
      shake.x = 0; shake.y = 0;
    }
  }

  function triggerShake(intensity) {
    shake.intensity = intensity;
    shake.timer = 0.15;
  }

  function apply(ctx) { ctx.translate(-cx + shake.x, -cy + shake.y); }
  function unapply(ctx) { ctx.translate(cx - shake.x, cy - shake.y); }
  function getOffset() { return { x: cx, y: cy }; }

  function reset() { cx = 0; cy = 0; shake = { x: 0, y: 0, timer: 0, intensity: 0 }; }

  return { update: update, triggerShake: triggerShake, apply: apply, unapply: unapply, getOffset: getOffset, reset: reset };
})();

/* ============================================
   Mythic Duel — Physics Module
   Gravity, platforms, obstacles, arena bounds
   ============================================ */

var DuelPhysics = (function () {
  "use strict";

  var S = DuelUtils.SCALE;

  function update(entity, dt, arena) {
    entity.vy += DuelUtils.GRAVITY * dt;
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    /* Ground */
    var feet = entity.y + entity.h * S;
    if (feet >= arena.groundY) {
      entity.y = arena.groundY - entity.h * S;
      entity.vy = 0;
      entity.onGround = true;
    }

    /* Platforms (only when falling) */
    if (entity.vy > 0 && !entity.isDucking) {
      for (var i = 0; i < arena.platforms.length; i++) {
        var p = arena.platforms[i];
        var prevFeet = feet - entity.vy * dt;
        if (prevFeet <= p.y && feet >= p.y &&
            entity.x + entity.w * S > p.x && entity.x < p.x + p.w) {
          entity.y = p.y - entity.h * S;
          entity.vy = 0;
          entity.onGround = true;
        }
      }
    }

    /* Obstacles */
    for (var j = 0; j < arena.obstacles.length; j++) {
      var obs = arena.obstacles[j];
      var eBox = { x: entity.x, y: entity.y, w: entity.w * S, h: entity.h * S };
      if (DuelUtils.rectsOverlap(eBox, obs)) {
        var overlapLeft = (eBox.x + eBox.w) - obs.x;
        var overlapRight = (obs.x + obs.w) - eBox.x;
        if (overlapLeft < overlapRight) {
          entity.x = obs.x - eBox.w;
        } else {
          entity.x = obs.x + obs.w;
        }
        entity.vx = 0;
      }
    }

    /* Arena bounds */
    entity.x = GameUtils.clamp(entity.x, 0, arena.width - entity.w * S);
  }

  function checkPoolInteractions(entity, dt, arena, heroKey) {
    for (var i = 0; i < arena.pools.length; i++) {
      var pool = arena.pools[i];
      var eBox = { x: entity.x, y: entity.y, w: entity.w * S, h: entity.h * S };
      var poolBox = { x: pool.x, y: pool.y, w: pool.w, h: pool.h + 20 };
      if (DuelUtils.rectsOverlap(eBox, poolBox)) {
        if (heroKey === "percy") {
          entity.hp = Math.min(entity.maxHp, entity.hp + 2 * dt);
        } else {
          entity.vx *= 0.7;
        }
        return true;
      }
    }
    return false;
  }

  function isAtArenaEdge(entity, arena) {
    return entity.x <= 2 || entity.x >= arena.width - entity.w * S - 2;
  }

  return { update: update, checkPoolInteractions: checkPoolInteractions, isAtArenaEdge: isAtArenaEdge };
})();

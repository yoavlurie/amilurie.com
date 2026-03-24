/* ============================================
   Mythic Duel — Status Effects
   Poison, burn, stun, slow, regen, empowered, dodge
   ============================================ */

var DuelStatus = (function () {
  "use strict";

  var EFFECTS = {
    poison:    { tickDamage: 2, tickInterval: 1.0, color: "#4aaa4a", label: "POISON" },
    burn:      { tickDamage: 3, tickInterval: 0.8, color: "#e85020", label: "BURN" },
    stun:      { disableInput: true, color: "#e8e6f0", label: "STUN" },
    slow:      { speedMult: 0.4, color: "#4a4ade", label: "SLOW" },
    regen:     { tickHeal: 3, tickInterval: 1.0, color: "#4bc76e", label: "REGEN" },
    empowered: { atkMult: 1.5, color: "#d4a017", label: "POWER" },
    dodge:     { dodgeChance: 0.4, color: "#c0a0e0", label: "MIST" }
  };

  function apply(entity, effectType, duration) {
    /* Don't stack same effect — refresh duration */
    for (var i = 0; i < entity.statusEffects.length; i++) {
      if (entity.statusEffects[i].type === effectType) {
        entity.statusEffects[i].duration = duration;
        return;
      }
    }
    entity.statusEffects.push({ type: effectType, duration: duration, tickTimer: 0 });
  }

  function remove(entity, effectType) {
    for (var i = entity.statusEffects.length - 1; i >= 0; i--) {
      if (entity.statusEffects[i].type === effectType) {
        entity.statusEffects.splice(i, 1);
      }
    }
  }

  function hasEffect(entity, effectType) {
    for (var i = 0; i < entity.statusEffects.length; i++) {
      if (entity.statusEffects[i].type === effectType) return true;
    }
    return false;
  }

  function isStunned(entity) { return hasEffect(entity, "stun"); }

  function getSpeedMult(entity) {
    var mult = 1.0;
    for (var i = 0; i < entity.statusEffects.length; i++) {
      var cfg = EFFECTS[entity.statusEffects[i].type];
      if (cfg && cfg.speedMult) mult *= cfg.speedMult;
    }
    return mult;
  }

  function getAtkMult(entity) {
    var mult = 1.0;
    for (var i = 0; i < entity.statusEffects.length; i++) {
      var cfg = EFFECTS[entity.statusEffects[i].type];
      if (cfg && cfg.atkMult) mult *= cfg.atkMult;
    }
    return mult;
  }

  function getDodgeChance(entity) {
    var chance = 0;
    for (var i = 0; i < entity.statusEffects.length; i++) {
      var cfg = EFFECTS[entity.statusEffects[i].type];
      if (cfg && cfg.dodgeChance) chance = Math.max(chance, cfg.dodgeChance);
    }
    return chance;
  }

  function update(entity, dt) {
    for (var i = entity.statusEffects.length - 1; i >= 0; i--) {
      var eff = entity.statusEffects[i];
      var cfg = EFFECTS[eff.type];
      eff.duration -= dt;

      if (cfg.tickDamage) {
        eff.tickTimer -= dt;
        if (eff.tickTimer <= 0) {
          entity.hp -= cfg.tickDamage;
          if (entity.hp < 0) entity.hp = 0;
          eff.tickTimer = cfg.tickInterval;
        }
      }

      if (cfg.tickHeal) {
        eff.tickTimer -= dt;
        if (eff.tickTimer <= 0) {
          entity.hp = Math.min(entity.maxHp, entity.hp + cfg.tickHeal);
          eff.tickTimer = cfg.tickInterval;
        }
      }

      if (eff.duration <= 0) {
        entity.statusEffects.splice(i, 1);
      }
    }
  }

  function render(ctx, entity) {
    if (entity.statusEffects.length === 0) return;
    var S = DuelUtils.SCALE;
    var x = entity.x + entity.w * S / 2;
    var y = entity.y - 16;
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    for (var i = 0; i < entity.statusEffects.length; i++) {
      var eff = entity.statusEffects[i];
      var cfg = EFFECTS[eff.type];
      if (!cfg) continue;
      ctx.fillStyle = cfg.color;
      ctx.globalAlpha = 0.8;
      ctx.fillText(cfg.label, x, y - i * 10);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  return {
    apply: apply, remove: remove, hasEffect: hasEffect,
    isStunned: isStunned, getSpeedMult: getSpeedMult,
    getAtkMult: getAtkMult, getDodgeChance: getDodgeChance,
    update: update, render: render, EFFECTS: EFFECTS
  };
})();

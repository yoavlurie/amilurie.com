/* ============================================
   Mythic Duel — Combat Module
   Damage, hitboxes, specials, projectiles,
   particles, status effects, duck support
   ============================================ */

var DuelCombat = (function () {
  "use strict";

  var S = DuelUtils.SCALE;
  var projectiles = [];
  var particles = [];
  var damageNumbers = [];

  /* ---- Hitbox helpers ---- */
  function getEntityBox(e) {
    if (e.isDucking) {
      var dh = Math.floor(e.h * DuelUtils.DUCK_HITBOX_MULT);
      return { x: e.x, y: e.y + (e.h - dh) * S, w: e.w * S, h: dh * S };
    }
    return { x: e.x, y: e.y, w: e.w * S, h: e.h * S };
  }

  function getAttackHitbox(e) {
    var reach = 22 * S;
    var hbH = 14 * S;
    var hbX = e.facingRight ? e.x + e.w * S : e.x - reach;
    var hbY = e.isDucking ? e.y + 12 * S : e.y + 6 * S;
    return { x: hbX, y: hbY, w: reach, h: hbH };
  }

  /* ---- Damage ---- */
  function applyDamage(target, amount, fromRight, isBlocked) {
    if (target.iFrames > 0) return 0;
    var actual = amount;
    if (isBlocked || target.state === "block") {
      actual = Math.max(1, Math.floor(amount * DuelUtils.BLOCK_REDUCTION));
    }
    if (target.isShadow) actual = Math.max(1, Math.floor(actual * 0.2));

    target.hp -= actual;
    if (target.hp < 0) target.hp = 0;
    target.iFrames = 0.4;
    target.state = "hurt";
    target.stateTimer = 0.25;
    target.vx = (fromRight ? -1 : 1) * 180;

    spawnDamageNumber(target.x + (target.w * S) / 2, target.y - 8, actual, isBlocked || target.state === "block");
    if (actual >= 15) DuelCamera.triggerShake(actual >= 25 ? 6 : 3);
    spawnHitParticles(target.x + (target.w * S) / 2, target.y + (target.h * S) / 2,
      isBlocked ? "#8b7fd4" : "#e85555");
    return actual;
  }

  /* ---- Damage numbers ---- */
  function spawnDamageNumber(x, y, text, blocked) {
    damageNumbers.push({ x: x, y: y, text: String(text), color: blocked ? "#8b7fd4" : "#ff4444", life: 1.0, vy: -60 });
  }

  function spawnHealNumber(x, y, amount) {
    damageNumbers.push({ x: x, y: y, text: "+" + amount, color: "#4bc76e", life: 1.0, vy: -60 });
  }

  function updateDamageNumbers(dt) {
    for (var i = damageNumbers.length - 1; i >= 0; i--) {
      damageNumbers[i].y += damageNumbers[i].vy * dt;
      damageNumbers[i].life -= dt;
      if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
    }
  }

  function renderDamageNumbers(ctx) {
    for (var i = 0; i < damageNumbers.length; i++) {
      var dn = damageNumbers[i];
      ctx.globalAlpha = Math.min(1, dn.life * 2);
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = dn.color;
      ctx.textAlign = "center";
      ctx.fillText(dn.text, dn.x, dn.y);
    }
    ctx.globalAlpha = 1; ctx.textAlign = "left";
  }

  /* ---- Particles ---- */
  function spawnHitParticles(x, y, color) {
    for (var i = 0; i < 6; i++) {
      particles.push({
        x: x, y: y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.8) * 150,
        size: 2 + Math.random() * 3, color: color, life: 0.3 + Math.random() * 0.3
      });
    }
  }

  function spawnSpecialParticles(x, y, color, count) {
    for (var i = 0; i < (count || 10); i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.8) * 120,
        size: 3 + Math.random() * 4, color: color, life: 0.5 + Math.random() * 0.5
      });
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx * dt;
      particles[i].y += particles[i].vy * dt;
      particles[i].vy += 200 * dt;
      particles[i].life -= dt;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function renderParticles(ctx) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = Math.min(1, p.life * 3);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- Projectiles ---- */
  function spawnProjectile(opts) {
    projectiles.push({
      x: opts.x, y: opts.y, vx: opts.vx || 0, vy: opts.vy || 0,
      w: opts.w || 20, h: opts.h || 12,
      damage: opts.damage || 20, color: opts.color || "#4a9ade",
      life: opts.life || 1.5, fromPlayer: opts.fromPlayer !== false,
      piercing: opts.piercing || false, statusEffect: opts.statusEffect || null
    });
  }

  function updateProjectiles(dt, playerEntity, enemyEntities, arena) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var proj = projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      /* Hit check against appropriate targets */
      var targets = proj.fromPlayer ? enemyEntities : [playerEntity];
      for (var t = 0; t < targets.length; t++) {
        var target = targets[t];
        if (!target || target.hp <= 0 || target.iFrames > 0) continue;
        var tBox = getEntityBox(target);
        var pBox = { x: proj.x, y: proj.y, w: proj.w, h: proj.h };
        if (DuelUtils.rectsOverlap(pBox, tBox)) {
          applyDamage(target, proj.damage, proj.vx < 0, target.state === "block");
          if (proj.statusEffect) {
            DuelStatus.apply(target, proj.statusEffect.type, proj.statusEffect.duration);
          }
          if (!proj.piercing) { projectiles.splice(i, 1); break; }
        }
      }

      if (proj.life <= 0 || proj.x < -50 || proj.x > arena.width + 50 ||
          proj.y < -50 || proj.y > arena.height + 50) {
        projectiles.splice(i, 1);
      }
    }
  }

  function renderProjectiles(ctx) {
    for (var i = 0; i < projectiles.length; i++) {
      var proj = projectiles[i];
      ctx.fillStyle = proj.color;
      ctx.fillRect(proj.x, proj.y, proj.w, proj.h);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(proj.x - 2, proj.y - 2, proj.w + 4, proj.h + 4);
      ctx.globalAlpha = 1;
    }
  }

  /* ---- Hero specials ---- */
  var heroSpecials = {
    percy_water_wave: function (p) {
      spawnProjectile({ x: p.facingRight ? p.x + p.w * S : p.x - 30, y: p.y + 8 * S,
        vx: p.facingRight ? 280 : -280, w: 28, h: 16, damage: 22, color: "#4a9ade", life: 1.2, fromPlayer: true });
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#4a9ade", 8);
    },
    annabeth_strategic: function (p, enemies) {
      var target = enemies[0];
      if (!target) return;
      applyDamage(target, 30, p.x > target.x, false);
      spawnSpecialParticles(target.x + target.w * S / 2, target.y, "#c0c0d0", 8);
    },
    jason_lightning: function (p, enemies) {
      var target = enemies[0];
      if (!target) return;
      applyDamage(target, 28, p.x > target.x, target.state === "block");
      spawnSpecialParticles(target.x + target.w * S / 2, target.y, "#e8d44a", 12);
      DuelCamera.triggerShake(5);
    },
    piper_charmspeak: function (p, enemies) {
      var target = enemies[0];
      if (!target) return;
      DuelStatus.apply(target, "stun", 2.0);
      spawnSpecialParticles(target.x + target.w * S / 2, target.y, "#e8a0d0", 10);
    },
    leo_fire: function (p) {
      spawnProjectile({ x: p.facingRight ? p.x + p.w * S : p.x - 30, y: p.y + 8 * S,
        vx: p.facingRight ? 250 : -250, w: 24, h: 18, damage: 15, color: "#e85020", life: 1.5,
        fromPlayer: true, statusEffect: { type: "burn", duration: 3.0 } });
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#e85020", 10);
    },
    frank_beast: function (p) {
      p.atk = Math.floor(p.atk * 1.5);
      DuelStatus.apply(p, "empowered", 5.0);
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#8a6432", 10);
    },
    hazel_mist: function (p) {
      DuelStatus.apply(p, "dodge", 4.0);
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#c0a0e0", 10);
    },
    nico_shadow: function (p, enemies) {
      var target = enemies[0];
      if (!target) return;
      var side = Math.random() < 0.5 ? -1 : 1;
      p.x = GameUtils.clamp(target.x + side * 70, 20, 700);
      applyDamage(target, 25, p.x > target.x, false);
      spawnSpecialParticles(p.x, p.y, "#3a2050", 12);
    },
    reyna_rally: function (p) {
      p.atk += 3; p.def += 3; p.speed += 20;
      DuelStatus.apply(p, "empowered", 6.0);
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#d4a017", 10);
    },
    will_heal: function (p) {
      DuelStatus.apply(p, "regen", 5.0);
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#e8d44a", 10);
    },
    carter_avatar: function (p, enemies) {
      var target = enemies[0];
      if (!target) return;
      applyDamage(target, 35, p.x > target.x, false);
      DuelCamera.triggerShake(6);
      spawnSpecialParticles(target.x + target.w * S / 2, target.y, "#2050a0", 15);
    },
    sadie_divine: function (p, enemies) {
      for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].hp > 0) {
          applyDamage(enemies[i], 20, p.x > enemies[i].x, false);
        }
      }
      spawnSpecialParticles(p.x + p.w * S / 2, p.y, "#d4a017", 15);
    },
    magnus_heal: function (p) {
      var heal = 30;
      p.hp = Math.min(p.maxHp, p.hp + heal);
      spawnHealNumber(p.x + p.w * S / 2, p.y - 8, heal);
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#4bc76e", 10);
    },
    alex_shift: function (p) {
      var buffs = ["empowered", "dodge", "regen"];
      var pick = buffs[GameUtils.randomInt(0, buffs.length - 1)];
      DuelStatus.apply(p, pick, 4.0);
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#50c878", 10);
    },
    meg_karpos: function (p) {
      /* Summon handled by wave system — for now, burst damage around player */
      spawnProjectile({ x: p.x - 40, y: p.y + 4 * S, vx: -150, w: 20, h: 20, damage: 15,
        color: "#4bc76e", life: 0.8, fromPlayer: true });
      spawnProjectile({ x: p.x + p.w * S + 10, y: p.y + 4 * S, vx: 150, w: 20, h: 20, damage: 15,
        color: "#4bc76e", life: 0.8, fromPlayer: true });
      spawnSpecialParticles(p.x + p.w * S / 2, p.y + p.h * S / 2, "#4bc76e", 8);
    }
  };

  /* ---- Monster specials ---- */
  var monsterSpecials = {
    horn_charge: function (e, p) { e.vx = (p.x > e.x ? 1 : -1) * e.speed * 3; e.aiTimer = 0.5; },
    backstab: function (e, p) { applyDamage(p, Math.round(e.atk * 1.4), e.x > p.x, p.state === "block"); },
    gaze_beam: function (e, p) {
      var dir = p.x > e.x ? 1 : -1;
      spawnProjectile({ x: e.x + (dir > 0 ? e.w * S : -16), y: e.y + 6 * S,
        vx: dir * 200, w: 16, h: 12, damage: e.atk, color: "#4aaa4a", life: 2.0, fromPlayer: false,
        statusEffect: { type: "stun", duration: 1.0 } });
    },
    storm_call: function (e, p, arena) {
      for (var i = 0; i < 3; i++) {
        spawnProjectile({ x: 50 + Math.random() * (arena.width - 100), y: 0,
          vx: 0, vy: 180, w: 40, h: 30, damage: Math.round(e.atk * 0.8),
          color: "#e85020", life: 2.5, fromPlayer: false });
      }
    },
    mega_storm: function (e, p, arena) {
      for (var i = 0; i < 6; i++) {
        spawnProjectile({ x: 30 + Math.random() * (arena.width - 60), y: -20 - Math.random() * 60,
          vx: (Math.random() - 0.5) * 60, vy: 150 + Math.random() * 100,
          w: 30 + Math.random() * 20, h: 25, damage: Math.round(e.atk * 0.9),
          color: "#c83010", life: 3.0, fromPlayer: false });
      }
      DuelCamera.triggerShake(8);
    },
    time_slow: function (e, p) { DuelStatus.apply(p, "slow", 3.0); spawnSpecialParticles(p.x, p.y, "#8080c0", 8); },
    fire_wave: function (e, p, arena) {
      var dir = p.x > e.x ? 1 : -1;
      spawnProjectile({ x: e.x + dir * e.w * S, y: e.y + 4 * S,
        vx: dir * 220, w: 40, h: 24, damage: Math.round(e.atk * 1.2), color: "#ff4500", life: 1.5,
        fromPlayer: false, statusEffect: { type: "burn", duration: 2.5 } });
    },
    chaos_form: function (e) { e.isShadow = true; e.shadowTimer = 2.5; spawnSpecialParticles(e.x, e.y, "#5020a0", 10); },
    shadow_shift: function (e) { e.isShadow = true; e.shadowTimer = 2.0; spawnSpecialParticles(e.x, e.y, "#1a1a3c", 10); },
    poison_spit: function (e, p) {
      var dir = p.x > e.x ? 1 : -1;
      spawnProjectile({ x: e.x + dir * e.w * S, y: e.y + 6 * S,
        vx: dir * 180, w: 14, h: 10, damage: 8, color: "#50c050", life: 1.8,
        fromPlayer: false, statusEffect: { type: "poison", duration: 4.0 } });
    },
    earth_quake: function (e, p, arena) {
      DuelCamera.triggerShake(10);
      applyDamage(p, Math.round(e.atk * 0.7), e.x > p.x, p.state === "block");
      spawnSpecialParticles(p.x, arena.groundY - 20, "#8a6432", 15);
    },
    ice_blast: function (e, p) {
      var dir = p.x > e.x ? 1 : -1;
      spawnProjectile({ x: e.x + dir * e.w * S, y: e.y + 6 * S,
        vx: dir * 240, w: 20, h: 14, damage: e.atk, color: "#80c0e0", life: 1.5,
        fromPlayer: false, statusEffect: { type: "slow", duration: 3.0 } });
    },
    golden_touch: function (e, p) { DuelStatus.apply(p, "stun", 1.5); spawnSpecialParticles(p.x, p.y, "#d4a017", 12); },
    charmspeak_enemy: function (e, p) { DuelStatus.apply(p, "stun", 1.5); spawnSpecialParticles(p.x, p.y, "#e8a0d0", 8); },
    nightmare: function (e, p) {
      DuelStatus.apply(p, "slow", 2.0);
      applyDamage(p, Math.round(e.atk * 0.6), e.x > p.x, p.state === "block");
      spawnSpecialParticles(p.x, p.y, "#3a1050", 12);
    }
  };

  function executeHeroSpecial(specialId, player, enemies) {
    if (heroSpecials[specialId]) heroSpecials[specialId](player, enemies);
  }

  function executeMonsterSpecial(specialId, enemy, player, arena) {
    if (monsterSpecials[specialId]) monsterSpecials[specialId](enemy, player, arena);
  }

  function clearAll() {
    projectiles = []; particles = []; damageNumbers = [];
  }

  return {
    getEntityBox: getEntityBox, getAttackHitbox: getAttackHitbox,
    applyDamage: applyDamage,
    spawnProjectile: spawnProjectile, spawnSpecialParticles: spawnSpecialParticles,
    spawnHealNumber: spawnHealNumber,
    updateProjectiles: updateProjectiles, updateParticles: updateParticles, updateDamageNumbers: updateDamageNumbers,
    renderProjectiles: renderProjectiles, renderParticles: renderParticles, renderDamageNumbers: renderDamageNumbers,
    executeHeroSpecial: executeHeroSpecial, executeMonsterSpecial: executeMonsterSpecial,
    clearAll: clearAll
  };
})();

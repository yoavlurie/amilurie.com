/* ============================================
   Mythic Duel — Combat Module
   Damage, hitboxes, specials, projectiles, particles
   ============================================ */

var DuelCombat = (function () {
  "use strict";

  var S = 4; /* pixel scale, set by engine init */
  var projectiles = [];
  var particles = [];
  var damageNumbers = [];
  var screenShake = { x: 0, y: 0, timer: 0, intensity: 0 };

  function setScale(s) { S = s; }

  /* ---- Rectangle overlap ---- */
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* ---- Get entity bounding box (in canvas pixels) ---- */
  function getEntityBox(e) {
    return { x: e.x, y: e.y, w: e.w * S, h: e.h * S };
  }

  /* ---- Get attack hitbox ---- */
  function getAttackHitbox(e) {
    var reach = 22 * S;
    var hbH = 14 * S;
    var hbX = e.facingRight ? e.x + e.w * S : e.x - reach;
    var hbY = e.y + 6 * S;
    return { x: hbX, y: hbY, w: reach, h: hbH };
  }

  /* ---- Apply damage ---- */
  function applyDamage(target, amount, fromRight, isBlocked) {
    if (target.iFrames > 0) return 0;

    var actual = amount;
    if (isBlocked || target.state === "block") {
      actual = Math.max(1, Math.floor(amount * 0.2));
    }

    target.hp -= actual;
    if (target.hp < 0) target.hp = 0;
    target.iFrames = 0.4;
    target.state = "hurt";
    target.stateTimer = 0.25;

    /* Knockback */
    var kbDir = fromRight ? -1 : 1;
    target.vx = kbDir * 180;

    /* Spawn damage number */
    spawnDamageNumber(
      target.x + (target.w * S) / 2,
      target.y - 8,
      actual,
      isBlocked || target.state === "block"
    );

    /* Screen shake on big hits */
    if (actual >= 15) {
      triggerShake(actual >= 25 ? 6 : 3);
    }

    /* Particles */
    spawnHitParticles(
      target.x + (target.w * S) / 2,
      target.y + (target.h * S) / 2,
      isBlocked ? "#8b7fd4" : "#e85555"
    );

    return actual;
  }

  /* ---- Damage numbers ---- */
  function spawnDamageNumber(x, y, amount, blocked) {
    damageNumbers.push({
      x: x, y: y,
      text: String(amount),
      color: blocked ? "#8b7fd4" : "#ff4444",
      life: 1.0,
      vy: -60
    });
  }

  function updateDamageNumbers(dt) {
    for (var i = damageNumbers.length - 1; i >= 0; i--) {
      var dn = damageNumbers[i];
      dn.y += dn.vy * dt;
      dn.life -= dt;
      if (dn.life <= 0) damageNumbers.splice(i, 1);
    }
  }

  function renderDamageNumbers(ctx) {
    for (var i = 0; i < damageNumbers.length; i++) {
      var dn = damageNumbers[i];
      var alpha = Math.min(1, dn.life * 2);
      ctx.globalAlpha = alpha;
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = dn.color;
      ctx.textAlign = "center";
      ctx.fillText(dn.text, dn.x, dn.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  /* ---- Particles ---- */
  function spawnHitParticles(x, y, color) {
    for (var i = 0; i < 6; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.8) * 150,
        size: 2 + Math.random() * 3,
        color: color,
        life: 0.3 + Math.random() * 0.3
      });
    }
  }

  function spawnSpecialParticles(x, y, color, count) {
    for (var i = 0; i < (count || 10); i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.8) * 120,
        size: 3 + Math.random() * 4,
        color: color,
        life: 0.5 + Math.random() * 0.5
      });
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; /* gravity on particles */
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function renderParticles(ctx) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var alpha = Math.min(1, p.life * 3);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ---- Projectiles ---- */
  function spawnProjectile(opts) {
    projectiles.push({
      x: opts.x, y: opts.y,
      vx: opts.vx || 0, vy: opts.vy || 0,
      w: opts.w || 20, h: opts.h || 12,
      damage: opts.damage || 20,
      color: opts.color || "#4a9ade",
      life: opts.life || 1.5,
      fromPlayer: opts.fromPlayer !== false,
      piercing: opts.piercing || false
    });
  }

  function updateProjectiles(dt, player, enemy, arena) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var proj = projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      /* Check hit */
      var target = proj.fromPlayer ? enemy : player;
      var tBox = getEntityBox(target);
      var pBox = { x: proj.x, y: proj.y, w: proj.w, h: proj.h };

      if (rectsOverlap(pBox, tBox) && target.iFrames <= 0) {
        var fromRight = proj.vx < 0;
        applyDamage(target, proj.damage, fromRight, target.state === "block");
        if (!proj.piercing) {
          projectiles.splice(i, 1);
          continue;
        }
      }

      /* Out of bounds or expired */
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
      /* Glow effect */
      ctx.globalAlpha = 0.3;
      ctx.fillRect(proj.x - 2, proj.y - 2, proj.w + 4, proj.h + 4);
      ctx.globalAlpha = 1;
    }
  }

  /* ---- Screen shake ---- */
  function triggerShake(intensity) {
    screenShake.intensity = intensity;
    screenShake.timer = 0.15;
  }

  function updateShake(dt) {
    if (screenShake.timer > 0) {
      screenShake.timer -= dt;
      screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
      screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    } else {
      screenShake.x = 0;
      screenShake.y = 0;
    }
  }

  /* ---- Special abilities ---- */
  var specials = {
    percy: function (player) {
      /* Water Wave — horizontal projectile */
      spawnProjectile({
        x: player.facingRight ? player.x + player.w * S : player.x - 30,
        y: player.y + 8 * S,
        vx: player.facingRight ? 280 : -280,
        vy: 0,
        w: 28, h: 16,
        damage: 22,
        color: "#4a9ade",
        life: 1.2,
        fromPlayer: true
      });
      spawnSpecialParticles(player.x + player.w * S / 2, player.y + player.h * S / 2, "#4a9ade", 8);
    },
    jason: function (player, enemy) {
      /* Lightning Bolt — vertical strike at enemy position */
      spawnSpecialParticles(enemy.x + enemy.w * S / 2, enemy.y, "#e8d44a", 12);
      var fromRight = player.x > enemy.x;
      applyDamage(enemy, 28, fromRight, enemy.state === "block");
      triggerShake(5);
    },
    magnus: function (player) {
      /* Heal Burst — restore HP */
      var heal = 30;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      spawnSpecialParticles(player.x + player.w * S / 2, player.y + player.h * S / 2, "#4bc76e", 10);
      spawnDamageNumber(player.x + player.w * S / 2, player.y - 8, "+" + heal, false);
      /* Override color to green */
      damageNumbers[damageNumbers.length - 1].color = "#4bc76e";
    }
  };

  /* ---- Clear all combat state (on level restart) ---- */
  function clearAll() {
    projectiles = [];
    particles = [];
    damageNumbers = [];
    screenShake = { x: 0, y: 0, timer: 0, intensity: 0 };
  }

  return {
    setScale: setScale,
    rectsOverlap: rectsOverlap,
    getEntityBox: getEntityBox,
    getAttackHitbox: getAttackHitbox,
    applyDamage: applyDamage,
    spawnProjectile: spawnProjectile,
    spawnSpecialParticles: spawnSpecialParticles,
    triggerShake: triggerShake,
    specials: specials,
    updateProjectiles: updateProjectiles,
    updateParticles: updateParticles,
    updateDamageNumbers: updateDamageNumbers,
    updateShake: updateShake,
    renderProjectiles: renderProjectiles,
    renderParticles: renderParticles,
    renderDamageNumbers: renderDamageNumbers,
    getShake: function () { return screenShake; },
    clearAll: clearAll
  };
})();

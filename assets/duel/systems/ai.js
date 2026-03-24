/* ============================================
   Mythic Duel — Composable AI System
   Behavior profiles for all enemy types + hero AI
   ============================================ */

var DuelAI = (function () {
  "use strict";

  var S = DuelUtils.SCALE;

  function update(enemy, player, dt, arena) {
    if (DuelStatus.isStunned(enemy)) { enemy.vx = 0; return null; }
    if (enemy.state === "hurt" && enemy.stateTimer > 0) { enemy.vx = 0; return null; }

    enemy.aiTimer -= dt;
    enemy.aiCooldown -= dt;
    if (enemy.aiCooldown < 0) enemy.aiCooldown = 0;

    var dist = Math.abs(enemy.x - player.x);
    var attackRange = 24 * S;
    enemy.facingRight = player.x > enemy.x;

    /* Speed modifier from status effects */
    var speedMult = DuelStatus.getSpeedMult(enemy);

    switch (enemy.aiState) {
      case "idle":
        enemy.vx = 0;
        if (enemy.aiCooldown <= 0 && dist < 400) enemy.aiState = "chase";
        /* Use special if available and off cooldown */
        if (enemy.specialId && enemy.specialCharges > 0 && enemy.aiCooldown <= 0 && dist < 300 && Math.random() < 0.008) {
          enemy.aiState = "cast_special";
          enemy.aiTimer = 0.8;
          enemy.vx = 0;
          enemy.showTelegraph = true;
        }
        break;

      case "chase":
        var dir = player.x > enemy.x ? 1 : -1;
        enemy.vx = dir * enemy.speed * speedMult;

        /* Attack when in range */
        if (dist < attackRange && enemy.aiCooldown <= 0) {
          enemy.aiState = "telegraph";
          enemy.aiTimer = enemy.telegraphTime;
          enemy.vx = 0;
          enemy.showTelegraph = true;
        }

        /* Type-specific behaviors */
        if (enemy.aiType === "charger" && dist < 250 && dist > attackRange && enemy.aiCooldown <= 0) {
          enemy.aiState = "charge";
          enemy.aiTimer = 0.6;
          enemy.vx = dir * enemy.speed * 2.5 * speedMult;
          enemy.showTelegraph = true;
        }

        if (enemy.aiType === "teleporter" && dist < 300 && enemy.aiCooldown <= 0 && Math.random() < 0.02) {
          enemy.aiState = "teleport";
          enemy.aiTimer = 0.4;
          enemy.vx = 0;
        }

        if ((enemy.aiType === "ranged" || enemy.aiType === "caster") && dist < 200 && enemy.aiCooldown <= 0) {
          enemy.aiState = enemy.aiType === "caster" ? "cast_special" : "retreat_shoot";
          enemy.aiTimer = enemy.aiType === "caster" ? 1.0 : 0.5;
          if (enemy.aiType === "caster") enemy.showTelegraph = true;
        }

        if (enemy.aiType === "ranged" && dist > 350 && enemy.aiCooldown <= 0) {
          enemy.aiState = "retreat_shoot";
          enemy.aiTimer = 0.5;
        }

        if (enemy.aiType === "phaser" && enemy.aiCooldown <= 0 && Math.random() < 0.01) {
          enemy.isShadow = true;
          enemy.shadowTimer = 2.0;
        }

        if (enemy.aiType === "duelist" && dist < attackRange * 1.5 && enemy.aiCooldown <= 0) {
          enemy.aiState = "telegraph";
          enemy.aiTimer = enemy.telegraphTime;
          enemy.vx = 0;
          enemy.showTelegraph = true;
        }

        if (enemy.aiType === "debuffer" && enemy.specialId && enemy.specialCharges > 0 && enemy.aiCooldown <= 0 && Math.random() < 0.015) {
          enemy.aiState = "cast_special";
          enemy.aiTimer = 0.8;
          enemy.vx = 0;
          enemy.showTelegraph = true;
        }

        /* Boss: jump occasionally */
        if (enemy.aiType === "boss" && enemy.onGround && Math.random() < 0.005) {
          enemy.vy = DuelUtils.JUMP_VEL * 0.8;
          enemy.onGround = false;
        }
        break;

      case "telegraph":
        enemy.vx = 0;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "attack";
          enemy.aiTimer = 0.3;
          enemy.showTelegraph = false;
        }
        break;

      case "attack":
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "retreat";
          enemy.aiTimer = enemy.retreatTime;
          enemy.aiCooldown = enemy.attackCooldownTime;
          return "melee";
        }
        break;

      case "charge":
        if (enemy.aiTimer <= 0 || enemy.x <= 5 || enemy.x >= arena.width - enemy.w * S - 5) {
          if (enemy.x <= 5 || enemy.x >= arena.width - enemy.w * S - 5) {
            enemy.aiState = "stunned";
            enemy.aiTimer = 1.2;
          } else {
            enemy.aiState = "retreat";
            enemy.aiTimer = enemy.retreatTime;
          }
          enemy.vx = 0;
          enemy.aiCooldown = enemy.attackCooldownTime;
          enemy.showTelegraph = false;
          return "charge_hit";
        }
        break;

      case "stunned":
        enemy.vx = 0;
        if (enemy.aiTimer <= 0) { enemy.aiState = "idle"; enemy.aiCooldown = 0.5; }
        break;

      case "retreat":
        enemy.vx = (player.x > enemy.x ? -1 : 1) * enemy.speed * 0.5 * speedMult;
        if (enemy.aiTimer <= 0) { enemy.aiState = "idle"; enemy.showTelegraph = false; }
        break;

      case "teleport":
        enemy.vx = 0;
        if (enemy.aiTimer <= 0) {
          var side = Math.random() < 0.5 ? -1 : 1;
          enemy.x = GameUtils.clamp(player.x + side * (80 + Math.random() * 60), 20, arena.width - enemy.w * S - 20);
          enemy.aiState = "telegraph";
          enemy.aiTimer = 0.3;
          enemy.showTelegraph = true;
          DuelCombat.spawnSpecialParticles(enemy.x, enemy.y, "#3a8a3a", 6);
        }
        break;

      case "retreat_shoot":
        enemy.vx = (player.x > enemy.x ? -1 : 1) * enemy.speed * 0.6 * speedMult;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "idle";
          enemy.aiCooldown = enemy.attackCooldownTime;
          return "ranged";
        }
        break;

      case "cast_special":
        enemy.vx = 0;
        enemy.showTelegraph = true;
        if (enemy.aiTimer <= 0) {
          enemy.showTelegraph = false;
          enemy.aiState = "retreat";
          enemy.aiTimer = enemy.retreatTime;
          enemy.aiCooldown = enemy.attackCooldownTime * 1.5;
          return "special";
        }
        break;
    }

    /* Phaser shadow timer */
    if (enemy.isShadow) {
      enemy.shadowTimer -= dt;
      if (enemy.shadowTimer <= 0) { enemy.isShadow = false; enemy.aiCooldown = 1.5; }
    }

    return null;
  }

  /* ---- Hero AI (for villain mode) ---- */
  function updateHeroAI(hero, villain, dt, arena) {
    if (DuelStatus.isStunned(hero)) { hero.vx = 0; return null; }
    if (hero.state === "hurt" && hero.stateTimer > 0) { hero.vx = 0; return null; }

    hero.aiTimer -= dt;
    hero.aiCooldown -= dt;
    if (hero.aiCooldown < 0) hero.aiCooldown = 0;

    var dist = Math.abs(hero.x - villain.x);
    var attackRange = 24 * S;
    hero.facingRight = villain.x > hero.x;

    if (!hero.aiState) hero.aiState = "idle";

    switch (hero.aiState) {
      case "idle":
        hero.vx = 0;
        if (dist < 400) hero.aiState = "chase";
        /* Block sometimes */
        if (dist < attackRange * 2 && Math.random() < 0.02) {
          hero.state = "block";
          hero.stateTimer = 0.5;
        }
        break;

      case "chase":
        hero.vx = (villain.x > hero.x ? 1 : -1) * hero.speed * DuelStatus.getSpeedMult(hero);
        /* Jump sometimes */
        if (hero.onGround && Math.random() < 0.01) {
          hero.vy = DuelUtils.JUMP_VEL;
          hero.onGround = false;
        }
        if (dist < attackRange && hero.aiCooldown <= 0) {
          hero.aiState = "attack";
          hero.aiTimer = 0.3;
          hero.vx = 0;
          return "melee";
        }
        /* Use special */
        if (hero.specialCharges > 0 && hero.specialCooldown <= 0 && dist < 200 && Math.random() < 0.01) {
          hero.specialCharges--;
          hero.specialCooldown = 3.0;
          return "hero_special";
        }
        /* Sometimes retreat */
        if (hero.hp < hero.maxHp * 0.3 && Math.random() < 0.02) {
          hero.aiState = "retreat";
          hero.aiTimer = 1.0;
        }
        break;

      case "attack":
        hero.state = "attack";
        if (hero.aiTimer <= 0) {
          hero.aiState = "retreat";
          hero.aiTimer = 0.6;
          hero.aiCooldown = 0.6;
        }
        break;

      case "retreat":
        hero.vx = (villain.x > hero.x ? -1 : 1) * hero.speed * 0.5;
        if (hero.aiTimer <= 0) hero.aiState = "idle";
        break;
    }

    return null;
  }

  return { update: update, updateHeroAI: updateHeroAI };
})();

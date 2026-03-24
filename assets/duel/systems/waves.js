/* ============================================
   Mythic Duel — Wave Controller
   Multi-enemy battle management
   ============================================ */

var DuelWaves = (function () {
  "use strict";

  var MAX_ATTACKERS = 2;
  var currentWave = 0;
  var waveEnemies = [];
  var battleDef = null;
  var waveCleared = false;

  function startBattle(def, arena) {
    battleDef = def;
    currentWave = 0;
    waveEnemies = [];
    waveCleared = false;
    spawnWave(arena);
  }

  function spawnWave(arena) {
    if (!battleDef || currentWave >= battleDef.waves.length) return;
    var wave = battleDef.waves[currentWave];
    waveEnemies = [];
    for (var i = 0; i < wave.enemies.length; i++) {
      var enemyDef = DuelEnemyDefs.getById(wave.enemies[i]);
      if (!enemyDef) continue;
      var spawnX = arena.spawnEnemy.x - i * 60;
      var e = DuelEntity.createFromEnemyDef(enemyDef, spawnX, arena.spawnEnemy.y, false);
      waveEnemies.push(e);
    }
    waveCleared = false;
  }

  function update(player, dt, arena) {
    if (!battleDef) return;

    /* Assign roles: closest enemies attack, rest circle */
    waveEnemies.sort(function (a, b) {
      return Math.abs(a.x - player.x) - Math.abs(b.x - player.x);
    });

    var attackerCount = 0;
    for (var i = 0; i < waveEnemies.length; i++) {
      var e = waveEnemies[i];
      if (e.hp <= 0) continue;

      if (attackerCount < MAX_ATTACKERS) {
        /* Full AI */
        var action = DuelAI.update(e, player, dt, arena);
        handleEnemyAction(action, e, player, arena);
        attackerCount++;
      } else {
        /* Circle at distance */
        var dist = Math.abs(e.x - player.x);
        if (dist < 250) {
          e.vx = (e.x < player.x ? -1 : 1) * e.speed * 0.3;
        } else {
          e.vx = 0;
        }
        e.facingRight = player.x > e.x;
      }

      DuelPhysics.update(e, dt, arena);
      DuelStatus.update(e, dt);
      updateTimers(e, dt);
    }

    /* Check wave clear */
    var allDead = true;
    for (var j = 0; j < waveEnemies.length; j++) {
      if (waveEnemies[j].hp > 0) { allDead = false; break; }
    }
    if (allDead && !waveCleared) {
      waveCleared = true;
      currentWave++;
      if (currentWave < battleDef.waves.length) {
        /* Short delay then next wave */
        setTimeout(function () { spawnWave(arena); }, 1500);
      }
    }
  }

  function handleEnemyAction(action, enemy, player, arena) {
    var S = DuelUtils.SCALE;
    if (action === "melee") {
      var hb = DuelCombat.getAttackHitbox(enemy);
      var pb = DuelCombat.getEntityBox(player);
      if (DuelUtils.rectsOverlap(hb, pb)) {
        var dmg = Math.max(1, Math.round(enemy.atk * DuelStatus.getAtkMult(enemy) - player.def * 0.3 + GameUtils.randomInt(-1, 2)));
        DuelCombat.applyDamage(player, dmg, enemy.x > player.x, player.state === "block");
      }
    }
    if (action === "charge_hit") {
      var chb = { x: enemy.x - 10, y: enemy.y, w: enemy.w * S + 20, h: enemy.h * S };
      var cpb = DuelCombat.getEntityBox(player);
      if (DuelUtils.rectsOverlap(chb, cpb)) {
        var cdmg = Math.max(1, Math.round(enemy.atk * 1.3 + GameUtils.randomInt(0, 3)));
        DuelCombat.applyDamage(player, cdmg, enemy.x > player.x, player.state === "block");
      }
    }
    if (action === "ranged" || action === "special") {
      if (enemy.specialId && action === "special") {
        enemy.specialCharges--;
        DuelCombat.executeMonsterSpecial(enemy.specialId, enemy, player, arena);
      } else {
        var dir = player.x > enemy.x ? 1 : -1;
        DuelCombat.spawnProjectile({ x: enemy.x + (dir > 0 ? enemy.w * S : -16), y: enemy.y + 6 * S,
          vx: dir * 200, w: 16, h: 12, damage: enemy.atk, color: "#aa4444", life: 2.0, fromPlayer: false });
      }
    }
  }

  function updateTimers(entity, dt) {
    if (entity.stateTimer > 0) {
      entity.stateTimer -= dt;
      if (entity.stateTimer <= 0 && (entity.state === "attack" || entity.state === "hurt")) entity.state = "idle";
    }
    if (entity.attackCooldown > 0) entity.attackCooldown -= dt;
    if (entity.iFrames > 0) entity.iFrames -= dt;
  }

  function getEnemies() { return waveEnemies; }
  function getCurrentWave() { return currentWave; }
  function getTotalWaves() { return battleDef ? battleDef.waves.length : 0; }
  function isBattleOver() { return battleDef && currentWave >= battleDef.waves.length && waveCleared; }
  function allEnemiesDead() {
    for (var i = 0; i < waveEnemies.length; i++) { if (waveEnemies[i].hp > 0) return false; }
    return true;
  }

  function clear() { waveEnemies = []; battleDef = null; currentWave = 0; waveCleared = false; }

  return {
    startBattle: startBattle, update: update,
    getEnemies: getEnemies, getCurrentWave: getCurrentWave, getTotalWaves: getTotalWaves,
    isBattleOver: isBattleOver, allEnemiesDead: allEnemiesDead, clear: clear
  };
})();

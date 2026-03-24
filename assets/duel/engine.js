/* ============================================
   Mythic Duel — Game Engine
   Game loop, state machine, rendering, all screens
   ============================================ */

(function () {
  "use strict";

  var canvas, ctx;
  var CW = DuelUtils.CW, CH = DuelUtils.CH;
  var S = DuelUtils.SCALE;

  var gameState = "SELECT";
  var lastTime = 0;
  var player = null, enemies = [], arena = null;
  var selectedHero = "percy", currentEnemyId = null, currentBattleId = null;
  var selectIndex = 0, locationMenuIndex = 0, villainSelectIndex = 0;
  var controlsHintTimer = 5;
  var isVillainMode = false;
  var questLogOpen = false;

  /* ================================================ INIT ================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    DuelControls.init();
    DuelProgression.load();
    DuelQuestEngine.autoStartAvailable();
    canvas.focus();
    canvas.addEventListener("click", function () { canvas.focus(); });
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  });

  /* ================================================ GAME LOOP ================================================ */
  function gameLoop(ts) {
    var dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    DuelControls.updateFrame();

    switch (gameState) {
      case "SELECT":       updateSelect(dt); break;
      case "MAP":          updateMap(dt); break;
      case "LOCATION":     updateLocation(dt); break;
      case "PLAYING":      updatePlaying(dt); break;
      case "BATTLE":       updateBattle(dt); break;
      case "VICTORY":      updateResult(dt); break;
      case "DEFEAT":       updateResult(dt); break;
      case "VILLAIN_SEL":  updateVillainSelect(dt); break;
      case "QUEST_LOG":    updateQuestLog(dt); break;
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  /* ================================================ SELECT HERO ================================================ */
  function updateSelect() {
    var heroes = DuelHeroDefs.roster;
    var unlocked = [];
    for (var i = 0; i < heroes.length; i++) {
      if (DuelProgression.isHeroUnlocked(heroes[i].id)) unlocked.push(i);
    }
    if (DuelControls.isJustPressed("right")) selectIndex = (selectIndex + 1) % heroes.length;
    if (DuelControls.isJustPressed("left")) selectIndex = (selectIndex + heroes.length - 1) % heroes.length;
    if ((DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) &&
        DuelProgression.isHeroUnlocked(heroes[selectIndex].id)) {
      selectedHero = heroes[selectIndex].id;
      DuelProgression.get().selectedHero = selectedHero;
      DuelProgression.save();
      isVillainMode = false;
      gameState = "MAP";
      DuelWorldMap.setSelected(DuelProgression.get().currentLocation);
    }
  }

  function renderSelect() {
    ctx.fillStyle = "#0f0e17"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#e8e6f0"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center";
    ctx.fillText("Choose Your Hero", CW / 2, 30);

    var heroes = DuelHeroDefs.roster;
    var cols = 5, cellW = 130, cellH = 55, gap = 8;
    var totalW = cols * cellW + (cols - 1) * gap;
    var startX = (CW - totalW) / 2;

    for (var i = 0; i < heroes.length; i++) {
      var h = heroes[i];
      var col = i % cols, row = Math.floor(i / cols);
      var cx = startX + col * (cellW + gap), cy = 45 + row * (cellH + gap);
      var unlocked = DuelProgression.isHeroUnlocked(h.id);
      var sel = i === selectIndex;

      ctx.fillStyle = sel ? "#1a1930" : "#12111f";
      ctx.strokeStyle = sel ? h.color : (unlocked ? "#2a2845" : "#1a1a28");
      ctx.lineWidth = sel ? 2 : 1;
      DuelUtils.roundRect(ctx, cx, cy, cellW, cellH, 6);

      if (unlocked) {
        var sp = DuelHeroSprites.sprites[h.id];
        if (sp && sp.idle) {
          var cached = DuelHeroSprites.getCached(h.id + "_idle_sm", sp.idle, 2, false);
          ctx.drawImage(cached, cx + 3, cy + 3);
        }
        ctx.fillStyle = sel ? "#e8e6f0" : "#9a96b0"; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
        ctx.fillText(h.name, cx + 36, cy + 18);
        ctx.fillStyle = "#6a6a8a"; ctx.font = "8px monospace";
        ctx.fillText(h.desc, cx + 36, cy + 30);
        ctx.fillStyle = "#d4a017"; ctx.font = "8px monospace";
        ctx.fillText(h.specialName, cx + 36, cy + 42);
      } else {
        ctx.fillStyle = "#3a3a4a"; ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
        ctx.fillText("?", cx + cellW / 2, cy + cellH / 2 + 5);
      }
    }

    /* Villain mode button */
    var villains = DuelProgression.get().unlockedVillains;
    if (villains.length > 0) {
      ctx.fillStyle = "#1a1930"; ctx.strokeStyle = "#c83030"; ctx.lineWidth = 1;
      DuelUtils.roundRect(ctx, CW / 2 - 80, CH - 55, 160, 30, 6);
      ctx.fillStyle = "#c83030"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
      ctx.fillText("Villain Mode (V)", CW / 2, CH - 36);
    }

    ctx.fillStyle = "#6a6a8a"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Arrows: Select \u2022 Space: Confirm", CW / 2, CH - 8);
    ctx.textAlign = "left";

    /* V key for villain mode */
    if (DuelControls.isJustPressed("flee") && villains.length > 0) {
      gameState = "VILLAIN_SEL"; villainSelectIndex = 0;
    }
  }

  /* ================================================ WORLD MAP ================================================ */
  function updateMap() {
    if (DuelControls.isJustPressed("left")) DuelWorldMap.moveToClosest("left");
    if (DuelControls.isJustPressed("right")) DuelWorldMap.moveToClosest("right");
    if (DuelControls.isJustPressed("jump")) DuelWorldMap.moveToClosest("up");
    if (DuelControls.isJustPressed("down")) DuelWorldMap.moveToClosest("down");
    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      var sel = DuelWorldMap.getSelected();
      if (DuelProgression.isLocationUnlocked(sel)) {
        DuelProgression.get().currentLocation = sel;
        DuelProgression.save();
        DuelQuestEngine.onEvent("arrived", { locationId: sel });
        DuelQuestEngine.autoStartAvailable();
        locationMenuIndex = 0;
        gameState = "LOCATION";
      }
    }
    if (DuelControls.isJustPressed("questlog")) { gameState = "QUEST_LOG"; }
    if (DuelControls.isJustPressed("block")) { gameState = "SELECT"; }
  }

  /* ================================================ LOCATION MENU ================================================ */
  function updateLocation() {
    var locId = DuelWorldMap.getSelected();
    var locEnemies = DuelEnemyDefs.getByLocation(locId);
    var locQuests = DuelQuestEngine.getAvailableQuests(locId);
    var items = locEnemies.concat(locQuests);
    if (items.length === 0) items = [{ id: "__back", name: "Back to Map" }];

    if (DuelControls.isJustPressed("down") || DuelControls.isJustPressed("right")) locationMenuIndex = (locationMenuIndex + 1) % items.length;
    if (DuelControls.isJustPressed("jump") || DuelControls.isJustPressed("left")) locationMenuIndex = (locationMenuIndex + items.length - 1) % items.length;

    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      var item = items[locationMenuIndex];
      if (item.id === "__back") { gameState = "MAP"; return; }
      if (item.hp !== undefined) {
        startFight(item.id, locId);
      } else if (item.steps) {
        /* It's a quest — auto-start */
        var s = DuelProgression.getQuestStatus(item.id);
        if (!s) DuelQuestEngine.startQuest(item.id);
        gameState = "MAP";
      }
    }
    if (DuelControls.isJustPressed("block")) { gameState = "MAP"; }
  }

  function renderLocation() {
    ctx.fillStyle = "#0f0e17"; ctx.fillRect(0, 0, CW, CH);
    var locId = DuelWorldMap.getSelected();
    var loc = DuelLocations.get(locId);
    if (!loc) return;

    ctx.fillStyle = "#e8e6f0"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
    ctx.fillText(loc.name, CW / 2, 30);
    ctx.fillStyle = "#9a96b0"; ctx.font = "11px monospace";
    ctx.fillText(loc.desc, CW / 2, 48);

    var locEnemies = DuelEnemyDefs.getByLocation(locId);
    var locQuests = DuelQuestEngine.getAvailableQuests(locId);
    var items = [];

    /* Section: Enemies */
    for (var i = 0; i < locEnemies.length; i++) items.push({ data: locEnemies[i], type: "enemy" });
    /* Section: Quests */
    for (var j = 0; j < locQuests.length; j++) items.push({ data: locQuests[j], type: "quest" });
    if (items.length === 0) items.push({ data: { id: "__back", name: "Back to Map" }, type: "action" });

    var yStart = 70;
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      var y = yStart + k * 30;
      var sel = k === locationMenuIndex;

      ctx.fillStyle = sel ? "#1a1930" : "#12111f";
      ctx.strokeStyle = sel ? "#8b7fd4" : "#2a2845";
      ctx.lineWidth = sel ? 2 : 1;
      DuelUtils.roundRect(ctx, 60, y, CW - 120, 26, 4);

      ctx.textAlign = "left";
      if (item.type === "enemy") {
        var e = item.data;
        var beaten = DuelProgression.isEnemyDefeated(e.id);
        ctx.fillStyle = sel ? "#e8e6f0" : "#9a96b0"; ctx.font = "bold 10px monospace";
        ctx.fillText((beaten ? "\u2713 " : "") + e.name + " \u2014 " + e.subtitle, 70, y + 17);
        ctx.fillStyle = "#6a6a8a"; ctx.font = "9px monospace"; ctx.textAlign = "right";
        ctx.fillText("Tier " + e.tier + " | HP:" + e.hp, CW - 70, y + 17);
      } else if (item.type === "quest") {
        var q = item.data;
        ctx.fillStyle = "#d4a017"; ctx.font = "bold 10px monospace";
        ctx.fillText("\u2606 " + q.name, 70, y + 17);
        ctx.fillStyle = "#9a96b0"; ctx.font = "9px monospace"; ctx.textAlign = "right";
        ctx.fillText(q.type, CW - 70, y + 17);
      } else {
        ctx.fillStyle = "#9a96b0"; ctx.font = "10px monospace";
        ctx.fillText(item.data.name, 70, y + 17);
      }
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#6a6a8a"; ctx.font = "11px monospace";
    ctx.fillText("Arrows: Select \u2022 Space: Fight/Start \u2022 Shift: Back", CW / 2, CH - 8);
    ctx.textAlign = "left";
  }

  /* ================================================ START FIGHT ================================================ */
  function startFight(enemyId, locationId) {
    currentEnemyId = enemyId;
    var enemyDef = DuelEnemyDefs.getById(enemyId);
    if (!enemyDef) return;
    arena = DuelArenas.get(locationId || enemyDef.locationId);

    var heroDef = DuelHeroDefs.getById(selectedHero);
    player = DuelEntity.createFromHeroDef(heroDef, arena.spawnPlayer.x, arena.spawnPlayer.y, true);

    var enemy = DuelEntity.createFromEnemyDef(enemyDef, arena.spawnEnemy.x, arena.spawnEnemy.y, false);
    enemies = [enemy];

    DuelCombat.clearAll();
    DuelCamera.reset();
    controlsHintTimer = 5;
    currentBattleId = null;
    gameState = "PLAYING";
  }

  function startBattle(battleId) {
    currentBattleId = battleId;
    var battle = DuelBattles.get(battleId);
    if (!battle) return;
    arena = DuelArenas.get(battle.arenaId);

    var heroDef = DuelHeroDefs.getById(selectedHero);
    player = DuelEntity.createFromHeroDef(heroDef, arena.spawnPlayer.x, arena.spawnPlayer.y, true);

    DuelCombat.clearAll();
    DuelCamera.reset();
    DuelWaves.startBattle(battle, arena);
    enemies = DuelWaves.getEnemies();
    controlsHintTimer = 5;
    gameState = "BATTLE";
  }

  /* ================================================ PLAYING (single fight) ================================================ */
  function updatePlaying(dt) {
    if (!player || enemies.length === 0) return;
    controlsHintTimer -= dt;

    /* Flee */
    if (DuelControls.isJustPressed("flee") && DuelPhysics.isAtArenaEdge(player, arena)) {
      gameState = "LOCATION"; return;
    }

    updatePlayerInput(dt);
    DuelPhysics.update(player, dt, arena);
    DuelStatus.update(player, dt);

    /* Enemy */
    var enemy = enemies[0];
    var action = DuelAI.update(enemy, player, dt, arena);
    handleEnemyAction(action, enemy);
    DuelPhysics.update(enemy, dt, arena);
    DuelStatus.update(enemy, dt);
    updateTimers(enemy, dt);

    /* Player attack hit */
    checkPlayerAttackHit();

    /* Pools */
    DuelPhysics.checkPoolInteractions(player, dt, arena, selectedHero);
    DuelPhysics.checkPoolInteractions(enemy, dt, arena, null);

    /* Magnus regen */
    if (selectedHero === "magnus" && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 0.5 * dt);
    }

    DuelCombat.updateProjectiles(dt, player, enemies, arena);
    DuelCombat.updateParticles(dt);
    DuelCombat.updateDamageNumbers(dt);
    DuelCamera.update(player, arena.width, dt);
    updateTimers(player, dt);

    /* Win/lose */
    if (enemy.hp <= 0) {
      DuelProgression.recordDefeat(currentEnemyId);
      DuelQuestEngine.onEvent("enemy_defeated", { enemyId: currentEnemyId });
      DuelQuestEngine.autoStartAvailable();
      gameState = "VICTORY";
    }
    if (player.hp <= 0) gameState = "DEFEAT";
  }

  /* ================================================ BATTLE (multi-wave) ================================================ */
  function updateBattle(dt) {
    if (!player) return;
    controlsHintTimer -= dt;

    updatePlayerInput(dt);
    DuelPhysics.update(player, dt, arena);
    DuelStatus.update(player, dt);

    DuelWaves.update(player, dt, arena);
    enemies = DuelWaves.getEnemies();

    checkPlayerAttackHit();
    DuelPhysics.checkPoolInteractions(player, dt, arena, selectedHero);

    if (selectedHero === "magnus" && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 0.5 * dt);
    }

    DuelCombat.updateProjectiles(dt, player, enemies, arena);
    DuelCombat.updateParticles(dt);
    DuelCombat.updateDamageNumbers(dt);
    DuelCamera.update(player, arena.width, dt);
    updateTimers(player, dt);

    if (DuelWaves.isBattleOver() && DuelWaves.allEnemiesDead()) {
      if (currentBattleId) {
        DuelProgression.completeBattle(currentBattleId);
        DuelQuestEngine.onEvent("battle_won", { battleId: currentBattleId });
        DuelQuestEngine.autoStartAvailable();
      }
      gameState = "VICTORY";
    }
    if (player.hp <= 0) gameState = "DEFEAT";
  }

  /* ================================================ SHARED INPUT ================================================ */
  function updatePlayerInput(dt) {
    if (DuelStatus.isStunned(player)) { player.vx = 0; return; }
    if (player.state === "hurt") return;

    var speedMult = DuelStatus.getSpeedMult(player);
    var moving = false;

    /* Duck */
    if (DuelControls.isAction("down") && player.onGround && player.state !== "attack") {
      player.isDucking = true;
      player.state = "duck";
    } else {
      player.isDucking = false;
    }

    /* Movement */
    if (player.state !== "attack" && !player.isDucking) {
      if (DuelControls.isAction("left")) {
        player.vx = -player.speed * speedMult * (player.state === "block" ? 0.3 : 1);
        player.facingRight = false; moving = true;
      } else if (DuelControls.isAction("right")) {
        player.vx = player.speed * speedMult * (player.state === "block" ? 0.3 : 1);
        player.facingRight = true; moving = true;
      } else {
        player.vx = 0;
      }
    } else if (player.isDucking) {
      player.vx = 0;
    }

    /* Jump */
    if (DuelControls.isJustPressed("jump") && player.onGround && !player.isDucking) {
      player.vy = DuelUtils.JUMP_VEL;
      player.onGround = false;
    }

    /* Block */
    if (DuelControls.isAction("block") && player.state !== "attack" && !player.isDucking) {
      player.state = "block";
    } else if (player.state === "block") {
      player.state = "idle";
    }

    /* Attack */
    if (DuelControls.isJustPressed("attack") && player.attackCooldown <= 0 && player.state !== "attack") {
      player.state = "attack";
      player.stateTimer = DuelUtils.ATTACK_DURATION;
      player.attackCooldown = DuelUtils.ATTACK_COOLDOWN;
      if (!player.isDucking) player.vx = 0;
    }

    /* Special */
    if (DuelControls.isJustPressed("special") && player.specialCharges > 0 && player.specialCooldown <= 0) {
      player.specialCharges--;
      player.specialCooldown = 3.0;
      DuelCombat.executeHeroSpecial(player.specialId, player, enemies);
    }

    /* Animation state */
    if (player.state !== "attack" && player.state !== "hurt" && player.state !== "block" && !player.isDucking) {
      player.state = moving ? "walk" : "idle";
    }
  }

  function checkPlayerAttackHit() {
    if (player.state !== "attack" || player.stateTimer <= 0.05 || player.stateTimer >= 0.2) return;
    var hb = DuelCombat.getAttackHitbox(player);
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.hp <= 0 || e.iFrames > 0) continue;
      /* Dodge check */
      if (DuelStatus.getDodgeChance(player) > 0 && Math.random() < DuelStatus.getDodgeChance(player)) continue;
      var eb = DuelCombat.getEntityBox(e);
      if (DuelUtils.rectsOverlap(hb, eb)) {
        var mult = e.isShadow ? 0.2 : 1.0;
        mult *= DuelStatus.getAtkMult(player);
        var dmg = Math.max(1, Math.round(player.atk * mult - e.def * 0.3 + GameUtils.randomInt(-1, 2)));
        DuelCombat.applyDamage(e, dmg, player.x > e.x, false);
      }
    }
  }

  function handleEnemyAction(action, enemy) {
    if (!action) return;
    if (action === "melee") {
      var hb = DuelCombat.getAttackHitbox(enemy);
      var pb = DuelCombat.getEntityBox(player);
      if (DuelUtils.rectsOverlap(hb, pb)) {
        /* Check player dodge */
        if (DuelStatus.getDodgeChance(player) > 0 && Math.random() < DuelStatus.getDodgeChance(player)) return;
        var dmg = Math.max(1, Math.round(enemy.atk * DuelStatus.getAtkMult(enemy) - player.def * 0.3 + GameUtils.randomInt(-1, 2)));
        DuelCombat.applyDamage(player, dmg, enemy.x > player.x, player.state === "block");
      }
    }
    if (action === "charge_hit") {
      var chb = { x: enemy.x - 10, y: enemy.y, w: enemy.w * S + 20, h: enemy.h * S };
      if (DuelUtils.rectsOverlap(chb, DuelCombat.getEntityBox(player))) {
        var cdmg = Math.max(1, Math.round(enemy.atk * 1.3 + GameUtils.randomInt(0, 3)));
        DuelCombat.applyDamage(player, cdmg, enemy.x > player.x, player.state === "block");
      }
    }
    if (action === "ranged") {
      var dir = player.x > enemy.x ? 1 : -1;
      DuelCombat.spawnProjectile({ x: enemy.x + (dir > 0 ? enemy.w * S : -16), y: enemy.y + 6 * S,
        vx: dir * 200, w: 16, h: 12, damage: enemy.atk, color: "#aa4444", life: 2.0, fromPlayer: false });
    }
    if (action === "special" && enemy.specialId) {
      enemy.specialCharges = (enemy.specialCharges || 0) - 1;
      DuelCombat.executeMonsterSpecial(enemy.specialId, enemy, player, arena);
    }
  }

  function updateTimers(entity, dt) {
    if (entity.stateTimer > 0) {
      entity.stateTimer -= dt;
      if (entity.stateTimer <= 0 && (entity.state === "attack" || entity.state === "hurt")) entity.state = "idle";
    }
    if (entity.attackCooldown > 0) entity.attackCooldown -= dt;
    if (entity.iFrames > 0) entity.iFrames -= dt;
    if (entity.specialCooldown > 0) entity.specialCooldown -= dt;
  }

  /* ================================================ VILLAIN SELECT ================================================ */
  function updateVillainSelect() {
    var villains = DuelProgression.get().unlockedVillains;
    if (villains.length === 0) { gameState = "SELECT"; return; }
    if (DuelControls.isJustPressed("right")) villainSelectIndex = (villainSelectIndex + 1) % villains.length;
    if (DuelControls.isJustPressed("left")) villainSelectIndex = (villainSelectIndex + villains.length - 1) % villains.length;
    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      startVillainFight(villains[villainSelectIndex]);
    }
    if (DuelControls.isJustPressed("block")) gameState = "SELECT";
  }

  function startVillainFight(villainId) {
    var enemyDef = DuelEnemyDefs.getById(villainId);
    if (!enemyDef) return;
    arena = DuelArenas.get(enemyDef.locationId);
    isVillainMode = true;

    /* Player is the villain */
    player = DuelEntity.createFromEnemyDef(enemyDef, arena.spawnPlayer.x, arena.spawnPlayer.y, true);
    player.facingRight = true;

    /* Enemy is a random unlocked hero */
    var heroIds = DuelProgression.get().unlockedHeroes;
    var heroId = heroIds[GameUtils.randomInt(0, heroIds.length - 1)];
    var heroDef = DuelHeroDefs.getById(heroId);
    var heroEntity = DuelEntity.createFromHeroDef(heroDef, arena.spawnEnemy.x, arena.spawnEnemy.y, false);
    heroEntity.facingRight = false;
    enemies = [heroEntity];

    selectedHero = villainId;
    currentEnemyId = heroId;
    DuelCombat.clearAll();
    DuelCamera.reset();
    controlsHintTimer = 5;
    gameState = "PLAYING";
  }

  function renderVillainSelect() {
    ctx.fillStyle = "#0f0e17"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#c83030"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center";
    ctx.fillText("Villain Mode", CW / 2, 30);
    ctx.fillStyle = "#9a96b0"; ctx.font = "11px monospace";
    ctx.fillText("Play as a defeated villain against hero AI", CW / 2, 50);

    var villains = DuelProgression.get().unlockedVillains;
    for (var i = 0; i < villains.length; i++) {
      var vDef = DuelEnemyDefs.getById(villains[i]);
      if (!vDef) continue;
      var sel = i === villainSelectIndex;
      var y = 70 + i * 35;
      ctx.fillStyle = sel ? "#1a1930" : "#12111f";
      ctx.strokeStyle = sel ? "#c83030" : "#2a2845";
      ctx.lineWidth = sel ? 2 : 1;
      DuelUtils.roundRect(ctx, 100, y, CW - 200, 30, 4);
      ctx.fillStyle = sel ? "#e8e6f0" : "#9a96b0"; ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
      ctx.fillText(vDef.name + " \u2014 " + vDef.subtitle, 110, y + 20);
      ctx.fillStyle = "#6a6a8a"; ctx.font = "9px monospace"; ctx.textAlign = "right";
      ctx.fillText("HP:" + vDef.hp + " ATK:" + vDef.atk, CW - 110, y + 20);
    }
    ctx.fillStyle = "#6a6a8a"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Arrows: Select \u2022 Space: Fight \u2022 Shift: Back", CW / 2, CH - 8);
    ctx.textAlign = "left";
  }

  /* ================================================ QUEST LOG ================================================ */
  function updateQuestLog() {
    if (DuelControls.isJustPressed("questlog") || DuelControls.isJustPressed("block") || DuelControls.isJustPressed("pause")) {
      gameState = "MAP";
    }
  }

  function renderQuestLog() {
    ctx.fillStyle = "#0f0e17"; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = "#d4a017"; ctx.font = "bold 22px monospace"; ctx.textAlign = "center";
    ctx.fillText("Quest Log", CW / 2, 28);

    var log = DuelQuestEngine.getQuestLog();
    if (log.length === 0) {
      ctx.fillStyle = "#6a6a8a"; ctx.font = "12px monospace";
      ctx.fillText("No quests yet. Explore the world map!", CW / 2, 100);
    }

    for (var i = 0; i < log.length; i++) {
      var entry = log[i];
      var q = entry.quest;
      var y = 50 + i * 50;
      if (y > CH - 30) break;

      ctx.fillStyle = entry.status === "completed" ? "#1a2a1a" : "#1a1930";
      ctx.strokeStyle = entry.status === "completed" ? "#2d8a4e" : "#8b7fd4";
      ctx.lineWidth = 1;
      DuelUtils.roundRect(ctx, 20, y, CW - 40, 44, 4);

      ctx.textAlign = "left";
      ctx.fillStyle = entry.status === "completed" ? "#2d8a4e" : "#e8e6f0";
      ctx.font = "bold 11px monospace";
      ctx.fillText((entry.status === "completed" ? "\u2713 " : "\u25cb ") + q.name, 30, y + 16);
      ctx.fillStyle = "#9a96b0"; ctx.font = "9px monospace";
      ctx.fillText(q.desc, 30, y + 30);

      if (entry.status === "active" && entry.step >= 0 && entry.step < q.steps.length) {
        ctx.fillStyle = "#d4a017"; ctx.font = "8px monospace";
        ctx.fillText("\u25b6 " + q.steps[entry.step].text, 30, y + 42);
      }
    }

    ctx.fillStyle = "#6a6a8a"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Tab or Shift: Close", CW / 2, CH - 8);
    ctx.textAlign = "left";
  }

  /* ================================================ RESULT ================================================ */
  function updateResult() {
    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      DuelWaves.clear();
      isVillainMode = false;
      if (gameState === "VICTORY") {
        gameState = "LOCATION";
      } else {
        gameState = "LOCATION";
      }
    }
  }

  function renderResult(victory) {
    renderPlayingScene();
    ctx.fillStyle = victory ? "rgba(15, 14, 23, 0.75)" : "rgba(30, 10, 10, 0.8)";
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = "center";

    if (victory) {
      ctx.fillStyle = "#2d8a4e"; ctx.font = "bold 36px monospace";
      ctx.fillText("VICTORY!", CW / 2, 140);
      ctx.fillStyle = "#e8e6f0"; ctx.font = "14px monospace";
      ctx.fillText((enemies[0] ? enemies[0].name : "Enemy") + " defeated!", CW / 2, 180);
    } else {
      ctx.fillStyle = "#c93030"; ctx.font = "bold 36px monospace";
      ctx.fillText("DEFEATED", CW / 2, 140);
      ctx.fillStyle = "#e8e6f0"; ctx.font = "14px monospace";
      ctx.fillText("But legends never truly die.", CW / 2, 180);
    }

    ctx.fillStyle = "#6a6a8a"; ctx.font = "11px monospace";
    ctx.fillText("Press Space to continue", CW / 2, 280);
    ctx.textAlign = "left";
  }

  /* ================================================ RENDER ================================================ */
  function render() {
    ctx.clearRect(0, 0, CW, CH);
    switch (gameState) {
      case "SELECT":      renderSelect(); break;
      case "MAP":         DuelWorldMap.render(ctx); break;
      case "LOCATION":    renderLocation(); break;
      case "PLAYING":     renderPlayingScene(); renderHUD(); break;
      case "BATTLE":      renderPlayingScene(); renderBattleHUD(); break;
      case "VICTORY":     renderResult(true); break;
      case "DEFEAT":      renderResult(false); break;
      case "VILLAIN_SEL": renderVillainSelect(); break;
      case "QUEST_LOG":   renderQuestLog(); break;
    }
  }

  function renderPlayingScene() {
    ctx.save();
    DuelCamera.apply(ctx);
    renderArena();
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) renderEntity(enemies[i]);
    }
    renderEntity(player);
    renderTelegraphs();
    DuelCombat.renderProjectiles(ctx);
    DuelCombat.renderParticles(ctx);
    DuelCombat.renderDamageNumbers(ctx);
    ctx.restore();
  }

  function renderArena() {
    var grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, arena.bgTop); grad.addColorStop(1, arena.bgBot);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, arena.width, CH);

    ctx.fillStyle = arena.groundColor;
    ctx.fillRect(0, arena.groundY, arena.width, CH - arena.groundY);
    ctx.fillStyle = DuelUtils.lighten(arena.groundColor, 20);
    ctx.fillRect(0, arena.groundY, arena.width, 2);

    for (var i = 0; i < arena.platforms.length; i++) {
      var p = arena.platforms[i];
      ctx.fillStyle = DuelUtils.lighten(arena.groundColor, 15);
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = DuelUtils.lighten(arena.groundColor, 30);
      ctx.fillRect(p.x, p.y, p.w, 2);
    }

    for (var j = 0; j < arena.obstacles.length; j++) {
      var obs = arena.obstacles[j];
      ctx.fillStyle = "#5a5a4a"; ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = "#6a6a5a"; ctx.fillRect(obs.x, obs.y, obs.w, 3);
    }

    for (var k = 0; k < arena.pools.length; k++) {
      var pool = arena.pools[k];
      ctx.fillStyle = "rgba(42, 90, 138, 0.5)";
      ctx.fillRect(pool.x, pool.y, pool.w, pool.h);
    }
  }

  function renderEntity(entity) {
    if (!entity || entity.hp <= 0) return;
    if (entity.iFrames > 0 && Math.floor(entity.iFrames * 20) % 2 === 0) return;

    var spriteKey = entity.spriteKey || entity.id;
    var sprites = DuelHeroSprites.sprites[spriteKey] || (DuelEnemySprites.sprites[spriteKey] ? DuelEnemySprites.sprites[spriteKey] : null);
    if (!sprites) return;

    var frameKey = entity.state;
    if (!sprites[frameKey]) frameKey = "idle";
    var frame = sprites[frameKey];
    if (!frame) return;

    var flipX = !entity.facingRight;
    var cacheKey = spriteKey + "_" + frameKey;
    var cached;
    if (DuelHeroSprites.sprites[spriteKey]) {
      cached = DuelHeroSprites.getCached(cacheKey, frame, S, flipX);
    } else {
      cached = DuelEnemySprites.getCached(cacheKey, frame, S, flipX);
    }

    if (entity.isShadow) ctx.globalAlpha = 0.35;
    ctx.drawImage(cached, Math.floor(entity.x), Math.floor(entity.y));
    ctx.globalAlpha = 1;

    DuelStatus.render(ctx, entity);
  }

  function renderTelegraphs() {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.showTelegraph && e.hp > 0) {
        ctx.fillStyle = "#ff4444"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
        ctx.fillText("!", e.x + e.w * S / 2, e.y - 10);
        ctx.textAlign = "left";
      }
    }
  }

  function renderHUD() {
    /* Player HP */
    drawBar(10, 10, 200, 14, Math.max(0, player.hp), player.maxHp, "#2d8a4e");
    ctx.fillStyle = "#e8e6f0"; ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
    var heroName = DuelHeroDefs.getById(selectedHero);
    ctx.fillText(heroName ? heroName.name : selectedHero, 10, 36);

    for (var i = 0; i < player.maxSpecialCharges; i++) {
      ctx.fillStyle = i < player.specialCharges ? "#d4a017" : "#2a2845";
      ctx.fillRect(10 + i * 14, 42, 10, 8);
    }

    /* Enemy HP */
    var e = enemies[0];
    if (e && e.hp > 0) {
      drawBar(CW - 210, 10, 200, 14, Math.max(0, e.hp), e.maxHp, "#c93030");
      ctx.textAlign = "right"; ctx.fillStyle = "#e8e6f0"; ctx.font = "bold 10px monospace";
      ctx.fillText(e.name, CW - 10, 36);

      ctx.fillStyle = "#d4a017"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(e.weakness, CW / 2, CH - 8);
    }

    /* Controls hint */
    if (controlsHintTimer > 0) {
      ctx.globalAlpha = Math.min(1, controlsHintTimer / 2) * 0.5;
      ctx.fillStyle = "#e8e6f0"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText("WASD:Move  S:Duck  Space:Attack  Shift:Block  E:Special  Q:Flee", CW / 2, CH - 22);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "left";
  }

  function renderBattleHUD() {
    renderHUD();
    /* Wave indicator */
    ctx.fillStyle = "#d4a017"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("Wave " + (DuelWaves.getCurrentWave() + 1) + "/" + DuelWaves.getTotalWaves(), CW / 2, 16);
    ctx.textAlign = "left";
  }

  function drawBar(x, y, w, h, val, max, color) {
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(x, y, w, h);
    var pct = max > 0 ? val / max : 0;
    ctx.fillStyle = color; ctx.fillRect(x, y, Math.floor(w * pct), h);
    ctx.strokeStyle = "#2a2845"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#e8e6f0"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
    ctx.fillText(Math.ceil(val) + "/" + max, x + w / 2, y + h - 3);
    ctx.textAlign = "left";
  }
})();

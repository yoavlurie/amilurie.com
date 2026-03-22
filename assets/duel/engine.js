/* ============================================
   Mythic Duel — Game Engine
   Game loop, rendering, physics, state machine,
   menus, HUD, and progression.
   ============================================ */

(function () {
  "use strict";

  var canvas, ctx;
  var CW = 720, CH = 400;
  var S; /* pixel scale from sprites */

  /* ---- Game state ---- */
  var gameState = "SELECT"; /* SELECT, LEVEL, PLAYING, VICTORY, DEFEAT, PAUSED */
  var lastTime = 0;

  /* ---- Player & enemy ---- */
  var player = null;
  var enemy = null;
  var arena = null;
  var selectedHero = "percy";
  var currentLevel = 0;

  /* ---- Physics constants ---- */
  var GRAVITY = 900;
  var JUMP_VEL = -380;
  var ATTACK_DURATION = 0.25;
  var ATTACK_COOLDOWN = 0.45;
  var BLOCK_SLOWDOWN = 0.3;

  /* ---- Progression ---- */
  var SAVE_KEY = "amilurie_duel_progress";
  var progress = loadProgress();

  /* ---- Menu state ---- */
  var selectIndex = 0;
  var levelIndex = 0;
  var heroKeys = ["percy", "jason", "magnus"];
  var controlsHintTimer = 5;

  /* ---- Persistence ---- */
  function loadProgress() {
    try {
      var d = JSON.parse(localStorage.getItem(SAVE_KEY));
      return d || { unlocked: 1 };
    } catch (e) {
      return { unlocked: 1 };
    }
  }

  function saveProgress() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  }

  /* ================================================
     INIT
     ================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    S = DuelSprites.SCALE;
    DuelCombat.setScale(S);
    DuelControls.init();

    /* Focus canvas for keyboard input */
    canvas.focus();
    canvas.addEventListener("click", function () { canvas.focus(); });

    /* Start game loop */
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  });

  /* ================================================
     GAME LOOP
     ================================================ */
  function gameLoop(timestamp) {
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    dt = Math.min(dt, 0.05);

    DuelControls.updateFrame();

    switch (gameState) {
      case "SELECT":  updateSelect(dt);  break;
      case "LEVEL":   updateLevel(dt);   break;
      case "PLAYING": updatePlaying(dt); break;
      case "VICTORY": updateResult(dt);  break;
      case "DEFEAT":  updateResult(dt);  break;
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  /* ================================================
     CHARACTER SELECT
     ================================================ */
  function updateSelect(dt) {
    if (DuelControls.isJustPressed("right")) {
      selectIndex = (selectIndex + 1) % heroKeys.length;
    }
    if (DuelControls.isJustPressed("left")) {
      selectIndex = (selectIndex + heroKeys.length - 1) % heroKeys.length;
    }
    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      selectedHero = heroKeys[selectIndex];
      gameState = "LEVEL";
      levelIndex = Math.min(progress.unlocked - 1, DuelEnemies.roster.length - 1);
    }
  }

  function renderSelect() {
    /* Background */
    ctx.fillStyle = "#0f0e17";
    ctx.fillRect(0, 0, CW, CH);

    /* Title */
    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Choose Your Hero", CW / 2, 50);

    /* Hero cards */
    var cardW = 180, cardH = 260, gap = 30;
    var totalW = heroKeys.length * cardW + (heroKeys.length - 1) * gap;
    var startX = (CW - totalW) / 2;

    for (var i = 0; i < heroKeys.length; i++) {
      var key = heroKeys[i];
      var hero = DuelSprites.heroes[key];
      var cx = startX + i * (cardW + gap);
      var selected = i === selectIndex;

      /* Card bg */
      ctx.fillStyle = selected ? "#1a1930" : "#12111f";
      ctx.strokeStyle = selected ? hero.color : "#2a2845";
      ctx.lineWidth = selected ? 3 : 1;
      roundRect(ctx, cx, 70, cardW, cardH, 8);

      /* Hero sprite */
      var sprite = DuelSprites.getCached(key + "_idle", hero.frames.idle, S, false);
      var sx = cx + (cardW - sprite.width) / 2;
      ctx.drawImage(sprite, sx, 90);

      /* Name */
      ctx.fillStyle = selected ? "#e8e6f0" : "#9a96b0";
      ctx.font = "bold 14px monospace";
      ctx.fillText(hero.name, cx + cardW / 2, 210);

      /* Description */
      ctx.font = "11px monospace";
      ctx.fillStyle = "#9a96b0";
      ctx.fillText(hero.desc, cx + cardW / 2, 230);

      /* Special */
      ctx.fillStyle = "#d4a017";
      ctx.font = "10px monospace";
      ctx.fillText("Special: " + hero.specialName, cx + cardW / 2, 250);

      /* Stats */
      ctx.fillStyle = "#6a6a8a";
      ctx.font = "9px monospace";
      var stats = "HP:" + hero.stats.hp + " ATK:" + hero.stats.atk + " DEF:" + hero.stats.def;
      ctx.fillText(stats, cx + cardW / 2, 270);

      /* Selection indicator */
      if (selected) {
        ctx.fillStyle = hero.color;
        ctx.fillRect(cx + cardW / 2 - 15, 340, 30, 4);
      }
    }

    /* Instructions */
    ctx.fillStyle = "#6a6a8a";
    ctx.font = "11px monospace";
    ctx.fillText("Arrow Keys to select \u2022 Space to confirm", CW / 2, 380);

    ctx.textAlign = "left";
  }

  /* ================================================
     LEVEL SELECT
     ================================================ */
  function updateLevel(dt) {
    if (DuelControls.isJustPressed("right")) {
      levelIndex = Math.min(levelIndex + 1, Math.min(progress.unlocked - 1, DuelEnemies.roster.length - 1));
    }
    if (DuelControls.isJustPressed("left")) {
      levelIndex = Math.max(levelIndex - 1, 0);
    }
    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      startLevel(levelIndex);
    }
    if (DuelControls.isJustPressed("block")) {
      gameState = "SELECT";
    }
  }

  function renderLevel() {
    ctx.fillStyle = "#0f0e17";
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Choose Your Opponent", CW / 2, 40);

    var cols = 5;
    var cellW = 120, cellH = 60, gap = 12;
    var totalW = cols * cellW + (cols - 1) * gap;
    var startX = (CW - totalW) / 2;

    for (var i = 0; i < DuelEnemies.roster.length; i++) {
      var e = DuelEnemies.roster[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = startX + col * (cellW + gap);
      var cy = 60 + row * (cellH + gap + 10);
      var unlocked = i < progress.unlocked;
      var selected = i === levelIndex;

      ctx.fillStyle = selected ? "#1a1930" : "#12111f";
      ctx.strokeStyle = selected ? "#8b7fd4" : (unlocked ? "#2a2845" : "#1a1a28");
      ctx.lineWidth = selected ? 2 : 1;
      roundRect(ctx, cx, cy, cellW, cellH, 6);

      if (unlocked) {
        /* Enemy sprite small */
        var esprites = DuelSprites.enemySprites[e.id];
        if (esprites) {
          var es = DuelSprites.getCached(e.id + "_idle_sm", esprites.idle, 2, false);
          ctx.drawImage(es, cx + 4, cy + 4);
        }

        ctx.fillStyle = selected ? "#e8e6f0" : "#9a96b0";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(e.name, cx + 38, cy + 22);
        ctx.font = "9px monospace";
        ctx.fillStyle = "#6a6a8a";
        ctx.fillText(e.subtitle, cx + 38, cy + 36);

        /* Beaten check */
        if (i < progress.unlocked - 1) {
          ctx.fillStyle = "#2d8a4e";
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "right";
          ctx.fillText("\u2713", cx + cellW - 8, cy + 22);
        }
      } else {
        ctx.fillStyle = "#3a3a4a";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("?", cx + cellW / 2, cy + cellH / 2 + 6);
      }
    }

    /* Selected enemy info */
    var sel = DuelEnemies.roster[levelIndex];
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 16px monospace";
    ctx.fillText(sel.name + " \u2014 " + sel.subtitle, CW / 2, 220);
    ctx.fillStyle = "#9a96b0";
    ctx.font = "11px monospace";
    ctx.fillText("HP:" + sel.hp + " ATK:" + sel.atk + " DEF:" + sel.def, CW / 2, 240);
    ctx.fillStyle = "#d4a017";
    ctx.font = "10px monospace";
    ctx.fillText("Weakness: " + sel.weakness, CW / 2, 260);

    /* Hero reminder */
    var hero = DuelSprites.heroes[selectedHero];
    ctx.fillStyle = "#6a6a8a";
    ctx.font = "10px monospace";
    ctx.fillText("Playing as: " + hero.name, CW / 2, 300);

    ctx.fillStyle = "#6a6a8a";
    ctx.font = "11px monospace";
    ctx.fillText("Arrows to select \u2022 Space to fight \u2022 Shift to go back", CW / 2, 380);

    ctx.textAlign = "left";
  }

  /* ================================================
     START LEVEL
     ================================================ */
  function startLevel(idx) {
    currentLevel = idx;
    var data = DuelEnemies.roster[idx];
    arena = DuelEnemies.arenas[data.id];
    var heroData = DuelSprites.heroes[selectedHero];

    /* Create player */
    player = {
      x: arena.spawnPlayer.x, y: arena.spawnPlayer.y,
      vx: 0, vy: 0,
      w: DuelSprites.CHAR_W, h: DuelSprites.CHAR_H,
      hp: heroData.stats.hp, maxHp: heroData.stats.hp,
      atk: heroData.stats.atk, def: heroData.stats.def,
      speed: heroData.stats.speed,
      facingRight: true,
      state: "idle",
      stateTimer: 0,
      attackCooldown: 0,
      iFrames: 0,
      onGround: false,
      heroKey: selectedHero,
      specialCharges: heroData.specialCharges,
      maxSpecialCharges: heroData.specialCharges,
      specialCooldown: 0
    };

    /* Create enemy */
    enemy = DuelEnemies.createEnemy(idx, arena);

    DuelCombat.clearAll();
    controlsHintTimer = 5;
    gameState = "PLAYING";
  }

  /* ================================================
     PLAYING — Update
     ================================================ */
  function updatePlaying(dt) {
    if (!player || !enemy) return;

    controlsHintTimer -= dt;

    /* ---- Pause ---- */
    if (DuelControls.isJustPressed("pause")) {
      gameState = "PAUSED"; return;
    }

    /* ---- Player input ---- */
    updatePlayerInput(dt);

    /* ---- Physics for both ---- */
    updatePhysics(player, dt);
    updatePhysics(enemy, dt);

    /* ---- Enemy AI ---- */
    var aiAction = DuelEnemies.updateAI(enemy, player, dt, arena);
    handleAIAction(aiAction);

    /* ---- Timers ---- */
    updateTimers(player, dt);
    updateTimers(enemy, dt);

    /* ---- Player attack hit check ---- */
    if (player.state === "attack" && player.stateTimer > 0.05 && player.stateTimer < 0.2) {
      var hb = DuelCombat.getAttackHitbox(player);
      var eb = DuelCombat.getEntityBox(enemy);
      if (DuelCombat.rectsOverlap(hb, eb) && enemy.iFrames <= 0) {
        var dmgMult = 1.0;
        /* Shadow enemies take less damage from normal attacks */
        if (enemy.isShadow) dmgMult = 0.2;
        var dmg = Math.max(1, Math.round(player.atk * dmgMult - enemy.def * 0.3 + GameUtils.randomInt(-1, 2)));
        DuelCombat.applyDamage(enemy, dmg, player.x > enemy.x, false);
      }
    }

    /* ---- Water pool interactions ---- */
    checkPoolInteractions(dt);

    /* ---- Percy high-ground bonus for Jason ---- */
    /* (handled in damage calc) */

    /* ---- Magnus passive regen ---- */
    if (selectedHero === "magnus" && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 0.5 * dt);
    }

    /* ---- Combat updates ---- */
    DuelCombat.updateProjectiles(dt, player, enemy, arena);
    DuelCombat.updateParticles(dt);
    DuelCombat.updateDamageNumbers(dt);
    DuelCombat.updateShake(dt);

    /* ---- Win/lose check ---- */
    if (enemy.hp <= 0) {
      gameState = "VICTORY";
      if (currentLevel + 1 >= progress.unlocked && currentLevel + 2 <= DuelEnemies.roster.length) {
        progress.unlocked = currentLevel + 2;
        saveProgress();
      }
    }
    if (player.hp <= 0) {
      gameState = "DEFEAT";
    }
  }

  function updatePlayerInput(dt) {
    if (player.state === "hurt") return;

    /* Movement */
    var moving = false;
    if (player.state !== "attack") {
      if (DuelControls.isAction("left")) {
        player.vx = -player.speed * (player.state === "block" ? BLOCK_SLOWDOWN : 1);
        player.facingRight = false;
        moving = true;
      } else if (DuelControls.isAction("right")) {
        player.vx = player.speed * (player.state === "block" ? BLOCK_SLOWDOWN : 1);
        player.facingRight = true;
        moving = true;
      } else {
        player.vx = 0;
      }
    }

    /* Jump */
    if (DuelControls.isJustPressed("jump") && player.onGround) {
      player.vy = JUMP_VEL;
      player.onGround = false;
    }

    /* Block */
    if (DuelControls.isAction("block") && player.state !== "attack") {
      player.state = "block";
    } else if (player.state === "block") {
      player.state = "idle";
    }

    /* Attack */
    if (DuelControls.isJustPressed("attack") && player.attackCooldown <= 0 && player.state !== "attack") {
      player.state = "attack";
      player.stateTimer = ATTACK_DURATION;
      player.attackCooldown = ATTACK_COOLDOWN;
      player.vx = 0;
    }

    /* Special */
    if (DuelControls.isJustPressed("special") && player.specialCharges > 0 && player.specialCooldown <= 0) {
      player.specialCharges--;
      player.specialCooldown = 3.0;
      var spec = DuelCombat.specials[selectedHero];
      if (spec) spec(player, enemy);
    }

    /* Animation state */
    if (player.state !== "attack" && player.state !== "hurt" && player.state !== "block") {
      player.state = moving ? "walk" : "idle";
    }
  }

  function handleAIAction(action) {
    if (!action) return;

    var S2 = DuelSprites.SCALE;

    if (action === "melee") {
      var hb = DuelCombat.getAttackHitbox(enemy);
      var pb = DuelCombat.getEntityBox(player);
      if (DuelCombat.rectsOverlap(hb, pb)) {
        var dmg = Math.max(1, Math.round(enemy.atk - player.def * 0.3 + GameUtils.randomInt(-1, 2)));
        DuelCombat.applyDamage(player, dmg, enemy.x > player.x, player.state === "block");
      }
    }

    if (action === "charge_hit") {
      var chb = { x: enemy.x - 10, y: enemy.y, w: enemy.w * S2 + 20, h: enemy.h * S2 };
      var cpb = DuelCombat.getEntityBox(player);
      if (DuelCombat.rectsOverlap(chb, cpb)) {
        var cdmg = Math.max(1, Math.round(enemy.atk * 1.3 - player.def * 0.2 + GameUtils.randomInt(0, 3)));
        DuelCombat.applyDamage(player, cdmg, enemy.x > player.x, player.state === "block");
      }
    }

    if (action === "ranged") {
      /* Medusa gaze projectile */
      var dir = player.x > enemy.x ? 1 : -1;
      DuelCombat.spawnProjectile({
        x: enemy.x + (dir > 0 ? enemy.w * S2 : -16),
        y: enemy.y + 6 * S2,
        vx: dir * 200,
        vy: 0,
        w: 16, h: 12,
        damage: enemy.atk,
        color: "#4aaa4a",
        life: 2.0,
        fromPlayer: false
      });
    }

    if (action === "cast_storm") {
      /* Set's storm — area damage zones */
      for (var i = 0; i < 3; i++) {
        var sx = 50 + Math.random() * (arena.width - 100);
        DuelCombat.spawnProjectile({
          x: sx, y: 0,
          vx: 0, vy: 180,
          w: 40, h: 30,
          damage: Math.round(enemy.atk * 0.8),
          color: "#e85020",
          life: 2.5,
          fromPlayer: false
        });
      }
      DuelCombat.spawnSpecialParticles(enemy.x, enemy.y, "#e85020", 8);
    }
  }

  /* ---- Physics ---- */
  function updatePhysics(entity, dt) {
    entity.vy += GRAVITY * dt;
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
    if (entity.vy > 0) {
      for (var i = 0; i < arena.platforms.length; i++) {
        var p = arena.platforms[i];
        var ew = entity.w * S;
        var prevFeet = feet - entity.vy * dt;
        if (prevFeet <= p.y && feet >= p.y &&
            entity.x + ew > p.x && entity.x < p.x + p.w) {
          entity.y = p.y - entity.h * S;
          entity.vy = 0;
          entity.onGround = true;
        }
      }
    }

    /* Obstacles (solid blocks) */
    for (var j = 0; j < arena.obstacles.length; j++) {
      var obs = arena.obstacles[j];
      var eBox = { x: entity.x, y: entity.y, w: entity.w * S, h: entity.h * S };
      if (DuelCombat.rectsOverlap(eBox, obs)) {
        /* Push out horizontally */
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

  function checkPoolInteractions(dt) {
    for (var i = 0; i < arena.pools.length; i++) {
      var pool = arena.pools[i];
      var pBox = DuelCombat.getEntityBox(player);
      var poolBox = { x: pool.x, y: pool.y, w: pool.w, h: pool.h + 20 };

      if (DuelCombat.rectsOverlap(pBox, poolBox)) {
        if (selectedHero === "percy") {
          player.hp = Math.min(player.maxHp, player.hp + 2 * dt);
        } else {
          player.vx *= 0.7;
        }
      }

      var eBox = DuelCombat.getEntityBox(enemy);
      if (DuelCombat.rectsOverlap(eBox, poolBox)) {
        enemy.vx *= 0.6;
      }
    }
  }

  function updateTimers(entity, dt) {
    if (entity.stateTimer > 0) {
      entity.stateTimer -= dt;
      if (entity.stateTimer <= 0) {
        if (entity.state === "attack" || entity.state === "hurt") {
          entity.state = "idle";
        }
      }
    }
    if (entity.attackCooldown > 0) entity.attackCooldown -= dt;
    if (entity.iFrames > 0) entity.iFrames -= dt;
    if (entity.specialCooldown !== undefined && entity.specialCooldown > 0) {
      entity.specialCooldown -= dt;
    }
  }

  /* ================================================
     VICTORY / DEFEAT
     ================================================ */
  function updateResult(dt) {
    if (DuelControls.isJustPressed("confirm") || DuelControls.isJustPressed("attack")) {
      if (gameState === "VICTORY" && currentLevel + 1 < DuelEnemies.roster.length) {
        gameState = "LEVEL";
        levelIndex = currentLevel + 1;
      } else {
        gameState = "LEVEL";
      }
    }
  }

  /* ================================================
     RENDER
     ================================================ */
  function render() {
    ctx.clearRect(0, 0, CW, CH);

    switch (gameState) {
      case "SELECT": renderSelect(); break;
      case "LEVEL":  renderLevel();  break;
      case "PLAYING": renderPlaying(); break;
      case "VICTORY": renderResultScreen(true); break;
      case "DEFEAT":  renderResultScreen(false); break;
    }
  }

  function renderPlaying() {
    var shake = DuelCombat.getShake();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    renderArena();
    renderEntity(enemy, enemy.id);
    renderEntity(player, selectedHero);
    renderTelegraph();
    DuelCombat.renderProjectiles(ctx);
    DuelCombat.renderParticles(ctx);
    DuelCombat.renderDamageNumbers(ctx);

    ctx.restore();
    renderHUD();
  }

  /* ---- Arena rendering ---- */
  function renderArena() {
    /* Sky gradient */
    var grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, arena.bgTop);
    grad.addColorStop(1, arena.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    /* Ground */
    ctx.fillStyle = arena.groundColor;
    ctx.fillRect(0, arena.groundY, CW, CH - arena.groundY);
    /* Ground line */
    ctx.fillStyle = lighten(arena.groundColor, 20);
    ctx.fillRect(0, arena.groundY, CW, 2);

    /* Platforms */
    for (var i = 0; i < arena.platforms.length; i++) {
      var p = arena.platforms[i];
      ctx.fillStyle = lighten(arena.groundColor, 15);
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = lighten(arena.groundColor, 30);
      ctx.fillRect(p.x, p.y, p.w, 2);
    }

    /* Obstacles */
    for (var j = 0; j < arena.obstacles.length; j++) {
      var obs = arena.obstacles[j];
      ctx.fillStyle = "#5a5a4a";
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = "#6a6a5a";
      ctx.fillRect(obs.x, obs.y, obs.w, 3);
      ctx.fillStyle = "#4a4a3a";
      ctx.fillRect(obs.x, obs.y + obs.h - 3, obs.w, 3);
    }

    /* Water pools */
    for (var k = 0; k < arena.pools.length; k++) {
      var pool = arena.pools[k];
      ctx.fillStyle = "rgba(42, 90, 138, 0.5)";
      ctx.fillRect(pool.x, pool.y, pool.w, pool.h);
      /* Shimmer */
      ctx.fillStyle = "rgba(100, 180, 255, 0.3)";
      var shimmerX = pool.x + (Math.sin(lastTime / 300) + 1) * pool.w / 4;
      ctx.fillRect(shimmerX, pool.y, pool.w / 4, 2);
    }
  }

  /* ---- Entity rendering ---- */
  function renderEntity(entity, spriteKey) {
    if (entity.iFrames > 0 && Math.floor(entity.iFrames * 20) % 2 === 0) return; /* flash */

    var sprites;
    if (DuelSprites.heroes[spriteKey]) {
      sprites = DuelSprites.heroes[spriteKey].frames;
    } else {
      sprites = DuelSprites.enemySprites[spriteKey];
    }
    if (!sprites) return;

    var frameKey = entity.state;
    if (frameKey === "walk" && !sprites.walk) frameKey = "idle";
    if (frameKey === "block" && !sprites.block) frameKey = "idle";
    if (!sprites[frameKey]) frameKey = "idle";

    var frame = sprites[frameKey];
    var flipX = !entity.facingRight;
    var cacheKey = spriteKey + "_" + frameKey;
    var cached = DuelSprites.getCached(cacheKey, frame, S, flipX);

    /* Shadow form for Nyx */
    if (entity.isShadow) {
      ctx.globalAlpha = 0.35;
    }

    ctx.drawImage(cached, Math.floor(entity.x), Math.floor(entity.y));
    ctx.globalAlpha = 1;
  }

  /* ---- Telegraph indicator ---- */
  function renderTelegraph() {
    if (enemy && enemy.showTelegraph) {
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("!", enemy.x + enemy.w * S / 2, enemy.y - 10);
      ctx.textAlign = "left";
    }
  }

  /* ---- HUD ---- */
  function renderHUD() {
    /* Player health */
    drawBar(10, 10, 200, 14, Math.max(0, player.hp), player.maxHp, "#2d8a4e");
    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 10px monospace";
    ctx.fillText(DuelSprites.heroes[selectedHero].name, 10, 36);

    /* Special charges */
    for (var i = 0; i < player.maxSpecialCharges; i++) {
      ctx.fillStyle = i < player.specialCharges ? "#d4a017" : "#2a2845";
      ctx.fillRect(10 + i * 14, 42, 10, 8);
    }

    /* Enemy health */
    drawBar(CW - 210, 10, 200, 14, Math.max(0, enemy.hp), enemy.maxHp, "#c93030");
    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(enemy.name, CW - 10, 36);
    ctx.textAlign = "left";

    /* Weakness hint */
    ctx.fillStyle = "#d4a017";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(enemy.weakness, CW / 2, CH - 8);
    ctx.textAlign = "left";

    /* Controls hint (fades) */
    if (controlsHintTimer > 0) {
      var alpha = Math.min(1, controlsHintTimer / 2);
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = "#e8e6f0";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("WASD:Move  Space:Attack  Shift:Block  E:Special", CW / 2, CH - 22);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
  }

  function drawBar(x, y, w, h, val, max, color) {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(x, y, w, h);
    var pct = max > 0 ? val / max : 0;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.floor(w * pct), h);
    ctx.strokeStyle = "#2a2845";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(val) + "/" + max, x + w / 2, y + h - 3);
    ctx.textAlign = "left";
  }

  /* ---- Result screen ---- */
  function renderResultScreen(victory) {
    /* Draw game state behind */
    renderPlaying();

    /* Overlay */
    ctx.fillStyle = victory ? "rgba(15, 14, 23, 0.75)" : "rgba(30, 10, 10, 0.8)";
    ctx.fillRect(0, 0, CW, CH);

    ctx.textAlign = "center";

    if (victory) {
      ctx.fillStyle = "#2d8a4e";
      ctx.font = "bold 36px monospace";
      ctx.fillText("VICTORY!", CW / 2, 140);

      ctx.fillStyle = "#e8e6f0";
      ctx.font = "14px monospace";
      ctx.fillText(enemy.name + " has been defeated!", CW / 2, 180);

      if (currentLevel + 1 < DuelEnemies.roster.length) {
        var next = DuelEnemies.roster[currentLevel + 1];
        ctx.fillStyle = "#d4a017";
        ctx.font = "12px monospace";
        ctx.fillText("Next: " + next.name + " \u2014 " + next.subtitle, CW / 2, 220);
      } else {
        ctx.fillStyle = "#d4a017";
        ctx.font = "14px monospace";
        ctx.fillText("You defeated all 10 villains!", CW / 2, 220);
      }
    } else {
      ctx.fillStyle = "#c93030";
      ctx.font = "bold 36px monospace";
      ctx.fillText("DEFEATED", CW / 2, 140);

      ctx.fillStyle = "#e8e6f0";
      ctx.font = "14px monospace";
      ctx.fillText(enemy.name + " overwhelms you...", CW / 2, 180);

      ctx.fillStyle = "#9a96b0";
      ctx.font = "12px monospace";
      ctx.fillText("But legends never truly die.", CW / 2, 210);
    }

    ctx.fillStyle = "#6a6a8a";
    ctx.font = "11px monospace";
    ctx.fillText("Press Space to continue", CW / 2, 300);

    ctx.textAlign = "left";
  }

  /* ---- Utility: rounded rectangle ---- */
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

  /* ---- Utility: lighten a hex color ---- */
  function lighten(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

})();

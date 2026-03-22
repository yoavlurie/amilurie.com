/* ============================================
   Mythic Duel — Enemies Module
   Enemy roster, AI state machines, arena layouts
   ============================================ */

var DuelEnemies = (function () {
  "use strict";

  /* ---- Arena layouts per enemy ---- */
  /* Each arena: width, height, groundY, background colors,
     platforms, obstacles (rocks), pools (water) */
  var arenas = {
    chimera: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a0a00", bgBot: "#3a2a1a", groundColor: "#4a3a20",
      platforms: [
        { x: 180, y: 260, w: 100, h: 10 },
        { x: 440, y: 280, w: 100, h: 10 }
      ],
      obstacles: [
        { x: 340, y: 310, w: 40, h: 40 }
      ],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 580, y: 250 }
    },
    cerberus: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a0a1a", bgBot: "#1a1a3a", groundColor: "#2a2a3a",
      platforms: [
        { x: 100, y: 240, w: 80, h: 10 },
        { x: 320, y: 220, w: 80, h: 10 },
        { x: 540, y: 240, w: 80, h: 10 }
      ],
      obstacles: [
        { x: 0, y: 300, w: 30, h: 50 },
        { x: 690, y: 300, w: 30, h: 50 }
      ],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    loki: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a1a0a", bgBot: "#1a3a2a", groundColor: "#2a3a2a",
      platforms: [
        { x: 150, y: 250, w: 90, h: 10 },
        { x: 480, y: 250, w: 90, h: 10 }
      ],
      obstacles: [
        { x: 330, y: 290, w: 60, h: 60 }
      ],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    medusa: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a1a0a", bgBot: "#1a2a1a", groundColor: "#3a4a3a",
      platforms: [
        { x: 200, y: 260, w: 80, h: 10 },
        { x: 440, y: 240, w: 80, h: 10 }
      ],
      obstacles: [
        { x: 320, y: 290, w: 50, h: 60 }
      ],
      pools: [
        { x: 100, y: 340, w: 80, h: 10 }
      ],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    sobek: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a1a00", bgBot: "#3a3a1a", groundColor: "#4a4a2a",
      platforms: [
        { x: 250, y: 270, w: 100, h: 10 }
      ],
      obstacles: [
        { x: 500, y: 310, w: 40, h: 40 }
      ],
      pools: [
        { x: 80, y: 340, w: 120, h: 10 },
        { x: 520, y: 340, w: 120, h: 10 }
      ],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    set: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a0a00", bgBot: "#3a1a0a", groundColor: "#5a3a1a",
      platforms: [
        { x: 120, y: 250, w: 90, h: 10 },
        { x: 350, y: 230, w: 90, h: 10 },
        { x: 540, y: 260, w: 90, h: 10 }
      ],
      obstacles: [],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    nyx: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#050510", bgBot: "#101028", groundColor: "#1a1a30",
      platforms: [
        { x: 160, y: 260, w: 80, h: 10 },
        { x: 480, y: 260, w: 80, h: 10 }
      ],
      obstacles: [
        { x: 310, y: 300, w: 50, h: 50 }
      ],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    apophis: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a0a00", bgBot: "#2a1a0a", groundColor: "#4a3a20",
      platforms: [
        { x: 100, y: 250, w: 80, h: 10 },
        { x: 300, y: 230, w: 80, h: 10 },
        { x: 500, y: 250, w: 80, h: 10 }
      ],
      obstacles: [],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    kronos: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#0a0a1a", bgBot: "#1a1a2a", groundColor: "#2a2a40",
      platforms: [
        { x: 200, y: 250, w: 100, h: 10 },
        { x: 420, y: 270, w: 100, h: 10 }
      ],
      obstacles: [
        { x: 150, y: 310, w: 40, h: 40 },
        { x: 530, y: 310, w: 40, h: 40 }
      ],
      pools: [],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    },
    typhon: {
      width: 720, height: 400, groundY: 350,
      bgTop: "#1a0500", bgBot: "#3a1500", groundColor: "#4a2a10",
      platforms: [
        { x: 80, y: 240, w: 80, h: 10 },
        { x: 300, y: 220, w: 120, h: 10 },
        { x: 560, y: 240, w: 80, h: 10 }
      ],
      obstacles: [
        { x: 200, y: 310, w: 40, h: 40 },
        { x: 480, y: 310, w: 40, h: 40 }
      ],
      pools: [
        { x: 320, y: 340, w: 80, h: 10 }
      ],
      spawnPlayer: { x: 80, y: 250 },
      spawnEnemy: { x: 560, y: 250 }
    }
  };

  /* ---- Enemy roster (easiest to hardest) ---- */
  var roster = [
    {
      id: "chimera", name: "Chimera", subtitle: "The Three-Formed",
      hp: 80, atk: 8, def: 3, speed: 70,
      aiType: "basic",
      telegraphTime: 1.0, attackCooldown: 1.8, retreatTime: 0.8,
      weakness: "Attack from behind while it charges",
      weaknessKey: "dodge_attack"
    },
    {
      id: "cerberus", name: "Cerberus", subtitle: "Hound of Hades",
      hp: 90, atk: 10, def: 3, speed: 130,
      aiType: "charger",
      telegraphTime: 0.8, attackCooldown: 1.5, retreatTime: 0.6,
      weakness: "Stunned after charging into walls",
      weaknessKey: "wall_stun"
    },
    {
      id: "loki", name: "Loki", subtitle: "The Trickster",
      hp: 85, atk: 11, def: 4, speed: 100,
      aiType: "teleporter",
      telegraphTime: 0.7, attackCooldown: 1.4, retreatTime: 0.5,
      weakness: "Vulnerable for a moment after teleporting",
      weaknessKey: "after_teleport"
    },
    {
      id: "medusa", name: "Medusa", subtitle: "The Gorgon",
      hp: 75, atk: 13, def: 3, speed: 80,
      aiType: "ranged",
      telegraphTime: 0.9, attackCooldown: 2.0, retreatTime: 0.7,
      weakness: "Block her gaze to stun her",
      weaknessKey: "reflect_gaze"
    },
    {
      id: "sobek", name: "Sobek", subtitle: "Crocodile God",
      hp: 110, atk: 14, def: 5, speed: 65,
      aiType: "heavy",
      telegraphTime: 1.0, attackCooldown: 2.2, retreatTime: 1.0,
      weakness: "Slowed and weakened in water pools",
      weaknessKey: "water_weak"
    },
    {
      id: "set", name: "Set", subtitle: "Lord of Chaos",
      hp: 100, atk: 12, def: 6, speed: 90,
      aiType: "caster",
      telegraphTime: 0.8, attackCooldown: 1.6, retreatTime: 0.6,
      weakness: "Stationary while summoning storms",
      weaknessKey: "casting_open"
    },
    {
      id: "nyx", name: "Nyx", subtitle: "Primordial Night",
      hp: 90, atk: 13, def: 8, speed: 95,
      aiType: "phaser",
      telegraphTime: 0.6, attackCooldown: 1.4, retreatTime: 0.5,
      weakness: "Only fully hittable when she attacks",
      weaknessKey: "attack_window"
    },
    {
      id: "apophis", name: "Apophis", subtitle: "Chaos Serpent",
      hp: 105, atk: 14, def: 4, speed: 140,
      aiType: "charger",
      telegraphTime: 0.6, attackCooldown: 1.2, retreatTime: 0.5,
      weakness: "Slides past you — attack from behind",
      weaknessKey: "dodge_attack"
    },
    {
      id: "kronos", name: "Kronos", subtitle: "Lord of Time",
      hp: 120, atk: 12, def: 8, speed: 85,
      aiType: "debuffer",
      telegraphTime: 0.5, attackCooldown: 1.5, retreatTime: 0.6,
      weakness: "Time-slow has a long recharge — rush him",
      weaknessKey: "cooldown_window"
    },
    {
      id: "typhon", name: "Typhon", subtitle: "Father of Monsters",
      hp: 150, atk: 16, def: 7, speed: 75,
      aiType: "boss",
      telegraphTime: 0.5, attackCooldown: 1.2, retreatTime: 0.4,
      weakness: "Changes phases at 75%, 50%, 25% HP — brief opening each time",
      weaknessKey: "phase_change"
    }
  ];

  /* ---- AI Update ---- */
  /* Returns the enemy's intended action for this frame */
  function updateAI(enemy, player, dt, arena) {
    enemy.aiTimer -= dt;
    enemy.aiCooldown -= dt;
    if (enemy.aiCooldown < 0) enemy.aiCooldown = 0;

    var dist = Math.abs(enemy.x - player.x);
    var attackRange = 24 * DuelSprites.SCALE;
    var S = DuelSprites.SCALE;

    /* Face the player */
    enemy.facingRight = player.x > enemy.x;

    switch (enemy.aiState) {
      case "idle":
        enemy.vx = 0;
        if (enemy.aiCooldown <= 0 && dist < 400) {
          enemy.aiState = "chase";
        }
        break;

      case "chase":
        var dir = player.x > enemy.x ? 1 : -1;
        enemy.vx = dir * enemy.speed;
        if (dist < attackRange && enemy.aiCooldown <= 0) {
          enemy.aiState = "telegraph";
          enemy.aiTimer = enemy.telegraphTime;
          enemy.vx = 0;
          enemy.showTelegraph = true;
        }
        /* Charger type: charge instead of normal attack */
        if (enemy.aiType === "charger" && dist < 250 && dist > attackRange && enemy.aiCooldown <= 0) {
          enemy.aiState = "charge";
          enemy.aiTimer = 0.6;
          enemy.vx = dir * enemy.speed * 2.5;
          enemy.showTelegraph = true;
        }
        /* Teleporter type */
        if (enemy.aiType === "teleporter" && dist < 300 && enemy.aiCooldown <= 0 && Math.random() < 0.02) {
          enemy.aiState = "teleport";
          enemy.aiTimer = 0.4;
          enemy.vx = 0;
        }
        /* Ranged type: keep distance and shoot */
        if (enemy.aiType === "ranged" && dist < 200) {
          enemy.aiState = "retreat_shoot";
          enemy.aiTimer = 0.5;
        }
        /* Caster type: summon storm */
        if (enemy.aiType === "caster" && enemy.aiCooldown <= 0 && Math.random() < 0.01) {
          enemy.aiState = "cast";
          enemy.aiTimer = 1.2;
          enemy.vx = 0;
        }
        /* Phaser type: go shadow */
        if (enemy.aiType === "phaser" && enemy.aiCooldown <= 0 && Math.random() < 0.01) {
          enemy.isShadow = true;
          enemy.shadowTimer = 2.0;
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
          enemy.aiCooldown = enemy.attackCooldown;
          return "melee"; /* signal engine to check hit */
        }
        break;

      case "charge":
        if (enemy.aiTimer <= 0) {
          /* Check if hit a wall */
          if (enemy.x <= 5 || enemy.x >= arena.width - enemy.w * S - 5) {
            enemy.aiState = "stunned";
            enemy.aiTimer = 1.2;
            enemy.vx = 0;
            enemy.showTelegraph = false;
          } else {
            enemy.aiState = "retreat";
            enemy.aiTimer = enemy.retreatTime;
          }
          enemy.aiCooldown = enemy.attackCooldown;
          enemy.showTelegraph = false;
          return "charge_hit";
        }
        break;

      case "stunned":
        enemy.vx = 0;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "idle";
          enemy.aiCooldown = 0.5;
        }
        break;

      case "retreat":
        var awayDir = player.x > enemy.x ? -1 : 1;
        enemy.vx = awayDir * enemy.speed * 0.5;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "idle";
          enemy.showTelegraph = false;
        }
        break;

      case "teleport":
        enemy.vx = 0;
        if (enemy.aiTimer <= 0) {
          /* Teleport to a random position near player */
          var side = Math.random() < 0.5 ? -1 : 1;
          enemy.x = GameUtils.clamp(player.x + side * (80 + Math.random() * 60), 20, arena.width - enemy.w * S - 20);
          enemy.aiState = "telegraph";
          enemy.aiTimer = 0.3; /* short telegraph after teleport */
          enemy.aiCooldown = 0;
          enemy.showTelegraph = true;
          DuelCombat.spawnSpecialParticles(enemy.x, enemy.y, "#3a8a3a", 6);
        }
        break;

      case "retreat_shoot":
        var runDir = player.x > enemy.x ? -1 : 1;
        enemy.vx = runDir * enemy.speed * 0.6;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "idle";
          enemy.aiCooldown = enemy.attackCooldown;
          return "ranged"; /* signal to fire projectile */
        }
        break;

      case "cast":
        enemy.vx = 0;
        enemy.showTelegraph = true;
        if (enemy.aiTimer <= 0) {
          enemy.aiState = "idle";
          enemy.aiCooldown = enemy.attackCooldown * 1.5;
          enemy.showTelegraph = false;
          return "cast_storm";
        }
        break;
    }

    /* Phaser shadow timer */
    if (enemy.isShadow) {
      enemy.shadowTimer -= dt;
      if (enemy.shadowTimer <= 0) {
        enemy.isShadow = false;
        enemy.aiCooldown = 1.5;
      }
    }

    return null;
  }

  /* ---- Create enemy entity from roster data ---- */
  function createEnemy(levelIndex, arena) {
    var data = roster[levelIndex];
    var spawn = arena.spawnEnemy;
    return {
      x: spawn.x, y: spawn.y,
      vx: 0, vy: 0,
      w: DuelSprites.CHAR_W, h: DuelSprites.CHAR_H,
      hp: data.hp, maxHp: data.hp,
      atk: data.atk, def: data.def,
      speed: data.speed,
      facingRight: false,
      state: "idle",
      stateTimer: 0,
      iFrames: 0,
      onGround: false,
      /* AI fields */
      aiState: "idle",
      aiTimer: 1.0,
      aiCooldown: 1.0,
      aiType: data.aiType,
      telegraphTime: data.telegraphTime,
      attackCooldown: data.attackCooldown,
      retreatTime: data.retreatTime,
      showTelegraph: false,
      /* Special states */
      isShadow: false,
      shadowTimer: 0,
      /* Data ref */
      id: data.id,
      name: data.name,
      subtitle: data.subtitle,
      weakness: data.weakness
    };
  }

  return {
    arenas: arenas,
    roster: roster,
    updateAI: updateAI,
    createEnemy: createEnemy
  };
})();

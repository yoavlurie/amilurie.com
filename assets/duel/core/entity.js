/* ============================================
   Mythic Duel — Entity Factory
   Unified entity for heroes AND villains
   ============================================ */

var DuelEntity = (function () {
  "use strict";

  function create(cfg) {
    return {
      x: cfg.x || 0, y: cfg.y || 0,
      vx: 0, vy: 0,
      w: cfg.w || DuelUtils.CHAR_W, h: cfg.h || DuelUtils.CHAR_H,
      onGround: false,
      hp: cfg.hp, maxHp: cfg.hp,
      atk: cfg.atk || 10, def: cfg.def || 5, speed: cfg.speed || 150,
      facingRight: cfg.facingRight !== false,
      state: "idle", stateTimer: 0,
      attackCooldown: 0, iFrames: 0,
      isDucking: false,
      specialCharges: cfg.specialCharges || 0,
      maxSpecialCharges: cfg.specialCharges || 0,
      specialCooldown: 0,
      specialId: cfg.specialId || null,
      statusEffects: [],
      id: cfg.id, name: cfg.name || cfg.id,
      spriteKey: cfg.spriteKey || cfg.id,
      isPlayer: cfg.isPlayer || false,
      /* AI fields */
      aiState: cfg.isPlayer ? null : "idle",
      aiTimer: 1.0, aiCooldown: 1.0,
      aiType: cfg.aiType || "basic",
      telegraphTime: cfg.telegraphTime || 0.8,
      attackCooldownTime: cfg.attackCooldownTime || 1.5,
      retreatTime: cfg.retreatTime || 0.6,
      showTelegraph: false,
      isShadow: false, shadowTimer: 0,
      /* Villain mode flag */
      isVillainPlayer: cfg.isVillainPlayer || false,
      /* Weakness */
      weakness: cfg.weakness || "",
      subtitle: cfg.subtitle || "",
      tier: cfg.tier || 1,
      locationId: cfg.locationId || ""
    };
  }

  function createFromHeroDef(heroDef, x, y, isPlayer) {
    return create({
      x: x, y: y, isPlayer: isPlayer,
      id: heroDef.id, name: heroDef.name,
      spriteKey: heroDef.id,
      hp: heroDef.stats.hp, atk: heroDef.stats.atk,
      def: heroDef.stats.def, speed: heroDef.stats.speed,
      specialCharges: heroDef.specialCharges,
      specialId: heroDef.specialId,
      aiType: "hero_ai"
    });
  }

  function createFromEnemyDef(enemyDef, x, y, asPlayer) {
    return create({
      x: x, y: y, isPlayer: asPlayer || false,
      isVillainPlayer: asPlayer || false,
      id: enemyDef.id, name: enemyDef.name,
      spriteKey: enemyDef.id,
      hp: enemyDef.hp, atk: enemyDef.atk,
      def: enemyDef.def, speed: enemyDef.speed,
      specialCharges: enemyDef.specialCharges || 2,
      specialId: enemyDef.specialId || null,
      aiType: enemyDef.aiType,
      telegraphTime: enemyDef.telegraphTime,
      attackCooldownTime: enemyDef.attackCooldown,
      retreatTime: enemyDef.retreatTime,
      weakness: enemyDef.weakness || "",
      subtitle: enemyDef.subtitle || "",
      tier: enemyDef.tier || 1,
      locationId: enemyDef.locationId || "",
      facingRight: false
    });
  }

  return { create: create, createFromHeroDef: createFromHeroDef, createFromEnemyDef: createFromEnemyDef };
})();

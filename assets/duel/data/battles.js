/* ============================================
   Mythic Duel — Major Battle Definitions
   Multi-wave battles
   ============================================ */

var DuelBattles = (function () {
  "use strict";

  var battles = {
    battle_manhattan: {
      name: "Battle of Manhattan",
      arenaId: "manhattan_wide",
      waves: [
        { enemies: ["kelli", "kelli"], spawnDelay: 0 },
        { enemies: ["procrustes", "kelli"], spawnDelay: 0 },
        { enemies: ["luke"], spawnDelay: 0, isBoss: true }
      ]
    },
    battle_olympus: {
      name: "Siege of Olympus",
      arenaId: "olympus",
      waves: [
        { enemies: ["polybotes"], spawnDelay: 0 },
        { enemies: ["enceladus", "mimas"], spawnDelay: 0 },
        { enemies: ["porphyrion"], spawnDelay: 0, isBoss: true }
      ]
    },
    battle_tower_nero: {
      name: "Tower of Nero",
      arenaId: "new_rome",
      waves: [
        { enemies: ["lityerses"], spawnDelay: 0 },
        { enemies: ["nero"], spawnDelay: 0, isBoss: true }
      ]
    },
    battle_egypt: {
      name: "Battle of the Red Pyramid",
      arenaId: "egypt",
      waves: [
        { enemies: ["sarah_jacobi", "menshikov"], spawnDelay: 0 },
        { enemies: ["set"], spawnDelay: 0, isBoss: true }
      ]
    }
  };

  function get(id) { return battles[id] || null; }

  return { battles: battles, get: get };
})();

/* ============================================
   Mythic Duel — Progression System
   Save/load with v1 migration
   ============================================ */

var DuelProgression = (function () {
  "use strict";

  var SAVE_KEY = "amilurie_duel_v2";
  var data = null;

  function defaultData() {
    return {
      version: 2,
      selectedHero: "percy",
      unlockedHeroes: ["percy", "annabeth", "magnus"],
      currentLocation: "camp_halfblood",
      unlockedLocations: ["camp_halfblood"],
      defeatedEnemies: {},
      unlockedVillains: [],
      quests: {},
      completedBattles: []
    };
  }

  function load() {
    try {
      /* Try v2 first */
      var d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (d && d.version === 2) { data = d; return; }
      /* Try v1 migration */
      var v1 = JSON.parse(localStorage.getItem("amilurie_duel_progress"));
      if (v1 && v1.unlocked) {
        data = defaultData();
        /* Migrate: unlock enemies based on old progress */
        var oldRoster = ["chimera","cerberus","loki","medusa","sobek","set","nyx","apophis","kronos","typhon"];
        for (var i = 0; i < Math.min(v1.unlocked, oldRoster.length); i++) {
          data.defeatedEnemies[oldRoster[i]] = { count: 1 };
        }
        save();
        return;
      }
    } catch (e) { /* ignore */ }
    data = defaultData();
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function get() { if (!data) load(); return data; }

  function isHeroUnlocked(id) { return get().unlockedHeroes.indexOf(id) >= 0; }
  function unlockHero(id) { if (!isHeroUnlocked(id)) { get().unlockedHeroes.push(id); save(); } }

  function isLocationUnlocked(id) {
    if (get().unlockedLocations.indexOf(id) >= 0) return true;
    /* Also check if the location's requiresQuest is completed */
    var loc = DuelLocations ? DuelLocations.get(id) : null;
    if (loc && loc.unlocked) return true;
    if (loc && loc.requiresQuest) {
      var qs = get().quests[loc.requiresQuest];
      if (qs && qs.status === "completed") {
        /* Auto-add to unlocked list */
        get().unlockedLocations.push(id);
        save();
        return true;
      }
    }
    return false;
  }
  function unlockLocation(id) { if (get().unlockedLocations.indexOf(id) < 0) { get().unlockedLocations.push(id); save(); } }

  function isEnemyDefeated(id) { return !!get().defeatedEnemies[id]; }
  function recordDefeat(id) {
    var d = get();
    if (!d.defeatedEnemies[id]) d.defeatedEnemies[id] = { count: 0 };
    d.defeatedEnemies[id].count++;
    save();
  }

  function isVillainUnlocked(id) { return get().unlockedVillains.indexOf(id) >= 0; }
  function unlockVillain(id) { if (!isVillainUnlocked(id)) { get().unlockedVillains.push(id); save(); } }

  function getQuestStatus(questId) { return get().quests[questId] || null; }
  function setQuestStatus(questId, status, step) {
    get().quests[questId] = { status: status, step: step }; save();
  }

  function isBattleComplete(battleId) { return get().completedBattles.indexOf(battleId) >= 0; }
  function completeBattle(battleId) { if (!isBattleComplete(battleId)) { get().completedBattles.push(battleId); save(); } }

  return {
    load: load, save: save, get: get,
    isHeroUnlocked: isHeroUnlocked, unlockHero: unlockHero,
    isLocationUnlocked: isLocationUnlocked, unlockLocation: unlockLocation,
    isEnemyDefeated: isEnemyDefeated, recordDefeat: recordDefeat,
    isVillainUnlocked: isVillainUnlocked, unlockVillain: unlockVillain,
    getQuestStatus: getQuestStatus, setQuestStatus: setQuestStatus,
    isBattleComplete: isBattleComplete, completeBattle: completeBattle
  };
})();

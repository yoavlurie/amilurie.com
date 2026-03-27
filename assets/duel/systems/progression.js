/* ============================================
   Mythic Duel — Progression System
   Save/load, magic items, v1/v2 migration
   ============================================ */

var DuelProgression = (function () {
  "use strict";

  var SAVE_KEY = "amilurie_duel_v6";
  var data = null;

  /* ---- Magic item definitions ---- */
  var MAGIC_ITEMS = {
    boost_aggression: { name: "Boost of Aggression", desc: "Deal 50 bonus damage on next special attack", maxOwned: 1, color: "#c83030" },
    boost_healing: { name: "Boost of Healing", desc: "Reduce all damage taken by 10 for the fight", maxOwned: 1, color: "#4bc76e" },
    boost_special: { name: "Boost of Special Attack", desc: "Grants +1 special attack charge per fight", maxOwned: 1, color: "#d4a017" }
  };

  function defaultData() {
    return {
      version: 6,
      selectedHero: "percy",
      unlockedHeroes: ["percy", "annabeth"],
      currentLocation: "camp_halfblood",
      unlockedLocations: ["camp_halfblood"],
      defeatedEnemies: {},
      unlockedVillains: [],
      quests: {},
      completedBattles: [],
      magicItems: [],
      isVillainPath: false,
      introSeen: false
    };
  }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (d && d.version === 6) { data = d; return; }
    } catch (e) { /* ignore */ }
    /* Wipe ALL old saves */
    try { localStorage.removeItem("amilurie_duel_v5"); } catch (e) { /* ignore */ }
    try { localStorage.removeItem("amilurie_duel_v4"); } catch (e) { /* ignore */ }
    try { localStorage.removeItem("amilurie_duel_v3"); } catch (e) { /* ignore */ }
    try { localStorage.removeItem("amilurie_duel_v2"); } catch (e) { /* ignore */ }
    try { localStorage.removeItem("amilurie_duel_progress"); } catch (e) { /* ignore */ }
    data = defaultData();
    save();
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function resetSave() {
    data = defaultData();
    save();
  }

  function get() { if (!data) load(); return data; }

  function isHeroUnlocked(id) { return get().unlockedHeroes.indexOf(id) >= 0; }
  function unlockHero(id) { if (!isHeroUnlocked(id)) { get().unlockedHeroes.push(id); save(); } }

  function isLocationUnlocked(id) {
    if (get().unlockedLocations.indexOf(id) >= 0) return true;
    var loc = (typeof DuelLocations !== "undefined") ? DuelLocations.get(id) : null;
    if (loc && loc.unlocked) return true;
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

  /* ---- Magic items ---- */
  function hasMagicItem(id) { return get().magicItems.indexOf(id) >= 0; }
  function addMagicItem(id) {
    var item = MAGIC_ITEMS[id];
    if (!item) return false;
    var count = 0;
    for (var i = 0; i < get().magicItems.length; i++) {
      if (get().magicItems[i] === id) count++;
    }
    if (count >= item.maxOwned) return false;
    get().magicItems.push(id);
    save();
    return true;
  }
  function useMagicItem(id) {
    var idx = get().magicItems.indexOf(id);
    if (idx >= 0) { get().magicItems.splice(idx, 1); save(); return true; }
    return false;
  }

  return {
    load: load, save: save, get: get, resetSave: resetSave,
    isHeroUnlocked: isHeroUnlocked, unlockHero: unlockHero,
    isLocationUnlocked: isLocationUnlocked, unlockLocation: unlockLocation,
    isEnemyDefeated: isEnemyDefeated, recordDefeat: recordDefeat,
    isVillainUnlocked: isVillainUnlocked, unlockVillain: unlockVillain,
    getQuestStatus: getQuestStatus, setQuestStatus: setQuestStatus,
    isBattleComplete: isBattleComplete, completeBattle: completeBattle,
    hasMagicItem: hasMagicItem, addMagicItem: addMagicItem, useMagicItem: useMagicItem,
    MAGIC_ITEMS: MAGIC_ITEMS
  };
})();

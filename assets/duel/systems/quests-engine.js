/* ============================================
   Mythic Duel — Quest Engine
   Quest state tracking and event processing
   ============================================ */

var DuelQuestEngine = (function () {
  "use strict";

  function getActiveQuests() {
    var active = [];
    for (var i = 0; i < DuelQuests.quests.length; i++) {
      var q = DuelQuests.quests[i];
      var status = DuelProgression.getQuestStatus(q.id);
      if (status && status.status === "active") active.push(q);
    }
    return active;
  }

  function getAvailableQuests(locationId) {
    var available = [];
    var locQuests = DuelQuests.getByLocation(locationId);
    for (var i = 0; i < locQuests.length; i++) {
      var q = locQuests[i];
      var status = DuelProgression.getQuestStatus(q.id);
      if (status && status.status === "completed") continue;
      if (q.prereq && !isQuestComplete(q.prereq)) continue;
      available.push(q);
    }
    return available;
  }

  function isQuestComplete(questId) {
    var s = DuelProgression.getQuestStatus(questId);
    return s && s.status === "completed";
  }

  function startQuest(questId) {
    DuelProgression.setQuestStatus(questId, "active", 0);
  }

  function getCurrentStep(questId) {
    var q = DuelQuests.getById(questId);
    var s = DuelProgression.getQuestStatus(questId);
    if (!q || !s || s.status !== "active") return null;
    if (s.step >= q.steps.length) return null;
    return q.steps[s.step];
  }

  function onEvent(eventType, eventData) {
    var active = getActiveQuests();
    for (var i = 0; i < active.length; i++) {
      var q = active[i];
      var s = DuelProgression.getQuestStatus(q.id);
      if (!s || s.step >= q.steps.length) continue;

      var step = q.steps[s.step];
      var match = false;

      if (step.type === "defeat" && eventType === "enemy_defeated" && eventData.enemyId === step.target) {
        match = true;
      }
      if (step.type === "travel" && eventType === "arrived" && eventData.locationId === step.locationId) {
        match = true;
      }
      if (step.type === "battle" && eventType === "battle_won" && eventData.battleId === step.battleId) {
        match = true;
      }

      if (match) {
        var nextStep = s.step + 1;
        if (nextStep >= q.steps.length) {
          DuelProgression.setQuestStatus(q.id, "completed", -1);
          applyRewards(q);
        } else {
          DuelProgression.setQuestStatus(q.id, "active", nextStep);
        }
      }
    }
  }

  function applyRewards(quest) {
    var r = quest.rewards;
    if (!r) return;
    if (r.unlockHero) DuelProgression.unlockHero(r.unlockHero);
    if (r.unlockHero2) DuelProgression.unlockHero(r.unlockHero2);
    if (r.unlockLocation) DuelProgression.unlockLocation(r.unlockLocation);
    if (r.unlockVillain) DuelProgression.unlockVillain(r.unlockVillain);
  }

  function autoStartAvailable() {
    for (var i = 0; i < DuelQuests.quests.length; i++) {
      var q = DuelQuests.quests[i];
      var status = DuelProgression.getQuestStatus(q.id);
      if (status) continue;
      if (q.prereq && !isQuestComplete(q.prereq)) continue;
      startQuest(q.id);
    }
  }

  function getQuestLog() {
    var log = [];
    for (var i = 0; i < DuelQuests.quests.length; i++) {
      var q = DuelQuests.quests[i];
      var s = DuelProgression.getQuestStatus(q.id);
      if (!s) continue;
      log.push({ quest: q, status: s.status, step: s.step });
    }
    return log;
  }

  return {
    getActiveQuests: getActiveQuests, getAvailableQuests: getAvailableQuests,
    isQuestComplete: isQuestComplete, startQuest: startQuest,
    getCurrentStep: getCurrentStep, onEvent: onEvent,
    autoStartAvailable: autoStartAvailable, getQuestLog: getQuestLog
  };
})();

/* ============================================
   Mythic Duel — Quest Definitions
   Story + side quests across all series
   ============================================ */

var DuelQuests = (function () {
  "use strict";

  var quests = [
    /* ---- PJO Story ---- */
    { id: "quest_training", name: "The First Trial", type: "story", series: "pjo", locationId: "camp_halfblood",
      desc: "Prove yourself against the camp's challenges.",
      steps: [
        { type: "defeat", target: "alecto", text: "Defeat the Fury Alecto" },
        { type: "defeat", target: "minotaur", text: "Defeat the Minotaur" }
      ],
      rewards: { unlockLocation: "manhattan", unlockHero: "annabeth" }, prereq: null },

    { id: "quest_underworld_pass", name: "Into the Underworld", type: "story", series: "pjo", locationId: "underworld",
      desc: "Journey to the realm of Hades.",
      steps: [
        { type: "defeat", target: "cerberus", text: "Get past Cerberus" },
        { type: "defeat", target: "antaeus", text: "Defeat Antaeus in his arena" }
      ],
      rewards: { unlockHero: "nico" }, prereq: "quest_training" },

    { id: "quest_olympus_gates", name: "The Lightning Thief", type: "story", series: "pjo", locationId: "manhattan",
      desc: "Recover the Master Bolt and face the traitor.",
      steps: [
        { type: "defeat", target: "procrustes", text: "Survive Procrustes" },
        { type: "defeat", target: "medusa", text: "Defeat Medusa" },
        { type: "defeat", target: "ares", text: "Challenge Ares" }
      ],
      rewards: { unlockLocation: "olympus" }, prereq: "quest_training" },

    { id: "quest_titan_war", name: "The Last Olympian", type: "story", series: "pjo", locationId: "manhattan",
      desc: "The Titan army marches on Manhattan.",
      steps: [
        { type: "defeat", target: "kelli", text: "Clear the Empousa" },
        { type: "defeat", target: "luke", text: "Face Luke Castellan" },
        { type: "battle", battleId: "battle_manhattan", text: "Survive the Battle of Manhattan" },
        { type: "defeat", target: "kronos", text: "Defeat Kronos" }
      ],
      rewards: { unlockVillain: "kronos" }, prereq: "quest_olympus_gates" },

    /* ---- HoO Story ---- */
    { id: "quest_roman_contact", name: "The Son of Neptune", type: "story", series: "hoo", locationId: "camp_jupiter",
      desc: "Journey to the Roman camp.",
      steps: [
        { type: "defeat", target: "octavian", text: "Deal with Octavian" },
        { type: "defeat", target: "khione", text: "Defeat Khione" }
      ],
      rewards: { unlockLocation: "camp_jupiter", unlockHero: "jason" }, prereq: "quest_training" },

    { id: "quest_west_coast", name: "The Mark of Athena", type: "story", series: "hoo", locationId: "san_francisco",
      desc: "Unite the Greek and Roman camps.",
      steps: [
        { type: "defeat", target: "enceladus", text: "Defeat Enceladus" },
        { type: "defeat", target: "orion", text: "Hunt Orion" }
      ],
      rewards: { unlockLocation: "san_francisco", unlockHero: "piper" }, prereq: "quest_roman_contact" },

    { id: "quest_beyond_gods", name: "The Son of Neptune", type: "story", series: "hoo", locationId: "alaska",
      desc: "Venture beyond the gods' reach.",
      steps: [
        { type: "defeat", target: "alcyoneus", text: "Defeat Alcyoneus in Alaska" }
      ],
      rewards: { unlockLocation: "alaska", unlockHero: "frank" }, prereq: "quest_west_coast" },

    { id: "quest_giant_war", name: "Blood of Olympus", type: "story", series: "hoo", locationId: "olympus",
      desc: "The Giants march on Olympus itself.",
      steps: [
        { type: "defeat", target: "polybotes", text: "Defeat Polybotes" },
        { type: "defeat", target: "porphyrion", text: "Face the Giant King" },
        { type: "defeat", target: "gaea", text: "Stop Gaea's awakening" }
      ],
      rewards: { unlockHero: "leo", unlockHero2: "hazel" }, prereq: "quest_beyond_gods" },

    { id: "quest_tartarus_descent", name: "The House of Hades", type: "story", series: "hoo", locationId: "tartarus",
      desc: "Descend into the deepest pit.",
      steps: [
        { type: "defeat", target: "pasiphae", text: "Navigate Pasiphae's labyrinth" },
        { type: "defeat", target: "epiales", text: "Face the God of Nightmares" },
        { type: "defeat", target: "nyx", text: "Survive Primordial Night" }
      ],
      rewards: { unlockLocation: "tartarus" }, prereq: "quest_giant_war" },

    /* ---- ToA Story ---- */
    { id: "quest_apollo_fall", name: "The Hidden Oracle", type: "story", series: "toa", locationId: "new_rome",
      desc: "Apollo falls to Earth as a mortal.",
      steps: [
        { type: "defeat", target: "nero", text: "Confront Emperor Nero" },
        { type: "defeat", target: "tarquin", text: "Defeat the Undead King" }
      ],
      rewards: { unlockLocation: "new_rome", unlockHero: "meg" }, prereq: "quest_roman_contact" },

    { id: "quest_waystation_call", name: "The Dark Prophecy", type: "story", series: "toa", locationId: "waystation",
      desc: "Seek shelter at the Waystation.",
      steps: [
        { type: "defeat", target: "commodus", text: "Defeat Emperor Commodus" },
        { type: "defeat", target: "lityerses", text: "Face the Reaper of Men" },
        { type: "defeat", target: "midas", text: "Survive King Midas" }
      ],
      rewards: { unlockLocation: "waystation" }, prereq: "quest_apollo_fall" },

    { id: "quest_tower_nero", name: "The Tower of Nero", type: "story", series: "toa", locationId: "new_rome",
      desc: "Final confrontation with the Triumvirate.",
      steps: [
        { type: "defeat", target: "caligula", text: "Defeat Emperor Caligula" },
        { type: "defeat", target: "python", text: "Slay Python" }
      ],
      rewards: { unlockVillain: "python" }, prereq: "quest_waystation_call" },

    /* ---- Kane Chronicles Story ---- */
    { id: "quest_kane_awakening", name: "The Red Pyramid", type: "story", series: "kc", locationId: "house_of_life",
      desc: "Carter and Sadie discover their powers.",
      steps: [
        { type: "defeat", target: "desjardins", text: "Escape the Chief Lector" },
        { type: "defeat", target: "sarah_jacobi", text: "Stop the rebel magician" }
      ],
      rewards: { unlockLocation: "house_of_life", unlockHero: "carter" }, prereq: null },

    { id: "quest_egypt_journey", name: "The Throne of Fire", type: "story", series: "kc", locationId: "egypt",
      desc: "Journey to Egypt to stop Apophis.",
      steps: [
        { type: "defeat", target: "set", text: "Face Set, Lord of Chaos" },
        { type: "defeat", target: "sobek", text: "Defeat Sobek" },
        { type: "defeat", target: "menshikov", text: "Stop Menshikov" }
      ],
      rewards: { unlockLocation: "egypt", unlockHero: "sadie" }, prereq: "quest_kane_awakening" },

    { id: "quest_serpent_shadow", name: "The Serpent's Shadow", type: "story", series: "kc", locationId: "egypt",
      desc: "The final battle against Chaos itself.",
      steps: [
        { type: "defeat", target: "setne", text: "Defeat the ghost magician Setne" },
        { type: "defeat", target: "apophis", text: "Destroy Apophis" }
      ],
      rewards: { unlockVillain: "apophis" }, prereq: "quest_egypt_journey" },

    /* ---- Magnus Chase Story ---- */
    { id: "quest_einherji", name: "The Sword of Summer", type: "story", series: "mc", locationId: "valhalla",
      desc: "Magnus dies and enters Valhalla.",
      steps: [
        { type: "defeat", target: "alderman", text: "Face Alderman" },
        { type: "defeat", target: "surt", text: "Battle Surt, Lord of Fire" }
      ],
      rewards: { unlockLocation: "valhalla", unlockHero: "alex" }, prereq: null },

    { id: "quest_bifrost", name: "The Hammer of Thor", type: "story", series: "mc", locationId: "asgard",
      desc: "Journey to Asgard to stop Loki's plan.",
      steps: [
        { type: "defeat", target: "hrungnir", text: "Defeat the Stone Giant" },
        { type: "defeat", target: "utgard_loki", text: "See through Utgard-Loki's illusions" },
        { type: "defeat", target: "loki", text: "Confront Loki" }
      ],
      rewards: { unlockLocation: "asgard" }, prereq: "quest_einherji" },

    { id: "quest_giant_land", name: "The Ship of the Dead", type: "story", series: "mc", locationId: "jotunheim",
      desc: "Sail to the land of giants.",
      steps: [
        { type: "defeat", target: "fenris", text: "Face the Fenris Wolf" }
      ],
      rewards: { unlockLocation: "jotunheim" }, prereq: "quest_bifrost" },

    /* ---- Ultimate Challenge ---- */
    { id: "quest_typhon", name: "Father of All Monsters", type: "story", series: "pjo", locationId: "tartarus",
      desc: "The ultimate challenge awaits in the deepest abyss.",
      steps: [
        { type: "defeat", target: "typhon", text: "Defeat Typhon, Father of Monsters" }
      ],
      rewards: { unlockVillain: "typhon" }, prereq: "quest_tartarus_descent" }
  ];

  function getById(id) {
    for (var i = 0; i < quests.length; i++) {
      if (quests[i].id === id) return quests[i];
    }
    return null;
  }

  function getByLocation(locationId) {
    var result = [];
    for (var i = 0; i < quests.length; i++) {
      if (quests[i].locationId === locationId) result.push(quests[i]);
    }
    return result;
  }

  return { quests: quests, getById: getById, getByLocation: getByLocation };
})();

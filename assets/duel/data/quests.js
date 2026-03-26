/* ============================================
   Mythic Duel — Quest Definitions
   Chiron-guided story flow with rewards
   ============================================ */

var DuelQuests = (function () {
  "use strict";

  var quests = [
    /* ---- PJO: Camp Half-Blood ---- */
    { id: "quest_training", name: "The First Trial", type: "story", series: "pjo", locationId: "camp_halfblood",
      desc: "Prove yourself at Camp Half-Blood.",
      chironIntro: "Welcome, young demigod! I am Chiron, trainer of heroes. Your first challenge awaits — the Minotaur has been spotted near camp!",
      steps: [
        { type: "defeat", target: "minotaur", text: "Defeat the Minotaur",
          chironBefore: "The Minotaur lurks nearby. Remember: use WASD to move, Space to attack, and Shift to block. You can do this!",
          chironAfter: "Excellent work! But trouble is not over — Mrs. Dodds has revealed herself as the Fury Alecto!" },
        { type: "defeat", target: "alecto", text: "Defeat Alecto the Fury",
          chironBefore: "Alecto is fast but fragile. Stay aggressive and don't let her corner you!",
          chironAfter: "You have proven yourself a true hero! I have much to tell you..." }
      ],
      rewards: { unlockLocation: "manhattan", unlockHero: "magnus",
        chironReward: "Incredible! You've cleared Camp Half-Blood. I'm unlocking Manhattan for you — Luke and his forces are gathering there. I've also sent word to Magnus Chase in Valhalla. He'll fight alongside you now. Find him in the hero select screen!" },
      prereq: null },

    /* ---- PJO: Manhattan ---- */
    { id: "quest_olympus_gates", name: "Stop Luke's Army", type: "story", series: "pjo", locationId: "manhattan",
      desc: "Chiron's quest: Stop Luke and his cronies in Manhattan.",
      chironIntro: "Luke Castellan has gathered monsters in Manhattan. You must stop them before they reach Olympus! Defeat his forces one by one.",
      steps: [
        { type: "defeat", target: "procrustes", text: "Defeat Procrustes",
          chironBefore: "Procrustes — the stretcher. He's slow but hits hard. Keep your distance and strike when he's recovering!",
          chironAfter: "Well done! But Medusa awaits deeper in the city..." },
        { type: "defeat", target: "medusa", text: "Defeat Medusa",
          chironBefore: "Medusa fires a gaze beam — you MUST block it (Shift) or duck (S) to avoid being stunned!",
          chironAfter: "The Gorgon falls! Now for the real threat..." },
        { type: "defeat", target: "luke", text: "Defeat Luke Castellan",
          chironBefore: "Luke is a skilled swordsman. He combos fast — block his strikes and counter when he pauses!",
          chironAfter: "Luke is defeated! You've saved Manhattan... for now." }
      ],
      rewards: { unlockLocation: "underworld", unlockLocation2: "olympus", rewardChoice: true,
        chironReward: "A great victory! Luke is defeated and the path to Olympus is clear. I've also opened the way to the Underworld. As a reward, I offer you a choice..." },
      prereq: "quest_training" },

    /* ---- PJO: Underworld ---- */
    { id: "quest_underworld_pass", name: "Into the Underworld", type: "story", series: "pjo", locationId: "underworld",
      desc: "Journey to the realm of Hades.",
      chironIntro: "The Underworld holds dark secrets. Be careful — Cerberus guards the entrance, and worse things lurk below.",
      steps: [
        { type: "defeat", target: "cerberus", text: "Get past Cerberus",
          chironBefore: "Cerberus charges in straight lines. Dodge to the side and he'll crash into the wall — then strike while he's stunned!",
          chironAfter: "Past the guard dog! Antaeus awaits in his arena..." },
        { type: "defeat", target: "antaeus", text: "Defeat Antaeus",
          chironBefore: "Antaeus draws strength from the ground. Fight him from the platforms — he's weaker when not touching earth!",
          chironAfter: "The Underworld is yours to explore." }
      ],
      rewards: { unlockHero: "nico", rewardChoice: true,
        chironReward: "Nico di Angelo has emerged from the shadows to join you! And once again, you may choose a reward..." },
      prereq: "quest_olympus_gates" },

    /* ---- PJO: Olympus ---- */
    { id: "quest_titan_war", name: "The Last Olympian", type: "story", series: "pjo", locationId: "manhattan",
      desc: "The Titan army marches on Olympus.",
      chironIntro: "Kronos himself leads the Titan army! This is the battle for Olympus. Are you ready?",
      steps: [
        { type: "defeat", target: "kelli", text: "Clear the Empousa",
          chironBefore: "Kelli's empousa are fast. Stay aggressive!",
          chironAfter: "The path to Kronos is clear..." },
        { type: "defeat", target: "kronos", text: "Defeat Kronos",
          chironBefore: "Kronos slows time itself. When he uses his time-slow power, dodge and wait — then rush in during the recharge!",
          chironAfter: "The Lord of Time falls! Olympus is saved!" }
      ],
      rewards: { unlockLocation: "olympus", unlockLocation2: "camp_jupiter", unlockLocation3: "house_of_life", unlockLocation4: "valhalla",
        unlockVillain: "kronos", rewardChoice: true,
        chironReward: "You've defeated a Titan Lord! Olympus is saved! But our fight is far from over. New threats are rising across the world — the Roman camp at Camp Jupiter needs help, Egyptian magicians stir in Brooklyn, and Norse warriors clash in Valhalla. I've unlocked all three realms for you. The world needs heroes everywhere. Choose your next adventure wisely!" },
      prereq: "quest_olympus_gates" },

    /* ---- HoO Story ---- */
    { id: "quest_roman_contact", name: "The Son of Neptune", type: "story", series: "hoo", locationId: "camp_jupiter",
      desc: "Journey to the Roman camp.",
      chironIntro: "Welcome to Camp Jupiter! The Roman demigods need our help against a new breed of enemies — the Giants, born to destroy the gods themselves.",
      steps: [
        { type: "defeat", target: "octavian", text: "Deal with Octavian",
          chironBefore: "Octavian is all talk — fragile once you close the distance.",
          chironAfter: "But a greater threat looms..." },
        { type: "defeat", target: "khione", text: "Defeat Khione",
          chironBefore: "The Snow Goddess fires ice blasts that slow you. Stay close where she's weakest!",
          chironAfter: "Camp Jupiter is safe!" }
      ],
      rewards: { unlockHero: "jason", unlockLocation: "san_francisco", rewardChoice: true,
        chironReward: "Jason Grace joins your ranks! San Francisco is now accessible — the Giants are gathering on the West Coast." },
      prereq: "quest_titan_war" },

    { id: "quest_west_coast", name: "The Mark of Athena", type: "story", series: "hoo", locationId: "san_francisco",
      desc: "Unite the camps against the Giants.",
      chironIntro: "The Giants are rising on the West Coast. You must stop them!",
      steps: [
        { type: "defeat", target: "enceladus", text: "Defeat Enceladus",
          chironBefore: "Enceladus is massive but slow. Dodge his wind-up attacks!",
          chironAfter: "One Giant down..." },
        { type: "defeat", target: "orion", text: "Hunt Orion",
          chironBefore: "Orion charges like a bull. Side-step and counter!",
          chironAfter: "San Francisco is clear!" }
      ],
      rewards: { unlockLocation: "alaska", unlockLocation2: "new_rome", unlockHero: "piper", rewardChoice: true,
        chironReward: "Piper McLean joins you! Alaska and New Rome are now accessible — the fight stretches across the continent." },
      prereq: "quest_roman_contact" },

    { id: "quest_kane_awakening", name: "The Red Pyramid", type: "story", series: "kc", locationId: "house_of_life",
      desc: "Carter and Sadie discover their powers.",
      chironIntro: "Egyptian magic stirs in Brooklyn. The Kane siblings need guidance.",
      steps: [
        { type: "defeat", target: "desjardins", text: "Escape the Chief Lector",
          chironBefore: "Desjardins is a powerful magician. Block his spells!",
          chironAfter: "Free from the House of Life..." },
        { type: "defeat", target: "sarah_jacobi", text: "Stop the rebel",
          chironBefore: "Sarah Jacobi is a rogue magician. Interrupt her casting!",
          chironAfter: "The rebellion is quelled." }
      ],
      rewards: { unlockLocation: "egypt", unlockHero: "carter", rewardChoice: true,
        chironReward: "Carter Kane joins the fight! Egypt is now accessible — ancient threats await in the land of the pharaohs." },
      prereq: null },

    { id: "quest_einherji", name: "The Sword of Summer", type: "story", series: "mc", locationId: "valhalla",
      desc: "Magnus enters Valhalla.",
      chironIntro: "Norse threats are stirring. Magnus must prove himself in Valhalla.",
      steps: [
        { type: "defeat", target: "alderman", text: "Face Alderman",
          chironBefore: "Alderman is slow and predictable. Good practice!",
          chironAfter: "But the Fire Giant awaits..." },
        { type: "defeat", target: "surt", text: "Battle Surt",
          chironBefore: "Surt shoots fire waves — dodge or duck them! Avoid fire pools.",
          chironAfter: "Surt falls!" }
      ],
      rewards: { unlockLocation: "asgard", unlockLocation2: "jotunheim", unlockHero: "alex", rewardChoice: true,
        chironReward: "Alex Fierro joins your team! Asgard and Jotunheim are now accessible — the Norse realms open before you." },
      prereq: null },

    /* ---- Egypt deeper ---- */
    { id: "quest_egypt_journey", name: "The Throne of Fire", type: "story", series: "kc", locationId: "egypt",
      desc: "Journey to Egypt to stop Apophis.",
      chironIntro: "Apophis, the Chaos Serpent, threatens all of Egypt.",
      steps: [
        { type: "defeat", target: "set", text: "Face Set",
          chironBefore: "Set summons storms. He's stationary while casting — rush in!",
          chironAfter: "Set retreats, but Apophis still looms..." },
        { type: "defeat", target: "apophis", text: "Destroy Apophis",
          chironBefore: "Apophis is lightning fast. He slides past you — turn and strike from behind!",
          chironAfter: "Chaos is defeated!" }
      ],
      rewards: { unlockHero: "sadie", unlockVillain: "apophis", rewardChoice: true,
        chironReward: "Sadie Kane joins! Chaos is banished... for now." },
      prereq: "quest_kane_awakening" },

    /* ---- Norse deeper ---- */
    { id: "quest_bifrost", name: "The Hammer of Thor", type: "story", series: "mc", locationId: "asgard",
      desc: "Journey to Asgard to stop Loki.",
      chironIntro: "Loki plots in Asgard. He must be stopped!",
      steps: [
        { type: "defeat", target: "loki", text: "Confront Loki",
          chironBefore: "Loki teleports! He's briefly vulnerable right after appearing. Strike fast!",
          chironAfter: "The Trickster is bound... for now." }
      ],
      rewards: { rewardChoice: true,
        chironReward: "Asgard secured! The Norse realms are safe." },
      prereq: "quest_einherji" },

    /* ---- Trials of Apollo ---- */
    { id: "quest_apollo_fall", name: "The Hidden Oracle", type: "story", series: "toa", locationId: "new_rome",
      desc: "Apollo falls to Earth as a mortal.",
      chironIntro: "The Triumvirate of Roman Emperors threatens New Rome. Apollo needs your help!",
      steps: [
        { type: "defeat", target: "nero", text: "Confront Emperor Nero",
          chironBefore: "Nero is a skilled duelist. Counter after his combo strings!",
          chironAfter: "Nero retreats, but the undead stir..." },
        { type: "defeat", target: "tarquin", text: "Defeat the Undead King",
          chironBefore: "Tarquin commands zombies — focus on the king, not the minions!",
          chironAfter: "New Rome is safe!" }
      ],
      rewards: { unlockLocation: "waystation", unlockHero: "meg", rewardChoice: true,
        chironReward: "Meg McCaffrey joins you! The Waystation is now accessible." },
      prereq: "quest_west_coast" },

    { id: "quest_waystation_call", name: "The Dark Prophecy", type: "story", series: "toa", locationId: "waystation",
      desc: "Seek shelter at the Waystation.",
      chironIntro: "The remaining emperors gather their forces. Stop them at the Waystation!",
      steps: [
        { type: "defeat", target: "commodus", text: "Defeat Emperor Commodus",
          chironBefore: "Commodus is vain but dangerous. Watch for his charges!",
          chironAfter: "One emperor down..." },
        { type: "defeat", target: "caligula", text: "Defeat Emperor Caligula",
          chironBefore: "Caligula is the deadliest of all three. Keep your distance!",
          chironAfter: "The Triumvirate falls!" }
      ],
      rewards: { unlockVillain: "caligula", rewardChoice: true,
        chironReward: "The Triumvirate is defeated! You can now play as Caligula in Villain Mode." },
      prereq: "quest_apollo_fall" },

    /* ---- Tartarus ---- */
    { id: "quest_tartarus_descent", name: "Into the Abyss", type: "story", series: "pjo", locationId: "tartarus",
      desc: "Descend into Tartarus itself.",
      chironIntro: "The deepest pit. Few heroes return from Tartarus. Be brave.",
      steps: [
        { type: "defeat", target: "nyx", text: "Survive Nyx",
          chironBefore: "Nyx is only hittable when she attacks. Wait for her to strike, then counter!",
          chironAfter: "Primordial Night yields..." },
        { type: "defeat", target: "typhon", text: "Defeat Typhon",
          chironBefore: "Typhon, Father of Monsters. His phases change at 75%, 50%, 25% HP. Brief openings each time!",
          chironAfter: "You have defeated the mightiest monster of all!" }
      ],
      rewards: { unlockLocation: "tartarus", unlockVillain: "typhon",
        chironReward: "You are a legend among legends! Typhon himself bows to your skill." },
      prereq: "quest_titan_war" }
  ];

  /* ---- Villain quests (Tartarus narrator) ---- */
  var villainQuests = [
    { id: "vquest_rise", name: "Rise from Tartarus", type: "villain_story", series: "pjo", locationId: "tartarus",
      desc: "Tartarus sends you to conquer the world above.",
      tartarusIntro: "Welcome, creature of darkness. I am Tartarus, the Pit itself. You shall be my champion. Rise... and destroy the heroes!",
      steps: [
        { type: "defeat", target: "percy", text: "Defeat Percy Jackson",
          tartarusBefore: "That sea brat stands in your way. Crush him!",
          tartarusAfter: "Yes! The son of Poseidon falls!" },
        { type: "defeat", target: "annabeth", text: "Defeat Annabeth Chase",
          tartarusBefore: "The daughter of Athena thinks she's clever. Show her true power!",
          tartarusAfter: "Wisdom is no match for raw chaos!" }
      ],
      rewards: { unlockLocation: "underworld" },
      prereq: null }
  ];

  function getById(id) {
    for (var i = 0; i < quests.length; i++) { if (quests[i].id === id) return quests[i]; }
    for (var j = 0; j < villainQuests.length; j++) { if (villainQuests[j].id === id) return villainQuests[j]; }
    return null;
  }

  function getByLocation(locationId) {
    var result = [];
    for (var i = 0; i < quests.length; i++) {
      if (quests[i].locationId === locationId) result.push(quests[i]);
    }
    return result;
  }

  function getVillainQuests() { return villainQuests; }

  return { quests: quests, villainQuests: villainQuests, getById: getById, getByLocation: getByLocation, getVillainQuests: getVillainQuests };
})();

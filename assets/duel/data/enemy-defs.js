/* ============================================
   Mythic Duel — Enemy Definitions
   55 enemies with stats, AI profiles, specials
   ============================================ */

var DuelEnemyDefs = (function () {
  "use strict";

  /* Compact format: [id, name, subtitle, hp, atk, def, speed, aiType,
     telegraphTime, attackCooldown, retreatTime, weakness, locationId, tier, specialId, specialCharges] */
  var raw = [
    /* ---- Percy Jackson & Olympians ---- */
    ["minotaur","Minotaur","Labyrinth Beast",85,9,3,80,"charger",0.9,1.8,0.7,"Stunned after charging walls","camp_halfblood",1,"horn_charge",2],
    ["alecto","Alecto","The Kindly One",70,8,3,120,"basic",0.8,1.5,0.6,"Predict her swooping attacks","camp_halfblood",1,null,0],
    ["procrustes","Procrustes","Crusty",80,10,4,70,"heavy",1.0,2.0,0.8,"Slow — dodge and counter","manhattan",1,null,0],
    ["chimera","Chimera","Three-Formed Beast",85,9,3,75,"basic",1.0,1.8,0.7,"Attack from behind when it charges","manhattan",1,"fire_wave",2],
    ["medusa","Medusa","The Gorgon",75,11,3,80,"ranged",0.9,2.0,0.7,"Block her gaze to reflect it back","manhattan",2,"gaze_beam",3],
    ["ares","Ares","God of War",100,13,6,110,"duelist",0.6,1.3,0.5,"Parry his strikes at the right moment","olympus",2,"backstab",2],
    ["cerberus","Cerberus","Hound of Hades",90,10,3,130,"charger",0.8,1.5,0.6,"Stunned after charging walls","underworld",2,"horn_charge",2],
    ["kelli","Kelli","The Empousa",70,11,3,130,"basic",0.7,1.2,0.5,"Fast but fragile — stay aggressive","manhattan",2,"charmspeak_enemy",2],
    ["antaeus","Antaeus","Son of Gaea",100,12,5,75,"heavy",0.9,1.8,0.8,"Lift him off the ground — attack from platforms","underworld",2,"earth_quake",2],
    ["atlas","Atlas","The Titan General",120,14,7,90,"boss",0.6,1.4,0.5,"Heavy attacks leave him open","san_francisco",3,null,0],
    ["luke","Luke Castellan","The Traitor",95,13,5,120,"duelist",0.5,1.2,0.5,"Parry and counter his combos","manhattan",3,"backstab",3],
    ["kronos","Kronos","Lord of Time",130,14,8,85,"debuffer",0.5,1.5,0.6,"Rush him when time-slow is recharging","olympus",5,"time_slow",3],

    /* ---- Heroes of Olympus ---- */
    ["khione","Khione","Snow Goddess",80,11,4,110,"ranged",0.7,1.4,0.6,"Stay close — she's weak in melee","camp_jupiter",2,"ice_blast",3],
    ["octavian","Octavian","Augur of Jupiter",65,8,3,100,"ranged",0.8,1.6,0.7,"Fragile — close the distance fast","camp_jupiter",1,null,0],
    ["enceladus","Enceladus","Bane of Athena",110,13,5,80,"heavy",0.8,1.6,0.7,"Slow wind-up — dodge and strike","san_francisco",3,"earth_quake",2],
    ["polybotes","Polybotes","Bane of Poseidon",115,14,6,75,"heavy",0.8,1.8,0.8,"Avoid the poison pools he creates","camp_jupiter",3,"poison_spit",3],
    ["porphyrion","Porphyrion","King of Giants",140,15,7,70,"boss",0.5,1.3,0.5,"Each phase has a brief opening","olympus",5,"mega_storm",3],
    ["medea","Medea","The Sorceress",80,12,4,100,"caster",0.7,1.4,0.6,"Stationary while casting — rush in","camp_jupiter",2,"charmspeak_enemy",3],
    ["pasiphae","Pasiphae","Mistress of the Labyrinth",85,11,5,90,"teleporter",0.6,1.4,0.5,"Vulnerable right after teleporting","tartarus",3,"chaos_form",2],
    ["orion","Orion","The Giant Hunter",105,14,5,120,"charger",0.6,1.2,0.5,"Charges past you — turn and strike","san_francisco",3,"horn_charge",2],
    ["alcyoneus","Alcyoneus","The Eldest Giant",125,13,7,65,"heavy",0.9,2.0,0.9,"Weakened away from Alaska","alaska",4,null,0],
    ["gaea","Gaea","The Earth Mother",150,16,8,60,"boss",0.4,1.2,0.4,"Attack during phase transitions","olympus",5,"earth_quake",4],
    ["mimas","Mimas","Bane of Hephaestus",100,13,5,85,"basic",0.7,1.5,0.6,"Use fire against him","camp_jupiter",3,"earth_quake",2],

    /* ---- Trials of Apollo ---- */
    ["nero","Nero","The Emperor",110,13,6,95,"duelist",0.5,1.3,0.5,"Counter after his combo strings","new_rome",4,"backstab",3],
    ["commodus","Commodus","The Vain Emperor",100,12,5,100,"charger",0.6,1.4,0.6,"Taunts leave him open","waystation",3,"horn_charge",2],
    ["caligula","Caligula","The Cruel Emperor",120,15,6,110,"duelist",0.4,1.1,0.4,"Most dangerous up close — keep distance","san_francisco",4,"backstab",3],
    ["python","Python","Ancient Serpent",130,14,6,85,"boss",0.5,1.3,0.5,"Weak spot glows between phases","tartarus",5,"poison_spit",4],
    ["lityerses","Lityerses","Reaper of Men",95,14,4,120,"duelist",0.5,1.2,0.5,"Fast but predictable patterns","waystation",3,"backstab",2],
    ["midas","Midas","The Golden King",85,10,5,70,"caster",0.8,1.6,0.7,"Don't let him touch you","waystation",2,"golden_touch",3],
    ["tarquin","Tarquin","The Last King",100,12,6,80,"summoner",0.7,1.5,0.6,"Focus the king, not the minions","new_rome",3,null,0],

    /* ---- Kane Chronicles ---- */
    ["set","Set","Lord of Chaos",105,13,6,95,"caster",0.7,1.6,0.6,"Stationary while summoning storms","egypt",3,"storm_call",3],
    ["sobek","Sobek","Crocodile God",110,14,5,65,"heavy",1.0,2.2,1.0,"Slowed and weakened in water","egypt",3,null,0],
    ["apophis","Apophis","Chaos Serpent",120,15,4,140,"charger",0.5,1.2,0.5,"Slides past you — attack from behind","egypt",4,"chaos_form",3],
    ["sarah_jacobi","Sarah Jacobi","Rebel Magician",85,12,4,110,"caster",0.6,1.4,0.5,"Interrupt her spells","house_of_life",2,"storm_call",2],
    ["setne","Setne","Ghost Magician",80,13,3,120,"teleporter",0.5,1.3,0.5,"Vulnerable after teleporting","house_of_life",3,"chaos_form",3],
    ["desjardins","Desjardins","Chief Lector",90,11,6,90,"caster",0.7,1.5,0.6,"Block his spells and counter","house_of_life",2,"storm_call",2],
    ["menshikov","Menshikov","Servant of Apophis",95,13,4,100,"caster",0.6,1.4,0.5,"His chaos magic has a cooldown","egypt",3,"chaos_form",2],

    /* ---- Magnus Chase ---- */
    ["surt","Surt","Lord of Fire Giants",120,15,5,80,"heavy",0.7,1.5,0.7,"Avoid fire pools — use water if Percy","jotunheim",4,"fire_wave",3],
    ["fenris","Fenris Wolf","The Monster Wolf",115,14,4,140,"charger",0.5,1.1,0.4,"Dodge his lunges — strike his flank","asgard",4,"horn_charge",3],
    ["loki","Loki","The Trickster",90,12,5,110,"teleporter",0.6,1.3,0.5,"Vulnerable after teleporting","asgard",3,"chaos_form",3],
    ["alderman","Alderman","Corrupted Father",80,10,4,80,"basic",0.8,1.6,0.7,"Slow and predictable","valhalla",1,null,0],
    ["hrungnir","Hrungnir","Stone Giant",120,13,8,60,"heavy",1.0,2.0,0.9,"Very slow — stay mobile","jotunheim",3,null,0],
    ["utgard_loki","Utgard-Loki","King of Mountain Giants",110,12,6,90,"teleporter",0.5,1.3,0.5,"His illusions fade when hit","jotunheim",3,"chaos_form",2],

    /* ---- Nico Adventures ---- */
    ["epiales","Epiales","God of Nightmares",100,13,5,100,"phaser",0.5,1.3,0.5,"Only hittable when attacking","tartarus",4,"nightmare",3],
    ["nyx","Nyx","Primordial Night",95,13,8,95,"phaser",0.6,1.4,0.5,"Only hittable when she attacks","tartarus",4,"shadow_shift",3],

    /* ---- Major boss extras ---- */
    ["typhon","Typhon","Father of Monsters",160,17,7,75,"boss",0.4,1.1,0.4,"Phase changes at 75%, 50%, 25% HP","tartarus",5,"mega_storm",4]
  ];

  var FIELDS = ["id","name","subtitle","hp","atk","def","speed","aiType",
    "telegraphTime","attackCooldown","retreatTime","weakness","locationId","tier","specialId","specialCharges"];

  var roster = [];
  for (var i = 0; i < raw.length; i++) {
    var e = {};
    for (var j = 0; j < FIELDS.length; j++) e[FIELDS[j]] = raw[i][j];
    roster.push(e);
  }

  function getById(id) {
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].id === id) return roster[i];
    }
    return null;
  }

  function getByLocation(locationId) {
    var result = [];
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].locationId === locationId) result.push(roster[i]);
    }
    return result;
  }

  function getByTier(tier) {
    var result = [];
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].tier === tier) result.push(roster[i]);
    }
    return result;
  }

  return { roster: roster, getById: getById, getByLocation: getByLocation, getByTier: getByTier };
})();

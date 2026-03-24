/* ============================================
   Mythic Duel — World Map Locations
   Node map with connections
   ============================================ */

var DuelLocations = (function () {
  "use strict";

  var locations = {
    camp_halfblood: { name: "Camp Half-Blood", x: 200, y: 220, series: "pjo",
      connectedTo: ["manhattan","underworld"], unlocked: true, desc: "Training grounds for Greek demigods" },
    manhattan: { name: "Manhattan", x: 320, y: 180, series: "pjo",
      connectedTo: ["camp_halfblood","olympus","camp_jupiter"], requiresQuest: "quest_training", desc: "The mortal world hides ancient threats" },
    olympus: { name: "Mount Olympus", x: 360, y: 100, series: "pjo",
      connectedTo: ["manhattan","tartarus"], requiresQuest: "quest_olympus_gates", desc: "Home of the Olympian gods" },
    underworld: { name: "The Underworld", x: 140, y: 300, series: "pjo",
      connectedTo: ["camp_halfblood","tartarus"], requiresQuest: "quest_underworld_pass", desc: "Realm of Hades and the dead" },
    tartarus: { name: "Tartarus", x: 260, y: 340, series: "pjo",
      connectedTo: ["underworld","olympus"], requiresQuest: "quest_tartarus_descent", desc: "The deepest abyss, prison of Titans" },
    camp_jupiter: { name: "Camp Jupiter", x: 500, y: 200, series: "hoo",
      connectedTo: ["manhattan","san_francisco","new_rome"], requiresQuest: "quest_roman_contact", desc: "Roman demigod stronghold" },
    san_francisco: { name: "San Francisco", x: 580, y: 160, series: "hoo",
      connectedTo: ["camp_jupiter","alaska"], requiresQuest: "quest_west_coast", desc: "Gateway to the Roman world" },
    alaska: { name: "Alaska", x: 640, y: 80, series: "hoo",
      connectedTo: ["san_francisco"], requiresQuest: "quest_beyond_gods", desc: "Beyond the reach of the gods" },
    new_rome: { name: "New Rome", x: 500, y: 280, series: "toa",
      connectedTo: ["camp_jupiter","waystation"], requiresQuest: "quest_apollo_fall", desc: "City of the Twelfth Legion" },
    waystation: { name: "The Waystation", x: 440, y: 320, series: "toa",
      connectedTo: ["new_rome"], requiresQuest: "quest_waystation_call", desc: "A safe haven for outcasts" },
    house_of_life: { name: "House of Life", x: 100, y: 140, series: "kc",
      connectedTo: ["egypt"], requiresQuest: "quest_kane_awakening", desc: "Brooklyn headquarters of Egyptian magicians" },
    egypt: { name: "Egypt", x: 60, y: 80, series: "kc",
      connectedTo: ["house_of_life"], requiresQuest: "quest_egypt_journey", desc: "Land of the pharaohs and ancient magic" },
    valhalla: { name: "Valhalla", x: 140, y: 60, series: "mc",
      connectedTo: ["asgard","jotunheim"], requiresQuest: "quest_einherji", desc: "Hall of fallen warriors" },
    asgard: { name: "Asgard", x: 80, y: 30, series: "mc",
      connectedTo: ["valhalla"], requiresQuest: "quest_bifrost", desc: "Realm of the Norse gods" },
    jotunheim: { name: "Jotunheim", x: 200, y: 40, series: "mc",
      connectedTo: ["valhalla"], requiresQuest: "quest_giant_land", desc: "Land of giants and frost" }
  };

  /* Build connections array */
  var connections = [];
  var keys = Object.keys(locations);
  var seen = {};
  for (var i = 0; i < keys.length; i++) {
    var loc = locations[keys[i]];
    for (var j = 0; j < loc.connectedTo.length; j++) {
      var pair = [keys[i], loc.connectedTo[j]].sort().join("-");
      if (!seen[pair]) { connections.push([keys[i], loc.connectedTo[j]]); seen[pair] = true; }
    }
  }

  function get(id) { return locations[id] || null; }
  function getAll() { return locations; }

  return { locations: locations, connections: connections, get: get, getAll: getAll };
})();

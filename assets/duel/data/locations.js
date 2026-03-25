/* ============================================
   Mythic Duel — World Map Locations
   Node map — locations unlock via quest rewards only
   ============================================ */

var DuelLocations = (function () {
  "use strict";

  var locations = {
    camp_halfblood: { name: "Camp Half-Blood", x: 360, y: 220, series: "pjo",
      connectedTo: ["manhattan","underworld","camp_jupiter","house_of_life","valhalla"],
      unlocked: true, desc: "Training grounds for Greek demigods — the center of all worlds" },
    manhattan: { name: "Manhattan", x: 440, y: 160, series: "pjo",
      connectedTo: ["camp_halfblood","olympus"],
      desc: "The mortal world hides ancient threats" },
    olympus: { name: "Mount Olympus", x: 440, y: 80, series: "pjo",
      connectedTo: ["manhattan","tartarus"],
      desc: "Home of the Olympian gods" },
    underworld: { name: "The Underworld", x: 360, y: 320, series: "pjo",
      connectedTo: ["camp_halfblood","tartarus"],
      desc: "Realm of Hades and the dead" },
    tartarus: { name: "Tartarus", x: 440, y: 360, series: "pjo",
      connectedTo: ["underworld","olympus"],
      desc: "The deepest abyss, prison of Titans" },

    camp_jupiter: { name: "Camp Jupiter", x: 580, y: 220, series: "hoo",
      connectedTo: ["camp_halfblood","san_francisco","new_rome"],
      desc: "Roman demigod stronghold" },
    san_francisco: { name: "San Francisco", x: 660, y: 160, series: "hoo",
      connectedTo: ["camp_jupiter","alaska"],
      desc: "Gateway to the Roman world" },
    alaska: { name: "Alaska", x: 680, y: 80, series: "hoo",
      connectedTo: ["san_francisco"],
      desc: "Beyond the reach of the gods" },
    new_rome: { name: "New Rome", x: 620, y: 300, series: "toa",
      connectedTo: ["camp_jupiter","waystation"],
      desc: "City of the Twelfth Legion" },
    waystation: { name: "The Waystation", x: 620, y: 370, series: "toa",
      connectedTo: ["new_rome"],
      desc: "A safe haven for outcasts" },

    house_of_life: { name: "House of Life", x: 140, y: 220, series: "kc",
      connectedTo: ["camp_halfblood","egypt"],
      desc: "Brooklyn HQ of Egyptian magicians" },
    egypt: { name: "Egypt", x: 60, y: 160, series: "kc",
      connectedTo: ["house_of_life"],
      desc: "Land of the pharaohs and ancient magic" },

    valhalla: { name: "Valhalla", x: 240, y: 100, series: "mc",
      connectedTo: ["camp_halfblood","asgard","jotunheim"],
      desc: "Hall of fallen warriors" },
    asgard: { name: "Asgard", x: 160, y: 40, series: "mc",
      connectedTo: ["valhalla"],
      desc: "Realm of the Norse gods" },
    jotunheim: { name: "Jotunheim", x: 320, y: 40, series: "mc",
      connectedTo: ["valhalla"],
      desc: "Land of giants and frost" }
  };

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

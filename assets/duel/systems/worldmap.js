/* ============================================
   Mythic Duel — World Map System
   Node map rendering and navigation
   ============================================ */

var DuelWorldMap = (function () {
  "use strict";

  var selectedNode = "camp_halfblood";
  var CW = DuelUtils.CW, CH = DuelUtils.CH;

  var seriesColors = {
    pjo: "#4a9ade", hoo: "#7832a0", kc: "#d4a017", mc: "#2a8a4e", toa: "#e85020"
  };

  function setSelected(nodeId) { selectedNode = nodeId; }
  function getSelected() { return selectedNode; }

  function getConnectedNodes(nodeId) {
    var loc = DuelLocations.get(nodeId);
    if (!loc) return [];
    var result = [];
    for (var i = 0; i < loc.connectedTo.length; i++) {
      var target = DuelLocations.get(loc.connectedTo[i]);
      if (target && DuelProgression.isLocationUnlocked(loc.connectedTo[i])) {
        result.push(loc.connectedTo[i]);
      }
    }
    return result;
  }

  function moveToClosest(direction) {
    var current = DuelLocations.get(selectedNode);
    if (!current) return;
    var connected = getConnectedNodes(selectedNode);
    if (connected.length === 0) return;

    /* Use angle-based matching: each direction covers a 90-degree cone.
       right = -45 to +45 degrees, up = -135 to -45, left = 135 to -135, down = 45 to 135 */
    var best = null, bestScore = -Infinity;
    for (var i = 0; i < connected.length; i++) {
      var target = DuelLocations.get(connected[i]);
      if (!target) continue;
      var dx = target.x - current.x;
      var dy = target.y - current.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) continue;

      /* Calculate how well this node matches the direction (dot product with unit direction) */
      var dirX = 0, dirY = 0;
      if (direction === "right") dirX = 1;
      else if (direction === "left") dirX = -1;
      else if (direction === "up") dirY = -1;
      else if (direction === "down") dirY = 1;

      var dot = (dx / dist) * dirX + (dy / dist) * dirY;
      /* Only consider nodes that are at least somewhat in the right direction (dot > 0.2) */
      if (dot > 0.2) {
        /* Score: higher dot product (better direction match) wins, with slight preference for closer nodes */
        var score = dot - dist / 2000;
        if (score > bestScore) { bestScore = score; best = connected[i]; }
      }
    }
    if (best) selectedNode = best;
  }

  function render(ctx) {
    /* Background */
    var grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, "#0a0a14");
    grad.addColorStop(1, "#141428");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    /* Title */
    ctx.fillStyle = "#e8e6f0";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("World Map", CW / 2, 26);

    /* Scale positions to fit canvas */
    var locs = DuelLocations.locations;
    var conns = DuelLocations.connections;

    /* Draw connections */
    ctx.strokeStyle = "#2a2845";
    ctx.lineWidth = 2;
    for (var i = 0; i < conns.length; i++) {
      var a = locs[conns[i][0]], b = locs[conns[i][1]];
      if (!a || !b) continue;
      var aUnlocked = DuelProgression.isLocationUnlocked(conns[i][0]);
      var bUnlocked = DuelProgression.isLocationUnlocked(conns[i][1]);
      ctx.strokeStyle = (aUnlocked && bUnlocked) ? "#3a3860" : "#1a1830";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    /* Draw nodes */
    var keys = Object.keys(locs);
    for (var j = 0; j < keys.length; j++) {
      var id = keys[j];
      var loc = locs[id];
      var unlocked = DuelProgression.isLocationUnlocked(id);
      var selected = id === selectedNode;
      var color = seriesColors[loc.series] || "#6a6a8a";
      var r = selected ? 14 : 10;

      ctx.beginPath();
      ctx.arc(loc.x, loc.y, r, 0, Math.PI * 2);
      ctx.fillStyle = unlocked ? color : "#1a1a28";
      ctx.fill();
      ctx.strokeStyle = selected ? "#e8e6f0" : (unlocked ? color : "#2a2845");
      ctx.lineWidth = selected ? 3 : 1;
      ctx.stroke();

      /* Node label */
      ctx.fillStyle = unlocked ? "#e8e6f0" : "#4a4a5a";
      ctx.font = (selected ? "bold " : "") + "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(unlocked ? loc.name : "???", loc.x, loc.y + r + 14);

      /* Lock icon */
      if (!unlocked) {
        ctx.fillStyle = "#4a4a5a";
        ctx.font = "10px monospace";
        ctx.fillText("\u{1F512}", loc.x, loc.y + 4);
      }

      /* Enemy count badge */
      if (unlocked) {
        var enemies = DuelEnemyDefs.getByLocation(id);
        if (enemies.length > 0) {
          ctx.fillStyle = "#1a1a2e";
          ctx.beginPath();
          ctx.arc(loc.x + r, loc.y - r, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#e8e6f0";
          ctx.font = "bold 8px monospace";
          ctx.fillText(String(enemies.length), loc.x + r, loc.y - r + 3);
        }
      }
    }

    /* Selected location info panel */
    var sel = locs[selectedNode];
    if (sel && DuelProgression.isLocationUnlocked(selectedNode)) {
      ctx.fillStyle = "rgba(15, 14, 23, 0.9)";
      ctx.fillRect(10, CH - 80, CW - 20, 70);
      ctx.strokeStyle = seriesColors[sel.series] || "#6a6a8a";
      ctx.lineWidth = 1;
      ctx.strokeRect(10, CH - 80, CW - 20, 70);

      ctx.fillStyle = "#e8e6f0";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(sel.name, 20, CH - 60);

      ctx.fillStyle = "#9a96b0";
      ctx.font = "11px monospace";
      ctx.fillText(sel.desc, 20, CH - 44);

      var locEnemies = DuelEnemyDefs.getByLocation(selectedNode);
      var locQuests = DuelQuestEngine.getAvailableQuests(selectedNode);
      ctx.fillStyle = "#d4a017";
      ctx.font = "10px monospace";
      ctx.fillText("Enemies: " + locEnemies.length + "  |  Quests: " + locQuests.length, 20, CH - 28);
    }

    ctx.fillStyle = "#6a6a8a";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Arrows: Navigate \u2022 Space: Enter Location \u2022 Q: Quest Log", CW / 2, CH - 4);
    ctx.textAlign = "left";
  }

  return {
    setSelected: setSelected, getSelected: getSelected,
    moveToClosest: moveToClosest, getConnectedNodes: getConnectedNodes,
    render: render
  };
})();

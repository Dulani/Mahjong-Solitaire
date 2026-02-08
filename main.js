/***********************************************
 * Global Variables and Game State
 ***********************************************/
let tiles = [];            // Array containing all tile objects.
let selectedTileId = null; // Id of the currently selected tile.
let currentLevel = 1;      // Start at Level 1.
const TILE_WIDTH = 80;
const TILE_HEIGHT = 100;

// Define a comprehensive set of Mahjong tile emojis (used as keys for SVG generation).
const tileEmojis = ["🀇","🀈","🀉","🀊","🀋","🀌","🀍","🀎","🀏",
                    "🀐","🀑","🀒","🀓","🀔","🀕","🀖","🀗","🀘",
                    "🀙","🀚","🀛","🀜","🀝","🀞","🀟","🀠","🀡"];

/***********************************************
 * Generate Dynamic Positions for the Level
 ***********************************************/
function generatePositions(level) {
  let pos = [];
  // Base layout: Level 1 - Layer 0 (7 columns x 4 rows = 28 positions)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      pos.push({
        x: 150 + col * 100,
        y: 50 + row * 110,
        z: 0,
        width: TILE_WIDTH,
        height: TILE_HEIGHT
      });
    }
  }
  // Base layout: Level 1 - Layer 1 (2 rows x 4 columns = 8 positions)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      pos.push({
        x: 300 + col * 100,
        y: 150 + row * 110,
        z: 1,
        width: TILE_WIDTH,
        height: TILE_HEIGHT
      });
    }
  }
  // For each extra level beyond 1, add 4 positions (one extra layer per level).
  for (let extra = 0; extra < level - 1; extra++) {
    for (let col = 0; col < 4; col++) {
      pos.push({
        x: 250 + col * 100,
        y: 300 + extra * 110,
        z: 2 + extra,
        width: TILE_WIDTH,
        height: TILE_HEIGHT
      });
    }
  }
  return pos;
}

/***********************************************
 * Initialize the Game
 ***********************************************/
function initGame() {
  tiles = [];
  selectedTileId = null;
  document.getElementById("message").textContent = "";

  const positions = generatePositions(currentLevel);
  const totalTiles = positions.length;
  const uniqueCount = totalTiles / 2;

  let uniqueEmojis = [];
  for (let i = 0; i < uniqueCount; i++) {
    uniqueEmojis.push(tileEmojis[i % tileEmojis.length]);
  }

  let tileTypes = [];
  uniqueEmojis.forEach(emoji => {
    tileTypes.push(emoji);
    tileTypes.push(emoji);
  });
  shuffle(tileTypes);

  for (let i = 0; i < positions.length; i++) {
    let pos = positions[i];
    let tile = {
      id: i,
      type: tileTypes[i],
      x: pos.x,
      y: pos.y,
      z: pos.z,
      width: pos.width,
      height: pos.height,
      removed: false
    };
    tiles.push(tile);
  }
  renderTiles();
  scaleBoard();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/***********************************************
 * Rendering Functions
 ***********************************************/
function renderTiles() {
  let board = document.getElementById("board-container");
  board.innerHTML = "";

  let sortedTiles = tiles.slice().sort((a, b) => a.z - b.z);

  sortedTiles.forEach(tile => {
    if (!tile.removed) {
      let tileDiv = document.createElement("div");
      tileDiv.className = "tile";
      if (tile.id === selectedTileId) {
        tileDiv.classList.add("selected");
      }
      tileDiv.innerHTML = getTileSVG(tile.type);
      tileDiv.style.left = tile.x + "px";
      tileDiv.style.top = tile.y + "px";
      tileDiv.style.zIndex = tile.z;
      tileDiv.onclick = () => handleTileClick(tile.id);
      board.appendChild(tileDiv);
    }
  });
}

/***********************************************
 * SVG Tile Generator
 ***********************************************/
function getTileSVG(emoji) {
  const index = tileEmojis.indexOf(emoji);
  if (index === -1) return emoji;

  let content = '';
  const viewBox = "0 0 100 120";

  if (index < 9) { // Characters
    const characters = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
    content = `
      <text x="50" y="45" font-size="40" text-anchor="middle" fill="#d32f2f" font-family="serif" font-weight="bold">${characters[index]}</text>
      <text x="50" y="95" font-size="45" text-anchor="middle" fill="#d32f2f" font-family="serif" font-weight="bold">萬</text>
    `;
  } else if (index < 18) { // Bamboos
    const count = index - 9 + 1;
    const colors = ["#2e7d32", "#1976d2", "#d32f2f"];
    const bamboo = (x, y, color) => `<rect x="${x-4}" y="${y-12}" width="8" height="24" rx="2" fill="${color}" stroke="#1b5e20" stroke-width="1"/>`;
    if (count === 1) {
      content = `<circle cx="50" cy="60" r="30" fill="none" stroke="#2e7d32" stroke-width="5"/>
                 <path d="M50 30 L50 90 M30 60 L70 60" stroke="#2e7d32" stroke-width="5"/>`;
    } else {
      const layouts = [
        [], [],
        [[50, 40, 0], [50, 80, 0]],
        [[50, 30, 0], [35, 75, 1], [65, 75, 1]],
        [[35, 40, 0], [65, 40, 1], [35, 80, 1], [65, 80, 0]],
        [[30, 35, 0], [70, 35, 1], [50, 60, 2], [30, 85, 1], [70, 85, 0]],
        [[30, 35, 0], [50, 35, 0], [70, 35, 0], [30, 85, 1], [50, 85, 1], [70, 85, 1]],
        [[50, 25, 0], [30, 55, 1], [50, 55, 1], [70, 55, 1], [30, 85, 2], [50, 85, 2], [70, 85, 2]],
        [[30, 30, 0], [50, 30, 0], [70, 30, 0], [30, 60, 1], [50, 60, 1], [70, 60, 1], [40, 90, 2], [60, 90, 2]],
        [[30, 30, 0], [50, 30, 1], [70, 30, 2], [30, 60, 0], [50, 60, 1], [70, 60, 2], [30, 90, 0], [50, 90, 1], [70, 90, 2]]
      ];
      layouts[count].forEach(p => content += bamboo(p[0], p[1], colors[p[2]]));
    }
  } else { // Circles
    const count = index - 18 + 1;
    const colors = ["#1976d2", "#d32f2f", "#2e7d32"];
    const circle = (x, y, r, color) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#0d47a1" stroke-width="1"/>`;
    if (count === 1) {
      content = circle(50, 60, 35, "#1976d2") + circle(50, 60, 15, "#ffeb3b") + circle(50, 60, 5, "#d32f2f");
    } else {
      const layouts = [
        [], [],
        [[35, 40, 15, 0], [65, 80, 15, 2]],
        [[30, 30, 12, 0], [50, 60, 12, 1], [70, 90, 12, 2]],
        [[35, 40, 15, 0], [65, 40, 15, 2], [35, 80, 15, 2], [65, 80, 15, 0]],
        [[30, 30, 12, 0], [70, 30, 12, 2], [50, 60, 12, 1], [30, 90, 12, 2], [70, 90, 12, 0]],
        [[35, 30, 12, 0], [65, 30, 12, 0], [35, 60, 12, 1], [65, 60, 12, 1], [35, 90, 12, 2], [65, 90, 12, 2]],
        [[50, 30, 10, 1], [30, 60, 10, 0], [50, 60, 10, 0], [70, 60, 10, 0], [30, 90, 10, 2], [50, 90, 10, 2], [70, 90, 10, 2]],
        [[35, 25, 10, 0], [65, 25, 10, 0], [35, 50, 10, 0], [65, 50, 10, 0], [35, 75, 10, 0], [65, 75, 10, 0], [35, 100, 10, 0], [65, 100, 10, 0]],
        [[30, 30, 10, 0], [50, 30, 10, 0], [70, 30, 10, 0], [30, 60, 10, 1], [50, 60, 10, 1], [70, 60, 10, 1], [30, 90, 10, 2], [50, 90, 10, 2], [70, 90, 10, 2]]
      ];
      layouts[count].forEach(p => content += circle(p[0], p[1], p[2], colors[p[3]]));
    }
  }
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

/***********************************************
 * Free Tile Detection
 ***********************************************/
function isTileFree(tile) {
  if (tile.removed) return false;
  for (let other of tiles) {
    if (!other.removed && other.z > tile.z && isOverlap(tile, other)) return false;
  }
  let leftBlocked = false;
  let rightBlocked = false;
  for (let other of tiles) {
    if (!other.removed && other.z === tile.z && other.id !== tile.id) {
      if (isTouchingLeft(tile, other)) leftBlocked = true;
      if (isTouchingRight(tile, other)) rightBlocked = true;
    }
  }
  return (!leftBlocked || !rightBlocked);
}

function isOverlap(tile1, tile2) {
  return (tile1.x < tile2.x + tile2.width && tile1.x + tile1.width > tile2.x &&
          tile1.y < tile2.y + tile2.height && tile1.y + tile1.height > tile2.y);
}

function isTouchingLeft(tile, other) {
  return (other.x + other.width >= tile.x - 10 && other.x + other.width <= tile.x + 10 && verticalOverlap(tile, other));
}

function isTouchingRight(tile, other) {
  return (other.x <= tile.x + tile.width + 10 && other.x >= tile.x + tile.width - 10 && verticalOverlap(tile, other));
}

function verticalOverlap(tile, other) {
  return (tile.y < other.y + other.height && tile.y + tile.height > other.y);
}

/***********************************************
 * Tile Selection & Matching
 ***********************************************/
function handleTileClick(tileId) {
  let tile = tiles.find(t => t.id === tileId);
  if (!tile || tile.removed) return;
  if (!isTileFree(tile)) {
    document.getElementById("message").textContent = "Tile is not free.";
    return;
  }
  if (selectedTileId === null) {
    selectedTileId = tileId;
    document.getElementById("message").textContent = "Selected a tile. Click on its match.";
  } else {
    let firstTile = tiles.find(t => t.id === selectedTileId);
    if (firstTile.id === tile.id) {
      selectedTileId = null;
      document.getElementById("message").textContent = "";
    } else if (firstTile.type === tile.type) {
      firstTile.removed = true;
      tile.removed = true;
      document.getElementById("message").textContent = "Matched!";
      selectedTileId = null;
      renderTiles();
      checkWinCondition();
    } else {
      document.getElementById("message").textContent = "Tiles do not match.";
      selectedTileId = null;
    }
  }
  renderTiles();
}

function checkWinCondition() {
  if (tiles.filter(t => !t.removed).length === 0) {
    document.getElementById("message").textContent = "Congratulations! Level " + currentLevel + " cleared!";
    setTimeout(() => {
      currentLevel++;
      initGame();
    }, 2000);
  }
}

/***********************************************
 * Scaling Logic
 ***********************************************/
function scaleBoard() {
  const container = document.getElementById("board-container");
  const header = document.querySelector("header");
  const message = document.getElementById("message");
  const footer = document.querySelector("footer");

  const availableWidth = window.innerWidth - 40;
  const availableHeight = window.innerHeight - header.offsetHeight - message.offsetHeight - footer.offsetHeight - 100;

  const scaleX = availableWidth / 1000;
  const scaleY = availableHeight / 800;
  const scale = Math.min(scaleX, scaleY, 1);

  container.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", scaleBoard);

/***********************************************
 * Event Handlers
 ***********************************************/
document.getElementById("newGameBtn").onclick = () => { currentLevel = 1; initGame(); };
document.getElementById("levelBtn").onclick = () => {
  let level = prompt("Enter level number (1+):", currentLevel);
  if (level && !isNaN(level) && level >= 1) {
    currentLevel = parseInt(level);
    initGame();
  }
};
document.getElementById("helpBtn").onclick = () => document.getElementById("helpModal").style.display = "block";
document.getElementById("closeHelp").onclick = () => document.getElementById("helpModal").style.display = "none";
window.onclick = (e) => { if (e.target === document.getElementById("helpModal")) document.getElementById("helpModal").style.display = "none"; };

initGame();

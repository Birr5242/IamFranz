// static/js/boxfight.js
// =====================
// Boxfight Spiel – einfacher Canvas-Fighter

console.log("Boxfight.js geladen.");

// Canvas holen
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Spielfeldgröße
canvas.width = 800;
canvas.height = 400;

// Bilder laden (Pfad angepasst: img/ liegt eine Ebene über static/)
const ASSETS = {
  bg: "img/bg.jpg",
  player: "img/player.png",
  enemy: "img/fighter.png"
};

let imagesLoaded = 0;
const totalAssets = Object.keys(ASSETS).length;
const loadedAssets = {};

for (const key in ASSETS) {
  const img = new Image();
  img.src = ASSETS[key];
  img.onload = () => {
    imagesLoaded++;
    loadedAssets[key] = img;
    if (imagesLoaded === totalAssets) {
      document.getElementById("startButton").disabled = false;
      console.log("Alle Assets geladen!");
    }
  };
  img.onerror = () => {
    console.error("Asset konnte nicht geladen werden:", ASSETS[key]);
  };
}

// Spieler und Gegner
const player = { x: 100, y: 280, width: 50, height: 80, color: "blue", hp: 100 };
const enemy = { x: 600, y: 280, width: 50, height: 80, color: "red", hp: 100 };

let gameRunning = false;

function draw() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(loadedAssets.bg, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(loadedAssets.player, player.x, player.y, player.width, player.height);
  ctx.drawImage(loadedAssets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);

  // Lebensbalken
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, player.hp * 2, 10);
  ctx.fillRect(canvas.width - 220, 20, enemy.hp * 2, 10);

  requestAnimationFrame(draw);
}

document.getElementById("startButton").addEventListener("click", () => {
  if (!gameRunning) {
    gameRunning = true;
    document.getElementById("startButton").disabled = true;
    document.getElementById("gameSection").style.display = "block";
    console.log("Spiel gestartet!");
    draw();
  }
});

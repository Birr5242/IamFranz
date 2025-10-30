// static/js/boxfight.js
console.log("Boxfight.js geladen.");

// Canvas holen
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Spielfeldgröße
canvas.width = 800;
canvas.height = 400;

// Bilder laden
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
const player = { x: 100, y: 280, width: 50, height: 80, hp: 100, speed: 5, attack: false, vy:0, jumping:false };
const enemy = { x: 600, y: 280, width: 50, height: 80, hp: 100, speed: 2, attack: false };

let gameRunning = false;
let countdown = 3; // Countdown in Sekunden
let enemyActive = false;

// Tastenstatus
const keys = { ArrowLeft: false, ArrowRight: false, Space: false, KeyW:false };

window.addEventListener("keydown", (e) => {
  if (e.code in keys) keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  if (e.code in keys) keys[e.code] = false;
});

// Update Funktion
function update() {
  // Spieler bewegen
  if (keys.ArrowLeft) player.x -= player.speed;
  if (keys.ArrowRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Spieler springen
  if (keys.KeyW && !player.jumping) {
    player.vy = -12;
    player.jumping = true;
  }

  // Gravitation
  player.y += player.vy;
  player.vy += 0.5; // Schwerkraft
  if (player.y >= 280) {
    player.y = 280;
    player.vy = 0;
    player.jumping = false;
  }

  // Spieler angreifen
  player.attack = keys.Space;

  if (enemyActive) {
    // Gegner läuft automatisch auf Spieler zu
    if (enemy.x > player.x) enemy.x -= enemy.speed;
    if (enemy.x < player.x) enemy.x += enemy.speed;

    // Gegner angreifen, wenn nah beim Spieler
    enemy.attack = Math.abs(enemy.x - player.x) < 60;
  }

  // Treffererkennung Spieler -> Gegner
  if (player.attack && Math.abs(player.x - enemy.x) < 60 && Math.abs(player.y - enemy.y) < 50) {
    enemy.hp -= 1;
  }

  // Treffererkennung Gegner -> Spieler
  if (enemy.attack && Math.abs(enemy.x - player.x) < 60 && Math.abs(player.y - enemy.y) < 50) {
    player.hp -= 0.5; // Gegner greift langsamer an
  }

  // Leben begrenzen
  player.hp = Math.max(0, player.hp);
  enemy.hp = Math.max(0, enemy.hp);

  // Spielende prüfen
  if (player.hp <= 0 || enemy.hp <= 0) {
    gameRunning = false;
    let winner = player.hp <= 0 ? "Gegner gewinnt!" : "Spieler gewinnt!";
    console.log("Spiel beendet:", winner);
    alert(winner);
    document.getElementById("startButton").disabled = false;
  }
}

// Draw Funktion
function draw() {
  if (!gameRunning) return;

  update(); // Positionen und Logik updaten

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(loadedAssets.bg, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(loadedAssets.player, player.x, player.y, player.width, player.height);
  ctx.drawImage(loadedAssets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);

  // Lebensbalken Spieler
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, player.hp * 2, 10);
  // Lebensbalken Gegner
  ctx.fillRect(canvas.width - 220, 20, enemy.hp * 2, 10);

  // Countdown anzeigen, wenn noch aktiv
  if (!enemyActive) {
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText(countdown, canvas.width/2 - 15, canvas.height/2);
  }

  requestAnimationFrame(draw);
}

// Countdown Funktion
function startCountdown() {
  if (countdown > 0) {
    draw(); // Anzeige aktualisieren
    setTimeout(() => {
      countdown--;
      startCountdown();
    }, 1000);
  } else {
    enemyActive = true;
  }
}

// Startbutton
document.getElementById("startButton").addEventListener("click", () => {
  if (!gameRunning) {
    gameRunning = true;
    countdown = 3;
    enemyActive = false;
    document.getElementById("startButton").disabled = true;
    document.getElementById("gameSection").style.display = "block";
    console.log("Spiel gestartet!");
    startCountdown();
  }
});

// static/js/boxfight.js
console.log("Boxfight.js geladen.");

// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

// Pixelart Schärfe beibehalten
ctx.imageSmoothingEnabled = false;

// Assets
const ASSETS = {
  bg: "img/bg.jpg",

  idle1: "img/Boxanimation1-1.png",
  idle2: "img/Boxanimation1-2.png",

  walk1: "img/Laufanimation1-1.png",
  walk2: "img/Laufanimation1-2.png",

  jump1: "img/Spring-1.png",
  jump2: "img/Spring-2.png",
  jump3: "img/Spring-3.png",

  enemy: "img/fighter.png"
};

let loaded = {};
let total = Object.keys(ASSETS).length;
let done = 0;

// Lade Bilder
for (let key in ASSETS) {
  const img = new Image();
  img.src = ASSETS[key];
  img.onload = () => {
    loaded[key] = img;
    done++;
    if (done === total) document.getElementById("startButton").disabled = false;
  };
}

// Variablen
let player, enemy;
let gameRunning = false;
let countdown = 3;
let canMove = false;

let frameTimer = 0;
let frameIndex = 0;

// Anti Jump Spam System
let jumpsUsed = 0;
let jumpCooldownTimer = 0;

// Gegner Sprung
let enemyJumpCooldown = 0;

// Get Animation
function getPlayerFrame() {
  if (player.jumping) {
    if (player.vy < -2) return loaded.jump1;
    if (player.vy > 2) return loaded.jump3;
    return loaded.jump2;
  }

  if (keys.ArrowLeft || keys.ArrowRight) {
    frameTimer++;
    if (frameTimer > 12) {
      frameIndex = (frameIndex + 1) % 2;
      frameTimer = 0;
    }
    return frameIndex === 0 ? loaded.walk1 : loaded.walk2;
  }

  frameTimer++;
  if (frameTimer > 18) {
    frameIndex = (frameIndex + 1) % 2;
    frameTimer = 0;
  }
  return frameIndex === 0 ? loaded.idle1 : loaded.idle2;
}

// Steuerung
const keys = { ArrowLeft: false, ArrowRight: false, Space: false, KeyW: false };
window.addEventListener("keydown", e => { if (keys[e.code] !== undefined) keys[e.code] = true; });
window.addEventListener("keyup", e => { if (keys[e.code] !== undefined) keys[e.code] = false; });

// Update
function update() {

  if (!canMove) return;

  // Bewegung reduziert
  if (keys.ArrowLeft) player.x -= player.speed;
  if (keys.ArrowRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Anti Jump Spam
  if (keys.KeyW && !player.jumping && jumpsUsed < 3) {
    player.vy = -11;
    player.jumping = true;
    jumpsUsed++;
    if (jumpsUsed >= 3) jumpCooldownTimer = 120; // 2 Sekunden Pause
  }

  if (jumpCooldownTimer > 0) {
    jumpCooldownTimer--;
    if (jumpCooldownTimer === 0) jumpsUsed = 0;
  }

  // Schwerkraft
  player.y += player.vy;
  player.vy += 0.5;
  if (player.y >= 280) {
    player.y = 280;
    player.vy = 0;
    player.jumping = false;
  }

  // Angriff
  if (keys.Space && Math.abs(player.x - enemy.x) < 55) enemy.hp -= 0.3;

  // Gegner KI Bewegung langsam
  if (enemy.x > player.x) enemy.x -= enemy.speed;
  else enemy.x += enemy.speed;

  // Gegner Springt manchmal
  if (!enemy.jumping && enemyJumpCooldown <= 0 && Math.random() < 0.01) {
    enemy.vy = -10;
    enemy.jumping = true;
    enemyJumpCooldown = 90;
  }
  enemyJumpCooldown--;

  // Gegner Schwerkraft
  enemy.y += enemy.vy;
  enemy.vy += 0.45;
  if (enemy.y >= 280) { enemy.y = 280; enemy.vy = 0; enemy.jumping = false; }

  // Gegner Angriff
  if (Math.abs(player.x - enemy.x) < 55) player.hp -= 0.2;

  player.hp = Math.max(0, player.hp);
  enemy.hp = Math.max(0, enemy.hp);

  if (player.hp <= 0 || enemy.hp <= 0) {
    gameRunning = false;
    alert(player.hp <= 0 ? "Gegner gewinnt!" : "Du gewinnst!");
    document.getElementById("startButton").disabled = false;
  }
}

// Draw
function draw() {
  if (!gameRunning) return;

  update();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(loaded.bg, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(getPlayerFrame(), player.x, player.y, player.width, player.height);
  ctx.drawImage(loaded.enemy, enemy.x, enemy.y, enemy.width, enemy.height);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, player.hp * 2, 10);
  ctx.fillRect(canvas.width - 220, 20, enemy.hp * 2, 10);

  if (!canMove) {
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText(countdown, canvas.width/2 - 15, canvas.height/2);
  }

  requestAnimationFrame(draw);
}

// Countdown
function startCountdown() {
  draw();
  if (countdown > 0) {
    setTimeout(() => {
      countdown--;
      startCountdown();
    }, 1000);
  } else canMove = true;
}

// Start
document.getElementById("startButton").addEventListener("click", () => {
  player = { x: 100, y: 280, width: 96, height: 96, hp: 100, speed: 2, vy: 0, jumping: false };
  enemy  = { x: 600, y: 280, width: 96, height: 96, hp: 100, speed: 1.2, vy: 0, jumping: false };
  countdown = 3;
  canMove = false;
  gameRunning = true;
  startCountdown();
});

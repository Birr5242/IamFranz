// static/js/boxfight.js
console.log("Boxfight System aktiv.");

/*
  Dieses Skript entspricht dem System in hobbys.html:
  - BoxFightInit(images)   → Bilder werden bereitgestellt
  - BoxFightStart()        → Spiel starten
  - BoxFightRestart()      → Neustart-Button
  - BoxFightMobileAction() → Mobile Buttons
*/

/* Canvas & Kontext */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

/* Steuerung */
const keys = { left: false, right: false, jump: false, attack: false };
let mobile = { left: false, right: false, jump: false, attack: false };

/* Spieler & Gegner */
let player, enemy;
let images = {};
let running = false;
let difficulty = 0.8; // Standard Mittel

/* Animation */
let frameTimer = 0;
let frameIndex = 0;

/* Wird von hobbys.html nach Asset-Load aufgerufen */
function BoxFightInit(loadedImages) {
  images = loadedImages;
  console.log("Bilder übertragen:", images);
}

/* Neue Runde vorbereiten */
function setupCharacters() {
  player = { x: 120, y: 280, w: 96, h: 96, hp: 100, vy: 0, jumping: false, speed: 2 };
  enemy  = { x: 600, y: 280, w: 96, h: 96, hp: 100, vy: 0, jumping: false, speed: 1.2 * difficulty };
}

/* Steuerung Tasten */
window.addEventListener("keydown", e => {
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = true;
  if (e.code === "Space") keys.attack = true;
});

window.addEventListener("keyup", e => {
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = false;
  if (e.code === "Space") keys.attack = false;
});

/* Mobile Steuerung */
function BoxFightMobileAction(action, state) {
  mobile[action] = state;
}

/* HUD Aktualisieren */
function updateHUD() {
  document.getElementById("player-health").style.width = player.hp + "%";
  document.getElementById("enemy-health").style.width = enemy.hp + "%";
}

/* Bewegungslogik */
function update() {

  const moveLeft = keys.left || mobile.left;
  const moveRight = keys.right || mobile.right;
  const jump = keys.jump || mobile.jump;
  const attack = keys.attack || mobile.attack;

  if (moveLeft) player.x -= player.speed;
  if (moveRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  if (jump && !player.jumping) {
    player.vy = -11;
    player.jumping = true;
  }

  player.y += player.vy;
  player.vy += 0.5;
  if (player.y >= 280) {
    player.y = 280;
    player.jumping = false;
    player.vy = 0;
  }

  if (attack && Math.abs(player.x - enemy.x) < 60) enemy.hp -= 0.4;

  if (enemy.x > player.x) enemy.x -= enemy.speed;
  else enemy.x += enemy.speed;

  if (Math.abs(player.x - enemy.x) < 55) player.hp -= 0.25;

  updateHUD();

  if (player.hp <= 0 || enemy.hp <= 0) {
    running = false;
    alert(player.hp <= 0 ? "Gegner gewinnt!" : "Du gewinnst!");
  }
}

/* Animationsframe bestimmen */
function getPlayerFrame() {

  if (player.jumping) {
    if (player.vy < -2) return images.player_jump_1;
    if (player.vy > 2) return images.player_jump_3;
    return images.player_jump_2;
  }

  if (keys.left || keys.right || mobile.left || mobile.right) {
    frameTimer++;
    if (frameTimer > 12) {
      frameIndex = (frameIndex + 1) % 2;
      frameTimer = 0;
    }
    return frameIndex === 0 ? images.player_run_1 : images.player_run_2;
  }

  frameTimer++;
  if (frameTimer > 18) {
    frameIndex = (frameIndex + 1) % 2;
    frameTimer = 0;
  }
  return frameIndex === 0 ? images.player_idle_1 : images.player_idle_2;
}

/* Rendering */
function loop() {
  if (!running) return;
  update();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(getPlayerFrame(), player.x, player.y, player.w, player.h);
  ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);
  requestAnimationFrame(loop);
}

/* wird vom Start Button in hobbys.html ausgelöst */
function BoxFightStart() {
  difficulty = parseFloat(document.getElementById("difficulty").value);
  setupCharacters();
  running = true;
  loop();
}

/* Neustart */
function BoxFightRestart() {
  BoxFightStart();
}

/* Bereitstellen */
window.BoxFightInit = BoxFightInit;
window.BoxFightStart = BoxFightStart;
window.BoxFightRestart = BoxFightRestart;
window.BoxFightMobileAction = BoxFightMobileAction;

// static/js/boxfight.js
console.log("Boxfight System aktiv.");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const keys = { left: false, right: false, jump: false, attack: false };
let mobile = { left: false, right: false, jump: false, attack: false };

let player, enemy;
let images = {};
let running = false;
let difficulty = 0.8;

let frameTimer = 0;
let frameIndex = 0;

function BoxFightInit(loadedImages) {
  images = loadedImages;
  console.log("Bilder übertragen:", images);
}

function setupCharacters() {
  player = { x: 120, y: 280, w: 96, h: 96, hp: 100, vy: 0, jumping: false, speed: 2 };
  enemy  = { x: 600, y: 280, w: 96, h: 96, hp: 100, vy: 0, jumping: false, speed: 1.2 * difficulty };
}

window.addEventListener("keydown", e => {
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = true;
  if (e.code === "KeyK") keys.attack = true;
});

window.addEventListener("keyup", e => {
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = false;
  if (e.code === "KeyK") keys.attack = false;
});

function BoxFightMobileAction(action, state) {
  if (action === "punch") mobile.attack = state;
  else mobile[action] = state;
}

function updateHUD() {
  document.getElementById("player-health").style.width = player.hp + "%";
  document.getElementById("enemy-health").style.width = enemy.hp + "%";
}

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

function getPlayerFrame() {
  const punching = keys.attack || mobile.attack;

  if (punching) {
    frameTimer++;
    if (frameTimer > 10) {
      frameIndex = (frameIndex + 1) % 2;
      frameTimer = 0;
    }
    return frameIndex === 0 ? images.player_punch_1 : images.player_punch_2;
  }

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

function loop() {
  if (!running) return;
  update();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(getPlayerFrame(), player.x, player.y, player.w, player.h);
  ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);
  requestAnimationFrame(loop);
}

function BoxFightStart() {
  difficulty = parseFloat(document.getElementById("difficulty").value);
  setupCharacters();
  running = true;
  loop();
}

function BoxFightRestart() {
  BoxFightStart();
}

window.BoxFightInit = BoxFightInit;
window.BoxFightStart = BoxFightStart;
window.BoxFightRestart = BoxFightRestart;
window.BoxFightMobileAction = BoxFightMobileAction;

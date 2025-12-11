// static/js/boxfight.js
console.log("Boxfight System aktiv.");

(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas ? canvas.getContext("2d") : null;
  if (!ctx) {
    console.error("Kein Canvas-Kontext!");
    return;
  }
  ctx.imageSmoothingEnabled = false;

  let images = {};
  let assets = {};
  let player = null;
  let enemy = null;
  let running = false;

  const keys = { left: false, right: false };
  let frameIndex = 0;
  let frameTimer = 0;
  let punchAnimating = false;

  let gameStarted = false;
  let countdown = 3;
  let countdownTimer = 0;
  const countdownDelay = 60;

  // Plattform und Grenzen (skaliert)
  const PLATFORM_Y = 178; // entspricht ~126 * 1.4118
  const MIN_X = 21;
  const MAX_X = 889;

  const GRAVITY = 0.6;
  const PUNCH_COOLDOWN = 600; // etwas langsamer

  // Init: BoxFightInit wird vom Preloader mit images gefüllt
  window.BoxFightInit = function (loadedImages, passedAssets) {
    images = loadedImages || {};
    assets = passedAssets || {};

    // map fallback: falls blue jump files nicht vorhanden nutze rote jumps
    if (!images.enemy_jump_1 && images.player_jump_1) images.enemy_jump_1 = images.player_jump_1;
    if (!images.enemy_jump_2 && images.player_jump_2) images.enemy_jump_2 = images.player_jump_2;
    if (!images.enemy_jump_3 && images.player_jump_3) images.enemy_jump_3 = images.player_jump_3;
    if (!images.enemy_jump_1_back && images.player_jump_1_back) images.enemy_jump_1_back = images.player_jump_1_back;
    if (!images.enemy_jump_2_back && images.player_jump_2_back) images.enemy_jump_2_back = images.player_jump_2_back;
    if (!images.enemy_jump_3_back && images.player_jump_3_back) images.enemy_jump_3_back = images.player_jump_3_back;

    // setze images.bg falls vorhanden
    if (images.bg_fertig) images.bg = images.bg_fertig;

    console.log("BoxFightInit abgeschlossen. Geladene Keys:", Object.keys(images));
  };

  function setupCharacters() {
    const SPR_H = 96;
    player = { x: 120, y: PLATFORM_Y - SPR_H, w: 96, h: SPR_H, hp: 100, vy: 0, jumping: false, speed: 2.2, facing: "right", prevX: 120 };
    enemy  = { x: 600, y: PLATFORM_Y - SPR_H, w: 96, h: SPR_H, hp: 100, vy: 0, jumping: false, speed: 2.2, facing: "left", prevX: 600, attackCooldown: false };
  }

  window.BoxFightStart = function () {
    setupCharacters();
    running = true;
    gameStarted = false;
    countdown = 3;
    countdownTimer = 0;

    // Versuche Musik zu spielen (wenn vorhanden)
    if (assets && assets.bg_music) {
      try {
        const a = new Audio(assets.bg_music);
        a.loop = true; a.volume = 0.45; a.play().catch(()=>console.log("Autoplay blockiert"));
      } catch (e) { console.warn("Fehler beim Abspielen der Musik:", e); }
    }

    requestAnimationFrame(loop);
  };

  window.BoxFightRestart = function () {
    setupCharacters();
    player.hp = 100; enemy.hp = 100;
    document.getElementById("player-health").style.width = "100%";
    document.getElementById("enemy-health").style.width = "100%";
    running = true; gameStarted = false; countdown = 3; countdownTimer = 0;
    requestAnimationFrame(loop);
  };

  // Input
  window.addEventListener("keydown", e => {
    if (!player || !gameStarted) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      if (!player.jumping) { player.vy = -10; player.jumping = true; }
    }
    if (e.code === "KeyK") { if (!punchAnimating) doPlayerPunch(); }
  });
  window.addEventListener("keyup", e => {
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
  });

  // Player punch
  function doPlayerPunch() {
    if (punchAnimating) return;
    punchAnimating = true;
    const reach = 60;
    if (Math.abs(player.x - enemy.x) < reach) enemy.hp = Math.max(0, enemy.hp - 2.5);
    setTimeout(() => { punchAnimating = false; }, PUNCH_COOLDOWN);
  }

  function update() {
    if (!running || !player || !enemy) return;
    if (!gameStarted) return;

    player.prevX = player.x;
    enemy.prevX = enemy.x;

    // Player movement & clamp to platform
    if (keys.left) { player.x -= player.speed; player.facing = "left"; }
    else if (keys.right) { player.x += player.speed; player.facing = "right"; }

    player.x = Math.max(MIN_X, Math.min(MAX_X - player.w, player.x));

    // Gravity for player (but no falling off platform)
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= PLATFORM_Y - player.h) { player.y = PLATFORM_Y - player.h; player.jumping = false; player.vy = 0; }

    // Enemy AI (stay on platform)
    const distance = enemy.x - player.x;
    const absDist = Math.abs(distance);
    const difficulty = parseFloat(document.getElementById('difficulty')?.value || "1");

    if (absDist > 55) {
      if (distance > 0) { enemy.x -= enemy.speed * difficulty; enemy.facing = "left"; }
      else { enemy.x += enemy.speed * difficulty; enemy.facing = "right"; }
    } else if (Math.random() < 0.01) {
      enemy.x += (Math.random() - 0.5) * 4;
    }

    // clamp enemy horizontally
    enemy.x = Math.max(MIN_X, Math.min(MAX_X - enemy.w, enemy.x));

    // enemy jump occasionally
    if (!enemy.jumping && absDist < 120 && Math.random() < 0.008 * difficulty) {
      enemy.vy = -10; enemy.jumping = true;
    }

    // enemy attack
    if (!enemy.attackCooldown && absDist < 60 && Math.random() < 0.02 * difficulty) {
      enemy.attackCooldown = true;
      setTimeout(() => {
        if (Math.abs(enemy.x - player.x) < 70) player.hp = Math.max(0, player.hp - 2.5);
        enemy.attackCooldown = false;
      }, PUNCH_COOLDOWN);
    }

    enemy.vy += GRAVITY;
    enemy.y += enemy.vy;
    if (enemy.y >= PLATFORM_Y - enemy.h) { enemy.y = PLATFORM_Y - enemy.h; enemy.jumping = false; enemy.vy = 0; }

    // update HP bars
    document.getElementById("player-health").style.width = Math.max(0, Math.min(100, player.hp)) + "%";
    document.getElementById("enemy-health").style.width = Math.max(0, Math.min(100, enemy.hp)) + "%";

    // end condition
    if (player.hp <= 0 || enemy.hp <= 0) {
      running = false;
      setTimeout(() => alert(enemy.hp <= 0 ? "Du gewinnst!" : "Gegner gewinnt!"), 50);
    }
  }

  // Choose frame to draw
  function getFrame(c) {
    if (!c) return null;
    const moving = (c === player) ? (keys.left || keys.right) : Math.abs(c.x - c.prevX) > 0.5;
    const jumping = c.jumping;
    const punch = (c === player) ? punchAnimating : (c.attackCooldown || false);

    let action = "idle";
    if (punch) action = "punch";
    else if (jumping) action = "jump";
    else if (moving) action = "run";

    frameTimer++;
    const limit = action === "idle" ? 18 : 10;
    if (frameTimer > limit) { frameTimer = 0; frameIndex = (frameIndex + 1) % 2; }

    const faceRight = c.facing === "right";

    if (c === player) {
      switch (action) {
        case "idle": return faceRight ? (images.stand || null) : (images.stand_back || null);
        case "run": return faceRight ? (images.player_run_1 || images.player_run_2) : (images.player_run_1_back || images.player_run_2_back);
        case "punch": return faceRight ? (images.player_punch_1 || images.player_punch_2) : (images.player_punch_1_back || images.player_punch_2_back);
        case "jump":
          if (c.vy < -2) return faceRight ? images.player_jump_1 : images.player_jump_1_back;
          if (c.vy > 2) return faceRight ? images.player_jump_3 : images.player_jump_3_back;
          return faceRight ? images.player_jump_2 : images.player_jump_2_back;
      }
    }

    // enemy
    switch (action) {
      case "idle": return faceRight ? (images.enemy_stand_back || images.enemy_stand) : (images.enemy_stand || images.enemy_stand_back);
      case "run": return faceRight ? (images.enemy_run_1_back || images.enemy_run_2_back) : (images.enemy_run_1 || images.enemy_run_2);
      case "punch": return faceRight ? (images.enemy_punch_1_back || images.enemy_punch_2_back) : (images.enemy_punch_1 || images.enemy_punch_2);
      case "jump":
        if (c.vy < -2) return faceRight ? images.enemy_jump_1_back : images.enemy_jump_1;
        if (c.vy > 2) return faceRight ? images.enemy_jump_3_back : images.enemy_jump_3;
        return faceRight ? images.enemy_jump_2_back : images.enemy_jump_2;
    }

    return null;
  }

  function draw() {
    // background
    if (images.bg && (images.bg instanceof HTMLImageElement || images.bg instanceof HTMLCanvasElement)) {
      ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#071428";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // subtle platform visual
    ctx.fillStyle = "rgba(80,40,140,0.25)";
    ctx.fillRect(MIN_X, PLATFORM_Y, MAX_X - MIN_X, 6);

    // draw characters
    const pf = getFrame(player);
    if (pf) { try { ctx.drawImage(pf, player.x, player.y, player.w, player.h); } catch(e){} }
    else {
      // fallback rectangle if no sprite
      ctx.fillStyle = "red";
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    const ef = getFrame(enemy);
    if (ef) { try { ctx.drawImage(ef, enemy.x, enemy.y, enemy.w, enemy.h); } catch(e){} }
    else {
      ctx.fillStyle = "blue";
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    }

    // countdown overlay
    if (!gameStarted) {
      ctx.fillStyle = "red";
      ctx.font = "50px Arial";
      ctx.textAlign = "center";
      if (countdown > 0) ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
      else ctx.fillText("LOS!", canvas.width / 2, canvas.height / 2);

      countdownTimer++;
      if (countdownTimer > countdownDelay) {
        countdown--;
        countdownTimer = 0;
        if (countdown < 0) gameStarted = true;
      }
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

})();

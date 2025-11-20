console.log("Boxfight System aktiv.");

(function(){
  let canvas = document.getElementById("game");
  let ctx = canvas ? canvas.getContext("2d") : null;
  if (ctx) ctx.imageSmoothingEnabled = false;

  const keys = { left: false, right: false, jump: false, attack: false };
  let mobile = { left: false, right: false, jump: false, attack: false };

  let player, enemy;
  let images = {};
  let running = false;
  let difficulty = 0.8;

  // Animation-State
  let lastAction = "idle"; // idle, run, jump, punch
  let actionFrameIndex = 0;
  let actionFrameTimer = 0;

  // Countdown
  let countdown = 3;
  let countdownRunning = false;

  // Punch Trigger (nur bei neuem Tastendruck)
  let punchTriggered = false;
  let punchPlaying = false; // Flag, dass Animation noch läuft

  // Anti-Bunnyhop
  let jumpCooldown = false;

  function BoxFightInit(loadedImages) {
    images = loadedImages || window.PRELOADED_ASSETS || {};
    console.log("Bilder übertragen:", images);
  }

  function setupCharacters() {
    player = { x: 120, y: 280, w: 96, h: 96, hp: 100, vy: 0, jumping: false, speed: 2 };
    enemy  = { x: 600, y: 280, w: 96, h: 96, hp: 100, vy: 0, jumping: false, speed: 1.2 * difficulty };
  }

  window.addEventListener("keydown", e => {
    if (countdownRunning) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
    if (e.code === "KeyW" || e.code === "ArrowUp") {
      if (!player.jumping && !jumpCooldown) {
        keys.jump = true;
        jumpCooldown = true;
      }
    }
    if (e.code === "KeyK") {
      if (!punchTriggered && !punchPlaying) {
        keys.attack = true;
        punchTriggered = true;
      }
    }
  });

  window.addEventListener("keyup", e => {
    if (countdownRunning) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = false;
    if (e.code === "KeyK") { punchTriggered = false; }
  });

  function BoxFightMobileAction(action, state) {
    if (countdownRunning) return;
    if (action === "punch") {
      if (state && !punchTriggered && !punchPlaying) { mobile.attack = true; punchTriggered = true; }
      if (!state) { mobile.attack = false; punchTriggered = false; }
    } else if (mobile.hasOwnProperty(action)) mobile[action] = state;
  }

  function updateHUD() {
    const ph = document.getElementById("player-health");
    const eh = document.getElementById("enemy-health");
    if (ph) ph.style.width = Math.max(0, Math.min(100, player.hp)) + "%";
    if (eh) eh.style.width = Math.max(0, Math.min(100, enemy.hp)) + "%";
  }

  function update() {
    if (!player || !enemy) return;
    if (!running) return;

    const moveLeft = keys.left || mobile.left;
    const moveRight = keys.right || mobile.right;
    const jump = keys.jump || mobile.jump;
    const attack = (keys.attack || mobile.attack) && !punchPlaying;

    // Bewegung
    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    player.x = Math.max(0, Math.min((canvas ? canvas.width : 900) - player.w, player.x));

    // Springen
    if (jump && !player.jumping) {
      player.vy = -11;
      player.jumping = true;
      keys.jump = false;
    }

    player.y += player.vy;
    player.vy += 0.6;

    if (player.y >= 280) {
      player.y = 280;
      player.jumping = false;
      player.vy = 0;
      jumpCooldown = false;
    }

    // Angriff nur in Reichweite
    if (attack && Math.abs(player.x - enemy.x) < 60) {
      enemy.hp -= 0.4;
      punchPlaying = true; // Animation startet
      keys.attack = false;
      mobile.attack = false;
    }

    // Gegner KI
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
    let currentAction = "idle";
    const moving = keys.left || keys.right || mobile.left || mobile.right;
    const jumping = player.jumping;

    if (countdownRunning) currentAction = "idle";
    else if (punchPlaying) currentAction = "punch";
    else if (jumping) currentAction = "jump";
    else if (moving) currentAction = "run";

    if (currentAction !== lastAction) {
      actionFrameIndex = 0;
      actionFrameTimer = 0;
      lastAction = currentAction;
    }

    actionFrameTimer++;

    switch(currentAction) {
      case "punch":
        if (actionFrameTimer > 12) {
          actionFrameIndex = (actionFrameIndex + 1) % 2;
          actionFrameTimer = 0;
          if (actionFrameIndex === 1) punchPlaying = false; // Animation fertig
        }
        return actionFrameIndex === 0 ? images.player_punch_1 : images.player_punch_2;
      case "jump":
        if (player.vy < -2) return images.player_jump_1;
        if (player.vy > 2) return images.player_jump_3;
        return images.player_jump_2;
      case "run":
        if (actionFrameTimer > 12) { actionFrameIndex = (actionFrameIndex + 1) % 2; actionFrameTimer = 0; }
        return actionFrameIndex === 0 ? images.player_run_1 : images.player_run_2;
      default: // idle
        if (actionFrameTimer > 18) { actionFrameIndex = (actionFrameIndex + 1) % 2; actionFrameTimer = 0; }
        return actionFrameIndex === 0 ? images.player_idle_1 : images.player_idle_2;
    }
  }

  function loop() {
    if (!running) return;
    update();
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (images.bg) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
      const pf = getPlayerFrame();
      if (pf) ctx.drawImage(pf, player.x, player.y, player.w, player.h);
      if (images.enemy) ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);
    }
    requestAnimationFrame(loop);
  }

  function drawCountdown() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (images.bg) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "80px Arial";
    ctx.textAlign = "center";
    ctx.fillText(countdown > 0 ? countdown : "FIGHT!", canvas.width / 2, canvas.height / 2);

    const pf = getPlayerFrame();
    if (pf) ctx.drawImage(pf, player.x, player.y, player.w, player.h);
    if (images.enemy) ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);

    if (countdown <= 0) {
      countdownRunning = false;
      running = true;
      loop();
    }
  }

  function startCountdown() {
    countdown = 3;
    countdownRunning = true;
    running = false;
    const interval = setInterval(() => {
      countdown--;
      drawCountdown();
      if (countdown < 0) clearInterval(interval);
    }, 1000);
  }

  function BoxFightStart() {
    const diffElem = document.getElementById("difficulty");
    difficulty = diffElem ? parseFloat(diffElem.value) : 0.8;
    setupCharacters();
    startCountdown();
  }

  function BoxFightRestart() {
    setupCharacters();
    if (player) player.hp = 100;
    if (enemy) enemy.hp = 100;
    updateHUD();
    startCountdown();
  }

  window.BoxFightInit = BoxFightInit;
  window.BoxFightStart = BoxFightStart;
  window.BoxFightRestart = BoxFightRestart;
  window.BoxFightMobileAction = BoxFightMobileAction;

  if (window.PRELOADED_ASSETS) BoxFightInit(window.PRELOADED_ASSETS);

})();

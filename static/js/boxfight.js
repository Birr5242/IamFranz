// static/js/boxfight.js
console.log("Boxfight System aktiv.");

(function(){
  const canvas = document.getElementById("game");
  const ctx = canvas ? canvas.getContext("2d") : null;
  if (ctx) ctx.imageSmoothingEnabled = false;

  let images = {};        
  let assets = {};        
  let player = null;
  let enemy = null;
  let running = false;

  const keys = { left: false, right: false, jump: false, attack: false };
  const mobile = { left: false, right: false, jump: false, attack: false };

  let bgMusic = null;
  let lastAction = "idle";
  let frameIndex = 0;
  let frameTimer = 0;
  let punchAnimating = false;

  // --- NEUE VARIABLEN ---
  let gameStarted = false;  
  let countdown = 3;         
  let countdownTimer = 0;
  const countdownDelay = 60; 

  // --- INIT ---
  window.BoxFightInit = function(loadedImages, passedAssets) {
    images = loadedImages || {};
    assets = passedAssets || {};

    if (assets.bg_music) {
      bgMusic = new Audio(assets.bg_music);
      bgMusic.loop = true;
      bgMusic.volume = 0.45;
    }

    console.log("BoxFightInit: Bilder geladen:", Object.keys(images));

    const ph = document.getElementById("player-health");
    const eh = document.getElementById("enemy-health");
    if (ph) ph.style.width = "100%";
    if (eh) eh.style.width = "100%";
  };

  function setupCharacters() {
    player = { x:120, y:280, w:96, h:96, hp:100, vy:0, jumping:false, speed:2.2 };
    enemy  = { x:600, y:280, w:96, h:96, hp:100, vy:0, jumping:false, speed:1.4 };
  }

  // --- START ---
  window.BoxFightStart = function() {
    setupCharacters();
    running = true;
    gameStarted = false;
    countdown = 3;
    countdownTimer = 0;

    if (bgMusic) bgMusic.play().catch(()=>{ console.log("Autoplay blockiert"); });
    if (canvas && canvas.focus) canvas.focus();

    requestAnimationFrame(loop);
  };

  window.BoxFightRestart = function() {
    setupCharacters();
    if (player) player.hp = 100;
    if (enemy) enemy.hp = 100;
    const ph = document.getElementById("player-health");
    const eh = document.getElementById("enemy-health");
    if (ph) ph.style.width = "100%";
    if (eh) eh.style.width = "100%";
    running = true;
    gameStarted = false;
    countdown = 3;
    countdownTimer = 0;
    requestAnimationFrame(loop);
  };

  window.BoxFightMobileAction = function(action, state) {
    if (mobile.hasOwnProperty(action)) mobile[action] = state;
  };

  // --- INPUT ---
  window.addEventListener("keydown", e => {
    if (!player || !gameStarted) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
    if ((e.code === "KeyW" || e.code === "ArrowUp") && !player.jumping) {
      keys.jump = true; player.vy = -10; player.jumping = true;
    }
    if (e.code === "KeyK" && !punchAnimating) keys.attack = true;
  });

  window.addEventListener("keyup", e => {
    if (!player) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = false;
    if (e.code === "KeyK") keys.attack = false;
  });

  // --- UPDATE ---
  function update() {
    if (!running || !player || !enemy) return;

    if (!gameStarted) return;

    const moveLeft  = keys.left || mobile.left;
    const moveRight = keys.right || mobile.right;
    const jump      = keys.jump || mobile.jump;
    const punch     = keys.attack || mobile.attack;

    if (moveLeft)  player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    player.y += player.vy;
    player.vy += 0.6;
    if (player.y >= 280) { player.y = 280; player.jumping = false; player.vy = 0; }

    if (punch && !punchAnimating) {
      punchAnimating = true;
      if (Math.abs(player.x - enemy.x) < 60) { enemy.hp -= 2.5; enemy.hp = Math.max(0, enemy.hp); }
      setTimeout(()=> { punchAnimating = false; }, 220);
    }

    if (enemy.x > player.x) enemy.x -= enemy.speed;
    else enemy.x += enemy.speed;

    if (Math.abs(player.x - enemy.x) < 55) {
      player.hp -= 0.15; player.hp = Math.max(0, player.hp);
    }

    const ph = document.getElementById("player-health");
    const eh = document.getElementById("enemy-health");
    if (ph) ph.style.width = Math.max(0, Math.min(100, player.hp)) + "%";
    if (eh) eh.style.width = Math.max(0, Math.min(100, enemy.hp)) + "%";

    if (player.hp <= 0 || enemy.hp <= 0) {
      running = false;
      setTimeout(()=> { alert(enemy.hp <= 0 ? "Du gewinnst!" : "Gegner gewinnt!"); }, 50);
    }
  }

  // --- ANIMATION ---
  function getPlayerFrame() {
    if (!player) return null;

    if (!gameStarted) return images["stand"];

    const moving = keys.left || keys.right || mobile.left || mobile.right;
    const jumping = player.jumping;
    let action = "idle";
    if (punchAnimating) action = "punch";
    else if (jumping) action = "jump";
    else if (moving) action = "run";

    if (action !== lastAction) { frameIndex = 0; frameTimer = 0; lastAction = action; }

    frameTimer++;
    const limit = (action === "idle") ? 18 : 10;
    if (frameTimer > limit) { frameTimer = 0; frameIndex = (frameIndex + 1) % 2; }

    switch(action){
      case "idle": return images["stand"];
      case "run": return images["player_run_" + (frameIndex+1)];
      case "punch": return images["player_punch_" + (frameIndex+1)];
      case "jump":
        if (player.vy < -2) return images.player_jump_1;
        if (player.vy > 2) return images.player_jump_3;
        return images.player_jump_2;
      default: return images["stand"];
    }
  }

  // --- DRAW ---
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (images.bg) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

    const pf = getPlayerFrame();
    if (pf) ctx.drawImage(pf, player.x, player.y, player.w, player.h);
    if (images.enemy && enemy) ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);

    // --- COUNTDOWN ---
    if (!gameStarted) {
      ctx.fillStyle = "red";
      ctx.font = "72px Arial";
      ctx.textAlign = "center";
      if (countdown > 0) {
        ctx.fillText(countdown, canvas.width/2, canvas.height/2);
        countdownTimer++;
        if (countdownTimer > countdownDelay) { countdown--; countdownTimer = 0; }
      } else {
        ctx.fillText("LOS!", canvas.width/2, canvas.height/2);
        countdownTimer++;
        if (countdownTimer > countdownDelay) gameStarted = true;
      }
    }
  }

  // --- LOOP ---
  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

})();

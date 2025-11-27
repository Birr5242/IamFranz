// static/js/boxfight.js
console.log("Boxfight System aktiv.");

(function(){
  // Canvas & Context (DOM ist vorhanden, da Script am Ende geladen wird)
  const canvas = document.getElementById("game");
  const ctx = canvas ? canvas.getContext("2d") : null;
  if (ctx) ctx.imageSmoothingEnabled = false;

  // Game state
  let images = {};        // enthält Image-Objekte: player_idle_1, player_run_1, bg, enemy, ...
  let assets = {};        // Originale ASSETS (z.B. bg_music path)
  let player = null;
  let enemy = null;
  let running = false;

  // Input
  const keys = { left: false, right: false, jump: false, attack: false };
  const mobile = { left: false, right: false, jump: false, attack: false };

  // Sound (nur background music - dein BeepBox Song)
  let bgMusic = null;

  // Animation / states
  let lastAction = "idle"; // idle, run, jump, punch
  let frameIndex = 0;
  let frameTimer = 0;
  let punchAnimating = false;

  // Countdown (einfacher Start ohne 3-2-1)
  // --- INIT FUNCTION (exportiert) ---
  window.BoxFightInit = function(loadedImages, passedAssets) {
    images = loadedImages || {};
    assets = passedAssets || {};

    // Background music
    if (assets.bg_music) {
      bgMusic = new Audio(assets.bg_music);
      bgMusic.loop = true;
      bgMusic.volume = 0.45;
    }

    console.log("BoxFightInit: Bilder geladen:", Object.keys(images));
    // Set initial HUD bars to full (wenn DOM vorhanden)
    const ph = document.getElementById("player-health");
    const eh = document.getElementById("enemy-health");
    if (ph) ph.style.width = "100%";
    if (eh) eh.style.width = "100%";
  };

  function setupCharacters() {
    player = { x:120, y:280, w:96, h:96, hp:100, vy:0, jumping:false, speed:2.2 };
    enemy  = { x:600, y:280, w:96, h:96, hp:100, vy:0, jumping:false, speed:1.4 };
  }

  // --- START / RESTART exported ---
  window.BoxFightStart = function() {
    if (!images || Object.keys(images).length === 0) console.warn("Start ohne geladene Bilder");
    setupCharacters();
    running = true;

    // Start background music (Autoplay kann blockiert werden — catch)
    if (bgMusic) {
      bgMusic.play().catch(()=>{ console.log("Autoplay der Musik blockiert - Interaktion notwendig"); });
    }

    // focus canvas for keyboard input
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
    requestAnimationFrame(loop);
  };

  window.BoxFightMobileAction = function(action, state) {
    if (mobile.hasOwnProperty(action)) mobile[action] = state;
  };

  // --- INPUT HANDLING ---
  window.addEventListener("keydown", e => {
    // Schutz: falls Spieler noch nicht gesetzt, ignorieren
    if (!player) return;

    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
    if ((e.code === "KeyW" || e.code === "ArrowUp") && !player.jumping) {
      keys.jump = true;
      player.vy = -10;
      player.jumping = true;
    }
    if (e.code === "KeyK") {
      // attack only triggered on keydown; punchAnimating prevents repeat until finished
      if (!punchAnimating) keys.attack = true;
    }
  });

  window.addEventListener("keyup", e => {
    if (!player) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.jump = false;
    if (e.code === "KeyK") keys.attack = false;
  });

  // --- GAME UPDATE ---
  function update() {
    if (!running || !player || !enemy) return;

    const moveLeft  = keys.left  || mobile.left;
    const moveRight = keys.right || mobile.right;
    const jump      = keys.jump  || mobile.jump;
    const punch     = keys.attack || mobile.attack;

    // Movement
    if (moveLeft)  player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    player.x = Math.max(0, Math.min((canvas ? canvas.width : 900) - player.w, player.x));

    // Gravity
    player.y += player.vy;
    player.vy += 0.6;
    if (player.y >= 280) {
      player.y = 280;
      player.jumping = false;
      player.vy = 0;
    }

    // Attack (only trigger once per press)
    if (punch && !punchAnimating) {
      punchAnimating = true;
      // only damage if in range
      if (Math.abs(player.x - enemy.x) < 60) {
        enemy.hp -= 2.5; // stärkerer Treffer
        enemy.hp = Math.max(0, enemy.hp);
      }
      // finish animation after a short delay
      setTimeout(()=> { punchAnimating = false; }, 220);
    }

    // Simple enemy AI: move toward player
    if (enemy.x > player.x) enemy.x -= enemy.speed;
    else enemy.x += enemy.speed;

    // if enemy too close, damage player slowly
    if (Math.abs(player.x - enemy.x) < 55) {
      player.hp -= 0.15;
      player.hp = Math.max(0, player.hp);
    }

    // update HUD
    const ph = document.getElementById("player-health");
    const eh = document.getElementById("enemy-health");
    if (ph) ph.style.width = Math.max(0, Math.min(100, player.hp)) + "%";
    if (eh) eh.style.width = Math.max(0, Math.min(100, enemy.hp)) + "%";

    // win/lose
    if (player.hp <= 0 || enemy.hp <= 0) {
      running = false;
      setTimeout(()=> {
        alert(enemy.hp <= 0 ? "Du gewinnst!" : "Gegner gewinnt!");
      }, 50);
    }
  }

  // --- ANIMATION FRAME SELECTION ---
  function getPlayerFrame() {
    if (!player) return null;
    const moving = keys.left || keys.right || mobile.left || mobile.right;
    const jumping = player.jumping;

    let action = "idle";
    if (punchAnimating) action = "punch";
    else if (jumping) action = "jump";
    else if (moving) action = "run";

    if (action !== lastAction) {
      frameIndex = 0;
      frameTimer = 0;
      lastAction = action;
    }

    frameTimer++;
    // slower frame switch for idle, faster for run/punch
    const limit = (action === "idle") ? 18 : 10;
    if (frameTimer > limit) {
      frameTimer = 0;
      frameIndex = (frameIndex + 1) % 2;
    }

    switch(action) {
      case "idle": return images["player_idle_" + (frameIndex+1)];
      case "run":  return images["player_run_" + (frameIndex+1)];
      case "punch": return images["player_punch_" + (frameIndex+1)];
      case "jump":
        if (player.vy < -2) return images.player_jump_1;
        if (player.vy > 2) return images.player_jump_3;
        return images.player_jump_2;
      default: return images["player_idle_1"];
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
  }

  // --- MAIN LOOP ---
  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }

})(); // IIFE end

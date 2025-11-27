console.log("Boxfight System aktiv.");

(function(){
  let canvas = document.getElementById("game");
  let ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let images = {};
  let player, enemy;
  let running = false;

  const keys = { left: false, right: false, jump: false, attack: false };
  const mobile = { left: false, right: false, jump: false, attack: false };

  // 🔊 Sound
  let bgMusic = null;
  let punchSound = null;

  // Animation
  let lastAction = "idle";
  let frameIndex = 0;
  let frameTimer = 0;
  let punchAnimating = false;

  function BoxFightInit(assets) {
    images = assets;

    // --- Sound laden ---
    punchSound = new Audio(assets.punch_sound);
    bgMusic = new Audio(assets.bg_music);
    bgMusic.loop = true;
  }

  function setupCharacters() {
    player = { x:120, y:280, w:96, h:96, hp:100, vy:0, jumping:false, speed:2 };
    enemy  = { x:600, y:280, w:96, h:96, hp:100, vy:0, jumping:false, speed:1.5 };
  }

  window.BoxFightStart = function() {
    setupCharacters();
    running = true;

    // 🔊 Musik starten
    bgMusic.volume = 0.4;
    bgMusic.play().catch(()=>{ console.log("Autoplay blockiert") });

    loop();
  };

  window.BoxFightRestart = function() {
    setupCharacters();
  };

  window.BoxFightMobileAction = function(action, state) {
    mobile[action] = state;
  };

  window.addEventListener("keydown", e => {
    if (e.code === "KeyA") keys.left = true;
    if (e.code === "KeyD") keys.right = true;
    if (e.code === "KeyW" && !player.jumping) {
      keys.jump = true;
      player.vy = -10;
      player.jumping = true;
    }
    if (e.code === "KeyK") keys.attack = true;
  });

  window.addEventListener("keyup", e => {
    if (e.code === "KeyA") keys.left = false;
    if (e.code === "KeyD") keys.right = false;
    if (e.code === "KeyW") keys.jump = false;
    if (e.code === "KeyK") keys.attack = false;
  });

  function update() {
    if (!running) return;

    const moveLeft  = keys.left  || mobile.left;
    const moveRight = keys.right || mobile.right;
    const jump      = keys.jump  || mobile.jump;
    const punch     = keys.attack || mobile.attack;

    if (moveLeft)  player.x -= player.speed;
    if (moveRight) player.x += player.speed;

    // Grenzen
    player.x = Math.max(0, Math.min(900 - player.w, player.x));

    // Gravitation
    player.y += player.vy;
    player.vy += 0.6;

    if (player.y >= 280) {
      player.y = 280;
      player.jumping = false;
    }

    // Angriff
    if (punch && !punchAnimating) {
      if (Math.abs(player.x - enemy.x) < 60) {
        enemy.hp -= 0.5;
        punchSound.currentTime = 0;
        punchSound.play();
      }
      punchAnimating = true;
      setTimeout(()=> punchAnimating=false, 200);
    }

    // Gegner
    if (enemy.x > player.x) enemy.x -= enemy.speed;
    if (enemy.x < player.x) enemy.x += enemy.speed;

    if (Math.abs(player.x - enemy.x) < 55) {
      player.hp -= 0.2;
    }

    if (enemy.hp <= 0 || player.hp <= 0) {
      running = false;
      alert(enemy.hp <= 0 ? "Du gewinnst!" : "Gegner gewinnt!");
    }
  }

  function getPlayerFrame() {
    const moving = keys.left || keys.right || mobile.left || mobile.right;

    let action = "idle";
    if (punchAnimating) action = "punch";
    else if (player.jumping) action = "jump";
    else if (moving) action = "run";

    if (action !== lastAction) { frameIndex = 0; frameTimer = 0; lastAction = action; }

    frameTimer++;
    if (frameTimer > 10) {
      frameTimer = 0;
      frameIndex = (frameIndex + 1) % 2;
    }

    switch(action) {
      case "idle": return images["player_idle_" + (frameIndex+1)];
      case "run":  return images["player_run_" + (frameIndex+1)];
      case "punch":return images["player_punch_" + (frameIndex+1)];
      case "jump":
        if (player.vy < -3) return images.player_jump_1;
        if (player.vy > 3)  return images.player_jump_3;
        return images.player_jump_2;
    }
  }

  function draw() {
    ctx.clearRect(0,0,900,420);

    ctx.drawImage(images.bg,0,0,900,420);

    ctx.drawImage(getPlayerFrame(), player.x, player.y, player.w, player.h);
    ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);

    // HP-Balken
    document.getElementById("player-health").style.width = player.hp + "%";
    document.getElementById("enemy-health").style.width = enemy.hp + "%";
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }
})();

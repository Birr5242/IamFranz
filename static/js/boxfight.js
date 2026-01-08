(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let images = {};
  let running = false, gameStarted = false;
  let countdown = 3, countdownTimer = 0;
  const countdownDelay = 60;

  const PLATFORM_Y = 570;
  const MIN_X = 27, MAX_X = 1121;
  const GRAVITY = 0.6;

  const keys = { left:false, right:false };

  let player, enemy;

  // ✅ LOOP-FIX
  let animationId = null;

  // ───────── 🎵 BACKGROUND SOUND ─────────
  const bgMusic = new Audio("sounds/BeepBox-Song.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.4;

  window.BoxFightInit = function(imgs){
    images = imgs || {};
  };

  function setupCharacters(){
    const H = 96;

    player = {
      x:120, y:PLATFORM_Y-H, w:96, h:H,
      hp:100, vy:0, jumping:false,
      speed:2.2, facing:"right",
      isPunching:false, punchFrame:0, punchCooldown:false
    };

    enemy = {
      x:600, y:PLATFORM_Y-H, w:96, h:H,
      hp:100, vy:0, jumping:false,
      speed:2.0, facing:"left",
      isPunching:false, punchFrame:0, punchCooldown:false,
      nextPunch:0
    };
  }

  // ───────── START ─────────
  window.BoxFightStart = function(){
    setupCharacters();
    running = true;
    gameStarted = false;
    countdown = 3;
    countdownTimer = 0;

    bgMusic.currentTime = 0;
    bgMusic.play().catch(()=>{});

    // ✅ nur EIN Loop
    if(animationId === null){
      animationId = requestAnimationFrame(loop);
    }
  };

  // ───────── RESTART ─────────
  window.BoxFightRestart = function(){
    bgMusic.pause();
    bgMusic.currentTime = 0;
    BoxFightStart();
  };

  // ───────── INPUT ─────────
  window.addEventListener("keydown", e=>{
    if(!gameStarted) return;

    if(e.code==="KeyA"){ keys.left=true; player.facing="left"; }
    if(e.code==="KeyD"){ keys.right=true; player.facing="right"; }

    if(e.code==="KeyW" && !player.jumping){
      player.vy=-10; player.jumping=true;
    }

    if(e.code==="KeyK"){
      playerPunch();
    }
  });

  window.addEventListener("keyup", e=>{
    if(e.code==="KeyA") keys.left=false;
    if(e.code==="KeyD") keys.right=false;
  });

  // ───────── SPIELER SCHLAG ─────────
  function playerPunch(){
    if(player.isPunching || player.punchCooldown) return;

    player.isPunching = true;
    player.punchCooldown = true;
    player.punchFrame = 1;

    setTimeout(()=>{
      player.punchFrame = 2;
      if(Math.abs(player.x - enemy.x) < 65){
        enemy.hp = Math.max(0, enemy.hp - 8);
      }
    }, 120);

    setTimeout(()=>{
      player.punchFrame = 0;
      player.isPunching = false;
      setTimeout(()=>player.punchCooldown=false, 500);
    }, 240);
  }

  // ───────── KI SCHLAG ─────────
  function enemyPunch(){
    if(enemy.isPunching || enemy.punchCooldown) return;

    enemy.isPunching = true;
    enemy.punchCooldown = true;
    enemy.punchFrame = 1;

    setTimeout(()=>{
      enemy.punchFrame = 2;
      if(Math.abs(enemy.x - player.x) < 65){
        player.hp = Math.max(0, player.hp - 6);
      }
    }, 120);

    setTimeout(()=>{
      enemy.punchFrame = 0;
      enemy.isPunching = false;
      setTimeout(()=>enemy.punchCooldown=false, 800);
    }, 240);
  }

  // ───────── UPDATE ─────────
  function update(){
    if(!running || !gameStarted) return;

    if(!player.isPunching){
      if(keys.left) player.x -= player.speed;
      if(keys.right) player.x += player.speed;
    }
    player.x = Math.max(MIN_X, Math.min(MAX_X-player.w, player.x));

    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y >= PLATFORM_Y-player.h){
      player.y = PLATFORM_Y-player.h;
      player.vy = 0; player.jumping = false;
    }

    const dx = player.x - enemy.x;
    enemy.facing = dx > 0 ? "left" : "right";

    const dist = Math.abs(dx);
    const diff = parseFloat(document.getElementById("difficulty").value || "1");

    const APPROACH_DIST = 50;
    const ATTACK_DIST = 30;

    if(dist > APPROACH_DIST && !enemy.isPunching){
      enemy.x += dx > 0 ? enemy.speed * diff : -enemy.speed * diff;
    } else if(dist <= ATTACK_DIST){
      const now = Date.now();
      if(now > enemy.nextPunch){
        enemyPunch();
        enemy.nextPunch = now + 900;
      }
    }

    enemy.x = Math.max(MIN_X, Math.min(MAX_X-enemy.w, enemy.x));

    enemy.vy += GRAVITY;
    enemy.y += enemy.vy;
    if(enemy.y >= PLATFORM_Y-enemy.h){
      enemy.y = PLATFORM_Y-enemy.h;
      enemy.vy = 0; enemy.jumping = false;
    }

    document.getElementById("player-health").style.width = player.hp+"%";
    document.getElementById("enemy-health").style.width = enemy.hp+"%";

    if(player.hp<=0 || enemy.hp<=0){
      running=false;
      bgMusic.pause();
      setTimeout(()=>alert(player.hp<=0?"Du verlierst!":"Du gewinnst!"),50);
    }
  }

  // ───────── DRAW ─────────
  function getSprite(c){
    const right = c.facing==="right";

    if(c.isPunching){
      if(c === player){
        return right
          ? (c.punchFrame===1?images.player_punch_1:images.player_punch_2)
          : (c.punchFrame===1?images.player_punch_1_back:images.player_punch_2_back);
      } else {
        return right
          ? (c.punchFrame===1?images.enemy_punch_1:images.enemy_punch_2)
          : (c.punchFrame===1?images.enemy_punch_1_back:images.enemy_punch_2_back);
      }
    }

    if(c.jumping){
      return right
        ? (c===player?images.player_jump_2:images.enemy_jump_2)
        : (c===player?images.player_jump_2_back:images.enemy_jump_2_back);
    }

    return right
      ? (c===player?images.stand:images.enemy_stand)
      : (c===player?images.stand_back:images.enemy_stand_back);
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(images.bg_fertig) ctx.drawImage(images.bg_fertig,0,0,canvas.width,canvas.height);

    ctx.drawImage(getSprite(player), player.x, player.y, player.w, player.h);
    ctx.drawImage(getSprite(enemy), enemy.x, enemy.y, enemy.w, enemy.h);

    if(!gameStarted){
      ctx.fillStyle="red";
      ctx.font="50px Arial";
      ctx.textAlign="center";
      ctx.fillText(countdown>0?countdown:"LOS!", canvas.width/2, canvas.height/2);
      countdownTimer++;
      if(countdownTimer>countdownDelay){
        countdown--; countdownTimer=0;
        if(countdown<0) gameStarted=true;
      }
    }
  }

  // ───────── LOOP ─────────
  function loop(){
    update();
    draw();

    if(running){
      animationId = requestAnimationFrame(loop);
    } else {
      animationId = null;
    }
  }
})();

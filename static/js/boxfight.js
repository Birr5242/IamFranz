(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let images = {}, assets = {};
  let player = null, enemy = null;
  let running = false, gameStarted = false;
  let countdown = 3, countdownTimer = 0;
  const countdownDelay = 60;

  const PLATFORM_Y = 570;
  const MIN_X = 27, MAX_X = 1121;
  const GRAVITY = 0.6;

  const keys = { left:false, right:false };

  window.BoxFightInit = function(loadedImages, passedAssets){
    images = loadedImages || {};
    assets = passedAssets || {};
    if(images.bg_fertig) images.bg = images.bg_fertig;
  };

  function setupCharacters(){
    const H = 96;
    player = {
      x:120, y:PLATFORM_Y-H, w:96, h:H,
      hp:100, vy:0, jumping:false,
      speed:2.2, facing:"right",
      isPunching:false, punchCooldown:false,
      sprite:images.stand
    };

    enemy = {
      x:600, y:PLATFORM_Y-H, w:96, h:H,
      hp:100, vy:0, jumping:false,
      speed:2.1, facing:"left",
      isPunching:false, punchCooldown:false,
      sprite:images.enemy_stand,
      nextPunchTime:0
    };
  }

  window.BoxFightStart = function(){
    setupCharacters();
    running=true; gameStarted=false;
    countdown=3; countdownTimer=0;
    requestAnimationFrame(loop);
  };

  window.BoxFightRestart = BoxFightStart;

  // ───────── INPUT ─────────
  window.addEventListener("keydown", e=>{
    if(!player||!gameStarted) return;

    if(e.code==="KeyA"){ keys.left=true; player.facing="left"; }
    if(e.code==="KeyD"){ keys.right=true; player.facing="right"; }

    if(e.code==="KeyW" && !player.jumping){
      player.vy=-10; player.jumping=true;
    }

    if(e.code==="KeyK"){
      if(!player.isPunching && !player.punchCooldown){
        startPunch(player, enemy);
      }
    }
  });

  window.addEventListener("keyup", e=>{
    if(e.code==="KeyA") keys.left=false;
    if(e.code==="KeyD") keys.right=false;
  });

  // ───────── PUNCH SYSTEM ─────────
  function startPunch(attacker, target){
    attacker.isPunching = true;
    attacker.punchCooldown = true;

    const right = attacker.facing === "right";

    attacker.sprite = right
      ? images.stand
      : images.stand_back;

    setTimeout(()=>{
      attacker.sprite = right
        ? images.player_punch_1 || images.enemy_punch_1
        : images.player_punch_1_back || images.enemy_punch_1_back;
    }, 80);

    setTimeout(()=>{
      attacker.sprite = right
        ? images.player_punch_2 || images.enemy_punch_2
        : images.player_punch_2_back || images.enemy_punch_2_back;

      if(Math.abs(attacker.x - target.x) < 65){
        target.hp = Math.max(0, target.hp - 8);
      }
    }, 160);

    setTimeout(()=>{
      attacker.sprite = right
        ? (attacker===player?images.stand:images.enemy_stand)
        : (attacker===player?images.stand_back:images.enemy_stand_back);

      attacker.isPunching = false;
      setTimeout(()=>attacker.punchCooldown=false, 600);
    }, 260);
  }

  // ───────── UPDATE ─────────
  function update(){
    if(!running || !gameStarted) return;

    // Spieler Bewegung
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

    // ───────── KI LOGIK ─────────
    const dx = player.x - enemy.x;
    enemy.facing = dx > 0 ? "right" : "left";

    const dist = Math.abs(dx);
    const diff = parseFloat(document.getElementById("difficulty").value);

    if(dist > 70 && !enemy.isPunching){
      enemy.x += dx > 0 ? enemy.speed*diff : -enemy.speed*diff;
      enemy.sprite = enemy.facing==="right"
        ? images.enemy_run_1
        : images.enemy_run_1_back;
    }
    else{
      const now = Date.now();
      if(!enemy.isPunching && !enemy.punchCooldown && now > enemy.nextPunchTime){
        startPunch(enemy, player);
        enemy.nextPunchTime = now + 1000;
      }
    }

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
      setTimeout(()=>alert(player.hp<=0?"Du verlierst!":"Du gewinnst!"),50);
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(images.bg) ctx.drawImage(images.bg,0,0,canvas.width,canvas.height);

    ctx.drawImage(player.sprite, player.x, player.y, player.w, player.h);
    ctx.drawImage(enemy.sprite, enemy.x, enemy.y, enemy.w, enemy.h);

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

  function loop(){ update(); draw(); if(running) requestAnimationFrame(loop); }
})();

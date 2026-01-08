(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let images = {};
  let running = false;
  let gameStarted = false;
  let animationId = null;

  let countdown = 3, countdownTimer = 0;
  const countdownDelay = 60;

  const PLATFORM_Y = 570;
  const MIN_X = 27, MAX_X = 1121;
  const GRAVITY = 0.6;

  const keys = { left:false, right:false };
  let player, enemy;

  let hitStopFrames = 0;
  let screenShake = 0;

  const bgMusic = new Audio("sounds/BeepBox-Song.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.4;

  window.BoxFightInit = imgs => images = imgs || {};

  function setupCharacters(){
    const H = 96;
    player = {
      x:120, y:PLATFORM_Y-H, w:96, h:H,
      hp:100, vy:0, jumping:false,
      speed:2.2, facing:"right",
      isPunching:false, punchFrame:0, punchCooldown:false,
      hitFlash:0
    };

    enemy = {
      x:MAX_X-120, y:PLATFORM_Y-H, w:96, h:H,
      hp:100, vy:0, jumping:false,
      speed:2.0, facing:"left",
      isPunching:false, punchFrame:0, punchCooldown:false,
      nextPunch:0,
      hitFlash:0
    };
  }

  function stopLoop(){
    if(animationId){
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  window.BoxFightStart = function(){
    stopLoop();
    setupCharacters();
    running = true;
    gameStarted = false;
    countdown = 3;
    countdownTimer = 0;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(()=>{});
    loop();
  };

  window.BoxFightRestart = function(){
    bgMusic.pause();
    bgMusic.currentTime = 0;
    BoxFightStart();
  };

  // INPUT
  window.addEventListener("keydown", e=>{
    if(!gameStarted) return;
    if(e.code==="KeyA"){ keys.left=true; player.facing="left"; }
    if(e.code==="KeyD"){ keys.right=true; player.facing="right"; }
    if(e.code==="KeyW" && !player.jumping){
      player.vy=-10; player.jumping=true;
    }
    if(e.code==="KeyK") playerPunch();
  });

  window.addEventListener("keyup", e=>{
    if(e.code==="KeyA") keys.left=false;
    if(e.code==="KeyD") keys.right=false;
  });

  function hitEffect(target, push){
    target.hitFlash = 6;
    hitStopFrames = 6;
    screenShake = 6;
    target.x += push;
  }

  function playerPunch(){
    if(player.isPunching || player.punchCooldown) return;
    player.isPunching = true;
    player.punchCooldown = true;
    player.punchFrame = 1;

    setTimeout(()=>{
      player.punchFrame = 2;
      const dist = Math.abs((player.x+player.w/2)-(enemy.x+enemy.w/2));
      if(dist < 60){
        enemy.hp = Math.max(0, enemy.hp - 8);
        hitEffect(enemy, player.facing==="right"?10:-10);
      }
    },120);

    setTimeout(()=>{
      player.isPunching=false;
      player.punchFrame=0;
      setTimeout(()=>player.punchCooldown=false,500);
    },240);
  }

  function enemyPunch(){
    if(enemy.isPunching || enemy.punchCooldown) return;
    enemy.isPunching=true;
    enemy.punchCooldown=true;
    enemy.punchFrame=1;

    setTimeout(()=>{
      enemy.punchFrame=2;
      const dist = Math.abs((enemy.x+enemy.w/2)-(player.x+player.w/2));
      if(dist < 60){
        player.hp = Math.max(0, player.hp - 6);
        hitEffect(player, enemy.facing==="right"?10:-10);
      }
    },120);

    setTimeout(()=>{
      enemy.isPunching=false;
      enemy.punchFrame=0;
      setTimeout(()=>enemy.punchCooldown=false,800);
    },240);
  }

  function resolveCollision(){
    const pR = player.x + player.w;
    const eR = enemy.x + enemy.w;
    if(pR > enemy.x && player.x < enemy.x){
      player.x -= pR - enemy.x;
    }
    if(eR > player.x && enemy.x < player.x){
      enemy.x -= eR - player.x;
    }
  }

  function update(){
    if(!running || !gameStarted) return;
    if(hitStopFrames > 0){
      hitStopFrames--;
      return;
    }

    if(!player.isPunching){
      if(keys.left) player.x -= player.speed;
      if(keys.right) player.x += player.speed;
    }

    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y >= PLATFORM_Y-player.h){
      player.y = PLATFORM_Y-player.h;
      player.vy = 0;
      player.jumping = false;
    }

    const dx = (player.x+player.w/2)-(enemy.x+enemy.w/2);
    enemy.facing = dx > 0 ? "right" : "left";

    const dist = Math.abs(dx);
    const diff = parseFloat(document.getElementById("difficulty").value || "1");

    if(dist > 45 && !enemy.isPunching){
      enemy.x += dx > 0 ? enemy.speed*diff : -enemy.speed*diff;
    } else if(dist < 35 && Date.now()>enemy.nextPunch){
      enemyPunch();
      enemy.nextPunch = Date.now()+900;
    }

    enemy.vy += GRAVITY;
    enemy.y += enemy.vy;
    if(enemy.y >= PLATFORM_Y-enemy.h){
      enemy.y = PLATFORM_Y-enemy.h;
      enemy.vy = 0;
    }

    resolveCollision();

    player.hitFlash && player.hitFlash--;
    enemy.hitFlash && enemy.hitFlash--;

    document.getElementById("player-health").style.width = player.hp+"%";
    document.getElementById("enemy-health").style.width = enemy.hp+"%";

    if(player.hp<=0 || enemy.hp<=0){
      running=false;
      bgMusic.pause();
      stopLoop();
      setTimeout(()=>alert(player.hp<=0?"Du verlierst!":"Du gewinnst!"),50);
    }
  }

  function draw(){
    let shakeX = screenShake ? (Math.random()*6-3) : 0;
    let shakeY = screenShake ? (Math.random()*6-3) : 0;
    screenShake && screenShake--;

    ctx.setTransform(1,0,0,1,shakeX,shakeY);
    ctx.clearRect(-10,-10,canvas.width+20,canvas.height+20);

    if(images.bg_fertig)
      ctx.drawImage(images.bg_fertig,0,0,canvas.width,canvas.height);

    drawChar(player);
    drawChar(enemy);

    ctx.setTransform(1,0,0,1,0,0);

    if(!gameStarted){
      ctx.fillStyle="red";
      ctx.font="50px Arial";
      ctx.textAlign="center";
      ctx.fillText(countdown>0?countdown:"LOS!",canvas.width/2,canvas.height/2);
      countdownTimer++;
      if(countdownTimer>countdownDelay){
        countdown--; countdownTimer=0;
        if(countdown<0) gameStarted=true;
      }
    }
  }

  function drawChar(c){
    ctx.drawImage(getSprite(c),c.x,c.y,c.w,c.h);
    if(c.hitFlash){
      ctx.fillStyle="rgba(255,255,255,0.4)";
      ctx.fillRect(c.x,c.y,c.w,c.h);
    }
  }

  function loop(){
    update();
    draw();
    if(running) animationId = requestAnimationFrame(loop);
  }

  function getSprite(c){
    const r = c.facing==="right";
    if(c.isPunching){
      return r
        ? (c===player?(c.punchFrame===1?images.player_punch_1:images.player_punch_2):(c.punchFrame===1?images.enemy_punch_1:images.enemy_punch_2))
        : (c===player?(c.punchFrame===1?images.player_punch_1_back:images.player_punch_2_back):(c.punchFrame===1?images.enemy_punch_1_back:images.enemy_punch_2_back));
    }
    return r ? (c===player?images.stand:images.enemy_stand)
             : (c===player?images.stand_back:images.enemy_stand_back);
  }
})();

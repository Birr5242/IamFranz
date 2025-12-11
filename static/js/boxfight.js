(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  let images = {}, assets = {};
  let player = null, enemy = null;
  let running = false, gameStarted = false, countdown = 3, countdownTimer = 0;
  const countdownDelay = 60;
  const PLATFORM_Y = 570;
  const MIN_X = 27, MAX_X = 1121;
  const GRAVITY = 0.6;

  const keys = { left:false, right:false, punch:false };
  let frameIndex = 0, frameTimer = 0;
  const runFrameDelay = 15;  // langsamer Lauf
  const punchFrameDelay = 10;
  const PUNCH_DURATION = 30; // ca 0.5 Sekunden
  const PUNCH_COOLDOWN = 1000; // 1 Sekunden

  window.BoxFightInit = function(loadedImages, passedAssets){
    images = loadedImages || {};
    assets = passedAssets || {};
    if(images.bg_fertig) images.bg = images.bg_fertig;
  };

  function setupCharacters(){
    const SPR_H = 96;
    player = { x:120, y:PLATFORM_Y-SPR_H, w:96, h:SPR_H, hp:100, vy:0, jumping:false, speed:2.2, facing:"right", isPunching:false, punchCooldown:false };
    enemy  = { x:600, y:PLATFORM_Y-SPR_H, w:96, h:SPR_H, hp:100, vy:0, jumping:false, speed:2.2, facing:"left", isPunching:false, punchCooldown:false, nextPunchTime:0 };
  }

  window.BoxFightStart = function(){ setupCharacters(); running=true; gameStarted=false; countdown=3; countdownTimer=0; requestAnimationFrame(loop); };
  window.BoxFightRestart = function(){ setupCharacters(); player.hp=100; enemy.hp=100; document.getElementById("player-health").style.width="100%"; document.getElementById("enemy-health").style.width="100%"; running=true; gameStarted=false; countdown=3; countdownTimer=0; requestAnimationFrame(loop); };

  window.addEventListener("keydown", e=>{
    if(!player||!gameStarted) return;
    if(e.code==="KeyA"||e.code==="ArrowLeft") keys.left=true;
    if(e.code==="KeyD"||e.code==="ArrowRight") keys.right=true;
    if(e.code==="KeyW"||e.code==="ArrowUp"){ if(!player.jumping){ player.vy=-10; player.jumping=true; } }
    if(e.code==="KeyK"){ if(!player.isPunching && !player.punchCooldown) doPunch(player, enemy); }
  });
  window.addEventListener("keyup", e=>{
    if(e.code==="KeyA"||e.code==="ArrowLeft") keys.left=false;
    if(e.code==="KeyD"||e.code==="ArrowRight") keys.right=false;
  });

  function doPunch(attacker, target){
    if(attacker.isPunching || attacker.punchCooldown) return;
    attacker.isPunching = true;
    attacker.punchFrame = 0;

    const punchAnim = setInterval(()=>{
      attacker.punchFrame++;
      if(attacker.punchFrame === Math.floor(PUNCH_DURATION/2)){
        const reach = 60;
        if(Math.abs(attacker.x - target.x) < reach){
          target.hp = Math.max(0, target.hp - 2.5);
        }
      }
      if(attacker.punchFrame >= PUNCH_DURATION){
        clearInterval(punchAnim);
        attacker.isPunching = false;
        attacker.punchCooldown = true;
        setTimeout(()=>{ attacker.punchCooldown=false; }, PUNCH_COOLDOWN);
      }
    }, 1000/60);
  }

  function update(){
    if(!running||!player||!enemy) return;
    if(!gameStarted) return;

    // Spieler Bewegung
    if(keys.left){ player.x-=player.speed; player.facing="left"; }
    else if(keys.right){ player.x+=player.speed; player.facing="right"; }
    player.x=Math.max(MIN_X, Math.min(MAX_X-player.w, player.x));

    player.vy+=GRAVITY; player.y+=player.vy;
    if(player.y>=PLATFORM_Y-player.h){ player.y=PLATFORM_Y-player.h; player.jumping=false; player.vy=0; }

    // KI Intelligenz
    const dx = player.x - enemy.x;
    const dist = Math.abs(dx);
    const difficulty=parseFloat(document.getElementById('difficulty')?.value||"1");
    const punchRange=60;
    const jumpChance = 0.01*difficulty;

    // KI bewegt sich in Richtung Spieler
    if(dist>punchRange){
      enemy.x += dx>0 ? enemy.speed*difficulty : -enemy.speed*difficulty;
      enemy.facing = dx>0?"right":"left";
    } else {
      // KI schlägt nur in Reichweite und nicht zu schnell
      const now = Date.now();
      if(!enemy.isPunching && !enemy.punchCooldown && now > enemy.nextPunchTime){
        doPunch(enemy, player);
        enemy.nextPunchTime = now + PUNCH_COOLDOWN;
      }
    }

    // KI springt gelegentlich
    if(!enemy.jumping && Math.random()<jumpChance) { enemy.vy=-10; enemy.jumping=true; }

    enemy.x=Math.max(MIN_X, Math.min(MAX_X-enemy.w, enemy.x));
    enemy.vy+=GRAVITY; enemy.y+=enemy.vy; if(enemy.y>=PLATFORM_Y-enemy.h){ enemy.y=PLATFORM_Y-enemy.h; enemy.jumping=false; enemy.vy=0; }

    document.getElementById("player-health").style.width=Math.max(0,Math.min(100,player.hp))+"%";
    document.getElementById("enemy-health").style.width=Math.max(0,Math.min(100,enemy.hp))+"%";

    if(player.hp<=0||enemy.hp<=0){ running=false; setTimeout(()=>alert(enemy.hp<=0?"Du gewinnst!":"Gegner gewinnt!"),50); }
  }

  function getFrame(c){
    if(!c) return null;
    const moving=(c===player)?(keys.left||keys.right):Math.abs((c.prevX||c.x)-c.x)>0.5;
    const jumping=c.jumping;
    const punching=c.isPunching;
    let action="idle";
    if(punching) action="punch";
    else if(jumping) action="jump";
    else if(moving) action="run";

    frameTimer++;
    let frameDelay = (action==="run")?runFrameDelay:((action==="punch")?punchFrameDelay:18);
    if(frameTimer>frameDelay){ frameTimer=0; frameIndex=(frameIndex+1)%2; }

    const faceRight=c.facing==="right";

    if(c===player){
      switch(action){
        case "idle": return faceRight?images.stand:images.stand_back;
        case "run": return faceRight?(frameIndex===0?images.player_run_1:images.player_run_2):(frameIndex===0?images.player_run_1_back:images.player_run_2_back);
        case "punch": return faceRight?(frameIndex===0?images.player_punch_1:images.player_punch_2):(frameIndex===0?images.player_punch_1_back:images.player_punch_2_back);
        case "jump": if(c.vy<-2) return faceRight?images.player_jump_1:images.player_jump_1_back; if(c.vy>2) return faceRight?images.player_jump_3:images.player_jump_3_back; return faceRight?images.player_jump_2:images.player_jump_2_back;
      }
    }

    switch(action){
      case "idle": return faceRight?images.enemy_stand:images.enemy_stand_back;
      case "run": return faceRight?(frameIndex===0?images.enemy_run_1:images.enemy_run_2):(frameIndex===0?images.enemy_run_1_back:images.enemy_run_2_back);
      case "punch": return faceRight?(frameIndex===0?images.enemy_punch_1:images.enemy_punch_2):(frameIndex===0?images.enemy_punch_1_back:images.enemy_punch_2_back);
      case "jump": if(c.vy<-2) return faceRight?images.enemy_jump_1:images.enemy_jump_1_back; if(c.vy>2) return faceRight?images.enemy_jump_3:images.enemy_jump_3_back; return faceRight?images.enemy_jump_2:images.enemy_jump_2_back;
    }
    return null;
  }

  function draw(){
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    if(images.bg) ctx.drawImage(images.bg,0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(80,40,140,0.25)"; ctx.fillRect(MIN_X,PLATFORM_Y,MAX_X-MIN_X,6);

    const pf=getFrame(player); if(pf) ctx.drawImage(pf,player.x,player.y,player.w,player.h); else ctx.fillRect(player.x,player.y,player.w,player.h);
    const ef=getFrame(enemy); if(ef) ctx.drawImage(ef,enemy.x,enemy.y,enemy.w,enemy.h); else ctx.fillRect(enemy.x,enemy.y,enemy.w,enemy.h);

    if(!gameStarted){ ctx.fillStyle="red"; ctx.font="50px Arial"; ctx.textAlign="center"; ctx.fillText(countdown>0?countdown:"LOS!",canvas.width/2,canvas.height/2); countdownTimer++; if(countdownTimer>countdownDelay){ countdown--; countdownTimer=0; if(countdown<0) gameStarted=true; } }
  }

  function loop(){ update(); draw(); if(running) requestAnimationFrame(loop); }
})();

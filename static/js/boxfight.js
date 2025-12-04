// static/js/boxfight.js
console.log("Boxfight System aktiv.");

(function(){
  const canvas=document.getElementById("game");
  const ctx=canvas.getContext("2d");
  ctx.imageSmoothingEnabled=false;

  let images={}, assets={};
  let player=null, enemy=null;
  let running=false, gameStarted=false, countdown=3, countdownTimer=0;

  const keys={left:false,right:false};
  const inputLock={jump:false,attack:false};
  const mobileLock={jump:false,attack:false};
  let frameIndex=0, frameTimer=0, punchAnimating=false;
  let bgMusic=null;

  const PLATFORM_Y=180, GRAVITY=0.6, SPRITE_H=96, PUNCH_COOLDOWN=500;

  window.BoxFightInit=function(loadedImages,passedAssets){
    images=loadedImages||{};
    assets=passedAssets||{};
    if(images.bg_fertig) images.bg = images.bg_fertig;

    if(assets.bg_music){
      bgMusic=new Audio(assets.bg_music);
      bgMusic.loop=true;
      bgMusic.volume=0.45;
    }

    document.getElementById("player-health").style.width="100%";
    document.getElementById("enemy-health").style.width="100%";
  };

  function setupCharacters(){
    player={x:120,y:PLATFORM_Y-SPRITE_H,w:96,h:SPRITE_H,hp:100,vy:0,jumping:false,speed:2.2,facing:"right",attackCooldown:false};
    enemy={x:600,y:PLATFORM_Y-SPRITE_H,w:96,h:SPRITE_H,hp:100,vy:0,jumping:false,speed:2.2,facing:"left",attackCooldown:false};
  }

  window.BoxFightStart=function(){
    setupCharacters();
    running=true;
    gameStarted=false;
    countdown=3;
    countdownTimer=0;
    if(bgMusic) bgMusic.play().catch(()=>console.log("Autoplay blockiert"));
    requestAnimationFrame(loop);
  };

  window.BoxFightRestart=function(){
    setupCharacters();
    player.hp=100; enemy.hp=100;
    document.getElementById("player-health").style.width="100%";
    document.getElementById("enemy-health").style.width="100%";
    running=true;
    gameStarted=false;
    countdown=3; countdownTimer=0;
    requestAnimationFrame(loop);
  };

  window.BoxFightMobileAction=function(action,state){
    if(action==="left"||action==="right"){ keys[action==="left"?"left":"right"]=state; }
    else if(action==="jump"){
      if(state && !mobileLock.jump && !player.jumping){ mobileLock.jump=true; player.vy=-10; player.jumping=true; }
      else if(!state) mobileLock.jump=false;
    }
    else if(action==="punch"){
      if(state && !mobileLock.attack && !punchAnimating){ mobileLock.attack=true; doPlayerPunch(); }
      else if(!state) mobileLock.attack=false;
    }
  };

  window.addEventListener("keydown", e=>{
    if(!player||!gameStarted) return;
    if(e.code==="KeyA"||e.code==="ArrowLeft") keys.left=true;
    if(e.code==="KeyD"||e.code==="ArrowRight") keys.right=true;
    if((e.code==="KeyW"||e.code==="ArrowUp") && !inputLock.jump && !player.jumping){ inputLock.jump=true; player.vy=-10; player.jumping=true; }
    if(e.code==="KeyK" && !inputLock.attack && !punchAnimating) { inputLock.attack=true; doPlayerPunch(); }
  });

  window.addEventListener("keyup", e=>{
    if(!player) return;
    if(e.code==="KeyA"||e.code==="ArrowLeft") keys.left=false;
    if(e.code==="KeyD"||e.code==="ArrowRight") keys.right=false;
    if(e.code==="KeyW"||e.code==="ArrowUp") inputLock.jump=false;
    if(e.code==="KeyK") inputLock.attack=false;
  });

  function doPlayerPunch(){
    if(punchAnimating) return;
    punchAnimating=true;
    const reach=60;
    if(Math.abs(player.x-enemy.x)<reach) enemy.hp=Math.max(0,enemy.hp-2.5);
    setTimeout(()=>{ punchAnimating=false; }, PUNCH_COOLDOWN);
  }

  function update(){
    if(!running||!player||!enemy) return;
    if(!gameStarted) return;

    // Player Movement
    if(keys.left&&!keys.right){ player.x-=player.speed; player.facing="left"; }
    else if(keys.right&&!keys.left){ player.x+=player.speed; player.facing="right"; }
    player.x=Math.max(0,Math.min(canvas.width-player.w,player.x));

    player.vy+=GRAVITY; player.y+=player.vy;
    if(player.y>=PLATFORM_Y-player.h){ player.y=PLATFORM_Y-player.h; player.jumping=false; player.vy=0; }

    // Enemy AI
    const distance=enemy.x-player.x, absDist=Math.abs(distance);
    const difficulty=parseFloat(document.getElementById('difficulty')?.value||"0.8");
    if(absDist>55){ distance>0 ? (enemy.x-=enemy.speed*difficulty, enemy.facing="left") : (enemy.x+=enemy.speed*difficulty, enemy.facing="right"); }
    else if(Math.random()<0.01) enemy.x+=(Math.random()-0.5)*4;

    if(!enemy.jumping && absDist<120 && Math.random()<0.008*difficulty){ enemy.vy=-10; enemy.jumping=true; }
    if(!enemy.attackCooldown && absDist<60 && Math.random()<0.02*difficulty){
      enemy.attackCooldown=true;
      setTimeout(()=>{ if(Math.abs(enemy.x-player.x)<70) player.hp=Math.max(0,player.hp-2.5); enemy.attackCooldown=false; }, PUNCH_COOLDOWN);
    }

    enemy.vy+=GRAVITY; enemy.y+=enemy.vy;
    if(enemy.y>=PLATFORM_Y-enemy.h){ enemy.y=PLATFORM_Y-enemy.h; enemy.jumping=false; enemy.vy=0; }

    // HP Bars
    document.getElementById("player-health").style.width=Math.max(0,Math.min(100,player.hp))+"%";
    document.getElementById("enemy-health").style.width=Math.max(0,Math.min(100,enemy.hp))+"%";

    if(player.hp<=0||enemy.hp<=0){ running=false; setTimeout(()=>{ alert(enemy.hp<=0?"Du gewinnst!":"Gegner gewinnt!"); },50); }
  }

  function getFrame(character){
    if(!character) return null;
    let moving = character===player?(keys.left||keys.right):Math.abs(character.x-(character.prevX||character.x))>0.5;
    const jumping=character.jumping;
    const punch=(character===player)?punchAnimating:(character.attackCooldown||false);
    let action="idle";
    if(punch) action="punch"; else if(jumping) action="jump"; else if(moving) action="run";

    frameTimer++; if(frameTimer>(action==="idle"?18:10)){ frameTimer=0; frameIndex=(frameIndex+1)%2; }
    const facingRight=character.facing==="right";

    if(character===player){
      switch(action){
        case "idle": return facingRight?images.stand:images.stand_back;
        case "run": return facingRight?images["player_run_"+(frameIndex+1)]:images["player_run_"+(frameIndex+1)+"_back"];
        case "punch": return facingRight?images["player_punch_"+((frameIndex%2)+1)]:images["player_punch_"+((frameIndex%2)+1)+"_back"];
        case "jump":
          if(character.vy<-2) return facingRight?images.player_jump_1:images.player_jump_1_back;
          if(character.vy>2) return facingRight?images.player_jump_3:images.player_jump_3_back;
          return facingRight?images.player_jump_2:images.player_jump_2_back;
        default: return facingRight?images.stand:images.stand_back;
      }
    } else {
      switch(action){
        case "idle": return facingRight?images.enemy_stand_back:images.enemy_stand;
        case "run": return facingRight?images["enemy_run_"+(frameIndex+1)+"_back"]:images["enemy_run_"+(frameIndex+1)];
        case "punch": return facingRight?images["enemy_punch_"+((frameIndex%2)+1)+"_back"]:images["enemy_punch_"+((frameIndex%2)+1)];
        case "jump":
          if(character.vy<-2) return facingRight?images.enemy_jump_1_back:images.enemy_jump_1;
          if(character.vy>2) return facingRight?images.enemy_jump_3_back:images.enemy_jump_3;
          return facingRight?images.enemy_jump_2_back:images.enemy_jump_2;
        default: return facingRight?images.enemy_stand_back:images.enemy_stand;
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(images.bg) ctx.drawImage(images.bg,0,0,canvas.width,canvas.height);
    const pf=getFrame(player), ef=getFrame(enemy);
    if(pf) ctx.drawImage(pf,player.x,player.y,player.w,player.h);
    if(ef) ctx.drawImage(ef,enemy.x,enemy.y,enemy.w,enemy.h);

    // Countdown
    if(!gameStarted){
      ctx.fillStyle="red";
      ctx.font="72px Arial";
      ctx.textAlign="center";
      if(countdown>0){ ctx.fillText(countdown,canvas.width/2,canvas.height/2); countdownTimer++; if(countdownTimer>60){ countdown--; countdownTimer=0; } }
      else { ctx.fillText("LOS!",canvas.width/2,canvas.height/

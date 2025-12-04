// static/js/boxfight.js
console.log("Boxfight System aktiv.");

(function(){
  const canvas=document.getElementById("game");
  const ctx=canvas?canvas.getContext("2d"):null;
  if(ctx) ctx.imageSmoothingEnabled=false;

  let images={};
  let assets={};
  let player=null;
  let enemy=null;
  let running=false;

  // Input state
  const keys={left:false,right:false};
  const inputLock={jump:false,attack:false};
  const mobileLock={jump:false,attack:false};

  // Timing + frame
  let frameIndex=0;
  let frameTimer=0;

  // Game state
  let bgMusic=null;
  let punchAnimating=false;

  let gameStarted=false;
  let countdown=3;
  let countdownTimer=0;
  const countdownDelay=60;

  // Plattform Hitbox
  const PLATFORM_Y = 180; // Spieler stehen auf Y=180
  const GRAVITY = 0.6;

  // Schlag Delay
  const PUNCH_COOLDOWN = 500; // Millisekunden zwischen Schlägen

  window.BoxFightInit=function(loadedImages,passedAssets){
    images=loadedImages||{};
    assets=passedAssets||{};

    // Setze Hintergrund
    if(images.bg_fertig) images.bg = images.bg_fertig;

    if(assets.bg_music){
      bgMusic=new Audio(assets.bg_music);
      bgMusic.loop=true;
      bgMusic.volume=0.45;
    }

    const ph=document.getElementById("player-health");
    const eh=document.getElementById("enemy-health");
    if(ph) ph.style.width="100%";
    if(eh) eh.style.width="100%";
  };

  function setupCharacters(){
    player={x:120,y:PLATFORM_Y-96,w:96,h:96,hp:100,vy:0,jumping:false,speed:2.2, facing:"right", attackCooldown:false};
    enemy={x:600,y:PLATFORM_Y-96,w:96,h:96,hp:100,vy:0,jumping:false,speed:2.2,facing:"left", attackCooldown:false};
  }

  window.BoxFightStart=function(){
    setupCharacters();
    running=true;
    gameStarted=false;
    countdown=3;
    countdownTimer=0;

    if(bgMusic) bgMusic.play().catch(()=>{console.log("Autoplay blockiert");});
    if(canvas&&canvas.focus) canvas.focus();
    requestAnimationFrame(loop);
  };

  window.BoxFightRestart=function(){
    setupCharacters();
    if(player) player.hp=100;
    if(enemy) enemy.hp=100;
    const ph=document.getElementById("player-health");
    const eh=document.getElementById("enemy-health");
    if(ph) ph.style.width="100%";
    if(eh) eh.style.width="100%";
    running=true;
    gameStarted=false;
    countdown=3;
    countdownTimer=0;
    requestAnimationFrame(loop);
  };

  // Mobile actions
  window.BoxFightMobileAction=function(action,state){
    if(action==="left"||action==="right"){
      keys[action==="left"?"left":"right"]=state;
    } else if(action==="jump"){
      if(state){
        if(!mobileLock.jump && !player.jumping){
          mobileLock.jump=true;
          player.vy=-10;
          player.jumping=true;
        }
      } else mobileLock.jump=false;
    } else if(action==="punch"){
      if(state){
        if(!mobileLock.attack && !punchAnimating){
          mobileLock.attack=true;
          doPlayerPunch();
        }
      } else mobileLock.attack=false;
    }
  };

  // Keyboard
  window.addEventListener("keydown", e=>{
    if(!player||!gameStarted) return;
    if(e.code==="KeyA"||e.code==="ArrowLeft") keys.left=true;
    if(e.code==="KeyD"||e.code==="ArrowRight") keys.right=true;

    if((e.code==="KeyW"||e.code==="ArrowUp")){
      if(!inputLock.jump && !player.jumping){
        inputLock.jump=true;
        player.vy=-10;
        player.jumping=true;
      }
    }

    if(e.code==="KeyK"){
      if(!inputLock.attack && !punchAnimating){
        inputLock.attack=true;
        doPlayerPunch();
      }
    }
  });

  window.addEventListener("keyup", e=>{
    if(!player) return;
    if(e.code==="KeyA"||e.code==="ArrowLeft") keys.left=false;
    if(e.code==="KeyD"||e.code==="ArrowRight") keys.right=false;
    if(e.code==="KeyW"||e.code==="ArrowUp") inputLock.jump=false;
    if(e.code==="KeyK") inputLock.attack=false;
  });

  // Spieler Schlag
  function doPlayerPunch(){
    if(punchAnimating) return;
    punchAnimating=true;

    const reach = 60;
    if(Math.abs(player.x - enemy.x) < reach){
      enemy.hp = Math.max(0, enemy.hp - 2.5);
    }

    setTimeout(()=>{ punchAnimating=false; }, PUNCH_COOLDOWN);
  }

  function update(){
    if(!running||!player||!enemy) return;
    if(!gameStarted) return;

    // Input
    const moveLeft = keys.left;
    const moveRight = keys.right;

    if(moveLeft && !moveRight){ player.x -= player.speed; player.facing="left"; }
    else if(moveRight && !moveLeft){ player.x += player.speed; player.facing="right"; }
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    // Gravity player
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y >= PLATFORM_Y - player.h){ player.y = PLATFORM_Y - player.h; player.jumping=false; player.vy=0; }

    // Enemy AI
    const distance = enemy.x - player.x;
    const absDist = Math.abs(distance);
    const difficulty = parseFloat(document.getElementById('difficulty')?.value || "0.8");

    if(absDist > 55){
      if(distance > 0){ enemy.x -= enemy.speed*difficulty; enemy.facing="left"; }
      else { enemy.x += enemy.speed*difficulty; enemy.facing="right"; }
    } else if(Math.random() < 0.01) enemy.x += (Math.random()-0.5)*4;

    if(!enemy.jumping && absDist < 120 && Math.random() < 0.008*difficulty){ enemy.vy=-10; enemy.jumping=true; }

    if(!enemy.attackCooldown && absDist < 60 && Math.random() < 0.02*difficulty){
      enemy.attackCooldown=true;
      setTimeout(()=>{
        if(Math.abs(enemy.x - player.x)<70) player.hp = Math.max(0,player.hp-2.5);
        enemy.attackCooldown=false;
      }, PUNCH_COOLDOWN);
    }

    // Gravity enemy
    enemy.vy += GRAVITY;
    enemy.y += enemy.vy;
    if(enemy.y >= PLATFORM_Y - enemy.h){ enemy.y = PLATFORM_Y - enemy.h; enemy.jumping=false; enemy.vy=0; }

    // HP bars
    const ph=document.getElementById("player-health");
    const eh=document.getElementById("enemy-health");
    if(ph) ph.style.width=Math.max(0,Math.min(100,player.hp))+"%";
    if(eh) eh.style.width=Math.max(0,Math.min(100,enemy.hp))+"%";

    if(player.hp<=0||enemy.hp<=0){ running=false; setTimeout(()=>{ alert(enemy.hp<=0?"Du gewinnst!":"Gegner gewinnt!"); },50); }
  }

  function getFrame(character){
    if(!character) return null;

    let moving = character===player ? (keys.left||keys.right) : Math.abs(character.x-(character.prevX||character.x))>0.5;
    const jumping = character.jumping;
    const punch = (character===player) ? punchAnimating : (character.attackCooldown||false);
    let action="idle";
    if(punch) action="punch";
    else if(jumping) action="jump";
    else if(moving) action="run";

    frameTimer++;
    const limit = action==="idle"?18:10;
    if(frameTimer>limit){ frameTimer=0; frameIndex=(frameIndex+1)%2; }

    const facingRight = character.facing==="right";

    // Player frames
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
    }
    // Enemy frames
    else {
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
    if(!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(images.bg) ctx.drawImage(images.bg,0,0,canvas.width,canvas.height);

    const pf = getFrame(player);
    if(pf) ctx.drawImage(pf, player.x, player.y, player.w, player.h);

    const ef = getFrame(enemy);
    if(ef) ctx.drawImage(ef, enemy.x, enemy.y, enemy.w, enemy.h);

    // Countdown
    if(!gameStarted){
      ctx.fillStyle="red";
      ctx.font="72px Arial";
      ctx.textAlign="center";
      if(countdown>0){ ctx.fillText(countdown,canvas.width/2,canvas.height/2); countdownTimer++; if(countdownTimer>countdownDelay){ countdown--; countdownTimer=0; } }
      else { ctx.fillText("LOS!",canvas.width/2,canvas.height/2); countdownTimer++; if(countdownTimer>countdownDelay) gameStarted=true; }
    }
  }

  function loop(){ update(); draw(); if(running) requestAnimationFrame(loop); }

})();

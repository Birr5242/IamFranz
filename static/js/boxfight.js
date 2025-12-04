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

  const keys={left:false,right:false};
  const inputLock={jump:false,attack:false};
  const mobileLock={jump:false,attack:false};

  let frameIndex=0;
  let frameTimer=0;

  let bgMusic=null;
  let punchAnimating=false;

  let gameStarted=false;
  let countdown=3;
  let countdownTimer=0;
  const countdownDelay=60;

  // Plattform + Sprites
  const PLATFORM_Y = 180; // Boden Y
  const GRAVITY = 0.6;
  const SPRITE_H = 96;

  const PUNCH_COOLDOWN = 500;

  window.BoxFightInit=function(loadedImages,passedAssets){
    images=loadedImages||{};
    assets=passedAssets||{};

    if(images.bg_fertig){
      images.bg = images.bg_fertig; 
      console.log("Neuer Hintergrund geladen!");
    }

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
    player={x:120,y:PLATFORM_Y-SPRITE_H,w:96,h:SPRITE_H,hp:100,vy:0,jumping:false,speed:2.2,facing:"right", attackCooldown:false};
    enemy={x:600,y:PLATFORM_Y-SPRITE_H,w:96,h:SPRITE_H,hp:100,vy:0,jumping:false,speed:2.2,facing:"left", attackCooldown:false};
  }

  // Restlicher Boxfight-Code unverändert...
  // (update(), draw(), getFrame(), loop() bleiben gleich, nur y-Positionen basieren jetzt auf PLATFORM_Y)
})();

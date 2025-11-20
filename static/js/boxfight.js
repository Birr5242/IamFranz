let fightPulse = 0;
let fightPulseDir = 1;

function drawCountdown() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (images.bg) ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  if (countdown > 0) {
    ctx.font = "80px Arial";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  } else {
    // FIGHT! pulsieren
    fightPulse += 0.05 * fightPulseDir;
    if (fightPulse > 1) fightPulseDir = -1;
    if (fightPulse < 0) fightPulseDir = 1;
    const scale = 1 + 0.2 * fightPulse; // 20% pulsieren
    ctx.font = `${Math.floor(80 * scale)}px Arial`;
    ctx.fillText("FIGHT!", canvas.width / 2, canvas.height / 2);
  }

  // idle Figur während Countdown
  const pf = getPlayerFrame();
  if (pf) ctx.drawImage(pf, player.x, player.y, player.w, player.h);
  if (images.enemy) ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);

  if (countdown <= 0) {
    countdownRunning = false;
    running = true;
    loop();
  }
}

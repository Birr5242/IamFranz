// static/js/boxfight.js
console.log("Boxfight System aktiv.");

(function () {

    const canvas = document.getElementById("game");
    const ctx = canvas ? canvas.getContext("2d") : null;
    if (ctx) ctx.imageSmoothingEnabled = false;

    let images = {};
    let assets = {};
    let player = null;
    let enemy = null;
    let running = false;

    const keys = { left: false, right: false };
    const inputLock = { jump: false, attack: false };

    let frameIndex = 0;
    let frameTimer = 0;

    let punchAnimating = false;

    let gameStarted = false;
    let countdown = 3;
    let countdownTimer = 0;
    const countdownDelay = 60;

    // Plattform Höhe
    const PLATFORM_Y = 126;

    // Grenzen
    const MIN_X = 21;
    const MAX_X = 889;

    const GRAVITY = 0.6;
    const PUNCH_COOLDOWN = 500;

    window.BoxFightInit = function (loadedImages, passedAssets) {
        images = loadedImages || {};
        assets = passedAssets || {};
    };

    function setupCharacters() {
        player = {
            x: 120,
            y: PLATFORM_Y - 96,
            w: 96,
            h: 96,
            hp: 100,
            vy: 0,
            jumping: false,
            speed: 2.2,
            facing: "right",
            prevX: 120
        };

        enemy = {
            x: 600,
            y: PLATFORM_Y - 96,
            w: 96,
            h: 96,
            hp: 100,
            vy: 0,
            jumping: false,
            speed: 2.2,
            facing: "left",
            prevX: 600
        };
    }

    window.BoxFightStart = function () {
        setupCharacters();
        running = true;
        gameStarted = false;
        countdown = 3;
        countdownTimer = 0;
        requestAnimationFrame(loop);
    };

    window.BoxFightRestart = function () {
        setupCharacters();
        running = true;
        gameStarted = false;
        countdown = 3;
        countdownTimer = 0;

        document.getElementById("player-health").style.width = "100%";
        document.getElementById("enemy-health").style.width = "100%";

        requestAnimationFrame(loop);
    };

    // INPUT
    window.addEventListener("keydown", e => {
        if (!player || !gameStarted) return;

        if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
        if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;

        if (e.code === "KeyW" || e.code === "ArrowUp") {
            if (!player.jumping) {
                player.vy = -10;
                player.jumping = true;
            }
        }

        if (e.code === "KeyK") {
            if (!punchAnimating) doPlayerPunch();
        }
    });

    window.addEventListener("keyup", e => {
        if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
        if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
    });

    function doPlayerPunch() {
        punchAnimating = true;

        if (Math.abs(player.x - enemy.x) < 60) {
            enemy.hp = Math.max(0, enemy.hp - 2.5);
        }

        setTimeout(() => punchAnimating = false, PUNCH_COOLDOWN);
    }

    function update() {
        if (!running || !player || !enemy) return;
        if (!gameStarted) return;

        // PLAYER MOVE
        if (keys.left) {
            player.x -= player.speed;
            player.facing = "left";
        } else if (keys.right) {
            player.x += player.speed;
            player.facing = "right";
        }

        // Grenzen
        player.x = Math.max(MIN_X, Math.min(MAX_X - player.w, player.x));

        // GRAVITY
        player.vy += GRAVITY;
        player.y += player.vy;

        if (player.y >= PLATFORM_Y - player.h) {
            player.y = PLATFORM_Y - player.h;
            player.jumping = false;
            player.vy = 0;
        }

        // ENEMY AI
        const distance = enemy.x - player.x;

        if (Math.abs(distance) > 55) {
            if (distance > 0) enemy.x -= enemy.speed;
            else enemy.x += enemy.speed;
        }

        enemy.x = Math.max(MIN_X, Math.min(MAX_X - enemy.w, enemy.x));

        enemy.vy += GRAVITY;
        enemy.y += enemy.vy;

        if (enemy.y >= PLATFORM_Y - enemy.h) {
            enemy.y = PLATFORM_Y - enemy.h;
            enemy.jumping = false;
            enemy.vy = 0;
        }

        // HP
        document.getElementById("player-health").style.width = player.hp + "%";
        document.getElementById("enemy-health").style.width = enemy.hp + "%";

        // KILL
        if (player.hp <= 0 || enemy.hp <= 0) {
            running = false;
            setTimeout(() => alert(enemy.hp <= 0 ? "Du gewinnst!" : "Gegner gewinnt!"), 100);
        }
    }

    function getFrame(c) {
        const moving = (c === player)
            ? (keys.left || keys.right)
            : Math.abs(c.x - c.prevX) > 0.5;

        const jumping = c.jumping;
        const punching = (c === player) ? punchAnimating : false;

        let action = "idle";
        if (punching) action = "punch";
        else if (jumping) action = "jump";
        else if (moving) action = "run";

        frameTimer++;
        if (frameTimer > 12) {
            frameTimer = 0;
            frameIndex = (frameIndex + 1) % 2;
        }

        const face = c.facing === "right";

        if (c === player) {
            if (action === "idle") return face ? images.stand : images.stand_back;
            if (action === "run") return face ? images["player_run_" + (frameIndex + 1)] : images["player_run_" + (frameIndex + 1) + "_back"];
            if (action === "punch") return face ? images["player_punch_" + (frameIndex + 1)] : images["player_punch_" + (frameIndex + 1) + "_back"];
            if (action === "jump") {
                if (c.vy < -2) return face ? images.player_jump_1 : images.player_jump_1_back;
                if (c.vy > 2) return face ? images.player_jump_3 : images.player_jump_3_back;
                return face ? images.player_jump_2 : images.player_jump_2_back;
            }
        }

        // ENEMY → gleiches System
        if (action === "idle") return face ? images.enemy_stand_back : images.enemy_stand;
        if (action === "run") return face ? images.enemy_run_1_back : images.enemy_run_1;
        if (action === "punch") return face ? images.enemy_punch_1_back : images.enemy_punch_1;
        if (action === "jump") return face ? images.enemy_jump_1_back : images.enemy_jump_1;

        return null;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (images.bg_fertig)
            ctx.drawImage(images.bg_fertig, 0, 0, canvas.width, canvas.height);

        const pf = getFrame(player);
        if (pf) ctx.drawImage(pf, player.x, player.y, player.w, player.h);

        const ef = getFrame(enemy);
        if (ef) ctx.drawImage(ef, enemy.x, enemy.y, enemy.w, enemy.h);

        if (!gameStarted) {
            ctx.fillStyle = "red";
            ctx.font = "50px Arial";
            ctx.textAlign = "center";

            i

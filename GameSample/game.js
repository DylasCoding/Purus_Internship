"use strict";

// ============================================================
// CANVAS & STATE
// ============================================================
let canvas, context;
let oldTimeStamp = 0;

const mapBg = new Image();
let player;
let enemies = [];
let vfxList = [];
let score   = 0;

window.showHitboxes = false;

// ============================================================
// LAYOUT  (tất cả kích thước tính từ đây — đổi 1 chỗ là đủ)
// ============================================================
const CANVAS_W = 1200;
const CANVAS_H = 750;   // canvas nằm ngang, dùng nửa dưới map làm nền

const PADDING  = 0;     // khoảng cách từ mép canvas vào vùng chơi

// Vùng chơi: toàn bộ canvas (map crop fill vào đây)
const playZone = {
    x: PADDING,
    y: PADDING,
    width:  CANVAS_W - PADDING * 2,
    height: CANVAS_H - PADDING * 2,
};

// Vùng di chuyển của player: nửa trái playZone
const playerBounds = {
    x:      playZone.x,
    y:      playZone.y,
    width:  playZone.width / 2,
    height: playZone.height,
};

// Vùng spawn quái: nửa phải playZone (với padding nhỏ trong mép)
const spawnZone = {
    x:      playZone.x + playZone.width / 2 + 40,
    y:      playZone.y + 40,
    width:  playZone.width / 2 - 80,
    height: playZone.height - 80,
};

const MAX_ENEMIES    = 25;
const SPAWN_INTERVAL = 900; // ms

// ============================================================
// INIT
// ============================================================
function init() {
    canvas  = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;

    mapBg.src = "./assets/light_map.png";

    // Player spawn ở giữa nửa trái
    player = new Player(
        context,
        playerBounds.x + playerBounds.width / 2,
        playerBounds.y + playerBounds.height / 2,
        playerBounds
    );

    canvas.addEventListener("click", () => {
        vfxList.push(new FirestormVFX(context, player.indicatorX, player.indicatorY, player.aimAngle));
    });

    window.addEventListener("keydown", e => {
        if (e.key.toLowerCase() === "h") window.showHitboxes = !window.showHitboxes;
    });

    setInterval(spawnEnemy, SPAWN_INTERVAL);
    window.requestAnimationFrame(gameLoop);
}

// ============================================================
// SPAWN
// ============================================================
function spawnEnemy() {
    if (enemies.length >= MAX_ENEMIES) return;

    const x = spawnZone.x + Math.random() * spawnZone.width;
    const y = spawnZone.y + Math.random() * spawnZone.height;
    enemies.push(new Enemy(context, x, y));
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timeStamp) {
    let dt = Math.min((timeStamp - oldTimeStamp) / 1000, 0.1);
    oldTimeStamp = timeStamp;

    update(dt);
    draw();

    window.requestAnimationFrame(gameLoop);
}

function update(dt) {
    player.update(dt);
    for (const e of enemies)  e.update(dt);

    // Di chuyển VFX và xoá khi ra ngoài playZone
    for (let i = vfxList.length - 1; i >= 0; i--) {
        vfxList[i].update(dt);
        const v = vfxList[i];
        if (v.x < playZone.x || v.x > playZone.x + playZone.width ||
            v.y < playZone.y || v.y > playZone.y + playZone.height) {
            vfxList.splice(i, 1);
        }
    }

    detectCollisions();
}

// ============================================================
// COLLISION  (AABB vs Circle)
// ============================================================
function detectCollisions() {
    for (let vi = vfxList.length - 1; vi >= 0; vi--) {
        const v = vfxList[vi];
        let hit = false;

        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const e  = enemies[ei];
            const cx = Math.max(v.x - v.width / 2, Math.min(e.x, v.x + v.width / 2));
            const cy = Math.max(v.y - v.height / 2, Math.min(e.y, v.y + v.height / 2));
            const dx = e.x - cx, dy = e.y - cy;

            if (dx * dx + dy * dy < e.radius * e.radius) {
                enemies.splice(ei, 1);
                score++;
                hit = true;
                break;
            }
        }

        if (hit) vfxList.splice(vi, 1);
    }
}

// ============================================================
// DRAW
// ============================================================
function draw() {
    const ctx = context;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 1. Nền tối bao quanh (nếu có padding)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. Clipping mask vào playZone
    ctx.save();
    ctx.beginPath();
    ctx.rect(playZone.x, playZone.y, playZone.width, playZone.height);
    ctx.clip();

    // 3. Vẽ nửa dưới của ảnh map fill vừa khít playZone
    if (mapBg.complete && mapBg.width > 0) {
        // Cắt nửa dưới ảnh map (src y bắt đầu từ 50%)
        const srcX = 0;
        const srcY = mapBg.height / 2;
        const srcW = mapBg.width;
        const srcH = mapBg.height / 2;

        ctx.drawImage(
            mapBg,
            srcX, srcY, srcW, srcH,                           // source: nửa dưới
            playZone.x, playZone.y, playZone.width, playZone.height  // dest: toàn playZone
        );
    } else {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(playZone.x, playZone.y, playZone.width, playZone.height);
    }

    // 4. Đường phân chia trái/phải (mờ, định hướng cho người chơi)
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(playZone.x + playZone.width / 2, playZone.y);
    ctx.lineTo(playZone.x + playZone.width / 2, playZone.y + playZone.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Nhân vật
    player.draw();
    for (const e of enemies) e.draw();
    for (const v of vfxList)  v.draw();

    // 6. Hitbox debug
    if (window.showHitboxes) {
        player.drawHitbox();
        for (const e of enemies) e.drawHitbox();
        for (const v of vfxList)  v.drawHitbox();
    }

    ctx.restore(); // gỡ clip mask

    // 7. Debug borders bên ngoài clip
    if (window.showHitboxes) {
        // playZone
        ctx.strokeStyle = "cyan";
        ctx.lineWidth   = 2;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(playZone.x, playZone.y, playZone.width, playZone.height);

        // playerBounds
        ctx.strokeStyle = "#2ecc71";
        ctx.strokeRect(playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height);

        // spawnZone
        ctx.strokeStyle = "#e74c3c";
        ctx.strokeRect(spawnZone.x, spawnZone.y, spawnZone.width, spawnZone.height);

        ctx.setLineDash([]);
    }

    drawUI();
}

// ============================================================
// UI
// ============================================================
function drawUI() {
    const ctx  = context;
    const pad  = 16;
    const barH = 52;

    // Nền UI trên cùng
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(pad, pad, 300, barH);

    ctx.fillStyle   = "#fff";
    ctx.font        = "bold 18px Arial";
    ctx.textAlign   = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`☠  Đã tiêu diệt: ${score}`, pad + 16, pad + barH / 2);

    // Hint
    ctx.fillStyle   = "rgba(255,255,255,0.45)";
    ctx.font        = "13px Arial";
    ctx.textAlign   = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("[H] Hitbox  •  WASD Di chuyển  •  Click Bắn", CANVAS_W - pad, CANVAS_H - pad);
}
import Grid from './grid.js';
import Shooter from './shooter.js';
import { circleIntersect, handleWallBounce } from './physics.js';
import Bubble from './bubble.js';
import GameUI from './game_ui.js';

let canvas, ctx;
const BUBBLE_RADIUS = 20;
let grid, shooter;

let gameWidth, gameHeight;
let score = 0;

let movingBubble = null;
let fallingBubbles = []; // Thêm mảng chứa bóng đang rơi
let lastTime = 0;

let gameState = 'PLAYING'; // 'PLAYING' hoặc 'GAMEOVER'
let shotsFired = 0;
const SHOTS_TO_DROP = 5; // 5 lầnn bắn -> đẩy xuống 1 hàng
let safeLineY;                     // bóng chajm thiof game over
let ui;

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Khởi tạo giao diện UI
    ui = new GameUI(canvas);

    let rect = canvas.getBoundingClientRect();
    gameWidth = rect.width;
    gameHeight = rect.height;
    safeLineY = gameHeight - 100; // Vạch tử thần nằm ngay trên nòng súng

    // Xử lý chống mờ cho Retina
    let dpr = window.devicePixelRatio || 1;
    canvas.width = gameWidth * dpr;   // Canvas vật lý to lên
    canvas.height = gameHeight * dpr;

    ctx.scale(dpr, dpr); // Scale bút vẽ lại
    canvas.style.width = `${gameWidth}px`;
    canvas.style.height = `${gameHeight}px`;

    ctx.imageSmoothingEnabled = false;

    Bubble.loadSprites({
        blue: './assets/blue.png',
        green: './assets/green.png',
        orange: './assets/orange.png',
        red: './assets/red.png',
        yellow: './assets/yellow.png'
    });

    const GRID_COLS = Math.floor(gameWidth / (BUBBLE_RADIUS * 2));
    const GRID_ROWS = 14;

    grid = new Grid(GRID_COLS, GRID_ROWS, BUBBLE_RADIUS);
    grid.initLevel(5);

    shooter = new Shooter(gameWidth / 2, gameHeight - 30);

    ui.updateGameInfo(score, SHOTS_TO_DROP);

    canvas.addEventListener('mousemove', (e) => {
        if (gameState !== 'PLAYING') return;

        let currentRect = canvas.getBoundingClientRect();
        let scaleX = gameWidth / currentRect.width;
        let scaleY = gameHeight / currentRect.height;
        shooter.aim((e.clientX - currentRect.left) * scaleX, (e.clientY - currentRect.top) * scaleY);
    });

    canvas.addEventListener('mousedown', () => {
        if (gameState !== 'PLAYING') return;

        if (!movingBubble) {
            movingBubble = shooter.fire();
            shotsFired++;

            // Cập nhật số lần bắn còn lại lên HUD (tạm dùng chữ Speed trong code của bạn)
            let shotsLeft = SHOTS_TO_DROP - (shotsFired % SHOTS_TO_DROP);
            ui.updateGameInfo(score, shotsLeft);
        }
    });

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt)) dt = 0;
    lastTime = timestamp;
    dt = Math.min(dt, 0.1);

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (gameState !== 'PLAYING') return;

    grid.update(dt);
    shooter.update(dt);

    // Cập nhật các quả bóng đang rơi tự do
    for (let i = fallingBubbles.length - 1; i >= 0; i--) {
        let b = fallingBubbles[i];
        b.update(dt); // Thêm dòng này để bóng đang rơi cũng có animation
        b.vy += 1500 * dt;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.y > gameHeight + b.radius) {
            fallingBubbles.splice(i, 1);
        }
    }

    // Cập nhật quả bóng đang bay từ súng
    if (movingBubble) {
        movingBubble.update(dt);

        // nảy tường
        handleWallBounce(movingBubble, gameWidth);

        let hasCollided = false;

        // Chạm trần
        if (movingBubble.y - BUBBLE_RADIUS <= 0) {
            hasCollided = true;
        } else {
            // dùng circleIntersect [physics.js] kiểm tra chạm bóng
            for (let r = 0; r < grid.rows; r++) {
                for (let c = 0; c < grid.cols; c++) {
                    let b = grid.cells[r][c];
                    if (b) {
                        if (circleIntersect(b.x, b.y, b.radius, movingBubble.x, movingBubble.y, movingBubble.radius)) {
                            hasCollided = true;
                            break;
                        }
                    }
                }
                if (hasCollided) break;
            }
        }

        if (hasCollided) {
            movingBubble.isMoving = false;

            let result = grid.snapBubble(movingBubble);

            // tính điểm 1đ cho bóng nổ, 2đ cho bóng rớt
            if (result.popped > 0) {
                score += (result.popped * 1) + (result.dropped.length * 2);
            }

            // Xử lý bóng rớt
            if (result.dropped.length > 0) {
                fallingBubbles.push(...result.dropped);
            }

            movingBubble = null;
            shooter.loadBubble();

            // kiểm tra ần bắn
            if (shotsFired % SHOTS_TO_DROP === 0) {
                grid.pushDown();
            }

            let shotsLeft = SHOTS_TO_DROP - (shotsFired % SHOTS_TO_DROP);
            ui.updateGameInfo(score, shotsLeft);

            if (checkGameOver()) {
                gameState = 'GAMEOVER';
                ui.showMessage("GAME OVER");
                ui.showButton("Restart", restartGame);
            }
        }
    }
}

function draw() {
    ctx.fillStyle = 'rgba(253,253,253,0.33)';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    // ctx.imageSmoothingEnabled = false;

    grid.draw(ctx);
    shooter.draw(ctx);

    if (movingBubble) {
        movingBubble.draw(ctx);
    }

    // Vẽ các quả bóng đang rớt
    for (let b of fallingBubbles) {
        b.draw(ctx);
    }

    // Vẽ vạch an toàn
    ctx.beginPath();
    ctx.moveTo(0, safeLineY);
    ctx.lineTo(gameWidth, safeLineY);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.setLineDash([10, 5]); // Nét đứt
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]); // Reset nét vẽ
}

// Hàm kiểm tra xem có bóng nào chạm vạch an toàn chưa
function checkGameOver() {
    for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
            let b = grid.cells[r][c];
            // Nếu toạ độ Y của đáy bóng vượt qua vạch tử thần
            if (b && (b.y + b.radius >= safeLineY)) {
                return true;
            }
        }
    }
    return false;
}

function restartGame() {
    score = 0;
    shotsFired = 0;
    fallingBubbles = [];
    movingBubble = null;
    gameState = 'PLAYING';

    grid.startY = grid.radius;
    grid.firstRowOffset = 0;
    grid.cells = Array(grid.rows).fill(null).map(() => Array(grid.cols).fill(null));
    grid.initLevel(5);

    shooter.loadBubble();

    ui.hideMessage();
    ui.updateGameInfo(score, SHOTS_TO_DROP);
}

window.onload = init;
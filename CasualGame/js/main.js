import Grid from './Grid.js';
import Shooter from './Shooter.js';
import { circleIntersect, handleWallBounce } from './Physics.js';
import Bubble from './Bubble.js';

let canvas, ctx;
const BUBBLE_RADIUS = 20;
let grid, shooter;

let gameWidth, gameHeight;
let score = 0;

let movingBubble = null;
let fallingBubbles = []; // Thêm mảng chứa bóng đang rơi
let lastTime = 0;

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Lấy kích thước chuẩn ban đầu
    let rect = canvas.getBoundingClientRect();
    gameWidth = rect.width;
    gameHeight = rect.height;

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

    // SỬA: Dùng gameWidth thay cho canvas.width
    const GRID_COLS = Math.floor(gameWidth / (BUBBLE_RADIUS * 2));
    const GRID_ROWS = 14;

    grid = new Grid(GRID_COLS, GRID_ROWS, BUBBLE_RADIUS);
    grid.initLevel(5);

    // SỬA: Dùng gameWidth, gameHeight thay cho canvas
    shooter = new Shooter(gameWidth / 2, gameHeight - 30);

    canvas.addEventListener('mousemove', (e) => {
        let currentRect = canvas.getBoundingClientRect();
        let scaleX = gameWidth / currentRect.width;
        let scaleY = gameHeight / currentRect.height;

        shooter.aim(
            (e.clientX - currentRect.left) * scaleX,
            (e.clientY - currentRect.top) * scaleY
        );
    });

    canvas.addEventListener('mousedown', () => {
        if (!movingBubble) {
            movingBubble = shooter.fire();
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

    // Cập nhật các quả bóng đang rơi tự do
    for (let i = fallingBubbles.length - 1; i >= 0; i--) {
        let b = fallingBubbles[i];
        b.vy += 1500 * dt; // Áp dụng trọng lực g

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Xoá bóng rác khỏi RAM khi đã rớt khỏi màn hình
        if (b.y > canvas.height + b.radius) {
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

            // Nhận kết quả là object từ Grid.js
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

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';

    ctx.fillText(`point: ${score}`, 20, gameHeight - 20);
}

window.onload = init;
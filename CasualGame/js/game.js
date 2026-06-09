import Grid from './grid.js';
import Shooter from './shooter.js';
import { circleIntersect, handleWallBounce } from './physics.js';
import Bubble from './bubble.js';
import GameUI from './game_ui.js';

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ui = new GameUI(this.canvas);

        this.BUBBLE_RADIUS = 20;
        this.SHOTS_TO_DROP = 5;

        this.gameWidth = 0;
        this.gameHeight = 0;
        this.safeLineY = 0;

        this.score = 0;
        this.shotsFired = 0;

        this.movingBubble = null;
        this.fallingBubbles = [];
        this.lastTime = 0;
        this.gameState = 'PLAYING';

        this.grid = null;
        this.shooter = null;

        this.gameLoop = this.gameLoop.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.restartGame = this.restartGame.bind(this);
    }

    init() {
        let rect = this.canvas.getBoundingClientRect();
        this.gameWidth = rect.width;
        this.gameHeight = rect.height;
        this.safeLineY = this.gameHeight - 100;

        let dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.gameWidth * dpr;
        this.canvas.height = this.gameHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${this.gameWidth}px`;
        this.canvas.style.height = `${this.gameHeight}px`;
        this.ctx.imageSmoothingEnabled = false;

        Bubble.loadSprites({
            blue: './assets/blue.png',
            green: './assets/green.png',
            orange: './assets/orange.png',
            red: './assets/red.png',
            yellow: './assets/yellow.png'
        });

        const GRID_COLS = Math.floor(this.gameWidth / (this.BUBBLE_RADIUS * 2));
        const GRID_ROWS = 14;

        this.grid = new Grid(GRID_COLS, GRID_ROWS, this.BUBBLE_RADIUS);
        this.grid.initLevel(5);

        this.shooter = new Shooter(this.gameWidth / 2, this.gameHeight - 30);

        this.ui.updateGameInfo(this.score, this.SHOTS_TO_DROP);

        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);

        requestAnimationFrame(this.gameLoop);
    }

    handleMouseMove(e) {
        if (this.gameState !== 'PLAYING') return;

        let currentRect = this.canvas.getBoundingClientRect();
        let scaleX = this.gameWidth / currentRect.width;
        let scaleY = this.gameHeight / currentRect.height;
        this.shooter.aim(
            (e.clientX - currentRect.left) * scaleX,
            (e.clientY - currentRect.top) * scaleY
        );
    }

    handleMouseDown() {
        if (this.gameState !== 'PLAYING') return;

        if (!this.movingBubble) {
            this.movingBubble = this.shooter.fire();
            this.shotsFired++;

            let shotsLeft = this.SHOTS_TO_DROP - (this.shotsFired % this.SHOTS_TO_DROP);
            this.ui.updateGameInfo(this.score, shotsLeft);
        }
    }

    gameLoop(timestamp) {
        let dt = (timestamp - this.lastTime) / 1000;
        if (isNaN(dt)) dt = 0;
        this.lastTime = timestamp;
        dt = Math.min(dt, 0.1);

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }

    update(dt) {
        if (this.gameState !== 'PLAYING') return;

        this.grid.update(dt);
        this.shooter.update(dt);

        this.updateFallingBubbles(dt);
        this.updateMovingBubble(dt);
    }

    updateFallingBubbles(dt) {
        for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
            let b = this.fallingBubbles[i];
            b.update(dt);
            b.vy += 1500 * dt;

            b.x += b.vx * dt;
            b.y += b.vy * dt;

            if (b.y > this.gameHeight + b.radius) {
                this.fallingBubbles.splice(i, 1);
            }
        }
    }

    updateMovingBubble(dt) {
        if (!this.movingBubble) return;

        this.movingBubble.update(dt);
        handleWallBounce(this.movingBubble, this.gameWidth);

        let hasCollided = this.checkCollisions();

        if (hasCollided) {
            this.movingBubble.isMoving = false;

            let result = this.grid.snapBubble(this.movingBubble);
            this.handleSnapResult(result);

            this.movingBubble = null;
            this.shooter.loadBubble();

            this.checkAndPushDown();

            if (this.checkGameOver()) {
                this.gameState = 'GAMEOVER';
                this.ui.showMessage("GAME OVER");
                this.ui.showButton("Restart", this.restartGame);
            }
        }
    }

    checkCollisions() {
        if (this.movingBubble.y - this.BUBBLE_RADIUS <= 0) {
            return true;
        }

        for (let r = 0; r < this.grid.rows; r++) {
            for (let c = 0; c < this.grid.cols; c++) {
                let b = this.grid.cells[r][c];
                if (b) {
                    if (circleIntersect(b.x, b.y, b.radius, this.movingBubble.x, this.movingBubble.y, this.movingBubble.radius)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    handleSnapResult(result) {
        if (result.popped > 0) {
            this.score += (result.popped * 1) + (result.dropped.length * 2);
        }

        if (result.dropped.length > 0) {
            this.fallingBubbles.push(...result.dropped);
        }
    }

    checkAndPushDown() {
        if (this.shotsFired % this.SHOTS_TO_DROP === 0) {
            this.grid.pushDown();
        }

        let shotsLeft = this.SHOTS_TO_DROP - (this.shotsFired % this.SHOTS_TO_DROP);
        this.ui.updateGameInfo(this.score, shotsLeft);
    }

    checkGameOver() {
        for (let r = 0; r < this.grid.rows; r++) {
            for (let c = 0; c < this.grid.cols; c++) {
                let b = this.grid.cells[r][c];
                if (b && (b.y + b.radius >= this.safeLineY)) {
                    return true;
                }
            }
        }
        return false;
    }

    restartGame() {
        this.score = 0;
        this.shotsFired = 0;
        this.fallingBubbles = [];
        this.movingBubble = null;
        this.gameState = 'PLAYING';

        this.grid.startY = this.grid.radius;
        this.grid.firstRowOffset = 0;
        this.grid.cells = Array(this.grid.rows).fill(null).map(() => Array(this.grid.cols).fill(null));
        this.grid.initLevel(5);

        this.shooter.loadBubble();

        this.ui.hideMessage();
        this.ui.updateGameInfo(this.score, this.SHOTS_TO_DROP);
    }

    draw() {
        this.ctx.fillStyle = 'rgba(253,253,253,0.33)';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        this.grid.draw(this.ctx);
        this.shooter.draw(this.ctx);

        if (this.movingBubble) {
            this.movingBubble.draw(this.ctx);
        }

        for (let b of this.fallingBubbles) {
            b.draw(this.ctx);
        }

        this.drawSafeLine();
    }

    drawSafeLine() {
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.safeLineY);
        this.ctx.lineTo(this.gameWidth, this.safeLineY);
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.setLineDash([10, 5]);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
}


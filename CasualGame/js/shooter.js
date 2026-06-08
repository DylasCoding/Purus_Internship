import Bubble from './bubble.js';

import {COLORS} from "./grid.js";
// const COLORS = ['blue', 'green', 'orange', 'red', 'yellow'];

export default class Shooter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2;
        this.loadedBubble = null;
        this.speed = 800; // Tốc độ bay của bóng (pixel/giây)

        this.loadBubble();
    }

    loadBubble() {
        let randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        // Đặt bóng ở ngay nòng súng
        this.loadedBubble = new Bubble(this.x, this.y, randomColor);
    }

    update(dt) {
        if (this.loadedBubble) {
            this.loadedBubble.update(dt);
        }
    }

    aim(mouseX, mouseY) {
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        this.angle = Math.atan2(dy, dx);

        if (this.angle > -0.1) this.angle = -0.1;
        if (this.angle < -Math.PI + 0.1) this.angle = -Math.PI + 0.1;
    }

    fire() {
        if (!this.loadedBubble) return null;

        let bubbleToFire = this.loadedBubble;
        bubbleToFire.vx = Math.cos(this.angle) * this.speed;
        bubbleToFire.vy = Math.sin(this.angle) * this.speed;
        bubbleToFire.isMoving = true;

        this.loadedBubble = null; // Bắn xong thì rỗng nòng
        return bubbleToFire;      // Trả về bóng để [main.js] quản lý
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // ctx.fillStyle = '#e3bcbc';
        // ctx.fillRect(0, -10, 60, 20);
        ctx.restore();

        this.drawTrajectory(ctx);

        // Vẽ quả bóng đang nằm trong nòng súng
        if (this.loadedBubble) {
            this.loadedBubble.draw(ctx);
        }
    }

    drawTrajectory(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        let endX = this.x + Math.cos(this.angle) * 300;
        let endY = this.y + Math.sin(this.angle) * 300;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(103,1,1,0.5)';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
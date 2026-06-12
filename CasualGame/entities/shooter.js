class Shooter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2;
        this.loadedBubble = null;
        this.speed = 800;

        this.nextBubbleColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.nextBubblePreview = new Bubble(this.x - 70, this.y + 10, this.nextBubbleColor);
        this.nextBubblePreview.radius = 15;

        this.loadBubble();
    }

    loadBubble() {
        this.loadedBubble = new Bubble(this.x, this.y, this.nextBubbleColor);
        this.nextBubbleColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.nextBubblePreview.color = this.nextBubbleColor;
    }

    update(dt) {
        if (this.loadedBubble) this.loadedBubble.update(dt);
        if (this.nextBubblePreview) this.nextBubblePreview.update(dt);
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

        let bubbleToFire = new Projectile(this.loadedBubble.x, this.loadedBubble.y, this.loadedBubble.color);
        bubbleToFire.vx = Math.cos(this.angle) * this.speed;
        bubbleToFire.vy = Math.sin(this.angle) * this.speed;

        this.loadedBubble = null;
        return bubbleToFire;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.restore();

        this.drawTrajectory(ctx);

        if (this.nextBubblePreview) this.nextBubblePreview.draw(ctx);
        if (this.loadedBubble) this.loadedBubble.draw(ctx);
    }

    drawTrajectory(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        let endX = this.x + Math.cos(this.angle) * 300;
        let endY = this.y + Math.sin(this.angle) * 300;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

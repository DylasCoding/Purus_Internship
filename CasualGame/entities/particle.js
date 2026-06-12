// Differentiates structural bubbles from detached, falling visual elements
class Particle extends Bubble {
    constructor(bubble) {
        super(bubble.x, bubble.y, bubble.color);
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = 0;
        this.isMoving = true;
    }
}

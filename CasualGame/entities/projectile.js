// Differentiates fired moving bubbles from stationary grid objects
class Projectile extends Bubble {
    constructor(x, y, colorName) {
        super(x, y, colorName);
        this.isMoving = true;
    }
}

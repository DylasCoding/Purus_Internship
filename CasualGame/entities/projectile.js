// bóng bắn
class Projectile extends Bubble {
    constructor(x, y, colorName) {
        super(x, y, colorName);
        this.isMoving = true;
    }
}

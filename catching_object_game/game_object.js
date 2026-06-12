class GameObject {
    constructor(context, x, y, width, height, vx = 0, vy = 0) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = vx;
        this.vy = vy;
    }

    update(secondsPassed = 1) {
        this.x += this.vx * secondsPassed;
        this.y += this.vy * secondsPassed;
    }

    draw() {
    }

    right() {
        return this.x + this.width;
    }

    bottom() {
        return this.y + this.height;
    }

    isTouching(other) {
        return !(
            this.right() < other.x ||
            this.x > other.right() ||
            this.bottom() < other.y ||
            this.y > other.bottom()
        );
    }
}

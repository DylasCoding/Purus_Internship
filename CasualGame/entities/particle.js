// bóng rơi xuống sau khi bị tách ra khỏi grid,
// caais này là bóng không nổ nhưng màa mất bóng ở trên chống đỡ rồi nên nó rơi xuống
class Particle extends Bubble {
    constructor(bubble) {
        super(bubble.x, bubble.y, bubble.color);
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = 0;
        this.isMoving = true;
    }
}

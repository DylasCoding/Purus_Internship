const OBSTACLE_COLOR = "#fb7185";
const OBSTACLE_DARK_COLOR = "#be123c";

class Obstacle extends GameObject {
    constructor(context, x, y, width, height, speed) {
        super(context, x, y, width, height, 0, speed);
    }

    update(secondsPassed) {
        // TODO: Move the obstacle downward.
        // Hint: call super.update(secondsPassed).

        super.update(secondsPassed);
    }

    draw() {
        this.context.fillStyle = OBSTACLE_COLOR;
        this.context.beginPath();
        this.context.roundRect(this.x, this.y, this.width, this.height, 8);
        this.context.fill();

        this.context.fillStyle = OBSTACLE_DARK_COLOR;
        this.context.fillRect(this.x + 6, this.y + 6, this.width - 12, 5);
    }

    isOffScreen(boardHeight) {
        // TODO: Return true when the obstacle is below the canvas.
        // return false;
        return this.y > boardHeight;
    }
}

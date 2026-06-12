const FALLING_OBJECT_COLOR = "#facc15";
const FALLING_OBJECT_DARK_COLOR = "#ca8a04";

class FallingObject extends GameObject {
    constructor(context, x, y, size, speed) {
        super(context, x, y, size, size, 0, speed);
        this.caught = false;
    }

    update(secondsPassed) {
        // TODO: Move the object downward.
        // Hint: call super.update(secondsPassed).

        super.update(secondsPassed);
    }


    draw() {
        this.context.fillStyle = FALLING_OBJECT_COLOR;
        this.context.beginPath();
        this.context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        this.context.fill();

        this.context.fillStyle = FALLING_OBJECT_DARK_COLOR;
        this.context.beginPath();
        this.context.arc(this.x + this.width * 0.62, this.y + this.height * 0.38, this.width * 0.13, 0, Math.PI * 2);
        this.context.fill();
    }

    isOffScreen(boardHeight) {
        // TODO: Return true when the object is below the canvas.
        // return false;
        return this.y > boardHeight;
    }
}

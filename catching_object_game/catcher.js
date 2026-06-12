const CATCHER_COLOR = "#38bdf8";
const CATCHER_DARK_COLOR = "#0369a1";

class Catcher extends GameObject {
    constructor(context, x, y, width, height) {
        super(context, x, y, width, height);
        this.speed = 520;
        this.moveLeft = false;
        this.moveRight = false;
    }

    update(secondsPassed, boardWidth) {
        // TODO: Use moveLeft and moveRight to change this.x.
        // Hint:
        // if (this.moveLeft) this.x -= this.speed * secondsPassed;
        // if (this.moveRight) this.x += this.speed * secondsPassed;

        // TODO: Keep the catcher inside the canvas.
        // Hint: clamp this.x between 0 and boardWidth - this.width.

        if (this.moveLeft) {
            this.x -= this.speed * secondsPassed;
        }
        if (this.moveRight) {
            this.x += this.speed * secondsPassed;
        }

        this.keepInside(boardWidth);
    }

    moveToCenter(centerX, boardWidth) {
        this.x = centerX - this.width / 2;
        this.keepInside(boardWidth);
    }

    keepInside(boardWidth) {
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > boardWidth) {
            this.x = boardWidth - this.width;
        }
    }

    draw() {
        this.context.fillStyle = CATCHER_DARK_COLOR;
        this.context.fillRect(this.x, this.y + this.height * 0.45, this.width, this.height * 0.55);

        this.context.fillStyle = CATCHER_COLOR;
        this.context.beginPath();
        this.context.roundRect(this.x, this.y, this.width, this.height * 0.65, 10);
        this.context.fill();
    }
}

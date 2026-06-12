class Bubble extends GameObject {
    static sprites = {};
    static numCols = 10;
    static numRows = 7;
    static totalFrames = 70;
    static frameWidth = 0;
    static frameHeight = 0;

    constructor(x, y, colorName) {
        super(x, y);
        this.radius = 20;
        this.color = colorName;

        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;

        this.currentFrame = Math.floor(Math.random() * Bubble.totalFrames);
        this.frameTimer = 0;
        this.frameInterval = 1 / 25;
    }

    draw(ctx) {
        let img = Bubble.sprites[this.color];
        let col = this.currentFrame % Bubble.numCols;
        let row = Math.floor(this.currentFrame / Bubble.numCols);

        let srcX = col * Bubble.frameWidth;
        let srcY = row * Bubble.frameHeight;
        let size = this.radius * 2;

        ctx.drawImage(
            img,
            srcX, srcY,
            Bubble.frameWidth, Bubble.frameHeight,
            this.x - this.radius, this.y - this.radius,
            size, size
        );
    }

    update(dt) {
        if (this.isMoving) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.currentFrame++;
            if (this.currentFrame >= Bubble.totalFrames) {
                this.currentFrame = 0;
            }
        }
    }

    static loadSprites(imageUrls) {
        for (let color in imageUrls) {
            let img = new Image();
            img.src = imageUrls[color];
            Bubble.sprites[color] = img;

            img.onload = () => {
                if (Bubble.frameWidth === 0) {
                    Bubble.frameWidth = img.width / Bubble.numCols;
                    Bubble.frameHeight = img.height / Bubble.numRows;
                }
            };
        }
    }
}

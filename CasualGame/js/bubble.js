export default class Bubble {
    // 1. Cấu hình Sprite Sheet
    static sprites = {}; // Object chứa các ảnh theo tên màu
    static numCols = 10;
    static numRows = 7;
    static totalFrames = 70; // 7 hàng x 10 cột
    static frameWidth = 0;
    static frameHeight = 0;

    constructor(x, y, colorName) {
        this.x = x;
        this.y = y;
        this.radius = 20;

        this.color = colorName; // 'blue', 'red'

        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;

        // Animation
        // Random frame bắt đầu để các quả bóng trên lưới không chuyển động đồng loạt giống hệt nhau
        this.currentFrame = Math.floor(Math.random() * Bubble.totalFrames);
        this.frameTimer = 0;

        // Tốc độ chạy (70 frames thì có thể để chạy nhanh một chút, vd: 30 FPS = 1/30s)
        this.frameInterval = 1 / 25;
    }

    draw(ctx) {
        let img = Bubble.sprites[this.color];

        // Áp dụng công thức tìm hàng và cột
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

        // Cập nhật Animation
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.currentFrame++;

            // Khi chạy tới frame 69, quay lại frame 0
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

            // Lấy kích thước khung hình khi ảnh đầu tiên tải xong
            img.onload = () => {
                if (Bubble.frameWidth === 0) {
                    Bubble.frameWidth = img.width / Bubble.numCols;
                    Bubble.frameHeight = img.height / Bubble.numRows;
                }
            };
        }
    }

}
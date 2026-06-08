"use strict";

// ============================================================
// BASE CLASS
// ============================================================
class GameObject {
    constructor(context, x, y, width, height) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

// ============================================================
// PLAYER
// ============================================================
class Player extends GameObject {
    static sprite = null;

    constructor(context, x, y, bounds) {
        super(context, x, y, 70, 70);

        // Giới hạn di chuyển của player (nửa trái playZone)
        this.bounds = bounds;

        // Aim arc
        this.radiusArc = 130;
        this.aimAngle   = -Math.PI / 2;
        this.aimSpeed   = 2.3;
        this.sweepDir   = 1;
        this.indicatorX = x;
        this.indicatorY = y;

        // Keyboard movement
        this.speed = 220;
        this.keys  = {};

        window.addEventListener("keydown", e => { this.keys[e.key] = true;  });
        window.addEventListener("keyup",   e => { this.keys[e.key] = false; });

        if (!Player.sprite) {
            Player.sprite = new Image();
            Player.sprite.src = "./assets/player.png";
        }
    }

    update(dt) {
        // --- Di chuyển WASD / Arrow ---
        let dx = 0, dy = 0;
        if (this.keys["ArrowUp"]    || this.keys["w"] || this.keys["W"]) dy -= 1;
        if (this.keys["ArrowDown"]  || this.keys["s"] || this.keys["S"]) dy += 1;
        if (this.keys["ArrowLeft"]  || this.keys["a"] || this.keys["A"]) dx -= 1;
        if (this.keys["ArrowRight"] || this.keys["d"] || this.keys["D"]) dx += 1;

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;

        // Clamp vào playerBounds
        const hw = this.width  / 2;
        const hh = this.height / 2;
        this.x = Math.max(this.bounds.x + hw, Math.min(this.bounds.x + this.bounds.width  - hw, this.x));
        this.y = Math.max(this.bounds.y + hh, Math.min(this.bounds.y + this.bounds.height - hh, this.y));

        // --- Sweep aim indicator ---
        this.aimAngle += this.aimSpeed * dt * this.sweepDir;
        if      (this.aimAngle >  Math.PI / 2) { this.aimAngle =  Math.PI / 2; this.sweepDir = -1; }
        else if (this.aimAngle < -Math.PI / 2) { this.aimAngle = -Math.PI / 2; this.sweepDir =  1; }

        this.indicatorX = this.x + Math.cos(this.aimAngle) * this.radiusArc;
        this.indicatorY = this.y + Math.sin(this.aimAngle) * this.radiusArc;
    }

    draw() {
        const ctx = this.context;

        // Aim arc
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radiusArc, -Math.PI / 2, Math.PI / 2);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth   = 3;
        ctx.stroke();

        // Aim indicator dot
        ctx.beginPath();
        ctx.arc(this.indicatorX, this.indicatorY, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffcc00";
        ctx.fill();

        // Sprite or fallback
        if (Player.sprite?.complete && Player.sprite.width > 0) {
            ctx.drawImage(Player.sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = "#3498db";
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }

    drawHitbox() {
        this.context.strokeStyle = "red";
        this.context.lineWidth   = 2;
        this.context.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

// ============================================================
// ENEMY  (9-frame sprite sheet)
// ============================================================
class Enemy extends GameObject {
    static sprite  = null;
    static COLS    = 9;

    constructor(context, x, y) {
        super(context, x, y, 60, 60);
        this.radius       = 24;
        this.currentFrame = 0;
        this.animTimer    = 0;

        if (!Enemy.sprite) {
            Enemy.sprite = new Image();
            Enemy.sprite.src = "./assets/enemy1.png";
        }
    }

    update(dt) {
        this.animTimer += dt;
        if (this.animTimer >= 0.1) {
            this.currentFrame = (this.currentFrame + 1) % Enemy.COLS;
            this.animTimer    = 0;
        }
    }

    draw() {
        const ctx = this.context;
        if (Enemy.sprite?.complete && Enemy.sprite.width > 0) {
            const fw = Enemy.sprite.width / Enemy.COLS;
            const fh = Enemy.sprite.height;
            ctx.drawImage(
                Enemy.sprite,
                this.currentFrame * fw, 0, fw, fh,
                this.x - this.width / 2, this.y - this.height / 2, this.width, this.height
            );
        } else {
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawHitbox() {
        this.context.strokeStyle = "red";
        this.context.lineWidth   = 2;
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.context.stroke();
    }
}

// ============================================================
// FIRESTORM VFX  (4-frame sprite sheet)
// ============================================================
class FirestormVFX extends GameObject {
    static sprite = null;
    static COLS   = 4;

    constructor(context, x, y, angle) {
        super(context, x, y, 50, 95);
        const speed  = 650;
        this.vx      = Math.cos(angle) * speed;
        this.vy      = Math.sin(angle) * speed;
        this.currentFrame = 0;
        this.animTimer    = 0;

        if (!FirestormVFX.sprite) {
            FirestormVFX.sprite = new Image();
            FirestormVFX.sprite.src = "./assets/firestorm.png";
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.animTimer += dt;
        if (this.animTimer >= 0.06) {
            this.currentFrame = (this.currentFrame + 1) % FirestormVFX.COLS;
            this.animTimer    = 0;
        }
    }

    draw() {
        const ctx = this.context;
        if (FirestormVFX.sprite?.complete && FirestormVFX.sprite.width > 0) {
            const fw = FirestormVFX.sprite.width / FirestormVFX.COLS;
            const fh = FirestormVFX.sprite.height;
            ctx.drawImage(
                FirestormVFX.sprite,
                this.currentFrame * fw, 0, fw, fh,
                this.x - this.width / 2, this.y - this.height / 2, this.width, this.height
            );
        } else {
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }

    drawHitbox() {
        this.context.strokeStyle = "red";
        this.context.lineWidth   = 2;
        this.context.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}
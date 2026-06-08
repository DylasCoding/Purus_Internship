import Bubble from './Bubble.js';

const COLORS = ['blue', 'green', 'orange', 'red', 'yellow'];

export default class Grid {
    constructor(cols, rows, bubbleRadius) {
        this.cols = cols;
        this.rows = rows;
        this.radius = bubbleRadius;
        this.diameter = bubbleRadius * 2;
        this.rowHeight = this.radius * Math.sqrt(3);
        this.cells = Array(rows).fill(null).map(() => Array(cols).fill(null));
        this.startX = this.radius;
        this.startY = this.radius;
    }

    update(dt) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c]) {
                    this.cells[r][c].update(dt);
                }
            }
        }
    }

    initLevel(rowsToFill) { /*... GIỮ NGUYÊN NHƯ BƯỚC TRƯỚC ...*/
        for (let r = 0; r < rowsToFill; r++) {
            let colsInRow = (r % 2 === 0) ? this.cols : this.cols - 1;
            for (let c = 0; c < colsInRow; c++) {
                let pos = this.getCanvasPos(r, c);
                let randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                this.cells[r][c] = new Bubble(pos.x, pos.y, randomColor);
            }
        }
    }

    getCanvasPos(row, col) { /*... GIỮ NGUYÊN ...*/
        let x = this.startX + col * this.diameter;
        if (row % 2 !== 0) x += this.radius;
        let y = this.startY + row * this.rowHeight;
        return { x, y };
    }

    // Lấy danh sách 6 ô hàng xóm của một ô tổ ong
    getNeighbors(r, c) {
        const isOdd = r % 2 !== 0;
        const offsets = isOdd ?
            [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] :
            [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];

        let neighbors = [];
        for (let off of offsets) {
            let nr = r + off[0];
            let nc = c + off[1];
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                // Hàng lẻ bị hụt 1 cột ở cuối, không được tính
                if (nr % 2 !== 0 && nc === this.cols - 1) continue;
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    // Snap bóng đang bay vào ô lưới trống gần nhất
    snapBubble(bubble) {
        let closestR = -1, closestC = -1, minDist = Infinity;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.cells[r][c]) {
                    if (r % 2 !== 0 && c === this.cols - 1) continue;

                    let pos = this.getCanvasPos(r, c);
                    let dist = Math.hypot(bubble.x - pos.x, bubble.y - pos.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closestR = r;
                        closestC = c;
                    }
                }
            }
        }

        if (closestR !== -1 && closestC !== -1) {
            let snapPos = this.getCanvasPos(closestR, closestC);
            bubble.x = snapPos.x;
            bubble.y = snapPos.y;
            this.cells[closestR][closestC] = bubble;

            // Gọi và trả về kết quả từ handleMatch
            return this.handleMatch(closestR, closestC, bubble.color);
        }
        // Trả về object rỗng nếu không snap được
        return { dropped: [], popped: 0 };
    }

    handleMatch(startR, startC, targetColor) {
        let matchGroup = this.findMatches(startR, startC, targetColor);
        let droppedBubbles = [];
        let poppedCount = 0; // đếm bóng nổ

        if (matchGroup.length >= 3) {
            poppedCount = matchGroup.length; // Ghi nhận số bóng nổ

            for (let cell of matchGroup) {
                this.cells[cell.r][cell.c] = null;
            }
            droppedBubbles = this.dropFloatingBubbles();
        }

        return { dropped: droppedBubbles, popped: poppedCount };
    }

    // Thuật toán vết dầu loang (Flood-fill) tìm bóng cùng màu
    findMatches(r, c, color) {
        let queue = [{ r, c }];
        let visited = new Set([`${r},${c}`]);
        let matches = [];

        while (queue.length > 0) {
            let current = queue.shift();
            matches.push(current);

            let neighbors = this.getNeighbors(current.r, current.c);
            for (let n of neighbors) {
                if (!visited.has(`${n.r},${n.c}`) && this.cells[n.r][n.c] && this.cells[n.r][n.c].color === color) {
                    visited.add(`${n.r},${n.c}`);
                    queue.push(n);
                }
            }
        }
        return matches;
    }

    // Tìm và thả rơi những bóng không nối với hàng 0 (trần nhà)
    dropFloatingBubbles() {
        let connected = new Set();
        let queue = [];

        for (let c = 0; c < this.cols; c++) {
            if (this.cells[0][c]) {
                queue.push({ r: 0, c });
                connected.add(`0,${c}`);
            }
        }

        while (queue.length > 0) {
            let current = queue.shift();
            let neighbors = this.getNeighbors(current.r, current.c);

            for (let n of neighbors) {
                if (!connected.has(`${n.r},${n.c}`) && this.cells[n.r][n.c]) {
                    connected.add(`${n.r},${n.c}`);
                    queue.push(n);
                }
            }
        }

        let falling = [];
        // Chuyển những bóng không được kết nối vào mảng falling
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c] && !connected.has(`${r},${c}`)) {
                    let b = this.cells[r][c];
                    // Tạo vận tốc ngang ngẫu nhiên nhẹ để rơi cho đẹp mắt
                    b.vx = (Math.random() - 0.5) * 200;
                    b.vy = 0; // Vận tốc rơi ban đầu
                    falling.push(b);

                    this.cells[r][c] = null; // Tách khỏi lưới
                }
            }
        }
        return falling;
    }

    draw(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c]) {
                    this.cells[r][c].draw(ctx);
                }
            }
        }
    }
}
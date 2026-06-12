const COLORS = ['blue', 'green', 'orange', 'red', 'yellow'];

class Grid {
    constructor(cols, rows, bubbleRadius) {
        this.cols = cols;
        this.rows = rows;
        this.radius = bubbleRadius;
        this.diameter = bubbleRadius * 2;
        this.rowHeight = this.radius * Math.sqrt(3);
        this.cells = Array(rows).fill(null).map(() => Array(cols).fill(null));
        this.startX = this.radius;
        this.startY = this.radius;
        this.firstRowOffset = 0;
    }

    ensureEmptyBottomRow() {
        while (this.cells[this.rows - 1].some(cell => cell !== null)) {
            this.rows++;
            this.cells.push(Array(this.cols).fill(null));
        }
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

    initLevel(rowsToFill) {
        for (let r = 0; r < rowsToFill; r++) {
            this.fillRow(r);
        }
    }

    fillRow(rowIndex) {
        let colsInRow = ((rowIndex + this.firstRowOffset) % 2 === 0) ? this.cols : this.cols - 1;
        for (let c = 0; c < colsInRow; c++) {
            let pos = this.getCanvasPos(rowIndex, c);
            let randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.cells[rowIndex][c] = new Bubble(pos.x, pos.y, randomColor);
        }
    }

    pushDown() {
        this.rows++;
        this.cells.push(Array(this.cols).fill(null));

        for (let r = this.rows - 1; r > 0; r--) {
            for (let c = 0; c < this.cols; c++) {
                this.cells[r][c] = this.cells[r - 1][c];
            }
        }

        this.firstRowOffset = (this.firstRowOffset === 0) ? 1 : 0;

        for (let c = 0; c < this.cols; c++) {
            this.cells[0][c] = null;
        }
        this.fillRow(0);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c]) {
                    let pos = this.getCanvasPos(r, c);
                    this.cells[r][c].x = pos.x;
                    this.cells[r][c].y = pos.y;
                }
            }
        }

        this.ensureEmptyBottomRow();
    }

    getCanvasPos(row, col) {
        let x = this.startX + col * this.diameter;
        if ((row + this.firstRowOffset) % 2 !== 0) x += this.radius;
        let y = this.startY + row * this.rowHeight;
        return { x, y };
    }

    getNeighbors(r, c) {
        const isOdd = (r + this.firstRowOffset) % 2 !== 0;
        const offsets = isOdd ?
            [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] :
            [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];

        let neighbors = [];
        for (let off of offsets) {
            let nr = r + off[0];
            let nc = c + off[1];
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if ((nr + this.firstRowOffset) % 2 !== 0 && nc === this.cols - 1) continue;
                neighbors.push({ r: nr, c: nc });
            }
        }
        return neighbors;
    }

    snapBubble(bubble) {
        this.ensureEmptyBottomRow();

        let closestR = -1, closestC = -1, minDist = Infinity;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.cells[r][c]) {
                    if ((r + this.firstRowOffset) % 2 !== 0 && c === this.cols - 1) continue;

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

            return this.handleMatch(closestR, closestC, bubble.color);
        }
        return { dropped: [], popped: 0 };
    }

    handleMatch(startR, startC, targetColor) {
        let matchGroup = this.findMatches(startR, startC, targetColor);
        let droppedBubbles = [];
        let poppedCount = 0;

        if (matchGroup.length >= 3) {
            poppedCount = matchGroup.length;

            for (let cell of matchGroup) {
                this.cells[cell.r][cell.c] = null;
            }
            droppedBubbles = this.dropFloatingBubbles();
        }

        return { dropped: droppedBubbles, popped: poppedCount };
    }

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
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c] && !connected.has(`${r},${c}`)) {
                    falling.push(new Particle(this.cells[r][c]));
                    this.cells[r][c] = null;
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

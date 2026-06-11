export function circleIntersect(x1, y1, r1, x2, y2, r2) {
    let squareDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    let collisionDistance = (r1 + r2) * 0.95;
    return squareDistance <= (collisionDistance * collisionDistance);
}

export function handleWallBounce(bubble, canvasWidth) {
    if (bubble.x - bubble.radius < 0) {
        bubble.x = bubble.radius;
        bubble.vx *= -1; // Đảao chiều vận tốc ngangg
    } else if (bubble.x + bubble.radius > canvasWidth) {
        bubble.x = canvasWidth - bubble.radius;
        bubble.vx *= -1;
    }
}
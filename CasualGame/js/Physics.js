// Kiểm tra va chạm giữa 2 hình tròn
export function circleIntersect(x1, y1, r1, x2, y2, r2) {
    let squareDistance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    // Trừ hao một chút (0.95) để bóng lún vào nhau nhẹ mới tính là va chạm
    let collisionDistance = (r1 + r2) * 0.95;
    return squareDistance <= (collisionDistance * collisionDistance);
}

// Xử lý bật nảy khi chạm 2 bên tường
export function handleWallBounce(bubble, canvasWidth) {
    if (bubble.x - bubble.radius < 0) {
        bubble.x = bubble.radius;
        bubble.vx *= -1; // Đảo chiều vận tốc ngang
    } else if (bubble.x + bubble.radius > canvasWidth) {
        bubble.x = canvasWidth - bubble.radius;
        bubble.vx *= -1;
    }
}
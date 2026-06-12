class Input {
    static getMouseCoordinates(e, canvas, gameWidth, gameHeight) {
        let currentRect = canvas.getBoundingClientRect();
        let scaleX = gameWidth / currentRect.width;
        let scaleY = gameHeight / currentRect.height;
        return {
            x: (e.clientX - currentRect.left) * scaleX,
            y: (e.clientY - currentRect.top) * scaleY
        };
    }
}

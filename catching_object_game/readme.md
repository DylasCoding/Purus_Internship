# Catching Object Canvas Game Skeleton

This is a beginner exercise. The project structure and UI are ready, but the main gameplay is intentionally incomplete.

Open `index.html`, click Start, then complete the TODO comments in the JavaScript files.

## Goal

Objects fall from the top of the screen.

- Catch good objects to gain score.
- Avoid bad obstacles.
- Lose lives when missing good objects or touching obstacles.
- Restart after game over.

## File structure

- `index.html` creates the canvas and loads scripts.
- `style.css` styles the page, canvas, score/lives bar, and buttons.
- `game_object.js` has shared movement and collision helpers.
- `catcher.js` contains the player catcher class.
- `falling_object.js` contains good falling objects.
- `obstacle.js` contains bad falling obstacles.
- `game_ui.js` creates the HTML lives/score UI and start/restart panel.
- `game.js` connects input, update, drawing, spawning, collision, start, and restart.

## Suggested order

1. Finish `Catcher.update()` in `catcher.js`.
2. Finish `FallingObject.update()` and `isOffScreen()` in `falling_object.js`.
3. Finish `Obstacle.update()` and `isOffScreen()` in `obstacle.js`.
4. Finish `spawnItems()` in `game.js`.
5. Finish collision and cleanup logic inside `Game.update()`.

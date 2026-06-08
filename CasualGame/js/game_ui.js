export default class GameUI {
    constructor(canvas) {
        this.stage = canvas.parentElement;

        this.hud = document.createElement("div");
        this.hud.className = "game-hud";

        this.nextLevelText = document.createElement("div");
        this.nextLevelText.className = "game-stat";

        this.scoreText = document.createElement("div");
        this.scoreText.className = "game-stat";

        this.hud.appendChild(this.nextLevelText);
        this.hud.appendChild(this.scoreText);

        this.panel = document.createElement("div");
        this.panel.className = "game-panel hidden";

        this.title = document.createElement("h1");
        this.title.className = "game-title";

        this.button = document.createElement("button");
        this.button.className = "game-button";
        this.button.type = "button";

        this.panel.appendChild(this.title);
        this.panel.appendChild(this.button);

        this.stage.appendChild(this.hud);
        this.stage.appendChild(this.panel);
    }

    updateGameInfo(score, nextLevelShots) {
        this.nextLevelText.textContent = `Next level in: ${parseInt(nextLevelShots)}`;
        this.scoreText.textContent = `Score ${score}`;
    }

    showButton(text, onClick) {
        this.button.textContent = text;
        this.button.onclick = onClick;
        this.panel.classList.remove("hidden");
    }

    showMessage(text) {
        this.title.textContent = text;
        this.panel.classList.remove("hidden");
    }

    hideMessage() {
        this.panel.classList.add("hidden");
        this.button.onclick = null;
    }
}

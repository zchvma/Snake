import { INITIAL_SPEED } from "./config.js"
import { startGame } from "./game.js"
import { renderGame } from "./board.js"
import { loadHighScores, updateHighScoresTable } from "./highscores.js"
import { setupControls } from "./controls.js"

document.addEventListener("DOMContentLoaded", () => {
  const State = {
    board: document.getElementById("game-board"),
    score: document.getElementById("score"),
    level: document.getElementById("level"),
    statusMessage: document.getElementById("status-message"),
    activeBonuses: document.getElementById("active-bonuses"),
    visibleGridOffset: { row: 0, col: 0 },
    direction: "right",
    nextDirection: "right",
    scoreCounter: 0,
    levelCounter: 1,
    gameSpeed: INITIAL_SPEED,
    gameInterval: null,
    isGameRunning: false,
    currentSkin: "default",
    isInverted: false,
    food: {},
    snake: [],
    walls: [],
    portals: [],
    bonuses: [],
    poisonZones: [],

    activeBonusEffects: {
      speedUp: { active: false, endTime: 0 },
      speedDown: { active: false, endTime: 0 },
      inversion: { active: false, endTime: 0 },
    },

    overlay: {
      container: document.getElementById("game-overlay"),
      title: document.getElementById("overlay-title"),
      message: document.getElementById("overlay-message"),
      startButton: document.getElementById("start-btn"),
    },

    ui: {
      skinSelect: document.getElementById("skin-select"),
      minimap: document.getElementById("minimap"),
    },

    highScores: {
      body: document.getElementById("highscores-body"),
      form: document.getElementById("name-form"),
      input: document.getElementById("player-name"),
      saveButton: document.getElementById("save-score-btn"),
    },

    controls: {
      up: document.getElementById("up-btn"),
      down: document.getElementById("down-btn"),
      left: document.getElementById("left-btn"),
      right: document.getElementById("right-btn"),
    },
  }

  setupControls(State)

  // Handle skin selection changes
  State.ui.skinSelect.addEventListener("change", () => {
    try {
      State.currentSkin = State.ui.skinSelect.value
      if (State.isGameRunning) {
        renderGame(State)
      }
    } catch (error) {
      console.error("Error handling skin selection change:", error)
    }
  })

  // Start button event listener
  State.overlay.startButton.addEventListener("click", startGame.bind(null, State))

  // Инициализация таблицы лучших результатов при загрузке страницы
  updateHighScoresTable(loadHighScores())
})

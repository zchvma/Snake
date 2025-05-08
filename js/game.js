import { INITIAL_SPEED, WALL_GENERATE_GROW_RATE } from "./config.js"
import * as highscores from "./highscores.js"
import * as board from "./board.js"
import { updateMinimap } from "./minimap.js"
import { generateWalls } from "./walls.js"
import { generatePortals } from "./portals.js"
import * as snake from "./snake.js"
import { generateFood } from "./food.js"
import { updateBonusEffects } from "./bonus.js"
import { generatePoisonZones } from "./poison.js"

const { loadHighScores, updateHighScoresTable, isHighScore, addHighScore, showNameForm, hideNameForm } = highscores

const { initializeBoard, updateViewportPosition, applyTheme, renderGame } = board

const { checkCollisions, findSafeSnakePosition, moveSnake } = snake

// Инициализирует игру
function initializeGame(GameState) {
  try {
    GameState.direction = "right"
    GameState.nextDirection = "right"
    GameState.scoreCounter = 0
    GameState.levelCounter = 1
    GameState.gameSpeed = INITIAL_SPEED
    GameState.isInverted = false
    GameState.walls = []
    GameState.portals = []
    GameState.bonuses = []
    GameState.poisonZones = []
    GameState.score.textContent = GameState.scoreCounter
    GameState.level.textContent = GameState.levelCounter
    GameState.statusMessage.textContent = "Игра началась! Удачи!"
    GameState.activeBonuses.innerHTML = ""

    initializeBoard(GameState)

    generateWalls(GameState, 2 + Math.ceil(WALL_GENERATE_GROW_RATE * GameState.levelCounter))
    generatePortals(GameState, 4)
    generatePoisonZones(GameState, 2)

    const safePosition = findSafeSnakePosition(GameState)

    GameState.snake = [
      { row: safePosition.row, col: safePosition.col },
      {
        row: safePosition.row,
        col: safePosition.col - 1,
      },
      { row: safePosition.row, col: safePosition.col - 2 },
    ]

    GameState.activeBonusEffects = {
      speedUp: { active: false, endTime: 0 },
      speedDown: { active: false, endTime: 0 },
      inversion: { active: false, endTime: 0 },
    }

    applyTheme(GameState)

    generateFood(GameState)

    renderGame(GameState)
    updateMinimap(GameState)
  } catch (error) {
    console.error("Ошибка при инициализации игры:", error)
  }
}

// Запускает игру
function startGame(GameState) {
  try {
    if (GameState.isGameRunning) {
      return
    }

    initializeGame(GameState)
    GameState.isGameRunning = true

    GameState.overlay.container.classList.add("hiding")
    setTimeout(() => {
      GameState.overlay.container.style.display = "none"
      GameState.overlay.container.classList.remove("hiding")
    }, 500)

    if (GameState.gameInterval) {
      clearInterval(GameState.gameInterval)
    }

    GameState.gameInterval = setInterval(() => {
      moveSnake(GameState)
      const gridExpanded = updateViewportPosition(GameState)
      checkCollisions(GameState)
      if (!gridExpanded) {
        renderGame(GameState)
        updateMinimap(GameState)
      }
      updateBonusEffects(GameState)
    }, GameState.gameSpeed)
  } catch (error) {
    console.error("Ошибка при запуске игры:", error)
  }
}

// Завершает игру
async function endGame(GameState, message) {
  try {
    if (GameState.gameInterval) {
      clearInterval(GameState.gameInterval)
      GameState.gameInterval = null
    }

    GameState.board.innerHTML = ""
    GameState.board.style.gridTemplateColumns = ""
    GameState.board.style.gridTemplateRows = ""
    GameState.isGameRunning = false

    const highScores = await loadHighScores()

    const isNewHighScore = isHighScore(playerName, GameState.scoreCounter, highScores)

    GameState.overlay.title.textContent = "Игра окончена"
    GameState.overlay.message.textContent = message + ` Итоговый счет: ${GameState.scoreCounter}`

    if (isNewHighScore) {
      showNameForm()

      GameState.highScores.saveButton.onclick = async () => {
        const playerName = GameState.highScores.input.value.trim() || "Игрок"
        const newScoreIndex = await addHighScore(playerName, GameState.scoreCounter, GameState.levelCounter)
        updateHighScoresTable(await loadHighScores(), newScoreIndex)
        hideNameForm()
      }
    } else {
      updateHighScoresTable(highScores)
      hideNameForm()
    }

    GameState.overlay.startButton.textContent = "Играть снова"
    GameState.overlay.container.style.display = "flex"
  } catch (error) {
    console.error("Ошибка при завершении игры:", error)
  }
}

export { initializeGame, startGame, endGame }

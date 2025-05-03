import {INITIAL_SPEED, WALL_GENERATE_GROW_RATE} from "./config.js";
import * as highscores from './highscores.js'
import * as board from './board.js'
import {updateMinimap} from './minimap.js'
import {generateWalls} from "./walls.js";
import {generatePortals} from "./portals.js";
import * as snake from "./snake.js";
import {generateFood} from "./food.js";
import {updateBonusEffects} from "./bonus.js";
import {generatePoisonZones} from "./poison.js";

const {
    loadHighScores,
    updateHighScoresTable,
    isHighScore,
    addHighScore,
    showNameForm,
    hideNameForm
} = highscores

const {
    initializeBoard,
    updateViewportPosition,
    applyTheme,
    renderGame
} = board

const {
    checkCollisions,
    findSafeSnakePosition,
    moveSnake
} = snake


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
        GameState.statusMessage.textContent = "Game started! Good luck!"
        GameState.activeBonuses.innerHTML = ""

        initializeBoard(GameState)

        generateWalls(GameState, 2 + Math.ceil(WALL_GENERATE_GROW_RATE * GameState.levelCounter))
        generatePortals(GameState, 4) // 4 portals (2 pairs)
        generatePoisonZones(GameState, 2) // 2 poison zones

        const safePosition = findSafeSnakePosition(GameState)

        // Reset snake to safe position
        GameState.snake = [
            {row: safePosition.row, col: safePosition.col},
            {
                row: safePosition.row,
                col: safePosition.col - 1,
            },
            {row: safePosition.row, col: safePosition.col - 2},
        ]

        // Reset active bonuses
        GameState.activeBonusEffects = {
            speedUp: {active: false, endTime: 0},
            speedDown: {active: false, endTime: 0},
            inversion: {active: false, endTime: 0},
        }

        // Apply theme
        applyTheme(GameState)

        // Generate food after other elements
        generateFood(GameState)

        renderGame(GameState)
        updateMinimap(GameState)
    } catch (error) {
        console.error("Error initializing game:", error)
    }
}

// Start the game
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

        // Start game loop
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
        console.error("Error starting game:", error)
    }
}

function endGame(GameState, message) {
    try {
        if (GameState.gameInterval) {
            clearInterval(GameState.gameInterval)
            GameState.gameInterval = null
        }

        GameState.isGameRunning = false

        // Загружаем текущие результаты
        const highScores = loadHighScores()

        // Проверяем, входит ли текущий результат в таблицу лучших
        const isNewHighScore = isHighScore(GameState.scoreCounter, highScores)

        GameState.overlay.title.textContent = "Game Over"
        GameState.overlay.message.textContent = message + ` Final score: ${GameState.scoreCounter}`

        if (isNewHighScore) {
            // Если это новый рекорд, показываем форму для ввода имени
            showNameForm()

            // Обработчик для кнопки сохранения
            GameState.highScores.saveButton.onclick = () => {
                const playerName = GameState.highScores.input.value.trim() || "Игрок"
                const newScoreIndex = addHighScore(playerName, GameState.scoreCounter, GameState.levelCounter)
                updateHighScoresTable(loadHighScores(), newScoreIndex)
                hideNameForm()
            }
        } else {
            // Если это не новый рекорд, просто обновляем таблицу
            updateHighScoresTable(highScores)
            hideNameForm()
        }

        GameState.overlay.startButton.textContent = "Play Again"
        GameState.overlay.container.style.display = "flex"
    } catch (error) {
        console.error("Error ending game:", error)
    }
}

export {initializeGame, startGame, endGame}
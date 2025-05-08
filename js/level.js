import { WALL_GENERATE_GROW_RATE } from "./config.js"
import { calculateBaseSpeed, updateGameInterval } from "./bonus.js"
import { generateWalls } from "./walls.js"
import { applyTheme } from "./board.js"

// Повышает уровень игры
function levelUp(gameState) {
  try {
    gameState.levelCounter++
    gameState.level.textContent = gameState.levelCounter

    gameState.board.style.transition = "transform 0.5s ease, filter 0.5s ease"
    gameState.board.style.transform = "scale(1.1)"
    gameState.board.style.filter = "brightness(1.5)"

    setTimeout(() => {
      gameState.board.style.transform = "scale(1)"
      gameState.board.style.filter = "brightness(1)"

      gameState.gameSpeed = calculateBaseSpeed(gameState)
      updateGameInterval(gameState)

      generateWalls(Math.ceil(WALL_GENERATE_GROW_RATE))

      applyTheme(gameState)
    }, 500)

    gameState.statusMessage.textContent = `Уровень ${gameState.levelCounter}!`
  } catch (error) {
    console.error("Ошибка при повышении уровня:", error)
  }
}

export { levelUp }

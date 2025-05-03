import { WALL_GENERATE_GROW_RATE } from "./config.js"
import { calculateBaseSpeed, updateGameInterval } from "./bonus.js"
import { generateWalls } from "./walls.js"
import { applyTheme } from "./board.js"

function levelUp(gameState) {
  try {
    gameState.levelCounter++
    gameState.level.textContent = gameState.levelCounter

    // Анимация перехода на новый уровень
    gameState.board.style.transition = "transform 0.5s ease, filter 0.5s ease"
    gameState.board.style.transform = "scale(1.1)"
    gameState.board.style.filter = "brightness(1.5)"

    setTimeout(() => {
      gameState.board.style.transform = "scale(1)"
      gameState.board.style.filter = "brightness(1)"

      // Increase difficulty
      gameState.gameSpeed = calculateBaseSpeed()
      updateGameInterval()

      // Add more walls
      generateWalls(Math.ceil(WALL_GENERATE_GROW_RATE))

      // Update theme
      applyTheme(gameState)
    }, 500)

    gameState.statusMessage.textContent = `Level ${gameState.levelCounter}!`
  } catch (error) {
    console.error("Error leveling up:", error)
  }
}

export { levelUp }

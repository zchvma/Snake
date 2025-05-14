import { MAX_GRID, WALL_GENERATE_GROW_RATE, MIN_WALLS, MAX_WALLS } from "./config.js"
import { getRandomInt, manhattanDistance } from "./utils.js"
import { updateMinimap } from "./minimap.js"
import { isPositionSafe } from "./utils.js"
import { isInSnakePath, wouldTrapSnake } from "./snake.js"
import { renderGame } from "./board.js"

function generateWalls(gameState, count) {
  try {
    for (let i = 0; i < count; i++) {
      let validPosition = false
      let wall = {}
      let attempts = 0
      const maxAttempts = 100

      while (!validPosition && attempts < maxAttempts) {
        wall = {
          row: getRandomInt(0, MAX_GRID.height - 1),
          col: getRandomInt(0, MAX_GRID.width - 1),
        }

        validPosition =
          isPositionSafe(gameState, wall) && !isInSnakePath(gameState, wall) && !wouldTrapSnake(gameState, [wall])
        attempts++
      }

      // Если мы не смогли найти валидную позицию после максимального количества попыток, пропускаем эту стену
      if (validPosition) {
        gameState.walls.push(wall)

        // Анимация появления стены
        setTimeout(() => {
          const wallCell = document.querySelector(`.cell[data-row="${wall.row}"][data-col="${wall.col}"]`)
          if (wallCell) {
            wallCell.classList.add("cell--wall")
            wallCell.style.transform = "scale(0)"
            setTimeout(() => {
              wallCell.style.transition = "transform 0.3s ease"
              wallCell.style.transform = "scale(1)"
            }, 10)
          }
        }, i * 50) // Последовательное появление стен
      }
    }
    updateMinimap(gameState) // Обновляем мини-карту после генерации стен
  } catch (error) {
    console.error("Ошибка при генерации стен:", error)
  }
}

function regenerateWalls(gameState) {
  try {
    // Анимация исчезновения старых стен
    gameState.walls.forEach((wall) => {
      const wallCell = document.querySelector(`.cell[data-row="${wall.row}"][data-col="${wall.col}"]`)
      if (wallCell) {
        wallCell.classList.add("destroying")
      }
    })

    // Удаляем старые стены после анимации
    setTimeout(() => {
      gameState.walls = []
      generateWalls(gameState, MIN_WALLS + Math.min(Math.ceil(WALL_GENERATE_GROW_RATE * Number(gameState.levelCounter))), MAX_WALLS)
    }, 300)
  } catch (error) {
    console.error("Ошибка при перегенерации стен:", error)
  }
}

function destroyNearbyWalls(gameState) {
  try {
    const { snake, walls } = gameState
    if (snake.length === 0) return

    const head = snake[0]
    const radius = 20

    // Разрушение стен
    walls.forEach((wall) => {
      const distance = manhattanDistance(wall, head)
      if (distance <= radius) {
        const wallCell = document.querySelector(`.cell[data-row="${wall.row}"][data-col="${wall.col}"]`)
        if (wallCell) {
          wallCell.classList.add("destroying")
        }
      }
    })

    // Удаляем стены
    setTimeout(() => {
      gameState.walls = walls.filter((wall) => {
        const distance = manhattanDistance(wall, head)
        return distance > radius
      })

      gameState.statusMessage.textContent = "Активирован разрушитель стен!"
      updateMinimap(gameState) // Обновляем мини-карту после уничтожения стен
      renderGame(gameState) // Перерисовываем игру после удаления стен
    }, 300)
  } catch (error) {
    console.error("Ошибка при уничтожении стен:", error)
  }
}

export { generateWalls, regenerateWalls, destroyNearbyWalls }

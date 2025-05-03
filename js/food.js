import { MAX_GRID } from "./config.js"
import { getRandomInt, positionsEqual, isPositionSafe } from "./utils.js"
import { updateMinimap } from "./minimap.js"
import { isInSnakePath } from "./snake.js"

// Генерирует еду на игровом поле
function generateFood(gameState) {
  try {
    let validPosition = false
    let newFood = {}
    let attempts = 0
    const maxAttempts = 100

    while (!validPosition && attempts < maxAttempts) {
      newFood = {
        row: getRandomInt(0, MAX_GRID.height - 1),
        col: getRandomInt(0, MAX_GRID.width - 1),
      }

      validPosition = isPositionSafe(gameState, newFood) && !isInSnakePath(gameState, newFood)
      attempts++
    }

    if (!validPosition) {
      attempts = 0
      while (!validPosition && attempts < maxAttempts) {
        newFood = {
          row: getRandomInt(0, MAX_GRID.height - 1),
          col: getRandomInt(0, MAX_GRID.width - 1),
        }

        validPosition = isPositionSafe(gameState, newFood)
        attempts++
      }
    }

    if (!validPosition) {
      for (let row = 0; row < MAX_GRID.height; row++) {
        for (let col = 0; col < MAX_GRID.width; col++) {
          const pos = { row, col }
          let onSnake = false

          for (const segment of gameState.snake) {
            if (positionsEqual(segment, pos)) {
              onSnake = true
              break
            }
          }

          if (!onSnake) {
            newFood = pos
            validPosition = true
            break
          }
        }
        if (validPosition) break
      }
    }

    gameState.food = newFood

    setTimeout(() => {
      const foodCell = document.querySelector(
        `.cell[data-row="${gameState.food.row}"][data-col="${gameState.food.col}"]`,
      )
      if (foodCell) {
        foodCell.classList.add("cell--food")
        foodCell.style.transform = "scale(0)"
        setTimeout(() => {
          foodCell.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          foodCell.style.transform = "scale(1)"
        }, 10)
      }
    }, 100)

    updateMinimap(gameState)
  } catch (error) {
    console.error("Ошибка при генерации еды:", error)
  }
}

export { generateFood }

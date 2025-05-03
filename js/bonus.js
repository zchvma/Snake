import {
  BONUS_DURATION,
  INITIAL_SPEED,
  MAX_GRID,
  MAX_SPEED,
  MIN_SPEED,
  SPEED_DOWN_BONUS_DURATION_TIME,
  SPEED_UP_BONUS_DURATION_TIME,
} from "./config.js"
import { getRandomInt, isPositionSafe } from "./utils.js"
import { updateMinimap } from "./minimap.js"
import { renderGame, updateViewportPosition } from "./board.js"
import { isInSnakePath, moveSnake, checkCollisions } from "./snake.js"
import { destroyNearbyWalls } from "./walls.js"

function generateBonus(gameState) {
  try {
    const bonusTypes = ["speedUp", "speedDown", "destroyer", "inversion"]
    const randomType = bonusTypes[Math.floor(Math.random() * bonusTypes.length)]

    let validPosition = false
    let bonus = {}
    let attempts = 0
    const maxAttempts = 100

    while (!validPosition && attempts < maxAttempts) {
      bonus = {
        row: getRandomInt(0, MAX_GRID.height - 1),
        col: getRandomInt(0, MAX_GRID.width - 1),
        type: randomType,
      }

      validPosition = isPositionSafe(gameState, bonus) && !isInSnakePath(gameState, bonus)
      attempts++
    }

    // Если мы не смогли найти валидную позицию после максимального количества попыток, пропускаем этот бонус
    if (validPosition) {
      gameState.bonuses.push(bonus)

      // Анимация появления бонуса
      setTimeout(() => {
        const bonusCell = document.querySelector(`.cell[data-row="${bonus.row}"][data-col="${bonus.col}"]`)
        if (bonusCell) {
          bonusCell.classList.add(`cell--${bonus.type}`)
          bonusCell.style.transform = "scale(0)"
          setTimeout(() => {
            bonusCell.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            bonusCell.style.transform = "scale(1)"
          }, 10)
        }
      }, 100)

      // Удаляем бонус через некоторое время, если он не был собран
      setTimeout(() => {
        try {
          const index = gameState.bonuses.findIndex(
            (b) => b.row === bonus.row && b.col === bonus.col && b.type === bonus.type,
          )

          if (index !== -1) {
            // Анимация исчезновения бонуса
            const bonusCell = document.querySelector(`.cell[data-row="${bonus.row}"][data-col="${bonus.col}"]`)
            if (bonusCell) {
              bonusCell.style.transition = "transform 0.3s ease, opacity 0.3s ease"
              bonusCell.style.transform = "scale(0)"
              bonusCell.style.opacity = "0"
            }

            // Удаляем бонус после анимации
            setTimeout(() => {
              gameState.bonuses.splice(index, 1)
              updateMinimap(gameState) // Обновляем мини-карту после удаления бонуса
              renderGame(gameState) // Перерисовываем игру после удаления бонуса
            }, 300)
          }
        } catch (error) {
          console.error("Ошибка в таймауте бонуса:", error)
        }
      }, 10000)
    }
  } catch (error) {
    console.error("Ошибка при генерации бонуса:", error)
  }
}

function applyBonus(gameState, type) {
  try {
    const currentTime = Date.now()

    switch (type) {
      case "speedUp":
        gameState.gameSpeed = Math.max(gameState.gameSpeed - 50, MAX_SPEED)
        gameState.activeBonusEffects.speedUp = {
          active: true,
          endTime: currentTime + SPEED_UP_BONUS_DURATION_TIME,
        }
        updateGameInterval(gameState)
        addBonusIndicator(gameState, "Speed Up", "game__bonus-indicator--speed-up")
        break

      case "speedDown":
        gameState.gameSpeed = Math.min(gameState.gameSpeed + 50, MIN_SPEED)
        gameState.activeBonusEffects.speedDown = {
          active: true,
          endTime: currentTime + SPEED_DOWN_BONUS_DURATION_TIME,
        }
        updateGameInterval(gameState)
        addBonusIndicator(gameState, "Speed Down", "game__bonus-indicator--speed-down")
        break

      case "destroyer":
        destroyNearbyWalls(gameState)
        break

      case "inversion":
        gameState.isInverted = !gameState.isInverted
        gameState.activeBonusEffects.inversion = {
          active: true,
          endTime: currentTime + BONUS_DURATION,
        }
        addBonusIndicator(gameState, "Controls Inverted", "game__bonus-indicator--inversion")
        break
    }

    gameState.statusMessage.textContent = `Активирован бонус ${type}!`
  } catch (error) {
    console.error("Ошибка при применении бонуса:", error)
  }
}

function updateBonusEffects(gameState) {
  try {
    const currentTime = Date.now()

    // Проверяем бонус ускорения
    if (gameState.activeBonusEffects.speedUp.active && currentTime > gameState.activeBonusEffects.speedUp.endTime) {
      gameState.activeBonusEffects.speedUp.active = false
      gameState.gameSpeed = calculateBaseSpeed(gameState)
      updateGameInterval(gameState)
      removeBonusIndicator(gameState, "Speed Up")
    }

    // Проверяем бонус замедления
    if (gameState.activeBonusEffects.speedDown.active && currentTime > gameState.activeBonusEffects.speedDown.endTime) {
      gameState.activeBonusEffects.speedDown.active = false
      gameState.gameSpeed = calculateBaseSpeed(gameState)
      updateGameInterval(gameState)
      removeBonusIndicator(gameState, "Speed Down")
    }

    // Проверяем бонус инверсии
    if (gameState.activeBonusEffects.inversion.active && currentTime > gameState.activeBonusEffects.inversion.endTime) {
      gameState.activeBonusEffects.inversion.active = false
      gameState.isInverted = false
      removeBonusIndicator(gameState, "Controls Inverted")
    }
  } catch (error) {
    console.error("Ошибка при обновлении эффектов бонусов:", error)
  }
}

function calculateBaseSpeed(gameState) {
  return Math.max(INITIAL_SPEED - (gameState.levelCounter - 1) * 10, MAX_SPEED)
}

function updateGameInterval(gameState) {
  try {
    if (gameState.gameInterval) {
      clearInterval(gameState.gameInterval)
    }

    gameState.gameInterval = setInterval(() => {
      moveSnake(gameState)
      const gridExpanded = updateViewportPosition(gameState)
      checkCollisions(gameState)
      if (!gridExpanded) {
        renderGame(gameState)
        updateMinimap(gameState)
      }
      updateBonusEffects(gameState)
    }, gameState.gameSpeed)
  } catch (error) {
    console.error("Ошибка при обновлении интервала игры:", error)
  }
}

function addBonusIndicator(gameState, text, className) {
  try {
    // Удаляем существующий индикатор с таким же текстом, если он существует
    removeBonusIndicator(gameState, text)

    const indicator = document.createElement("div")
    indicator.classList.add("game__bonus-indicator")
    indicator.classList.add(className)
    indicator.textContent = text
    indicator.dataset.bonusName = text

    // Добавляем анимацию появления
    indicator.style.opacity = "0"
    indicator.style.transform = "translateY(10px)"

    gameState.activeBonuses.appendChild(indicator)

    // Запускаем анимацию появления
    setTimeout(() => {
      indicator.style.transition = "opacity 0.3s ease, transform 0.3s ease"
      indicator.style.opacity = "1"
      indicator.style.transform = "translateY(0)"
    }, 10)
  } catch (error) {
    console.error("Ошибка при добавлении индикатора бонуса:", error)
  }
}

function removeBonusIndicator(gameState, text) {
  try {
    const indicators = gameState.activeBonuses.querySelectorAll(".game__bonus-indicator")
    indicators.forEach((indicator) => {
      if (indicator.dataset.bonusName === text) {
        // Добавляем анимацию исчезновения
        indicator.classList.add("removing")

        // Удаляем элемент после завершения анимации
        setTimeout(() => {
          indicator.remove()
        }, 300)
      }
    })
  } catch (error) {
    console.error("Ошибка при удалении индикатора бонуса:", error)
  }
}

export { generateBonus, applyBonus, updateBonusEffects, calculateBaseSpeed, updateGameInterval }

import { VISIBLE_GRID, BASE_GRID_SIZE, EXPANSION_THRESHOLD, THEMES, MAX_GRID } from "./config.js"
import { updateMinimap } from "./minimap.js"

// Инициализирует игровое поле
function initializeBoard(gameState) {
  try {
    gameState.board.innerHTML = ""
    gameState.visibleGridOffset = { row: 0, col: 0 }
    renderGrid(gameState)
    initializeMinimap(gameState)
  } catch (error) {
    console.error("Ошибка при инициализации игрового поля:", error)
  }
}

// Инициализирует мини-карту
function initializeMinimap(gameState) {
  try {
    gameState.ui.minimap.innerHTML = ""
    gameState.ui.minimap.style.position = "relative"
  } catch (error) {
    console.error("Ошибка при инициализации мини-карты:", error)
  }
}

// Отрисовывает сетку игрового поля
function renderGrid(gameState) {
  try {
    const { board, visibleGridOffset } = gameState

    board.innerHTML = ""
    board.style.gridTemplateColumns = `repeat(${VISIBLE_GRID.width}, ${BASE_GRID_SIZE}px)`
    board.style.gridTemplateRows = `repeat(${VISIBLE_GRID.height}, ${BASE_GRID_SIZE}px)`

    for (let row = 0; row < VISIBLE_GRID.height; row++) {
      for (let col = 0; col < VISIBLE_GRID.width; col++) {
        const cell = document.createElement("div")
        cell.classList.add("cell")
        cell.dataset.row = (row + visibleGridOffset.row).toString()
        cell.dataset.col = (col + visibleGridOffset.col).toString()
        board.appendChild(cell)
      }
    }
  } catch (error) {
    console.error("Ошибка при отрисовке сетки:", error)
  }
}

// Обновляет позицию видимой области игрового поля
function updateViewportPosition(gameState) {
  try {
    const { snake, visibleGridOffset } = gameState

    if (snake.length === 0) return false

    const head = snake[0]
    let needsUpdate = false
    const newVisibleOffset = { ...visibleGridOffset }

    if (head.row - visibleGridOffset.row + EXPANSION_THRESHOLD >= VISIBLE_GRID.height) {
      newVisibleOffset.row = Math.min(
        head.row - Math.floor(VISIBLE_GRID.height / 2),
        MAX_GRID.height - VISIBLE_GRID.height,
      )
      needsUpdate = true
    }

    if (head.col - visibleGridOffset.col + EXPANSION_THRESHOLD >= VISIBLE_GRID.width) {
      newVisibleOffset.col = Math.min(
        head.col - Math.floor(VISIBLE_GRID.width / 2),
        MAX_GRID.width - VISIBLE_GRID.width,
      )
      needsUpdate = true
    }

    if (head.row - visibleGridOffset.row - EXPANSION_THRESHOLD <= 0 && visibleGridOffset.row > 0) {
      newVisibleOffset.row = Math.max(0, head.row - Math.floor(VISIBLE_GRID.height / 2))
      needsUpdate = true
    }

    if (head.col - visibleGridOffset.col - EXPANSION_THRESHOLD <= 0 && visibleGridOffset.col > 0) {
      newVisibleOffset.col = Math.max(0, head.col - Math.floor(VISIBLE_GRID.width / 2))
      needsUpdate = true
    }

    if (needsUpdate) {
      const viewportElement = document.querySelector(".game__minimap-viewport")
      if (viewportElement) {
        viewportElement.style.transition = "left 0.3s ease, top 0.3s ease"
      }

      gameState.visibleGridOffset = newVisibleOffset
      renderGrid(gameState)
      renderGame(gameState)
      updateMinimap(gameState)
      return true
    }

    return false
  } catch (error) {
    console.error("Ошибка при обновлении позиции видимой сетки:", error)
    return false
  }
}

// Применяет тему к игровому полю в зависимости от уровня
function applyTheme(gameState) {
  try {
    const { board, levelCounter } = gameState

    THEMES.forEach((theme) => {
      board.classList.remove(theme.name)
    })

    let currentTheme = THEMES[0]
    for (let i = THEMES.length - 1; i >= 0; i--) {
      if (levelCounter >= THEMES[i].minLevel) {
        currentTheme = THEMES[i]
        break
      }
    }

    board.style.transition = "background 0.5s ease"
    board.classList.add(currentTheme.name)
  } catch (error) {
    console.error("Ошибка при применении темы:", error)
  }
}

// Отрисовывает все элементы игры
function renderGame(gameState) {
  try {
    const { snake, food, walls, portals, bonuses, poisonZones, visibleGridOffset, currentSkin, direction } = gameState

    const cells = document.querySelectorAll(".cell")
    cells.forEach((cell) => {
      const classList = Array.from(cell.classList)
      classList.forEach((className) => {
        if (className !== "cell") {
          cell.classList.remove(className)
        }
      })
    })

    function renderElement(element, className) {
      if (
        element.row >= visibleGridOffset.row &&
        element.row < visibleGridOffset.row + VISIBLE_GRID.height &&
        element.col >= visibleGridOffset.col &&
        element.col < visibleGridOffset.col + VISIBLE_GRID.width
      ) {
        const cell = document.querySelector(`.cell[data-row="${element.row}"][data-col="${element.col}"]`)
        if (cell) {
          cell.classList.add(className)
        }
        return cell
      }
      return null
    }

    snake.forEach((segment, index) => {
      const cell = renderElement(segment, "cell--snake")
      if (cell) {
        cell.classList.add("snake-segment")

        cell.classList.add(`cell--${currentSkin}`)
        if (index === 0) {
          cell.classList.add("cell--snake-head")
        }
      }
    })

    if (food && food.row !== undefined && food.col !== undefined) {
      renderElement(food, "cell--food")
    }

    walls.forEach((wall) => renderElement(wall, "cell--wall"))

    portals.forEach((portal) => {
      renderElement(portal, `cell--portal-${portal.pairId}`)
    })

    bonuses.forEach((bonus) => {
      renderElement(bonus, `cell--${bonus.type}`)
    })

    poisonZones.forEach((zone) => {
      zone.cells.forEach((cell) => {
        renderElement(cell, "cell--poison")
      })
    })
  } catch (error) {
    console.error("Ошибка при отрисовке игры:", error)
  }
}

export { initializeBoard, initializeMinimap, renderGrid, updateViewportPosition, applyTheme, renderGame }

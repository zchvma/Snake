import { MAX_GRID, VISIBLE_GRID } from "./config.js"

// Обновляет мини-карту
function updateMinimap(gameState) {
  try {
    const { ui, visibleGridOffset, snake, food, walls, portals, poisonZones } = gameState
    const minimap = ui.minimap
    minimap.innerHTML = ""

    const minimapWidth = minimap.offsetWidth
    const minimapHeight = minimap.offsetHeight
    const scaleX = minimapWidth / MAX_GRID.width
    const scaleY = minimapHeight / MAX_GRID.height

    // Создает элемент на мини-карте
    function createMinimapElement(className, position, size = { width: scaleX, height: scaleY }) {
      const element = document.createElement("div")
      element.classList.add(className)
      element.style.left = `${position.col * scaleX}px`
      element.style.top = `${position.row * scaleY}px`
      element.style.width = `${size.width}px`
      element.style.height = `${size.height}px`
      minimap.appendChild(element)
      return element
    }

    createMinimapElement(
      "game__minimap-viewport",
      { row: visibleGridOffset.row, col: visibleGridOffset.col },
      { width: VISIBLE_GRID.width * scaleX, height: VISIBLE_GRID.height * scaleY },
    )

    createMinimapElement(
      "game__minimap-boundary",
      { row: 0, col: 0 },
      { width: MAX_GRID.width * scaleX, height: MAX_GRID.height * scaleY },
    )

    snake.forEach((segment, index) => {
      if (index === 0) {
        createMinimapElement("game__minimap-head", segment, { width: scaleX * 1.5, height: scaleY * 1.5 })
      } else {
        createMinimapElement("game__minimap-snake", segment)
      }
    })

    if (food && food.row !== undefined && food.col !== undefined) {
      createMinimapElement("game__minimap-food", food)
    }

    walls.forEach((wall) => createMinimapElement("game__minimap-wall", wall))

    portals.forEach((portal) => createMinimapElement(`game__minimap-portal-${portal.pairId}`, portal))

    poisonZones.forEach((zone) => {
      zone.cells.forEach((cell) => createMinimapElement("game__minimap-poison", cell))
    })
  } catch (error) {
    console.error("Ошибка при обновлении мини-карты:", error)
  }
}

export { updateMinimap }

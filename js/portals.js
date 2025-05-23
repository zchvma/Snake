import { MAX_GRID, MAX_PORTAL_PAIRS } from "./config.js"
import { getRandomInt, positionsEqual, isPositionSafe } from "./utils.js"
import { updateMinimap } from "./minimap.js"
import { isInSnakePath } from "./snake.js"

// Генерирует порталы на игровом поле
function generatePortals(gameState, count = 4) {
  try {
    gameState.portals = []

    count = Math.min(count - (count % 2), MAX_PORTAL_PAIRS * 2)

    for (let pair = 0; pair < count / 2; pair++) {
      for (let i = 0; i < 2; i++) {
        let validPosition = false
        let portal = {}
        let attempts = 0
        const maxAttempts = 100

        while (!validPosition && attempts < maxAttempts) {
          portal = {
            row: getRandomInt(0, MAX_GRID.height - 1),
            col: getRandomInt(0, MAX_GRID.width - 1),
            pairId: pair + 1,
          }

          validPosition =
            isPositionSafe(gameState, portal) &&
            !isInSnakePath(gameState, portal) &&
            !gameState.portals.some((p) => positionsEqual(p, portal))
          attempts++
        }

        if (validPosition) {
          gameState.portals.push(portal)

          setTimeout(
            () => {
              const portalCell = document.querySelector(`.cell[data-row="${portal.row}"][data-col="${portal.col}"]`)
              if (portalCell) {
                portalCell.classList.add(`cell--portal-${portal.pairId}`)
                portalCell.style.transform = "scale(0) rotate(180deg)"
                setTimeout(() => {
                  portalCell.style.transition = "transform 0.5s ease"
                  portalCell.style.transform = "scale(1) rotate(0deg)"
                }, 10)
              }
            },
            (pair * 2 + i) * 100,
          )
        }
      }
    }

    updateMinimap(gameState)
  } catch (error) {
    console.error("Ошибка при генерации порталов:", error)
  }
}

export { generatePortals }

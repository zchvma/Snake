import { MAX_GRID } from "./config.js"
import { getRandomInt, isPositionSafe } from "./utils.js"
import { updateMinimap } from "./minimap.js"
import { isInSnakePath } from "./snake.js"
import { drawLine, removeDuplicateCells } from "./utils.js"

// Генерирует зоны отравления на игровом поле
function generatePoisonZones(gameState, zoneCount = 2) {
  try {
    gameState.poisonZones = []

    const totalZones = zoneCount + Math.floor(gameState.levelCounter / 3)

    for (let z = 0; z < totalZones; z++) {
      const shapeType = Math.floor(Math.random() * 5)
      let zoneCells = []

      let validPosition = false
      let attempts = 0
      const maxAttempts = 50

      while (!validPosition && attempts < maxAttempts) {
        const centerRow = getRandomInt(5, MAX_GRID.height - 10)
        const centerCol = getRandomInt(5, MAX_GRID.width - 10)

        zoneCells = []

        switch (shapeType) {
          case 0: // Форма круга
            const radius = 3 + Math.floor(Math.random() * 3)
            for (let r = -radius; r <= radius; r++) {
              for (let c = -radius; c <= radius; c++) {
                if (r * r + c * c <= radius * radius) {
                  zoneCells.push({
                    row: centerRow + r,
                    col: centerCol + c,
                  })
                }
              }
            }
            break

          case 1: // Аморфная форма
            const blobSize = 3 + Math.floor(Math.random() * 3)
            for (let r = 0; r < blobSize; r++) {
              for (let c = 0; c < blobSize; c++) {
                zoneCells.push({
                  row: centerRow + r,
                  col: centerCol + c,
                })
              }
            }

            const extensions = 3 + Math.floor(Math.random() * 5)
            for (let e = 0; e < extensions; e++) {
              const direction = Math.floor(Math.random() * 4)
              const length = 2 + Math.floor(Math.random() * 3)
              const startCell = zoneCells[Math.floor(Math.random() * zoneCells.length)]

              for (let i = 1; i <= length; i++) {
                let newRow = startCell.row
                let newCol = startCell.col

                switch (direction) {
                  case 0:
                    newRow -= i
                    break
                  case 1:
                    newCol += i
                    break
                  case 2:
                    newRow += i
                    break
                  case 3:
                    newCol -= i
                    break
                }

                if (newRow >= 0 && newRow < gameState.height && newCol >= 0 && newCol < gameState.width) {
                  zoneCells.push({ row: newRow, col: newCol })
                }
              }
            }
            break

          case 2: // Форма полумесяца
            const outerRadius = 5 + Math.floor(Math.random() * 2)
            const innerRadius = 3 + Math.floor(Math.random() * 2)
            const offset = 2 + Math.floor(Math.random() * 2)

            for (let r = -outerRadius; r <= outerRadius; r++) {
              for (let c = -outerRadius; c <= outerRadius; c++) {
                const distOuter = r * r + c * c
                const distInner = (r - offset) * (r - offset) + c * c

                if (distOuter <= outerRadius * outerRadius && distInner > innerRadius * innerRadius) {
                  zoneCells.push({
                    row: centerRow + r,
                    col: centerCol + c,
                  })
                }
              }
            }
            break

          case 3: // Форма звезды
            const starPoints = 5 + Math.floor(Math.random() * 3)
            const innerRad = 2
            const outerRad = 5

            for (let angle = 0; angle < 360; angle += 360 / starPoints) {
              const rad = (angle * Math.PI) / 180

              const outerX = Math.round(centerCol + outerRad * Math.cos(rad))
              const outerY = Math.round(centerRow + outerRad * Math.sin(rad))

              const innerAngle = rad + Math.PI / starPoints
              const innerX = Math.round(centerCol + innerRad * Math.cos(innerAngle))
              const innerY = Math.round(centerRow + innerRad * Math.sin(innerAngle))

              drawLine(centerRow, centerCol, outerY, outerX, zoneCells)
              drawLine(innerY, innerX, outerY, outerX, zoneCells)
            }
            break

          case 4: // Случайно разбросанные точки
            const dotCount = 15 + Math.floor(Math.random() * 10)
            const spread = 7

            for (let i = 0; i < dotCount; i++) {
              const offsetRow = Math.floor(Math.random() * spread * 2) - spread
              const offsetCol = Math.floor(Math.random() * spread * 2) - spread

              zoneCells.push({
                row: centerRow + offsetRow,
                col: centerCol + offsetCol,
              })
            }
            break
        }

        zoneCells = removeDuplicateCells(zoneCells)

        validPosition = true
        for (const cell of zoneCells) {
          if (
            cell.row < 0 ||
            cell.row >= MAX_GRID.height ||
            cell.col < 0 ||
            cell.col >= MAX_GRID.width ||
            !isPositionSafe(gameState, cell) ||
            isInSnakePath(gameState, cell)
          ) {
            validPosition = false
            break
          }
        }

        attempts++
      }

      if (validPosition && zoneCells.length > 0) {
        gameState.poisonZones.push({ cells: zoneCells })

        zoneCells.forEach((cell, index) => {
          setTimeout(() => {
            const poisonCell = document.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`)
            if (poisonCell) {
              poisonCell.classList.add("cell--poison")
              poisonCell.style.opacity = "0"
              setTimeout(() => {
                poisonCell.style.transition = "opacity 0.3s ease"
                poisonCell.style.opacity = "0.7"
              }, 10)
            }
          }, index * 10)
        })
      }
    }

    if (gameState.poisonZones.length === 0) {
      const zoneSize = 3
      const zoneCenter = {
        row: getRandomInt(0, MAX_GRID.height - zoneSize),
        col: getRandomInt(0, MAX_GRID.width - zoneSize),
      }

      const zoneCells = []
      for (let r = 0; r < zoneSize; r++) {
        for (let c = 0; c < zoneSize; c++) {
          zoneCells.push({
            row: zoneCenter.row + r,
            col: zoneCenter.col + c,
          })
        }
      }

      gameState.poisonZones.push({ cells: zoneCells })

      zoneCells.forEach((cell, index) => {
        setTimeout(() => {
          const poisonCell = document.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`)
          if (poisonCell) {
            poisonCell.classList.add("cell--poison")
            poisonCell.style.opacity = "0"
            setTimeout(() => {
              poisonCell.style.transition = "opacity 0.3s ease"
              poisonCell.style.opacity = "0.7"
            }, 10)
          }
        }, index * 10)
      })
    }

    updateMinimap(gameState)
  } catch (error) {
    console.error("Ошибка при генерации зон отравления:", error)
  }
}

export { generatePoisonZones }

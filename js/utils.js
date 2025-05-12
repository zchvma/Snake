import { MAX_GRID } from "./config.js"

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function positionsEqual(pos1, pos2) {
  return pos1.row === pos2.row && pos1.col === pos2.col
}

function manhattanDistance(pos1, pos2) {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col)
}

function wrapPosition(position) {
  let { row, col } = position

  if (row < 0) row = MAX_GRID.height - 1
  if (row >= MAX_GRID.height) row = 0
  if (col < 0) col = MAX_GRID.width - 1
  if (col >= MAX_GRID.width) col = 0

  return { row, col }
}

function drawLine(y1, x1, y2, x2, cells) {
  try {
    const dx = Math.abs(x2 - x1)
    const dy = Math.abs(y2 - y1)
    const sx = x1 < x2 ? 1 : -1
    const sy = y1 < y2 ? 1 : -1
    let err = dx - dy

    while (true) {
      cells.push({ row: y1, col: x1 })

      if (x1 === x2 && y1 === y2) break

      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x1 += sx
      }
      if (e2 < dx) {
        err += dx
        y1 += sy
      }
    }
  } catch (error) {
    console.error("Ошибка при рисовании линии:", error)
  }
}

function removeDuplicateCells(cells) {
  try {
    const seen = new Set()
    return cells.filter((cell) => {
      const key = `${cell.row},${cell.col}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error("Ошибка при удалении дубликатов ячеек:", error)
    return cells
  }
}

function isPositionSafe(GameState, position) {
  // Check if position is out of bounds
  if (position.row < 0 || position.row >= MAX_GRID.height || position.col < 0 || position.col >= MAX_GRID.width) {
    return false
  }

  // Check collision with game elements using a single loop
  const gameElements = [
    ...GameState.walls,
    ...GameState.portals,
    ...GameState.snake,
    ...(GameState.food && GameState.food.row !== undefined ? [GameState.food] : []),
    ...GameState.bonuses,
  ]

  for (const element of gameElements) {
    if (positionsEqual(element, position)) {
      return false
    }
  }

  // Check poison zones
  for (const zone of GameState.poisonZones) {
    for (const cell of zone.cells) {
      if (positionsEqual(cell, position)) {
        return false
      }
    }
  }

  return true
}

export { getRandomInt, positionsEqual, manhattanDistance, wrapPosition, drawLine, removeDuplicateCells }
export { isPositionSafe }

import { MAX_GRID, POINTS_PER_LEVEL, POINTS_PER_REGENERATE, SAFE_DISTANCE } from "./config.js"
import { wrapPosition, positionsEqual, getRandomInt, isPositionSafe } from "./utils.js"
import { applyBonus, generateBonus } from "./bonus.js"
import { generatePoisonZones } from "./poison.js"
import { generatePortals } from "./portals.js"
import { regenerateWalls } from "./walls.js"
import { generateFood } from "./food.js"
import { levelUp } from "./level.js"
import { endGame } from "./game.js"

// Перемещает змейку
function moveSnake(gameState) {
  try {
    const { snake, nextDirection, portals, food } = gameState

    if (snake.length === 0) return

    gameState.direction = nextDirection

    const head = { ...snake[0] }

    switch (gameState.direction) {
      case "up":
        head.row--
        break
      case "down":
        head.row++
        break
      case "left":
        head.col--
        break
      case "right":
        head.col++
        break
    }

    const wrappedHead = wrapPosition(head)
    head.row = wrappedHead.row
    head.col = wrappedHead.col

    const portalIndex = portals.findIndex((portal) => positionsEqual(portal, head))

    if (portalIndex !== -1) {
      const portalCell = document.querySelector(
        `.cell[data-row="${portals[portalIndex].row}"][data-col="${portals[portalIndex].col}"]`,
      )
      if (portalCell) {
        portalCell.classList.add("cell--portal-active")
        setTimeout(() => {
          portalCell.classList.remove("cell--portal-active")
        }, 300)
      }

      const portalMinimap = document.querySelector(`.game__minimap-portal-${portals[portalIndex].pairId}`)
      if (portalMinimap) {
        portalMinimap.classList.add("game__minimap-portal-active")
        setTimeout(() => {
          portalMinimap.classList.remove("game__minimap-portal-active")
        }, 300)
      }

      const currentPairId = portals[portalIndex].pairId
      const otherPortalIndex = portals.findIndex(
        (portal, index) => index !== portalIndex && portal.pairId === currentPairId,
      )

      if (otherPortalIndex !== -1) {
        const otherPortalCell = document.querySelector(
          `.cell[data-row="${portals[otherPortalIndex].row}"][data-col="${portals[otherPortalIndex].col}"]`,
        )
        if (otherPortalCell) {
          otherPortalCell.classList.add("cell--portal-active")
          setTimeout(() => {
            otherPortalCell.classList.remove("cell--portal-active")
          }, 300)
        }

        const otherPortalMinimap = document.querySelector(`.game__minimap-portal-${portals[otherPortalIndex].pairId}`)
        if (otherPortalMinimap) {
          otherPortalMinimap.classList.add("game__minimap-portal-active")
          setTimeout(() => {
            otherPortalMinimap.classList.remove("game__minimap-portal-active")
          }, 300)
        }

        head.row = portals[otherPortalIndex].row
        head.col = portals[otherPortalIndex].col

        switch (gameState.direction) {
          case "up":
            head.row--
            break
          case "down":
            head.row++
            break
          case "left":
            head.col--
            break
          case "right":
            head.col++
            break
        }

        const wrappedHeadAfterTeleport = wrapPosition(head)
        head.row = wrappedHeadAfterTeleport.row
        head.col = wrappedHeadAfterTeleport.col
      }
    }

    snake.unshift(head)

    if (food && positionsEqual(head, food)) {
      const foodCell = document.querySelector(`.cell[data-row="${food.row}"][data-col="${food.col}"]`)
      if (foodCell) {
        foodCell.classList.add("food-eaten")
      }

      gameState.scoreCounter += 10
      gameState.score.textContent = gameState.scoreCounter

      if (gameState.scoreCounter >= gameState.levelCounter * POINTS_PER_LEVEL) {
        levelUp(gameState)
      }

      for (let i = 0; i < 6; i++) {
        generateFood(gameState)
      }

      if (gameState.bonuses.length < 10) {
        generateBonus(gameState)
        if (Math.random() < 0.6) {
          generateBonus(gameState)
        }
        if (Math.random() > 0.4) {
          generateBonus(gameState)
        }
      }

      if (gameState.scoreCounter % POINTS_PER_REGENERATE === 0) {
        regenerateWalls(gameState)
        generatePortals(gameState, 4)
        generatePoisonZones(gameState, 6)
      }
    } else {
      snake.pop()
    }
  } catch (error) {
    console.error("Ошибка при перемещении змейки:", error)
  }
}

// Проверяет столкновения змейки
function checkCollisions(gameState) {
  try {
    const { snake, walls, bonuses, poisonZones } = gameState

    if (snake.length === 0) return

    const head = snake[0]

    for (let i = 1; i < snake.length; i++) {
      if (positionsEqual(snake[i], head)) {
        endGame(gameState, "Вы столкнулись с собой!").then();
        return;
      }
    }

    for (const wall of walls) {
      if (positionsEqual(wall, head)) {
        const wallCell = document.querySelector(`.cell[data-row="${wall.row}"][data-col="${wall.col}"]`)
        if (wallCell) {
          wallCell.classList.add("wall-collision")
        }

        endGame(gameState, "Вы врезались в стену!").then();
        return;
      }
    }

    for (let i = 0; i < bonuses.length; i++) {
      const bonus = bonuses[i]
      if (positionsEqual(bonus, head)) {
        const bonusCell = document.querySelector(`.cell[data-row="${bonus.row}"][data-col="${bonus.col}"]`)
        if (bonusCell) {
          bonusCell.classList.add("bonus-collected")
        }

        applyBonus(gameState, bonus.type)
        bonuses.splice(i, 1)
        break
      }
    }

    for (const zone of poisonZones) {
      let allInZone = true
      for (const segment of snake) {
        let inCurrentZone = false
        for (const cell of zone.cells) {
          if (positionsEqual(cell, segment)) {
            inCurrentZone = true
            break
          }
        }
        if (!inCurrentZone) {
          allInZone = false
          break
        }
      }

      if (allInZone && snake.length > 0) {
        snake.forEach((segment, index) => {
          const segmentCell = document.querySelector(`.cell[data-row="${segment.row}"][data-col="${segment.col}"]`)
          if (segmentCell) {
            setTimeout(() => {
              segmentCell.classList.add("poison-effect")
            }, index * 50)
          }
        })

        endGame(gameState, "Ваша змейка полностью отравлена!").then();
        return;
      }
    }
  } catch (error) {
    console.error("Ошибка при проверке столкновений:", error)
  }
}

// Находит безопасную позицию для змейки
function findSafeSnakePosition(gameState) {
  try {
    // Используем MAX_GRID из импорта, а не из gameState
    const centerArea = {
      minRow: Math.floor(MAX_GRID.height * 0.4),
      maxRow: Math.floor(MAX_GRID.height * 0.6),
      minCol: Math.floor(MAX_GRID.width * 0.4),
      maxCol: Math.floor(MAX_GRID.width * 0.6),
    }

    // Сначала пытаемся найти позицию в центральной области
    for (let attempts = 0; attempts < 50; attempts++) {
      const row = getRandomInt(centerArea.minRow, centerArea.maxRow)
      const col = getRandomInt(centerArea.minCol, centerArea.maxCol)

      // Проверяем, что позиция безопасна для всех трех начальных сегментов змейки
      if (
          isPositionSafe(gameState, { row, col }) &&
          isPositionSafe(gameState, { row, col: col - 1 }) &&
          isPositionSafe(gameState, { row, col: col - 2 })
      ) {
        return { row, col }
      }
    }

    // Если не нашли в центре, ищем по всему полю
    for (let attempts = 0; attempts < 100; attempts++) {
      const row = getRandomInt(0, MAX_GRID.height - 1)
      const col = getRandomInt(0, MAX_GRID.width - 1)

      // Проверяем, что позиция безопасна для всех трех начальных сегментов змейки
      if (
          isPositionSafe(gameState, { row, col }) &&
          isPositionSafe(gameState, { row, col: col - 1 }) &&
          isPositionSafe(gameState, { row, col: col - 2 })
      ) {
        return { row, col }
      }
    }

    // Если все попытки не удались, используем фиксированную безопасную позицию
    // Проверяем каждую позицию в сетке, начиная с верхнего левого угла
    for (let row = 0; row < MAX_GRID.height; row++) {
      for (let col = 0; col < MAX_GRID.width; col++) {
        if (
            isPositionSafe(gameState, { row, col }) &&
            col + 2 < MAX_GRID.width &&
            isPositionSafe(gameState, { row, col: col + 1 }) &&
            isPositionSafe(gameState, { row, col: col + 2 })
        ) {
          return { row, col }
        }
      }
    }

    // Если совсем ничего не нашли, используем фиксированную позицию и очищаем область
    const defaultPosition = { row: 5, col: 5 }

    // Очищаем область вокруг фиксированной позиции
    const clearArea = (position) => {
      // Удаляем стены, порталы, бонусы и яды в этой области
      gameState.walls = gameState.walls.filter(
          (wall) => Math.abs(wall.row - position.row) > 2 || Math.abs(wall.col - position.col) > 2,
      )

      gameState.portals = gameState.portals.filter(
          (portal) => Math.abs(portal.row - position.row) > 2 || Math.abs(portal.col - position.col) > 2,
      )

      gameState.bonuses = gameState.bonuses.filter(
          (bonus) => Math.abs(bonus.row - position.row) > 2 || Math.abs(bonus.col - position.col) > 2,
      )

      // Очищаем ядовитые зоны
      gameState.poisonZones.forEach((zone) => {
        zone.cells = zone.cells.filter(
            (cell) => Math.abs(cell.row - position.row) > 2 || Math.abs(cell.col - position.col) > 2,
        )
      })

      // Удаляем пустые зоны яда
      gameState.poisonZones = gameState.poisonZones.filter((zone) => zone.cells.length > 0)
    }

    clearArea(defaultPosition)
    return defaultPosition
  } catch (error) {
    console.error("Ошибка при поиске безопасной позиции для змейки:", error)

    // В случае ошибки, возвращаем фиксированную позицию и очищаем область
    const emergencyPosition = { row: 5, col: 5 }

    try {
      // Очищаем область вокруг фиксированной позиции
      gameState.walls = gameState.walls.filter(
          (wall) => Math.abs(wall.row - emergencyPosition.row) > 2 || Math.abs(wall.col - emergencyPosition.col) > 2,
      )

      gameState.poisonZones.forEach((zone) => {
        if (zone && zone.cells) {
          zone.cells = zone.cells.filter(
              (cell) => Math.abs(cell.row - emergencyPosition.row) > 2 || Math.abs(cell.col - emergencyPosition.col) > 2,
          )
        }
      })
    } catch (clearError) {
      console.error("Ошибка при очистке области для аварийного спавна:", clearError)
    }

    return emergencyPosition
  }
}

// Проверяет, находится ли позиция на пути змейки
function isInSnakePath(gameState, position) {
  try {
    const { snake, direction } = gameState

    if (snake.length === 0) {
      return false
    }

    const head = snake[0]

    const dangerZone = []

    switch (direction) {
      case "up":
        for (let i = 1; i <= SAFE_DISTANCE; i++) {
          dangerZone.push({ row: head.row - i, col: head.col })
        }
        break
      case "down":
        for (let i = 1; i <= SAFE_DISTANCE; i++) {
          dangerZone.push({ row: head.row + i, col: head.col })
        }
        break
      case "left":
        for (let i = 1; i <= SAFE_DISTANCE; i++) {
          dangerZone.push({ row: head.row, col: head.col - i })
        }
        break
      case "right":
        for (let i = 1; i <= SAFE_DISTANCE; i++) {
          dangerZone.push({ row: head.row, col: head.col + i })
        }
        break
    }

    return dangerZone.some((zone) => positionsEqual(zone, position))
  } catch (error) {
    console.error("Ошибка при проверке пути змейки:", error)
    return false
  }
}

// Проверяет, заблокирует ли змейку добавление новых стен
function wouldTrapSnake(gameState, newWalls) {
  const { snake, walls } = gameState
  if (snake.length === 0) return false

  const allWalls = [...walls, ...newWalls]

  const grid = Array(MAX_GRID.height)
    .fill(undefined)
    .map(() => Array(MAX_GRID.width).fill(0))

  allWalls.forEach((wall) => {
    if (wall.row >= 0 && wall.row < MAX_GRID.height && wall.col >= 0 && wall.col < MAX_GRID.width) {
      grid[wall.row][wall.col] = 1
    }
  })

  for (let i = 1; i < snake.length; i++) {
    const segment = snake[i]
    if (segment.row >= 0 && segment.row < MAX_GRID.height && segment.col >= 0 && segment.col < MAX_GRID.width) {
      grid[segment.row][segment.col] = 1
    }
  }

  const head = snake[0]
  const queue = [head]
  const visited = new Set()
  visited.add(`${head.row},${head.col}`)

  while (queue.length > 0) {
    const current = queue.shift()

    const directions = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ]

    for (const next of directions) {
      let nextRow = next.row
      let nextCol = next.col

      if (nextRow < 0) nextRow = MAX_GRID.height - 1
      if (nextRow >= MAX_GRID.height) nextRow = 0
      if (nextCol < 0) nextCol = MAX_GRID.width - 1
      if (nextCol >= MAX_GRID.width) nextCol = 0

      const key = `${nextRow},${nextCol}`

      if (
        !visited.has(key) &&
        (nextRow < 0 ||
          nextRow >= MAX_GRID.height ||
          nextCol < 0 ||
          nextCol >= MAX_GRID.width ||
          grid[nextRow][nextCol] === 0)
      ) {
        visited.add(key)
        queue.push({ row: nextRow, col: nextCol })
      }
    }
  }

  const totalCells = MAX_GRID.height * MAX_GRID.width
  const wallCount = allWalls.length + snake.length - 1
  const accessibleCells = visited.size

  return accessibleCells < (totalCells - wallCount) / 2
}

export { moveSnake, checkCollisions, findSafeSnakePosition, isInSnakePath, wouldTrapSnake }

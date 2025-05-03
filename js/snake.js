import { MAX_GRID, POINTS_PER_LEVEL, POINTS_PER_REGENERATE, SAFE_DISTANCE } from "./config.js"
import { wrapPosition, positionsEqual, getRandomInt, isPositionSafe } from "./utils.js"
import { applyBonus, generateBonus } from "./bonus.js"
import { generatePoisonZones } from "./poison.js"
import { generatePortals } from "./portals.js"
import { regenerateWalls } from "./walls.js"
import { generateFood } from "./food.js"
import { levelUp } from "./level.js"
import { endGame } from "./game.js"

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
      // Добавляем эффект активации портала
      const portalCell = document.querySelector(
        `.cell[data-row="${portals[portalIndex].row}"][data-col="${portals[portalIndex].col}"]`,
      )
      if (portalCell) {
        portalCell.classList.add("cell--portal-active")
        setTimeout(() => {
          portalCell.classList.remove("cell--portal-active")
        }, 300)
      }

      // Добавляем эффект активации портала на миникарте
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
        // Добавляем эффект активации второго портала
        const otherPortalCell = document.querySelector(
          `.cell[data-row="${portals[otherPortalIndex].row}"][data-col="${portals[otherPortalIndex].col}"]`,
        )
        if (otherPortalCell) {
          otherPortalCell.classList.add("cell--portal-active")
          setTimeout(() => {
            otherPortalCell.classList.remove("cell--portal-active")
          }, 300)
        }

        // Добавляем эффект активации второго портала на миникарте
        const otherPortalMinimap = document.querySelector(`.game__minimap-portal-${portals[otherPortalIndex].pairId}`)
        if (otherPortalMinimap) {
          otherPortalMinimap.classList.add("game__minimap-portal-active")
          setTimeout(() => {
            otherPortalMinimap.classList.remove("game__minimap-portal-active")
          }, 300)
        }

        head.row = portals[otherPortalIndex].row
        head.col = portals[otherPortalIndex].col

        // Move one step in the current direction after teleportation
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

    // Проверяем, съела ли змейка еду
    if (food && positionsEqual(head, food)) {
      // Анимация поедания еды
      const foodCell = document.querySelector(`.cell[data-row="${food.row}"][data-col="${food.col}"]`)
      if (foodCell) {
        foodCell.classList.add("food-eaten")
      }

      // Увеличиваем счет
      gameState.scoreCounter += 10
      gameState.score.textContent = gameState.scoreCounter

      // Проверяем на повышение уровня
      if (gameState.scoreCounter >= gameState.levelCounter * POINTS_PER_LEVEL) {
        levelUp(gameState)
      }

      // Генерируем новую еду
      generateFood(gameState)

      // Иногда генерируем бонусы
      if (Math.random() < 0.3) {
        generateBonus(gameState)
      }

      // Перестройка карты
      if (gameState.scoreCounter % POINTS_PER_REGENERATE === 0) {
        regenerateWalls(gameState)
        generatePortals(gameState, 4)
        generatePoisonZones(gameState, 2)
      }
    } else {
      // Удаляем хвост, если еда не была съедена
      snake.pop()
    }
  } catch (error) {
    console.error("Ошибка при перемещении змейки:", error)
  }
}

function checkCollisions(gameState) {
  try {
    const { snake, walls, bonuses, poisonZones } = gameState

    if (snake.length === 0) return

    const head = snake[0]

    // Колизии змейки с собой
    for (let i = 1; i < snake.length; i++) {
      if (positionsEqual(snake[i], head)) {
        endGame(gameState, "Вы столкнулись с собой!")
        return
      }
    }

    // Колизии змейки со стенами
    for (const wall of walls) {
      if (positionsEqual(wall, head)) {
        // Анимация столкновения со стеной
        const wallCell = document.querySelector(`.cell[data-row="${wall.row}"][data-col="${wall.col}"]`)
        if (wallCell) {
          wallCell.classList.add("wall-collision")
        }

        endGame(gameState, "Вы врезались в стену!")
        return
      }
    }

    // Змейка собрала бонус
    for (let i = 0; i < bonuses.length; i++) {
      const bonus = bonuses[i]
      if (positionsEqual(bonus, head)) {
        // Анимация сбора бонуса
        const bonusCell = document.querySelector(`.cell[data-row="${bonus.row}"][data-col="${bonus.col}"]`)
        if (bonusCell) {
          bonusCell.classList.add("bonus-collected")
        }

        applyBonus(gameState, bonus.type)
        bonuses.splice(i, 1)
        break
      }
    }

    // Проверка на зоны отравления
    for (const zone of poisonZones) {
      // Проверяем, находится ли вся змейка в зоне отравления
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
        // Анимация отравления змейки
        snake.forEach((segment, index) => {
          const segmentCell = document.querySelector(`.cell[data-row="${segment.row}"][data-col="${segment.col}"]`)
          if (segmentCell) {
            setTimeout(() => {
              segmentCell.classList.add("poison-effect")
            }, index * 50) // Последовательная анимация для каждого сегмента
          }
        })

        endGame(gameState, "Ваша змейка полностью отравлена!")
        return
      }
    }
  } catch (error) {
    console.error("Ошибка при проверке столкновений:", error)
  }
}

function findSafeSnakePosition(gameState) {
  try {
    const { MAX_GRID } = gameState

    const centerArea = {
      minRow: Math.floor(MAX_GRID.height * 0.4),
      maxRow: Math.floor(MAX_GRID.height * 0.6),
      minCol: Math.floor(MAX_GRID.width * 0.4),
      maxCol: Math.floor(MAX_GRID.width * 0.6),
    }

    for (let attempts = 0; attempts < 50; attempts++) {
      const row = getRandomInt(centerArea.minRow, centerArea.maxRow)
      const col = getRandomInt(centerArea.minCol, centerArea.maxCol)

      if (
        isPositionSafe(gameState, { row, col }) &&
        isPositionSafe(gameState, { row, col: col - 1 }) &&
        isPositionSafe(gameState, { row, col: col - 2 })
      ) {
        return { row, col }
      }
    }

    for (let attempts = 0; attempts < 100; attempts++) {
      const row = getRandomInt(0, MAX_GRID.height - 1)
      const col = getRandomInt(0, MAX_GRID.width - 1)

      if (
        isPositionSafe(gameState, { row, col }) &&
        isPositionSafe(gameState, { row, col: col - 1 }) &&
        isPositionSafe(gameState, { row, col: col - 2 })
      ) {
        return { row, col }
      }
    }

    // Если все попытки не удались, используем жестко заданную безопасную позицию
    return { row: 5, col: 5 }
  } catch (error) {
    console.error("Ошибка при поиске безопасной позиции для змейки:", error)
    return { row: 5, col: 5 }
  }
}

function isInSnakePath(gameState, position) {
  try {
    const { snake, direction } = gameState

    if (snake.length === 0) {
      return false
    }

    const head = snake[0]

    // Определяем опасную зону на основе направления змейки
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

    // Проверяем, находится ли позиция в опасной зоне
    return dangerZone.some((zone) => positionsEqual(zone, position))
  } catch (error) {
    console.error("Ошибка при проверке пути змейки:", error)
    return false
  }
}

function wouldTrapSnake(gameState, newWalls) {
  const { snake, walls } = gameState
  if (snake.length === 0) return false

  // Создаем копию текущих стен плюс новые стены
  const allWalls = [...walls, ...newWalls]

  // Создаем представление сетки
  const grid = Array(MAX_GRID.height)
    .fill(undefined)
    .map(() => Array(MAX_GRID.width).fill(0))

  // Отмечаем стены как заблокированные
  allWalls.forEach((wall) => {
    if (wall.row >= 0 && wall.row < MAX_GRID.height && wall.col >= 0 && wall.col < MAX_GRID.width) {
      grid[wall.row][wall.col] = 1
    }
  })

  // Отмечаем змейку как заблокированную (кроме головы)
  for (let i = 1; i < snake.length; i++) {
    const segment = snake[i]
    if (segment.row >= 0 && segment.row < MAX_GRID.height && segment.col >= 0 && segment.col < MAX_GRID.width) {
      grid[segment.row][segment.col] = 1
    }
  }

  // Простой алгоритм заливки от головы змейки для проверки доступности
  const head = snake[0]
  const queue = [head]
  const visited = new Set()
  visited.add(`${head.row},${head.col}`)

  while (queue.length > 0) {
    const current = queue.shift()

    // Проверяем все четыре направления
    const directions = [
      { row: current.row - 1, col: current.col }, // вверх
      { row: current.row + 1, col: current.col }, // вниз
      { row: current.row, col: current.col - 1 }, // влево
      { row: current.row, col: current.col + 1 }, // вправо
    ]

    for (const next of directions) {
      // Обрабатываем зацикливание
      let nextRow = next.row
      let nextCol = next.col

      if (nextRow < 0) nextRow = MAX_GRID.height - 1
      if (nextRow >= MAX_GRID.height) nextRow = 0
      if (nextCol < 0) nextCol = MAX_GRID.width - 1
      if (nextCol >= MAX_GRID.width) nextCol = 0

      const key = `${nextRow},${nextCol}`

      // Если не посещено и не стена
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

  // Если мы можем достичь хотя бы половины незаблокированных ячеек, змейка, вероятно, не заблокирована
  const totalCells = MAX_GRID.height * MAX_GRID.width
  const wallCount = allWalls.length + snake.length - 1
  const accessibleCells = visited.size

  return accessibleCells < (totalCells - wallCount) / 2
}

export { moveSnake, checkCollisions, findSafeSnakePosition, isInSnakePath, wouldTrapSnake }

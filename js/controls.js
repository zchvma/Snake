function setupControls(gameState) {
  // Обработка клавиатуры
  document.addEventListener("keydown", (event) => {
    handleKeyboardInput(event, gameState)
  })

  // Обработка сенсорных кнопок
  setupTouchControls(gameState)
}

function handleKeyboardInput(event, gameState) {
  try {
    if (!gameState.isGameRunning) return

    const key = event.key.toLowerCase()

    // Определяем направление в зависимости от статуса инверсии
    if (!gameState.isInverted) {
      // Нормальное управление
      if ((key === "arrowup" || key === "w") && gameState.direction !== "down") {
        gameState.nextDirection = "up"
      } else if ((key === "arrowdown" || key === "s") && gameState.direction !== "up") {
        gameState.nextDirection = "down"
      } else if ((key === "arrowleft" || key === "a") && gameState.direction !== "right") {
        gameState.nextDirection = "left"
      } else if ((key === "arrowright" || key === "d") && gameState.direction !== "left") {
        gameState.nextDirection = "right"
      }
    } else {
      // Инвертированное управление
      if ((key === "arrowup" || key === "w") && gameState.direction !== "up") {
        gameState.nextDirection = "down"
      } else if ((key === "arrowdown" || key === "s") && gameState.direction !== "down") {
        gameState.nextDirection = "up"
      } else if ((key === "arrowleft" || key === "a") && gameState.direction !== "left") {
        gameState.nextDirection = "right"
      } else if ((key === "arrowright" || key === "d") && gameState.direction !== "right") {
        gameState.nextDirection = "left"
      }
    }
  } catch (error) {
    console.error("Ошибка при обработке ввода с клавиатуры:", error)
  }
}

function setupTouchControls(gameState) {
  try {
    // Кнопка вверх
    gameState.controls.up.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "down") {
        gameState.nextDirection = "up"
      } else if (gameState.isInverted && gameState.direction !== "up") {
        gameState.nextDirection = "down"
      }
    })

    // Кнопка вниз
    gameState.controls.down.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "up") {
        gameState.nextDirection = "down"
      } else if (gameState.isInverted && gameState.direction !== "down") {
        gameState.nextDirection = "up"
      }
    })

    // Кнопка влево
    gameState.controls.left.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "right") {
        gameState.nextDirection = "left"
      } else if (gameState.isInverted && gameState.direction !== "left") {
        gameState.nextDirection = "right"
      }
    })

    // Кнопка вправо
    gameState.controls.right.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "left") {
        gameState.nextDirection = "right"
      } else if (gameState.isInverted && gameState.direction !== "right") {
        gameState.nextDirection = "left"
      }
    })
  } catch (error) {
    console.error("Ошибка при настройке сенсорных элементов управления:", error)
  }
}

export { setupControls }

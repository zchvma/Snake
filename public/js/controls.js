// Настраивает элементы управления игрой
function setupControls(gameState) {
  document.addEventListener("keydown", (event) => {
    handleKeyboardInput(event, gameState)
  })

  setupTouchControls(gameState)
}

// Обрабатывает ввод с клавиатуры
function handleKeyboardInput(event, gameState) {
  try {
    if (!gameState.isGameRunning) return

    const key = event.key.toLowerCase()

    if (!gameState.isInverted) {
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

// Настраивает сенсорные элементы управления
function setupTouchControls(gameState) {
  try {
    gameState.controls.up.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "down") {
        gameState.nextDirection = "up"
      } else if (gameState.isInverted && gameState.direction !== "up") {
        gameState.nextDirection = "down"
      }
    })

    gameState.controls.down.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "up") {
        gameState.nextDirection = "down"
      } else if (gameState.isInverted && gameState.direction !== "down") {
        gameState.nextDirection = "up"
      }
    })

    gameState.controls.left.addEventListener("click", () => {
      if (!gameState.isGameRunning) return
      if (!gameState.isInverted && gameState.direction !== "right") {
        gameState.nextDirection = "left"
      } else if (gameState.isInverted && gameState.direction !== "left") {
        gameState.nextDirection = "right"
      }
    })

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

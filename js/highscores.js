import { MAX_HIGH_SCORES, HIGH_SCORES_KEY } from "./config.js"

// Загружает таблицу рекордов из localStorage или с сервера
async function loadHighScores() {
  try {
    try {
      const response = await fetch("/api/highscores")
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn("Не удалось загрузить рекорды с сервера, используем локальное хранилище", error)
    }

    const highScores = localStorage.getItem(HIGH_SCORES_KEY)
    return highScores ? JSON.parse(highScores) : []
  } catch (error) {
    console.error("Ошибка при загрузке рекордов:", error)
    return []
  }
}

// Сохраняет таблицу рекордов в localStorage и на сервере
async function saveHighScores(highScores) {
  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores))

    try {
      await fetch("/api/highscores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(highScores),
      })
    } catch (error) {
      console.warn("Не удалось сохранить рекорды на сервере", error)
    }
  } catch (error) {
    console.error("Ошибка при сохранении рекордов:", error)
  }
}

// Обновляет таблицу рекордов в интерфейсе
function updateHighScoresTable(highScores, newScoreIndex = -1) {
  const highScoresBody = document.getElementById("highscores-body")
  if (!highScoresBody) return

  highScoresBody.innerHTML = ""

  if (highScores.length === 0) {
    const row = document.createElement("tr")
    const cell = document.createElement("td")
    cell.colSpan = 5
    cell.textContent = "Пока нет рекордов"
    cell.style.textAlign = "center"
    row.appendChild(cell)
    highScoresBody.appendChild(row)
    return
  }

  highScores.forEach((score, index) => {
    const row = document.createElement("tr")
    if (index === newScoreIndex) {
      row.classList.add("new-record")
    }

    const cells = [
      index + 1, // Место
      score.name, // Имя
      score.score, // Очки
      score.level, // Уровень
      new Date(score.date).toLocaleDateString(), // Дата
    ]

    cells.forEach((content) => {
      const cell = document.createElement("td")
      cell.textContent = content
      row.appendChild(cell)
    })

    highScoresBody.appendChild(row)
  })
}

// Проверяет, является ли текущий результат рекордом
function isHighScore(currentScore, highScores) {
  if (highScores.length < MAX_HIGH_SCORES) return true

  const minScore = Math.min(...highScores.map((score) => score.score))
  return currentScore > minScore
}

// Добавляет новый рекорд в таблицу
async function addHighScore(playerName, playerScore, playerLevel) {
  try {
    let highScores = await loadHighScores()

    const newScore = {
      name: playerName || "Игрок",
      score: playerScore,
      level: playerLevel,
      date: Date.now(),
    }

    highScores.push(newScore)

    highScores.sort((a, b) => b.score - a.score)

    highScores = highScores.slice(0, MAX_HIGH_SCORES)

    await saveHighScores(highScores)

    return highScores.findIndex(
      (score) => score.name === newScore.name && score.score === newScore.score && score.date === newScore.date,
    )
  } catch (error) {
    console.error("Ошибка при добавлении нового рекорда:", error)
    return -1
  }
}

// Показывает форму ввода имени игрока
function showNameForm() {
  const nameForm = document.getElementById("name-form")
  const playerNameInput = document.getElementById("player-name")

  if (nameForm) {
    nameForm.style.display = "block"
    if (playerNameInput) {
      playerNameInput.focus()
    }
  }
}

// Скрывает форму ввода имени игрока
function hideNameForm() {
  const nameForm = document.getElementById("name-form")
  if (nameForm) {
    nameForm.style.display = "none"
  }
}

export { loadHighScores, updateHighScoresTable, isHighScore, addHighScore, showNameForm, hideNameForm }

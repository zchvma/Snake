import {MAX_HIGH_SCORES} from "./config.js"

async function loadHighScores() {
  try {
    try {
      // Запрос к api для получения рекордов
      const response = await fetch("/api/highscores")
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn("Could not fetch high scores from server", error)
    }

    // Если не удалось загрузить с сервера, возвращаем пустой массив
    return []
  } catch (error) {
    console.error("Error loading high scores:", error)
    return []
  }
}

async function saveHighScores(highScores) {
  try {
    if (!Array.isArray(highScores)) {
      console.error("highScores is not an array in saveHighScores:", highScores)
      return
    }
    try {
      // Запрос к api для сохранения рекордов
      await fetch("/api/highscores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(highScores),
      })
    } catch (error) {
      console.warn("Could not save high scores to server", error)
    }
  } catch (error) {
    console.error("Error saving high scores:", error)
  }
}

function updateHighScoresTable(highScores, newScoreIndex = -1) {
  const highScoresBody = document.getElementById("highscore-body")
  if (!highScoresBody) return

  highScoresBody.innerHTML = ""

  if (!Array.isArray(highScores)) {
    console.error("highScores is not an array in updateHighScoresTable:", highScores)
    return;
  }

  // Создает 1 ячейку на все 5 колонок с сообщением, что нет рекордов
  if (highScores.length === 0) {
    const row = document.createElement("tr")
    const cell = document.createElement("td")
    cell.colSpan = 5
    cell.textContent = "No high scores yet"
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
      index + 1, // Номер
      score.name || "Player", // Имя
      score.score || 0, // Очки
      score.level || 1, // Уровень
      new Date(score.date || Date.now()).toLocaleDateString(), // Дата
    ]

    cells.forEach((content) => {
      const cell = document.createElement("td")
      cell.textContent = content
      row.appendChild(cell)
    })

    highScoresBody.appendChild(row)
  })
}

function isHighScore(currentScore, highScores) {
  // Убедимся, что highScores - это массив
  if (!Array.isArray(highScores)) {
    console.error("highScores is not an array in isHighScore:", highScores)
    return true
  }

  // If the table is not full, the result will definitely be included
  if (highScores.length < MAX_HIGH_SCORES) return true

  // Otherwise, check if the result is greater than the minimum in the table
  const minScore = Math.min(...highScores.map((score) => score.score || 0))
  return currentScore > minScore
}

async function addHighScore(playerName, playerScore, playerLevel) {
  try {
    // Load current high scores
    let highScores = await loadHighScores()

    // Убедимся, что highScores - это массив
    if (!Array.isArray(highScores)) {
      console.error("highScores is not an array in addHighScore:", highScores)
      highScores = []
    }

    // Create a new record
    const newScore = {
      name: playerName || "Player",
      score: playerScore,
      level: playerLevel,
      date: Date.now(),
    }

    // Add new score
    highScores.push(newScore)

    // Sort by descending score
    highScores.sort((a, b) => (b.score || 0) - (a.score || 0))

    // Keep only MAX_HIGH_SCORES records
    highScores = highScores.slice(0, MAX_HIGH_SCORES)

    // Save updated high scores
    await saveHighScores(highScores)

    // Return index of new score
    return highScores.findIndex(
        (score) => score.name === newScore.name && score.score === newScore.score && score.date === newScore.date,
    )
  } catch (error) {
    console.error("Error adding new high score:", error)
    return -1
  }
}

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

function hideNameForm() {
  const nameForm = document.getElementById("name-form")
  if (nameForm) {
    nameForm.style.display = "none"
  }
}

export { loadHighScores, updateHighScoresTable, isHighScore, addHighScore, showNameForm, hideNameForm }
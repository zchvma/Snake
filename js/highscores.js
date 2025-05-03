import { MAX_HIGH_SCORES, HIGH_SCORES_KEY } from "./config.js"

function loadHighScores() {
  try {
    const highScores = localStorage.getItem(HIGH_SCORES_KEY)
    return highScores ? JSON.parse(highScores) : []
  } catch (error) {
    console.error("Ошибка при загрузке лучших результатов:", error)
    return []
  }
}

function saveHighScores(highScores) {
  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores))
  } catch (error) {
    console.error("Ошибка при сохранении лучших результатов:", error)
  }
}

function updateHighScoresTable(highScores, newScoreIndex = -1) {
  const highScoresBody = document.getElementById("highscores-body")
  if (!highScoresBody) return

  // Очистка таблицы
  highScoresBody.innerHTML = ""

  // Показать сообщение, если нет результатов
  if (highScores.length === 0) {
    const row = document.createElement("tr")
    const cell = document.createElement("td")
    cell.colSpan = 5
    cell.textContent = "Пока нет результатов"
    cell.style.textAlign = "center"
    row.appendChild(cell)
    highScoresBody.appendChild(row)
    return
  }

  // Добавление строк с результатами
  highScores.forEach((score, index) => {
    const row = document.createElement("tr")
    if (index === newScoreIndex) {
      row.classList.add("new-record")
    }

    // Создание ячеек таблицы
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

function isHighScore(currentScore, highScores) {
  // Если таблица не заполнена, то результат точно войдет
  if (highScores.length < MAX_HIGH_SCORES) return true

  // Иначе проверяем, больше ли результат минимального в таблице
  const minScore = Math.min(...highScores.map((score) => score.scoreCounter))
  return currentScore > minScore
}

function addHighScore(playerName, playerScore, playerLevel) {
  try {
    // Загружаем текущие результаты
    let highScores = loadHighScores()

    // Создаем новую запись
    const newScore = {
      name: playerName || "Игрок",
      score: playerScore,
      level: playerLevel,
      date: Date.now(),
    }

    // Добавляем новый результат
    highScores.push(newScore)

    // Сортируем по убыванию очков
    highScores.sort((a, b) => b.score - a.score)

    // Оставляем только MAX_HIGH_SCORES записей
    highScores = highScores.slice(0, MAX_HIGH_SCORES)

    // Сохраняем обновленные результаты
    saveHighScores(highScores)

    // Возвращаем индекс нового результата
    return highScores.findIndex(
      (score) => score.name === newScore.name && score.score === newScore.score && score.date === newScore.date,
    )
  } catch (error) {
    console.error("Ошибка при добавлении нового результата:", error)
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
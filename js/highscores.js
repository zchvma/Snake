import { MAX_HIGH_SCORES, HIGH_SCORES_KEY } from "./config.js"

// Load high scores from localStorage (fallback) or fetch from server
async function loadHighScores() {
  try {
    // Try to fetch from server first
    try {
      const response = await fetch("/api/highscores")
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn("Could not fetch high scores from server, using localStorage fallback", error)
    }

    // Fallback to localStorage
    const highScores = localStorage.getItem(HIGH_SCORES_KEY)
    return highScores ? JSON.parse(highScores) : []
  } catch (error) {
    console.error("Error loading high scores:", error)
    return []
  }
}

// Save high scores to localStorage (fallback) and send to server
async function saveHighScores(highScores) {
  try {
    // Save to localStorage as fallback
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores))

    // Try to save to server
    try {
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
  const highScoresBody = document.getElementById("highscores-body")
  if (!highScoresBody) return

  // Clear the table
  highScoresBody.innerHTML = ""

  // Show message if no results
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

  // Add rows with results
  highScores.forEach((score, index) => {
    const row = document.createElement("tr")
    if (index === newScoreIndex) {
      row.classList.add("new-record")
    }

    // Create table cells
    const cells = [
      index + 1, // Rank
      score.name, // Name
      score.score, // Score
      score.level, // Level
      new Date(score.date).toLocaleDateString(), // Date
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
  // If the table is not full, the result will definitely be included
  if (highScores.length < MAX_HIGH_SCORES) return true

  // Otherwise, check if the result is greater than the minimum in the table
  const minScore = Math.min(...highScores.map((score) => score.score))
  return currentScore > minScore
}

async function addHighScore(playerName, playerScore, playerLevel) {
  try {
    // Load current high scores
    let highScores = await loadHighScores()

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
    highScores.sort((a, b) => b.score - a.score)

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

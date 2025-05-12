import {MAX_HIGH_SCORES} from "./config.js"

async function loadHighScores() {
    try {
        const response = await fetch("/api/highscores", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });
        if (response.ok) {
            return await response.json();
        }
        if (response.status === 403) {
            console.warn("Access denied: no valid token");
            return [];
        }
    } catch (e) {
        console.warn("Could not fetch high scores from server", e);
    }
    return [];
}

async function saveHighScores(highScores) {
    if (!Array.isArray(highScores)) return;

    try {
        const response = await fetch("/api/highscores", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(highScores)
        });
        if (!response.ok) {
            console.warn("Save failed with status", response.status);
        }
    } catch (e) {
        console.warn("Could not save high scores to server", e);
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
            index + 1, // Rank
            score.name || "Player", // Name
            score.score || 0, // Score
            score.level || 1, // Level
            new Date(score.date || Date.now()).toLocaleDateString(), // Date
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
    if (!Array.isArray(highScores)) {
        console.error("highScores is not an array in isHighScore:", highScores)
        return true
    }

    if (highScores.length < MAX_HIGH_SCORES) return true

    const minScore = Math.min(...highScores.map((score) => score.score || 0))
    return currentScore > minScore
}

async function addHighScore(playerName, playerScore, playerLevel) {
    try {
        let highScores = await loadHighScores()

        const newScore = {
            name: playerName || "Player",
            score: playerScore,
            level: playerLevel,
            date: Date.now(),
        }

        // Если пользователь уже имел рекорд, то обновляем его
        const old_player_index = highScores.findIndex((score) => score.name === newScore.name)

        if (old_player_index !== -1) {
            if (newScore.score <= highScores[old_player_index].score) {
                return old_player_index;
            }
            highScores[old_player_index].score = newScore.score
            highScores[old_player_index].level = newScore.level
            highScores[old_player_index].date = newScore.date
        } else {
            highScores.push(newScore)
        }


        highScores.sort((a, b) => (b.score || 0) - (a.score || 0))
        highScores = highScores.slice(0, MAX_HIGH_SCORES)
        await saveHighScores(highScores)

        return highScores.findIndex((score) => score.name === newScore.name)
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

export {loadHighScores, updateHighScoresTable, isHighScore, addHighScore, showNameForm, hideNameForm}
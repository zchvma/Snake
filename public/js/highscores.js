import { MAX_HIGH_SCORES } from "../config.js";

let jwt;

// 1) Получаем JWT при старте страницы
async function init() {
    try {
        const res = await fetch("/api/login", { method: "POST" });
        const { token } = await res.json();
        jwt = token;
    } catch (e) {
        console.error("Login failed:", e);
    }
    await refreshTable();
}

// 2) Загрузка и отрисовка
async function refreshTable(newIndex = -1) {
    const res = await fetch("/api/highscores");
    const highs = res.ok ? await res.json() : [];
    updateHighScoresTable(highs, newIndex);
}

async function submitScores(highScores) {
    try {
        await fetch("/api/highscores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwt}`,
            },
            body: JSON.stringify(highScores),
        });
    } catch (e) {
        console.warn("Save failed:", e);
    }
}

function updateHighScoresTable(highScores, newScoreIndex = -1) {
    const body = document.getElementById("highscore-body");
    body.innerHTML = "";
    if (!highScores.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No high scores yet";
        row.append(cell);
        body.append(row);
        return;
    }
    highScores.forEach((s, i) => {
        const row = document.createElement("tr");
        if (i === newScoreIndex) row.classList.add("new-record");
        [i+1, s.name, s.score, s.level, new Date(s.date).toLocaleString()]
            .forEach(text => {
                const td = document.createElement("td");
                td.textContent = text;
                row.append(td);
            });
        body.append(row);
    });
}

function isHighScore(currentScore, highScores) {
    if (highScores.length < MAX_HIGH_SCORES) return true;
    const minScore = Math.min(...highScores.map(s => s.score));
    return currentScore > minScore;
}

async function addHighScore(name, score, level) {
    const res = await fetch("/api/highscores");
    const highs = res.ok ? await res.json() : [];
    const newEntry = { name, score, level, date: Date.now() };
    const idx = highs.findIndex(s => s.name === name);
    if (idx >= 0) {
        if (newEntry.score <= highs[idx].score) return idx;
        highs[idx] = newEntry;
    } else {
        highs.push(newEntry);
    }
    highs.sort((a,b) => b.score - a.score);
    const top = highs.slice(0, MAX_HIGH_SCORES);
    await submitScores(top);
    return top.findIndex(s => s.name === name);
}

window.addEventListener("load", init);

export {
    refreshTable,
    isHighScore,
    addHighScore,
};
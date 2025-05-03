// Инициализирует интерфейс приложения
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link")
  const sections = document.querySelectorAll(".content-section")

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      navLinks.forEach((l) => l.classList.remove("active"))
      sections.forEach((s) => s.classList.remove("active"))

      link.classList.add("active")

      const sectionId = link.getAttribute("data-section") + "-section"
      document.getElementById(sectionId).classList.add("active")

      window.scrollTo(0, 0)
    })
  })

  // Загружает таблицу рекордов при переходе на вкладку результатов
  const resultsLink = document.querySelector('[data-section="results"]')
  resultsLink.addEventListener("click", () => {
    fetchHighScores()
  })

  // Загружает рекорды с сервера
  async function fetchHighScores() {
    const highScoresBody = document.getElementById("highscores-body")

    try {
      const response = await fetch("/api/highscores")

      if (!response.ok) {
        throw new Error("Не удалось загрузить рекорды")
      }

      const highScores = await response.json()

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
    } catch (error) {
      console.error("Ошибка при загрузке рекордов:", error)
      highScoresBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #f44336;">
                        Не удалось загрузить рекорды. Пожалуйста, попробуйте позже.
                    </td>
                </tr>
            `
    }
  }
})

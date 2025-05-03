document.addEventListener("DOMContentLoaded", () => {
  // Navigation functionality
  const navLinks = document.querySelectorAll(".nav-link")
  const sections = document.querySelectorAll(".content-section")

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Remove active class from all links and sections
      navLinks.forEach((l) => l.classList.remove("active"))
      sections.forEach((s) => s.classList.remove("active"))

      // Add active class to clicked link
      link.classList.add("active")

      // Show corresponding section
      const sectionId = link.getAttribute("data-section") + "-section"
      document.getElementById(sectionId).classList.add("active")

      // Scroll to top when changing sections
      window.scrollTo(0, 0)
    })
  })

  // Load high scores when results tab is clicked
  const resultsLink = document.querySelector('[data-section="results"]')
  resultsLink.addEventListener("click", () => {
    fetchHighScores()
  })

  // Function to fetch high scores from the server
  async function fetchHighScores() {
    const highScoresBody = document.getElementById("highscores-body")

    try {
      const response = await fetch("/api/highscores")

      if (!response.ok) {
        throw new Error("Failed to fetch high scores")
      }

      const highScores = await response.json()

      // Clear loading message
      highScoresBody.innerHTML = ""

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

      // Add high scores to the table
      highScores.forEach((score, index) => {
        const row = document.createElement("tr")

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
    } catch (error) {
      console.error("Error fetching high scores:", error)
      highScoresBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #f44336;">
                        Failed to load high scores. Please try again later.
                    </td>
                </tr>
            `
    }
  }
})

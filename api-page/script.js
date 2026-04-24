const BASEURL = window.location.origin
const particlesJS = window.particlesJS
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen")
  const body = document.body
  body.classList.add("no-scroll")
  document.body.classList.add("dark-mode")

  particlesJS("particles-js", {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#6c5ce7" },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#6c5ce7",
        opacity: 0.4,
        width: 1,
      },
      move: { enable: true, speed: 2 },
    },
  })

  try {
    const settings = await fetch(BASEURL + "/src/settings.json").then(res => res.json())

    const setContent = (id, prop, value) => {
      const el = document.getElementById(id)
      if (el) el[prop] = value
    }

    document.getElementById("currentYear").textContent = new Date().getFullYear()

    setContent("page", "textContent", settings.name)
    setContent("header", "textContent", settings.name)
    setContent("footerBrand", "textContent", settings.name)
    setContent("name", "textContent", settings.name)
    setContent("copyrightName", "textContent", settings.name)
    setContent("description", "textContent", settings.description)

    const apiContent = document.getElementById("apiContent")

    settings.categories.forEach((category) => {
      const categoryDiv = document.createElement("div")
      categoryDiv.className = "api-category"

      const title = document.createElement("div")
      title.className = "api-category-header"
      title.innerHTML = `<span>${category.name}</span>`

      const body = document.createElement("div")
      body.className = "api-category-content"
      body.style.display = "grid"

      category.items.forEach((item) => {
        const card = document.createElement("div")
        card.className = "api-endpoint-card"

        card.dataset.apiPath = item.path
        card.dataset.apiName = item.name
        card.dataset.apiDesc = item.desc

        card.innerHTML = `
          <span class="method-badge">GET</span>
          <div class="endpoint-text">
            <span class="endpoint-name">${item.name}</span>
          </div>
          <span class="arrow-icon">»</span>
        `

        body.appendChild(card)
      })

      categoryDiv.appendChild(title)
      categoryDiv.appendChild(body)
      apiContent.appendChild(categoryDiv)
    })

    document.addEventListener("click", (e) => {
      const card = e.target.closest(".api-endpoint-card")
      if (!card) return

      const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))

      document.getElementById("apiResponseModalLabel").textContent = card.dataset.apiName
      document.getElementById("modalApiDescription").textContent = card.dataset.apiDesc

      modal.show()
    })

    // ✅ TAB SWITCH (المهم)
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", function () {

        document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"))
        this.classList.add("active")

        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"))
        document.getElementById(this.dataset.tab + "Tab").classList.add("active")

      })
    })

  } catch (err) {
    console.error(err)
  } finally {
    loadingScreen.style.display = "none"
    body.classList.remove("no-scroll")
  }
})

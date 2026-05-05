const BASEURL = window.location.origin
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {

  const apiContent = document.getElementById("apiContent")

  // =========================
  // ☰ MENU BUTTON
  // =========================
  const menuBtn = document.createElement("button")
  menuBtn.innerHTML = "☰"
  menuBtn.className = "menu-btn"
  document.body.appendChild(menuBtn)

  // =========================
  // SIDEBAR
  // =========================
  const sidebar = document.createElement("div")
  sidebar.className = "sidebar"
  document.body.appendChild(sidebar)

  menuBtn.onclick = () => {
    sidebar.classList.toggle("open")
  }

  // =========================
  // ICONS
  // =========================
  const getIcon = (name) => {
    name = name.toLowerCase()
    if (name.includes("ai")) return "fa-robot"
    if (name.includes("download")) return "fa-download"
    if (name.includes("tool")) return "fa-wrench"
    if (name.includes("anime")) return "fa-dragon"
    if (name.includes("search")) return "fa-search"
    if (name.includes("islam")) return "fa-mosque"
    if (name.includes("info")) return "fa-circle-info"
    if (name.includes("status")) return "fa-signal"
    return "fa-layer-group"
  }

  const settings = await fetch("/src/settings.json").then(r => r.json())

  // =========================
  // SIDEBAR ITEMS
  // =========================
  settings.categories.forEach((cat, index) => {
    const item = document.createElement("div")

    item.innerHTML = `
      <i class="fas ${getIcon(cat.name)}"></i>
      <span>${cat.name}</span>
    `

    item.onclick = () => {
      window.location.href = `?category=${index}`
    }

    sidebar.appendChild(item)
  })

  const params = new URLSearchParams(window.location.search)
  const selectedCategoryIndex = params.get("category")

  // =========================
  // 🏠 HOME PAGE
  // =========================
  if (selectedCategoryIndex === null) {

    const totalEndpoints = settings.categories.reduce((a, c) => a + c.items.length, 0)
    const sectionsCount = settings.categories.length

    let dominant = { name: "", count: 0 }
    settings.categories.forEach(c => {
      if (c.items.length > dominant.count) {
        dominant = { name: c.name, count: c.items.length }
      }
    })

    apiContent.innerHTML = `
    <h2>📊 API Dashboard</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <h4>Total Endpoints</h4>
        <p>${totalEndpoints}</p>
      </div>
      <div class="stat-card">
        <h4>Sections</h4>
        <p>${sectionsCount}</p>
      </div>
      <div class="stat-card">
        <h4>Dominant</h4>
        <p>${dominant.name}</p>
      </div>
    </div>

    <!-- 👤 PROFILE -->
    <div class="home-card center">
      <img src="/src/icon.png" class="profile-img">
      <h2>Terbo API</h2>

      <div class="profile-buttons">
        <span>📞 +20 103 452 6368</span>
        <span>💬 WhatsApp</span>
        <span>💻 Developer</span>
        <span>🔥 APIs</span>
      </div>
    </div>

    <!-- 🔥 LOGO -->
    <div class="home-card center">
      <img src="/src/icon.png" class="api-logo">
      <h2>Terbo API</h2>
      <p>Best API Services For Developers 🚀</p>
    </div>

    <!-- 📦 EXAMPLE -->
    <div class="home-card">
      <h3>⚡ Example API</h3>
      <div class="code-box">
<pre>
${BASEURL}/api/gpt?text=hello

{
  "status": true,
  "result": "Hello world"
}
</pre>
      </div>
    </div>

    <!-- 👋 WELCOME -->
    <div class="home-card center">
      <h2>Welcome 👋</h2>
      <p>Choose any section from menu and start using APIs 🔥</p>
    </div>
    `
  }

  // =========================
  // 📂 CATEGORY PAGE
  // =========================
  else {
    const category = settings.categories[selectedCategoryIndex]

    apiContent.innerHTML = `<h2>${category.name}</h2>`

    const container = document.createElement("div")
    container.className = "api-category-content"

    category.items.forEach(item => {
      const card = document.createElement("div")
      card.className = "api-endpoint-card"

      card.dataset.apiPath = item.path
      card.dataset.apiName = item.name
      card.dataset.apiDesc = item.desc

      card.innerHTML = `
        <span class="method-badge">GET</span>
        <div class="endpoint-text">
          <span class="endpoint-path">${item.path}</span>
          <span>${item.name}</span>
        </div>
      `

      container.appendChild(card)
    })

    apiContent.appendChild(container)
  }

  // =========================
  // 🚀 EXECUTE
  // =========================
  document.addEventListener("click", async (e) => {
    const card = e.target.closest(".api-endpoint-card")
    if (!card) return

    const url = BASEURL + card.dataset.apiPath
    const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))

    document.getElementById("apiResponseModalLabel").textContent = card.dataset.apiName

    document.getElementById("submitQueryBtn").onclick = async () => {
      const res = await fetch(url)
      const text = await res.text()
      document.getElementById("apiResponseBody").textContent = text
    }

    modal.show()
  })

})

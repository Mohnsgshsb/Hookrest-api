const BASEURL = window.location.origin
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {

  const apiContent = document.getElementById("apiContent")

  // ☰ MENU
  const menuBtn = document.createElement("button")
  menuBtn.innerHTML = "☰"
  menuBtn.className = "menu-btn"
  document.body.appendChild(menuBtn)

  const sidebar = document.createElement("div")
  sidebar.className = "sidebar"
  document.body.appendChild(sidebar)

  menuBtn.onclick = () => sidebar.classList.toggle("open")

  // ICONS
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

  // SIDEBAR
  settings.categories.forEach((cat, index) => {
    const item = document.createElement("div")
    item.className = "sidebar-item"

    item.innerHTML = `
      <i class="fas ${getIcon(cat.name)}"></i>
      <span>${cat.name}</span>
    `

    item.onclick = () => window.location.href = `?category=${index}`

    sidebar.appendChild(item)
  })

  const params = new URLSearchParams(window.location.search)
  const selectedCategoryIndex = params.get("category")

  // =========================
  // 🏠 HOME
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

    // DISTRIBUTION
    let distHTML = ""
    settings.categories.forEach(c => {
      const percent = ((c.items.length / totalEndpoints) * 100).toFixed(0)
      distHTML += `
        <div class="dist-box">
          <div class="dist-top">
            <span><i class="fas ${getIcon(c.name)}"></i> ${c.name}</span>
            <span>${c.items.length} endpoints (${percent}%)</span>
          </div>
          <div class="dist-bar">
            <div style="width:${percent}%"></div>
          </div>
        </div>
      `
    })

    apiContent.innerHTML = `
      <div class="dashboard">

        <h2 class="title">📊 API Dashboard</h2>

        <div class="stats-grid">
          <div class="stat-card"><h4>Total</h4><p>${totalEndpoints}</p></div>
          <div class="stat-card"><h4>Sections</h4><p>${sectionsCount}</p></div>
          <div class="stat-card"><h4>Top</h4><p>${dominant.name}</p></div>
        </div>

        <div class="distribution">
          <h3>Sections Distribution</h3>
          ${distHTML}
        </div>

      </div>
    `
  }

  // =========================
  // 📂 CATEGORY
  // =========================
  else {
    const category = settings.categories[selectedCategoryIndex]

    apiContent.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <i class="fas ${getIcon(category.name)}"></i>
          <h2>${category.name}</h2>
        </div>

        <div class="api-grid"></div>
      </div>
    `

    const grid = document.querySelector(".api-grid")

    category.items.forEach(item => {

      const tryLink = BASEURL + item.path

      const card = document.createElement("div")
      card.className = "api-card"

      card.innerHTML = `
        <div class="api-top">
          <span class="method">GET</span>
          <button class="try-btn" onclick="window.open('${tryLink}','_blank')">Try</button>
        </div>

        <div class="api-body">
          <h4>${item.name}</h4>
          <p>${item.desc || "No description"}</p>
          <code>${item.path}</code>
        </div>
      `

      grid.appendChild(card)
    })
  }

})

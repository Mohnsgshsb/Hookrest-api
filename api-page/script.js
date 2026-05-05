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

  menuBtn.onclick = () => sidebar.classList.toggle("open")

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

    let html = `
    <div class="dashboard">

      <h2 class="dash-title">📊 API Statistics Dashboard</h2>

      <div class="stats-grid">

        <div class="stat-card">
          <i class="fas fa-code"></i>
          <h4>Total Endpoints</h4>
          <p>${totalEndpoints}</p>
        </div>

        <div class="stat-card">
          <i class="fas fa-layer-group"></i>
          <h4>Total Sections</h4>
          <p>${sectionsCount}</p>
        </div>

        <div class="stat-card">
          <i class="fas fa-crown"></i>
          <h4>Dominant Section</h4>
          <p>${dominant.name}</p>
        </div>

      </div>

      <h3 class="dist-title">📊 Sections Distribution</h3>
      <div class="dist-wrapper">
    `

    settings.categories.forEach(cat => {
      const percent = ((cat.items.length / totalEndpoints) * 100).toFixed(0)

      html += `
        <div class="dist-row">
          <div class="dist-header">
            <span>${cat.name}</span>
            <span>${cat.items.length} endpoints (${percent}%)</span>
          </div>
          <div class="dist-bar">
            <div class="dist-fill" style="width:${percent}%"></div>
          </div>
        </div>
      `
    })

    html += `
      </div>

      <!-- PROFILE -->
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

      <!-- LOGO -->
      <div class="home-card center">
        <img src="/src/icon.png" class="api-logo">
        <h2>Terbo API</h2>
        <p>Best API Services For Developers 🚀</p>
      </div>

      <!-- EXAMPLE -->
      <div class="home-card">
        <h3>⚡ Example API</h3>
        <div class="code-box">
<pre>${BASEURL}/api/gpt?text=hello</pre>
        </div>
      </div>

    </div>
    `

    apiContent.innerHTML = html
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

      card.innerHTML = `
        <div class="card-top">
          <span class="method-badge">GET</span>
          <span class="endpoint-path">${item.path}</span>
        </div>

        <div class="card-body">
          <h4>${item.name}</h4>
          <p>${item.desc}</p>
        </div>

        <button class="try-btn">Try It</button>
      `

      // ✅ TRY IT مباشر
      card.querySelector(".try-btn").onclick = () => {
        let url = BASEURL + item.path

        if (url.includes("url=")) url += "https://tiktok.com/@test/video/123"
        else if (url.includes("text=")) url += "hello"
        else if (url.includes("q=")) url += "test"
        else if (url.includes("prompt=")) url += "anime"

        window.open(url, "_blank")
      }

      container.appendChild(card)
    })

    apiContent.appendChild(container)
  }

})

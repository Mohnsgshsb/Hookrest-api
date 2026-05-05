const BASEURL = window.location.origin
const particlesJS = window.particlesJS
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {

  document.body.classList.add("dark-mode")

  // =========================
  // ☰ MENU BUTTON
  // =========================
  const menuBtn = document.createElement("button")
  menuBtn.innerHTML = "☰"
  Object.assign(menuBtn.style, {
    position: "fixed",
    top: "15px",
    left: "15px",
    zIndex: "999",
    fontSize: "22px",
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer"
  })
  document.body.appendChild(menuBtn)

  // =========================
  // SIDEBAR
  // =========================
  const sidebar = document.createElement("div")
  Object.assign(sidebar.style, {
    position: "fixed",
    top: "0",
    left: "-260px",
    width: "260px",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    padding: "20px",
    transition: "0.3s",
    zIndex: "998",
    overflowY: "auto"
  })
  document.body.appendChild(sidebar)

  menuBtn.onclick = () => {
    sidebar.style.left = sidebar.style.left === "0px" ? "-260px" : "0px"
  }

  // =========================
  // ICON FUNCTION
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

  // =========================
  // PARTICLES
  // =========================
  particlesJS("particles-js", {
    particles: {
      number: { value: 80 },
      color: { value: "#6c5ce7" },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: 3, random: true },
      move: { enable: true, speed: 2 }
    }
  })

  try {
    const settings = await fetch(BASEURL + "/src/settings.json").then(res => res.json())
    const apiContent = document.getElementById("apiContent")

    // =========================
    // SIDEBAR ITEMS
    // =========================
    settings.categories.forEach((cat, index) => {
      const item = document.createElement("div")

      item.innerHTML = `
        <i class="fas ${getIcon(cat.name)}"></i>
        <span>${cat.name}</span>
      `

      Object.assign(item.style, {
        marginBottom: "10px",
        cursor: "pointer",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "rgba(255,255,255,0.05)",
        transition: "0.2s"
      })

      item.onmouseenter = () => item.style.background = "rgba(108,92,231,0.3)"
      item.onmouseleave = () => item.style.background = "rgba(255,255,255,0.05)"

      item.onclick = () => {
        window.location.href = `?category=${index}`
      }

      sidebar.appendChild(item)
    })

    const params = new URLSearchParams(window.location.search)
    const selectedCategoryIndex = params.get("category")

    // =========================
    // DASHBOARD
    // =========================
    if (selectedCategoryIndex === null) {

      const totalEndpoints = settings.categories.reduce((sum, c) => sum + c.items.length, 0)
      const sectionsCount = settings.categories.length

      let dominant = { name: "", count: 0 }
      settings.categories.forEach(c => {
        if (c.items.length > dominant.count) {
          dominant = { name: c.name, count: c.items.length }
        }
      })

      const dash = document.createElement("div")

      dash.innerHTML = `
        <h2 style="margin-bottom:20px;">📊 API Statistics Dashboard</h2>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin-bottom:25px;">
          <div class="stat-card"><h4>Total Endpoints</h4><p>${totalEndpoints}</p></div>
          <div class="stat-card"><h4>Total Sections</h4><p>${sectionsCount}</p></div>
          <div class="stat-card"><h4>Dominant</h4><p>${dominant.name}</p></div>
        </div>

        <h3 style="margin-bottom:15px;">📊 Sections Distribution</h3>
      `

      settings.categories.forEach(cat => {
        const percent = ((cat.items.length / totalEndpoints) * 100).toFixed(0)

        const bar = document.createElement("div")
        bar.style.marginBottom = "15px"

        bar.innerHTML = `
          <div style="display:flex;justify-content:space-between;">
            <span>${cat.name}</span>
            <span>${cat.items.length}</span>
          </div>
          <div style="background:#222;border-radius:10px;height:8px;overflow:hidden;">
            <div style="width:${percent}%;background:#6c5ce7;height:100%;"></div>
          </div>
        `

        dash.appendChild(bar)
      })

      apiContent.appendChild(dash)

    } else {

      // =========================
      // CATEGORY PAGE
      // =========================
      const category = settings.categories[selectedCategoryIndex]

      const title = document.createElement("h2")
      title.textContent = category.name
      apiContent.appendChild(title)

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
            <span class="endpoint-path">${item.path.split("?")[0]}</span>
            <span class="endpoint-name">${item.name}</span>
          </div>
          <i class="fas fa-chevron-down"></i>
        `

        container.appendChild(card)
      })

      apiContent.appendChild(container)
    }

    // =========================
    // MODAL + EXECUTE FIX
    // =========================
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".api-endpoint-card")) return

      const card = event.target.closest(".api-endpoint-card")
      const { apiPath, apiName, apiDesc } = card.dataset

      const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))

      document.getElementById("apiResponseModalLabel").textContent = apiName
      document.getElementById("apiResponseModalDesc").textContent = apiDesc
      document.getElementById("modalEndpointPath").textContent = apiPath.split("?")[0]
      document.getElementById("modalApiDescription").textContent = apiDesc

      const submitBtn = document.getElementById("submitQueryBtn")
      const clearBtn = document.getElementById("clearQueryBtn")
      const inputContainer = document.getElementById("apiQueryInputContainer")

      inputContainer.innerHTML = ""
      submitBtn.style.display = "inline-block"
      clearBtn.style.display = "none"

      const baseApiUrl = `${BASEURL}${apiPath.split("?")[0]}`
      const params = new URLSearchParams(apiPath.split("?")[1])

      let currentParams = {}

      if (params.toString()) {
        clearBtn.style.display = "inline-block"

        params.forEach((_, param) => {
          const input = document.createElement("input")
          input.className = "form-control mb-2"
          input.placeholder = param
          input.oninput = (e) => {
            currentParams[param] = e.target.value
          }
          inputContainer.appendChild(input)
        })

        submitBtn.onclick = () => {
          const query = new URLSearchParams(currentParams).toString()
          handleApiRequest(`${baseApiUrl}?${query}`)
        }

        clearBtn.onclick = () => {
          inputContainer.querySelectorAll("input").forEach(i => i.value = "")
          currentParams = {}
        }

      } else {
        submitBtn.onclick = () => {
          handleApiRequest(baseApiUrl)
        }
      }

      modal.show()
    })

  } catch (err) {
    console.error(err)
  }
})

// =========================
// API REQUEST
// =========================
async function handleApiRequest(url) {
  const resBox = document.getElementById("apiResponseBody")
  resBox.textContent = "Loading..."

  try {
    const res = await fetch(url)
    const text = await res.text()
    resBox.textContent = text
  } catch (e) {
    resBox.textContent = "Error: " + e.message
  }
          }

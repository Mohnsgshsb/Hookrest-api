const BASEURL = window.location.origin
const particlesJS = window.particlesJS
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen")
  const body = document.body
  body.classList.add("no-scroll")
  document.body.classList.add("dark-mode")

  // 🔥 إنشاء زرار ☰ تلقائي
  const menuBtn = document.createElement("button")
  menuBtn.innerHTML = "☰"
  menuBtn.style.position = "fixed"
  menuBtn.style.top = "15px"
  menuBtn.style.left = "15px"
  menuBtn.style.zIndex = "999"
  menuBtn.style.fontSize = "22px"
  menuBtn.style.background = "transparent"
  menuBtn.style.border = "none"
  menuBtn.style.color = "#fff"
  document.body.appendChild(menuBtn)

  // 🔥 إنشاء Sidebar
  const sidebar = document.createElement("div")
  sidebar.style.position = "fixed"
  sidebar.style.top = "0"
  sidebar.style.left = "-260px"
  sidebar.style.width = "260px"
  sidebar.style.height = "100%"
  sidebar.style.background = "#111"
  sidebar.style.padding = "20px"
  sidebar.style.transition = "0.3s"
  sidebar.style.zIndex = "998"
  sidebar.style.overflowY = "auto"
  document.body.appendChild(sidebar)

  menuBtn.onclick = () => {
    sidebar.style.left = sidebar.style.left === "0px" ? "-260px" : "0px"
  }

  particlesJS("particles-js", {
    particles: {
      number: { value: 80 },
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
    }
  })

  try {
    const settings = await fetch(BASEURL + "/src/settings.json").then(res => res.json())

    const apiContent = document.getElementById("apiContent")

    // 🔥 إضافة الكاتيجوريز في السايد بار
    settings.categories.forEach((cat, index) => {
      const item = document.createElement("div")
      item.textContent = cat.name
      item.style.margin = "10px 0"
      item.style.cursor = "pointer"
      item.style.color = "#fff"

      item.onclick = () => {
        window.location.href = `?category=${index}`
      }

      sidebar.appendChild(item)
    })

    // 🔥 تحديد الكاتيجوري من الرابط
    const params = new URLSearchParams(window.location.search)
    const selectedCategoryIndex = params.get("category")

    if (selectedCategoryIndex !== null) {
      const category = settings.categories[selectedCategoryIndex]

      const title = document.createElement("h2")
      title.textContent = category.name
      apiContent.appendChild(title)

      const container = document.createElement("div")
      container.className = "api-category-content"

      category.items.forEach((item) => {
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

    } else {
      apiContent.innerHTML = "<h2>☰ اختار قسم من القائمة</h2>"
    }

    // 🔥 نفس المودال القديم بدون تعديل
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".api-endpoint-card")) return

      const card = event.target.closest(".api-endpoint-card")
      const { apiPath, apiName, apiDesc } = card.dataset

      const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))

      document.getElementById("apiResponseModalLabel").textContent = apiName
      document.getElementById("apiResponseModalDesc").textContent = apiDesc
      document.getElementById("modalEndpointPath").textContent = apiPath.split("?")[0]
      document.getElementById("modalApiDescription").textContent = apiDesc

      modal.show()
    })

  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(() => {
      loadingScreen.style.opacity = 0
      setTimeout(() => {
        loadingScreen.style.display = "none"
        body.classList.remove("no-scroll")
      }, 300)
    }, 500)
  }
})

const BASEURL = window.location.origin
const particlesJS = window.particlesJS
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen")
  const body = document.body
  body.classList.add("no-scroll")
  document.body.classList.add("dark-mode")

  // زرار المينيو
  const menuBtn = document.getElementById("menuBtn")
  const sidebar = document.getElementById("sidebar")
  const categoryList = document.getElementById("categoryList")

  if (menuBtn) {
    menuBtn.onclick = () => {
      sidebar.classList.toggle("active")
    }
  }

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
    }
  })

  try {
    const settings = await fetch(BASEURL + "/src/settings.json").then(res => res.json())

    const apiContent = document.getElementById("apiContent")

    // 🔥 عرض الكاتيجوريز في السايد بار
    settings.categories.forEach((cat, index) => {
      const div = document.createElement("div")
      div.textContent = cat.name
      div.onclick = () => {
        window.location.href = `?category=${index}`
      }
      categoryList.appendChild(div)
    })

    // 🔥 تحديد الكاتيجوري من الرابط
    const params = new URLSearchParams(window.location.search)
    const selectedCategoryIndex = params.get("category")

    if (selectedCategoryIndex !== null) {
      const category = settings.categories[selectedCategoryIndex]

      const categoryDiv = document.createElement("div")
      categoryDiv.className = "api-category"

      const title = document.createElement("h2")
      title.textContent = category.name
      categoryDiv.appendChild(title)

      const container = document.createElement("div")
      container.className = "api-category-content"

      category.items.forEach((item) => {
        const card = document.createElement("div")
        card.className = "api-endpoint-card"

        card.innerHTML = `
          <span class="method-badge">GET</span>
          <div class="endpoint-text">
            <span>${item.name}</span>
            <small>${item.desc}</small>
          </div>
        `

        card.onclick = () => {
          const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))

          document.getElementById("apiResponseModalLabel").textContent = item.name
          document.getElementById("apiResponseModalDesc").textContent = item.desc
          document.getElementById("modalEndpointPath").textContent = item.path.split("?")[0]

          modal.show()
        }

        container.appendChild(card)
      })

      categoryDiv.appendChild(container)
      apiContent.appendChild(categoryDiv)

    } else {
      apiContent.innerHTML = "<h2>☰ اختار قسم من القائمة</h2>"
    }

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

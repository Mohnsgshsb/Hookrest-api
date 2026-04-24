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
      opacity: { value: 0.5, random: false },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#6c5ce7",
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true,
      },
    },
  })

  const animateElements = document.querySelectorAll(".animate")

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1
          entry.target.style.transform = "translateY(0)"
        }
      })
    },
    { threshold: 0.1 },
  )

  animateElements.forEach((el) => {
    el.style.opacity = 0
    el.style.transform = "translateY(30px)"
    observer.observe(el)
  })

  try {
    const settings = await fetch(BASEURL + "/src/settings.json").then((res) => res.json())

    const setContent = (id, property, value) => {
      const element = document.getElementById(id)
      if (element) element[property] = value
    }

    document.getElementById("currentYear").textContent = new Date().getFullYear()

    setContent("page", "textContent", settings.name || "Hookrest API")
    setContent("header", "textContent", settings.name || "Hookrest API")
    setContent("footerBrand", "textContent", settings.name || "Hookrest API")
    setContent("name", "textContent", settings.name || "Hookrest API")
    setContent("copyrightName", "textContent", settings.name || "Hookrest API")
    setContent("description", "textContent", settings.description || "Simple API's")

    const apiContent = document.getElementById("apiContent")

    let totalEndpoints = 0
    settings.categories.forEach((category) => {
      totalEndpoints += category.items.length
    })

    const endpointsCounter = document.getElementById("endpointsCounter")
    const totalEndpointsSpan = document.getElementById("totalEndpoints")
    if (endpointsCounter && totalEndpointsSpan) {
      totalEndpointsSpan.textContent = totalEndpoints
      endpointsCounter.style.display = "flex"
    }

    settings.categories.forEach((category) => {
      const categoryDiv = document.createElement("div")
      categoryDiv.className = "api-category animate"

      const categoryTitle = document.createElement("div")
      categoryTitle.className = "api-category-header"
      categoryTitle.innerHTML = `<span>${category.name}</span>`

      categoryDiv.appendChild(categoryTitle)

      const categoryBody = document.createElement("div")
      categoryBody.className = "api-category-content"
      categoryBody.style.display = "grid"

      const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name))
      sortedItems.forEach((item) => {
        const endpointCard = document.createElement("div")
        endpointCard.className = "api-endpoint-card"
        endpointCard.dataset.apiPath = item.path
        endpointCard.dataset.apiName = item.name
        endpointCard.dataset.apiDesc = item.desc
        endpointCard.dataset.apiInnerDesc = item.innerDesc || ""
        endpointCard.innerHTML = `<span class="method-badge">GET</span><div class="endpoint-text"><span class="endpoint-name">${item.name}</span></div><span class="arrow-icon">»</span>`
        categoryBody.appendChild(endpointCard)
      })

      categoryDiv.appendChild(categoryBody)
      apiContent.appendChild(categoryDiv)

      observer.observe(categoryDiv)
    })

    const searchInput = document.getElementById("searchInput")
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase()
      document.querySelectorAll(".api-endpoint-card").forEach((item) => {
        const name = item.dataset.apiName.toLowerCase()
        const path = item.dataset.apiPath.toLowerCase()
        item.style.display = name.includes(searchTerm) || path.includes(searchTerm) ? "flex" : "none"
      })
      document.querySelectorAll(".api-category").forEach((categoryDiv) => {
        const categoryBody = categoryDiv.querySelector(".api-category-content")
        const visibleItems = categoryBody.querySelectorAll('.api-endpoint-card[style*="display: flex"]')
        if (visibleItems.length > 0) {
          categoryDiv.style.display = ""
          categoryBody.style.display = "grid"
        } else {
          categoryDiv.style.display = "none"
        }
      })
    })

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".api-endpoint-card")) return
      const card = event.target.closest(".api-endpoint-card")
      const { apiPath, apiName, apiDesc, apiInnerDesc } = card.dataset
      const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))

      const modalRefs = {
        label: document.getElementById("apiResponseModalLabel"),
        desc: document.getElementById("apiResponseModalDesc"),
        modalApiDescription: document.getElementById("modalApiDescription"),
        modalEndpointPath: document.getElementById("modalEndpointPath"),
        queryInputContainer: document.getElementById("apiQueryInputContainer"),
        submitBtn: document.getElementById("submitQueryBtn"),
        clearBtn: document.getElementById("clearQueryBtn"),
      }

      modalRefs.label.textContent = apiName
      modalRefs.desc.textContent = apiDesc
      modalRefs.modalApiDescription.textContent = apiDesc
      modalRefs.modalEndpointPath.textContent = apiPath.split("?")[0]
      modalRefs.queryInputContainer.innerHTML = ""

      document.getElementById("apiCurlContent").textContent = ""
      document.getElementById("apiRequestUrlContent").textContent = ""
      document.getElementById("apiResponseCode").textContent = ""
      document.getElementById("apiResponseBody").innerHTML = ""
      document.getElementById("apiResponseHeaders").textContent = ""

      document.querySelector(".tab-button[data-tab='parameters']").click()
      document.querySelector(".response-tab-button[data-response-tab='code']").click()

      const baseApiUrl = `${BASEURL}${apiPath.split("?")[0]}`
      const params = new URLSearchParams(apiPath.split("?")[1])
      let currentParams = {}

      modalRefs.submitBtn.style.display = "inline-block"
      modalRefs.clearBtn.style.display = "none"

      if (params.toString()) {
        modalRefs.clearBtn.style.display = "inline-block"

        const paramContainer = document.createElement("div")
        paramContainer.className = "param-container"

        params.forEach((_, param) => {
          const paramGroup = document.createElement("div")
          paramGroup.className = "param-group"
          paramGroup.innerHTML = `<label>${param} *</label><input type="text" class="form-control" data-param="${param}">`
          paramGroup.querySelector("input").addEventListener("input", (e) => {
            currentParams[param] = e.target.value.trim()
            updateCurlAndRequestUrl(baseApiUrl, currentParams)
          })
          paramContainer.appendChild(paramGroup)
        })

        modalRefs.queryInputContainer.appendChild(paramContainer)
        updateCurlAndRequestUrl(baseApiUrl, currentParams)

        modalRefs.submitBtn.onclick = async () => {
          const newParams = new URLSearchParams()
          modalRefs.queryInputContainer.querySelectorAll("input").forEach((input) => {
            if (input.value.trim()) {
              newParams.append(input.dataset.param, input.value.trim())
            }
          })
          handleApiRequest(`${baseApiUrl}?${newParams.toString()}`, apiName)
        }

        modalRefs.clearBtn.onclick = () => {
          modalRefs.queryInputContainer.querySelectorAll("input").forEach((input) => (input.value = ""))
          currentParams = {}
          updateCurlAndRequestUrl(baseApiUrl, currentParams)
        }
      } else {
        updateCurlAndRequestUrl(baseApiUrl, {})
        modalRefs.submitBtn.onclick = async () => {
          handleApiRequest(baseApiUrl, apiName)
        }
      }

      modal.show()
    })

    // ✅ FIXED TAB BUTTONS
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", function () {

        document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"))
        this.classList.add("active")

        document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"))
        const target = document.getElementById(this.dataset.tab + "Tab")
        if (target) target.classList.add("active")

      })
    })

    document.querySelectorAll(".response-tab-button").forEach((button) => {
      button.addEventListener("click", function () {

        document.querySelectorAll(".response-tab-button").forEach(btn => btn.classList.remove("active"))
        this.classList.add("active")

        document.querySelectorAll(".response-tab-pane").forEach(pane => pane.classList.remove("active"))

        const target = document.getElementById(
          "response" + this.dataset.responseTab.charAt(0).toUpperCase() + this.dataset.responseTab.slice(1) + "Tab"
        )

        if (target) target.classList.add("active")

      })
    })

  } catch (error) {
    console.error("Error loading settings:", error)
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

function copyToClipboard(text, successMessage) {
  navigator.clipboard.writeText(text)
}

function updateCurlAndRequestUrl(baseApiUrl, params) {
  const newParams = new URLSearchParams(params)
  const fullRequestUrl = `${baseApiUrl}${newParams.toString() ? "?" + newParams.toString() : ""}`
  document.getElementById("apiRequestUrlContent").textContent = fullRequestUrl
  document.getElementById("apiCurlContent").textContent =
    `curl -X 'GET' \\\n  '${fullRequestUrl}' \\\n  -H 'accept: */*'`
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function handleApiRequest(apiUrl, apiName) {
  const apiResponseCode = document.getElementById("apiResponseCode")
  const apiResponseBody = document.getElementById("apiResponseBody")
  const apiResponseHeaders = document.getElementById("apiResponseHeaders")

  apiResponseCode.textContent = "Loading..."
  apiResponseBody.innerHTML = "Loading..."
  apiResponseHeaders.textContent = "Loading..."

  document.querySelector(".tab-button[data-tab='responses']").click()

  try {
    const response = await fetch(apiUrl)

    apiResponseCode.textContent = response.status

    const contentType = response.headers.get("Content-Type") || ""

    if (contentType.includes("application/json")) {
      const data = await response.json()
      apiResponseBody.textContent = JSON.stringify(data, null, 2)
    } else {
      apiResponseBody.textContent = await response.text()
    }

  } catch (error) {
    apiResponseCode.textContent = "Error"
    apiResponseBody.textContent = error.message
  }
        }

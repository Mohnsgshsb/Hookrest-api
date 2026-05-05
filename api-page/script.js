const BASEURL = window.location.origin
const bootstrap = window.bootstrap

document.addEventListener("DOMContentLoaded", async () => {

  const apiContent = document.getElementById("all-ai")
  const sidebar = document.getElementById("sidebar")
  const toggleSidebar = document.getElementById("toggle-sidebar")
  const threeDots = document.getElementById("three-dots")
  const poupMenu = document.getElementById("poup-menu")
  const dynamicButtons = document.getElementById("dynamic-buttons")

  const modal = document.getElementById("test-modal")
  const modalBody = document.getElementById("modal-body")
  const modalTitle = document.getElementById("modal-title")
  const closeModal = document.querySelector(".close-modal")

  const notification = document.getElementById("notification")

  // ================= MENU =================
  toggleSidebar.onclick = () => {
    sidebar.classList.toggle("open")
  }

  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target)) {
      sidebar.classList.remove("open")
    }
  })

  // ================= POPUP =================
  threeDots.onclick = (e) => {
    e.stopPropagation()
    poupMenu.classList.toggle("open")
  }

  document.addEventListener("click", () => {
    poupMenu.classList.remove("open")
  })

  // ================= NOTIFICATION =================
  function showNotification(msg = "Done") {
    notification.innerText = msg
    notification.classList.add("show")
    setTimeout(() => {
      notification.classList.remove("show")
    }, 2500)
  }

  // ================= MODAL =================
  function openModal(title, content) {
    modalTitle.innerText = title
    modalBody.innerHTML = content
    modal.classList.add("open")
  }

  closeModal.onclick = () => modal.classList.remove("open")
  window.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("open")
  }

  // ================= DESCRIPTION =================
  function parseDescription(desc) {
    const container = document.getElementById("description-content")
    container.innerHTML = ""

    if (!desc) return

    const box = document.createElement("div")
    box.className = "description-container"

    desc.split("\n").forEach(line => {
      const p = document.createElement("p")
      p.className = "description-paragraph"
      p.textContent = line
      box.appendChild(p)
    })

    container.appendChild(box)
  }

  // ================= RENDER API =================
  function renderApis(categories) {
    apiContent.innerHTML = ""

    categories.forEach(cat => {
      const wrap = document.createElement("div")
      wrap.className = "category-container"

      wrap.innerHTML = `
        <div class="category-header">
          <div class="category-title">${cat.name}</div>
          <div class="category-badge">${cat.apis.length}</div>
        </div>
      `

      const table = document.createElement("table")
      table.className = "api-table"

      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Method</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      `

      const tbody = table.querySelector("tbody")

      cat.apis.forEach(api => {
        const tr = document.createElement("tr")

        tr.innerHTML = `
          <td>${api.name}</td>
          <td>${api.method}</td>
          <td><span class="status-indicator">● Online</span></td>
          <td>
            <button class="open-button">Open</button>
            <button class="test-button">Test</button>
          </td>
        `

        // open
        tr.querySelector(".open-button").onclick = () => {
          window.open(api.url, "_blank")
        }

        // test
        tr.querySelector(".test-button").onclick = async () => {
          openModal("Testing...", "⏳ Loading...")

          try {
            const res = await fetch(api.url)
            const text = await res.text()

            openModal("Result", `<pre>${text}</pre>`)
          } catch (err) {
            openModal("Error", `<div class="error-message">${err}</div>`)
          }
        }

        tbody.appendChild(tr)
      })

      wrap.appendChild(table)
      apiContent.appendChild(wrap)
    })
  }

  // ================= SIDEBAR BUTTONS =================
  function loadSidebar(sections) {
    dynamicButtons.innerHTML = ""

    sections.forEach(sec => {
      const btn = document.createElement("button")
      btn.innerHTML = `<i class="material-icons">folder</i> ${sec.name}`

      btn.onclick = () => {
        parseDescription(sec.description)
        renderApis(sec.categories)
        sidebar.classList.remove("open")
      }

      dynamicButtons.appendChild(btn)
    })
  }

  // ================= LOAD DATA =================
  async function loadData() {
    try {
      const res = await fetch(window.location.href + "/api/")
      const data = await res.json()

      loadSidebar(data.sections)

      if (data.sections.length > 0) {
        parseDescription(data.sections[0].description)
        renderApis(data.sections[0].categories)
      }

    } catch (err) {
      openModal("Error", "❌ Failed to load API")
    }
  }

  // ================= START =================
  await loadData()

})

// Global variables
let tasks = []
let isLoading = false
let previousStats = { total: 0, pending: 0, completed: 0, overdue: 0 }
let currentView = "board"
let currentSort = "date"

// DOM elements
const elements = {
  // Theme
  themeToggle: document.getElementById("theme-toggle"),

  // Form
  taskForm: document.getElementById("task-form"),
  taskIdInput: document.getElementById("task_id"),
  descriptionInput: document.getElementById("description"),
  dueDateInput: document.getElementById("due_date"),
  tagsInput: document.getElementById("tags"),
  addBtn: document.getElementById("add-btn"),

  // Loading
  loadingContainer: document.getElementById("loading-container"),
  tasksContainer: document.getElementById("tasks-container"),

  // Task lists
  pendingList: document.getElementById("pending-list"),
  completedList: document.getElementById("completed-list"),
  pendingEmpty: document.getElementById("pending-empty"),
  completedEmpty: document.getElementById("completed-empty"),

  // Stats
  totalTasks: document.getElementById("total-tasks"),
  pendingTasks: document.getElementById("pending-tasks"),
  completedTasks: document.getElementById("completed-tasks"),
  overdueTasks: document.getElementById("overdue-tasks"),
  pendingCount: document.getElementById("pending-count"),
  completedCount: document.getElementById("completed-count"),

  // Trends
  totalTrend: document.getElementById("total-trend"),
  pendingTrend: document.getElementById("pending-trend"),
  completedTrend: document.getElementById("completed-trend"),
  overdueTrend: document.getElementById("overdue-trend"),

  // Progress bars
  totalProgress: document.getElementById("total-progress"),
  pendingProgress: document.getElementById("pending-progress"),
  completedProgress: document.getElementById("completed-progress"),
  overdueProgress: document.getElementById("overdue-progress"),

  // View controls
  tasksBoard: document.getElementById("tasks-board"),
  viewButtons: document.querySelectorAll(".view-btn"),
  sortSelect: document.getElementById("sort-select"),
  sortPending: document.getElementById("sort-pending"),
  clearCompleted: document.getElementById("clear-completed"),
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeTheme()
  loadTasks()
  setupEventListeners()
  setMinimumDate()
})

// Theme management
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)

  elements.themeToggle.addEventListener("click", toggleTheme)
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  document.documentElement.setAttribute("data-theme", newTheme)
  localStorage.setItem("theme", newTheme)

  // Add ripple effect
  createRippleEffect(elements.themeToggle)
}

// Setup event listeners
function setupEventListeners() {
  elements.taskForm.addEventListener("submit", addTask)

  // Add ripple effect to primary button
  elements.addBtn.addEventListener("click", (e) => {
    if (!elements.addBtn.classList.contains("loading")) {
      createRippleEffect(elements.addBtn, e)
    }
  })

  // Add view toggle functionality
  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.getAttribute("data-view")
      switchView(view)
    })
  })

  // Add sort functionality
  elements.sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value
    renderTasks()
  })

  // Add column action listeners
  elements.sortPending.addEventListener("click", () => {
    sortTasks("pending")
  })

  elements.clearCompleted.addEventListener("click", () => {
    clearCompletedTasks()
  })
}

// Switch between board and list view
function switchView(view) {
  currentView = view

  // Update active button
  elements.viewButtons.forEach((btn) => {
    btn.classList.remove("active")
    if (btn.getAttribute("data-view") === view) {
      btn.classList.add("active")
    }
  })

  // Re-render tasks with new view
  renderTasks()
}

// Set minimum date to today
function setMinimumDate() {
  const today = new Date().toISOString().split("T")[0]
  elements.dueDateInput.min = today
}

// Create ripple effect
function createRippleEffect(button, event = null) {
  const ripple = button.querySelector(".btn-ripple")
  if (ripple) {
    ripple.style.width = "0"
    ripple.style.height = "0"

    setTimeout(() => {
      ripple.style.width = "400px"
      ripple.style.height = "400px"
    }, 10)

    setTimeout(() => {
      ripple.style.width = "0"
      ripple.style.height = "0"
    }, 800)
  }
}

// Load tasks from API (MongoDB database)
async function loadTasks() {
  showLoading(true)

  try {
    const response = await fetch("https://app-umoj.vercel.app/api/tasks")
    if (response.ok) {
      tasks = await response.json()
      // Convert date strings back to Date objects
      tasks = tasks.map((task) => ({
        ...task,
        due_date: new Date(task.due_date),
      }))
    } else {
      throw new Error("Failed to load tasks from database")
    }
  } catch (error) {
    console.error("Error loading tasks:", error)
    showToast("Failed to load tasks from database. Please check your connection.", "error")
    // Fallback to empty array instead of mock data
    tasks = []
  }

  // Add staggered animation
  setTimeout(() => {
    renderTasks()
    updateStats()
    showLoading(false)
  }, 1200)
}

// Show/hide loading state
function showLoading(show) {
  isLoading = show

  if (show) {
    elements.loadingContainer.classList.remove("hidden")
    elements.tasksContainer.classList.add("hidden")
  } else {
    elements.loadingContainer.classList.add("hidden")
    elements.tasksContainer.classList.remove("hidden")
  }
}

// Show toast notification
function showToast(message, type = "success") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 6px; font-size: 1rem;">
            ${type === "success" ? "Success" : "Error"}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
            ${message}
        </div>
    `

  document.body.appendChild(toast)

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = "slideInRight 0.4s ease-out reverse"
    setTimeout(() => toast.remove(), 400)
  }, 5000)
}

// Add new task to database
async function addTask(event) {
  event.preventDefault()

  if (isLoading) return

  // Validate form
  if (!validateForm()) return

  const task = {
    task_id: Number.parseInt(elements.taskIdInput.value),
    description: elements.descriptionInput.value.trim(),
    due_date: new Date(elements.dueDateInput.value),
    status: "pending",
    tags: elements.tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag),
  }

  // Show loading state
  elements.addBtn.classList.add("loading")

  try {
    const response = await fetch("https://app-umoj.vercel.app/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })

    if (response.ok) {
      // Reload tasks from database to get the latest data
      await loadTasks()

      // Reset form and show success
      elements.taskForm.reset()
      clearErrors()
      showToast("Task created successfully and saved to database!", "success")
    } else {
      throw new Error("Failed to create task")
    }
  } catch (error) {
    console.error("Error creating task:", error)
    showToast("Failed to create task. Please check your connection and try again.", "error")
  } finally {
    elements.addBtn.classList.remove("loading")
  }
}

// Validate form inputs
function validateForm() {
  let isValid = true
  clearErrors()

  // Validate task ID
  const taskId = Number.parseInt(elements.taskIdInput.value)
  if (!taskId || taskId <= 0) {
    showFieldError("task-id-error", "Please enter a valid task ID")
    isValid = false
  } else if (tasks.some((task) => task.task_id === taskId)) {
    showFieldError("task-id-error", "Task ID already exists")
    isValid = false
  }

  // Validate description
  if (!elements.descriptionInput.value.trim()) {
    showFieldError("description-error", "Please enter a task description")
    isValid = false
  } else if (elements.descriptionInput.value.trim().length < 3) {
    showFieldError("description-error", "Description must be at least 3 characters")
    isValid = false
  }

  // Validate due date
  const dueDate = new Date(elements.dueDateInput.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (dueDate < today) {
    showFieldError("due-date-error", "Due date cannot be in the past")
    isValid = false
  }

  return isValid
}

// Show field error
function showFieldError(elementId, message) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.animation = "fadeInUp 0.3s ease-out"
  }
}

// Clear all form errors
function clearErrors() {
  const errorElements = document.querySelectorAll(".error-message")
  errorElements.forEach((element) => {
    element.textContent = ""
    element.style.animation = ""
  })
}

// Sort tasks based on current sort option
function sortTasks(taskList) {
  return [...taskList].sort((a, b) => {
    switch (currentSort) {
      case "date":
        return new Date(a.due_date) - new Date(b.due_date)
      case "priority":
        // Sort by overdue first, then by due date
        const aOverdue = isTaskOverdue(a) && a.status === "pending"
        const bOverdue = isTaskOverdue(b) && b.status === "pending"
        if (aOverdue !== bOverdue) return bOverdue - aOverdue
        return new Date(a.due_date) - new Date(b.due_date)
      case "status":
        if (a.status !== b.status) {
          return a.status === "pending" ? -1 : 1
        }
        return new Date(a.due_date) - new Date(b.due_date)
      case "id":
        return a.task_id - b.task_id
      default:
        return new Date(a.due_date) - new Date(b.due_date)
    }
  })
}

// Clear completed tasks from database
function clearCompletedTasks() {
  const completedTasks = tasks.filter((task) => task.status === "completed")
  const completedCount = completedTasks.length

  if (completedCount === 0) {
    showToast("No completed tasks to clear", "error")
    return
  }

  showConfirmDialog(
    "Clear all completed tasks?",
    `Are you sure you want to delete ${completedCount} completed task(s) from the database? This action cannot be undone.`,
  ).then(async (confirmed) => {
    if (confirmed) {
      try {
        // Delete each completed task from database
        const deletePromises = completedTasks.map((task) =>
          fetch(`https://app-umoj.vercel.app/api/tasks/${task._id}`, {
            method: "DELETE",
          }),
        )

        await Promise.all(deletePromises)

        // Reload tasks from database
        await loadTasks()
        showToast(`Cleared ${completedCount} completed task(s) from database successfully!`, "success")
      } catch (error) {
        console.error("Error clearing completed tasks:", error)
        showToast("Failed to clear completed tasks. Please check your connection.", "error")
      }
    }
  })
}

// Render tasks based on current view
function renderTasks() {
  if (currentView === "board") {
    renderBoardView()
  } else {
    renderListView()
  }
}

// Render board view (original column layout)
function renderBoardView() {
  // Show board layout
  elements.tasksBoard.style.display = "grid"
  elements.tasksBoard.className = "tasks-board"

  const pendingTasks = sortTasks(tasks.filter((task) => task.status === "pending"))
  const completedTasks = sortTasks(tasks.filter((task) => task.status === "completed"))

  // Render task lists in columns
  renderTaskList(pendingTasks, elements.pendingList, elements.pendingEmpty)
  renderTaskList(completedTasks, elements.completedList, elements.completedEmpty)

  // Update counts
  elements.pendingCount.textContent = pendingTasks.length
  elements.completedCount.textContent = completedTasks.length
}

// Render list view (single column with all tasks)
function renderListView() {
  // Change to single column layout
  elements.tasksBoard.style.display = "block"
  elements.tasksBoard.className = "tasks-list-view"

  // Clear existing content
  elements.tasksBoard.innerHTML = ""

  // Sort all tasks
  const sortedTasks = sortTasks(tasks)

  // Create single list container
  const listContainer = document.createElement("div")
  listContainer.className = "list-container"

  if (sortedTasks.length === 0) {
    listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-illustration">
                    <div class="empty-circle">
                        <div class="empty-lines">
                            <div class="empty-line"></div>
                            <div class="empty-line"></div>
                            <div class="empty-line"></div>
                        </div>
                    </div>
                </div>
                <h3 class="empty-title">No Tasks Found</h3>
                <p class="empty-description">Create your first task to get started with productivity!</p>
            </div>
        `
  } else {
    // Add header
    const listHeader = document.createElement("div")
    listHeader.className = "list-header"
    listHeader.innerHTML = `
            <h3 class="list-title">All Tasks (${sortedTasks.length})</h3>
            <div class="list-stats">
                <span class="stat-item pending-stat">${tasks.filter((t) => t.status === "pending").length} Pending</span>
                <span class="stat-item completed-stat">${tasks.filter((t) => t.status === "completed").length} Completed</span>
                <span class="stat-item overdue-stat">${tasks.filter((t) => t.status === "pending" && isTaskOverdue(t)).length} Overdue</span>
            </div>
        `
    listContainer.appendChild(listHeader)

    // Add tasks
    sortedTasks.forEach((task, index) => {
      const taskElement = createListTaskElement(task)
      taskElement.style.animationDelay = `${index * 100}ms`
      taskElement.classList.add("fade-in")
      listContainer.appendChild(taskElement)
    })
  }

  elements.tasksBoard.appendChild(listContainer)
}

// Create task element for list view
function createListTaskElement(task) {
  const taskDiv = document.createElement("div")
  taskDiv.className = `list-task-item ${task.status}`

  // Check if task is overdue
  const isOverdue = isTaskOverdue(task)
  if (isOverdue && task.status === "pending") {
    taskDiv.classList.add("overdue")
  }

  const dueDate = new Date(task.due_date)
  const formattedDate = formatDate(dueDate)
  const overdueIndicator =
    isOverdue && task.status === "pending" ? '<span class="overdue-indicator">Overdue</span>' : ""

  // Calculate days until due
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let dueDateClass = ""
  if (task.status === "pending") {
    if (diffDays < 0) dueDateClass = "overdue-date"
    else if (diffDays === 0) dueDateClass = "today-date"
    else if (diffDays <= 3) dueDateClass = "soon-date"
  }

  taskDiv.innerHTML = `
        <div class="list-task-content">
            <div class="list-task-main">
                <div class="list-task-header">
                    <div class="task-id">ID ${task.task_id}</div>
                    <div class="task-status-badge ${task.status}">${task.status === "pending" ? "PENDING" : "COMPLETED"}</div>
                </div>
                <div class="list-task-description">${escapeHtml(task.description)}</div>
                <div class="list-task-meta">
                    <div class="list-task-due ${dueDateClass}">
                        Due: ${formattedDate}${overdueIndicator}
                    </div>
                    <div class="list-task-tags">
                        ${task.tags.map((tag) => `<span class="list-task-tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                </div>
            </div>
            <div class="list-task-actions">
                <button class="list-task-btn ${task.status === "pending" ? "complete" : "undo"}" 
                        onclick="toggleStatus('${task._id}', '${task.status}')">
                    ${task.status === "pending" ? "Complete" : "Undo"}
                </button>
                <button class="list-task-btn delete" onclick="deleteTask('${task._id}')">
                    Delete
                </button>
            </div>
        </div>
    `

  // Add click handler for task completion toggle
  taskDiv.addEventListener("click", (e) => {
    if (!e.target.closest(".list-task-actions")) {
      toggleStatus(task._id, task.status)
    }
  })

  return taskDiv
}

// Render task list for board view
function renderTaskList(taskList, container, emptyState) {
  // Clear existing tasks (except empty state)
  const existingTasks = container.querySelectorAll(".task-item")
  existingTasks.forEach((task) => task.remove())

  if (taskList.length === 0) {
    emptyState.classList.remove("hidden")
  } else {
    emptyState.classList.add("hidden")

    taskList.forEach((task, index) => {
      const taskElement = createTaskElement(task)
      taskElement.style.animationDelay = `${index * 150}ms`
      taskElement.classList.add("fade-in")
      container.appendChild(taskElement)
    })
  }
}

// Create task element for board view
function createTaskElement(task) {
  const taskDiv = document.createElement("div")
  taskDiv.className = `task-item ${task.status}`

  // Check if task is overdue
  const isOverdue = isTaskOverdue(task)
  if (isOverdue && task.status === "pending") {
    taskDiv.classList.add("overdue")
  }

  const dueDate = new Date(task.due_date)
  const formattedDate = formatDate(dueDate)
  const overdueIndicator =
    isOverdue && task.status === "pending" ? '<span class="overdue-indicator">Overdue</span>' : ""

  taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-id">ID ${task.task_id}</div>
            <div class="task-actions">
                <button class="task-btn ${task.status === "pending" ? "complete" : "undo"}" 
                        onclick="toggleStatus('${task._id}', '${task.status}')">
                    ${task.status === "pending" ? "Complete" : "Undo"}
                </button>
                <button class="task-btn delete" onclick="deleteTask('${task._id}')">
                    Delete
                </button>
            </div>
        </div>
        <div class="task-description">${escapeHtml(task.description)}</div>
        <div class="task-meta">
            <div class="task-due-date">
                ${formattedDate}${overdueIndicator}
            </div>
            <div class="task-tags">
                ${task.tags.map((tag) => `<div class="task-tag">${escapeHtml(tag)}</div>`).join("")}
            </div>
        </div>
    `

  // Add click handler for task completion toggle
  taskDiv.addEventListener("click", (e) => {
    if (!e.target.closest(".task-actions")) {
      toggleStatus(task._id, task.status)
    }
  })

  return taskDiv
}

// Check if task is overdue
function isTaskOverdue(task) {
  const today = new Date()
  const dueDate = new Date(task.due_date)
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

// Format date for display
function formatDate(date) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) {
    return "Today"
  } else if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow"
  } else if (date.getTime() === yesterday.getTime()) {
    return "Yesterday"
  } else {
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (Math.abs(diffDays) <= 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      })
    }
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Toggle task status in database
async function toggleStatus(id, currentStatus) {
  try {
    const newStatus = currentStatus === "pending" ? "completed" : "pending"

    const response = await fetch(`https://app-umoj.vercel.app/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (response.ok) {
      // Reload tasks from database
      await loadTasks()
      showToast(`Task ${newStatus === "completed" ? "completed" : "reopened"} successfully!`, "success")
    } else {
      throw new Error("Failed to update task status")
    }
  } catch (error) {
    console.error("Error updating task:", error)
    showToast("Failed to update task. Please check your connection.", "error")
  }
}

// Delete task from database
async function deleteTask(id) {
  // Create custom confirmation dialog
  const confirmed = await showConfirmDialog(
    "Are you sure you want to delete this task?",
    "This action cannot be undone and will permanently remove the task from the database.",
  )

  if (!confirmed) return

  try {
    const response = await fetch(`https://app-umoj.vercel.app/api/tasks/${id}`, {
      method: "DELETE",
    })

    if (response.ok) {
      // Reload tasks from database
      await loadTasks()
      showToast("Task deleted successfully from database!", "success")
    } else {
      throw new Error("Failed to delete task")
    }
  } catch (error) {
    console.error("Error deleting task:", error)
    showToast("Failed to delete task. Please check your connection.", "error")
  }
}

// Show confirmation dialog
function showConfirmDialog(title, message) {
  return new Promise((resolve) => {
    const dialog = document.createElement("div")
    dialog.className = "loading-overlay"
    dialog.innerHTML = `
            <div class="loading-content" style="max-width: 450px;">
                <h3 style="margin-bottom: 16px; color: var(--text-primary); font-size: 1.5rem; font-weight: 700;">${title}</h3>
                <p style="margin-bottom: 30px; color: var(--text-secondary); line-height: 1.6; font-size: 1rem;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: flex-end;">
                    <button class="cancel-btn" style="padding: 12px 24px; border: 2px solid var(--border-primary); background: transparent; color: var(--text-secondary); border-radius: var(--radius-lg); cursor: pointer; font-weight: 600; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease;">Cancel</button>
                    <button class="confirm-btn" style="padding: 12px 24px; background: linear-gradient(135deg, var(--error), #dc2626); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 600; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease; box-shadow: var(--shadow-md);">Delete</button>
                </div>
            </div>
        `

    document.body.appendChild(dialog)
    dialog.classList.remove("hidden")

    const cancelBtn = dialog.querySelector(".cancel-btn")
    const confirmBtn = dialog.querySelector(".confirm-btn")

    // Add hover effects
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "var(--bg-tertiary)"
      cancelBtn.style.borderColor = "var(--accent-primary)"
      cancelBtn.style.color = "var(--accent-primary)"
    })

    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "transparent"
      cancelBtn.style.borderColor = "var(--border-primary)"
      cancelBtn.style.color = "var(--text-secondary)"
    })

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.transform = "translateY(-2px)"
      confirmBtn.style.boxShadow = "var(--shadow-lg)"
    })

    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)"
      confirmBtn.style.boxShadow = "var(--shadow-md)"
    })

    cancelBtn.addEventListener("click", () => {
      dialog.remove()
      resolve(false)
    })

    confirmBtn.addEventListener("click", () => {
      dialog.remove()
      resolve(true)
    })

    // Close on backdrop click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.remove()
        resolve(false)
      }
    })
  })
}

// Update statistics with animations
function updateStats() {
  const total = tasks.length
  const pending = tasks.filter((task) => task.status === "pending").length
  const completed = tasks.filter((task) => task.status === "completed").length
  const overdue = tasks.filter((task) => task.status === "pending" && isTaskOverdue(task)).length

  // Calculate trends
  const trends = {
    total: total - previousStats.total,
    pending: pending - previousStats.pending,
    completed: completed - previousStats.completed,
    overdue: overdue - previousStats.overdue,
  }

  // Update numbers with animation
  animateNumber(elements.totalTasks, total)
  animateNumber(elements.pendingTasks, pending)
  animateNumber(elements.completedTasks, completed)
  animateNumber(elements.overdueTasks, overdue)

  // Update trends
  updateTrend(elements.totalTrend, trends.total)
  updateTrend(elements.pendingTrend, trends.pending)
  updateTrend(elements.completedTrend, trends.completed)
  updateTrend(elements.overdueTrend, trends.overdue)

  // Update progress bars
  updateProgressBar(elements.totalProgress, total, Math.max(total, 10))
  updateProgressBar(elements.pendingProgress, pending, total || 1)
  updateProgressBar(elements.completedProgress, completed, total || 1)
  updateProgressBar(elements.overdueProgress, overdue, total || 1)

  // Store current stats for next comparison
  previousStats = { total, pending, completed, overdue }
}

// Update trend indicator
function updateTrend(element, change) {
  element.textContent = change >= 0 ? `+${change}` : `${change}`

  // Update trend class
  element.className = "card-trend"
  if (change > 0) {
    element.classList.add("positive")
  } else if (change < 0) {
    element.classList.add("negative")
  } else {
    element.classList.add("neutral")
  }
}

// Update progress bar
function updateProgressBar(element, current, total) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  element.style.width = `${Math.min(percentage, 100)}%`
}

// Animate number changes
function animateNumber(element, targetNumber) {
  const currentNumber = Number.parseInt(element.textContent) || 0
  const increment = targetNumber > currentNumber ? 1 : -1
  const duration = 1500
  const steps = Math.abs(targetNumber - currentNumber)
  const stepDuration = steps > 0 ? duration / steps : 0

  if (steps === 0) return

  let current = currentNumber
  const timer = setInterval(
    () => {
      current += increment
      element.textContent = current

      if (current === targetNumber) {
        clearInterval(timer)
        // Add completion animation
        element.style.transform = "scale(1.15)"
        setTimeout(() => {
          element.style.transform = "scale(1)"
        }, 300)
      }
    },
    Math.max(stepDuration, 80),
  )
}

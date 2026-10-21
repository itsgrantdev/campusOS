"use strict";

// CampusOS — Core Setup
const CampusOS = {
  data: {
    courses: [],
    assignments: [],
    events: [],
    study: []
  },

  currentUser: null,
  selectedDate: new Date(),
  calendarDate: new Date(),
  editingItem: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const STORAGE_KEY = "campusOS_data";
const USER_KEY = "campusOS_user";
const THEME_KEY = "campusOS_theme";

// Save and load the user's data
function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(CampusOS.data)
    );
  } catch (error) {
    console.error("Could not save CampusOS data:", error);
    showToast("Unable to save your changes.");
  }
}

function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
      const parsedData = JSON.parse(savedData);

      CampusOS.data.courses = Array.isArray(parsedData.courses)
        ? parsedData.courses : [];

      CampusOS.data.assignments = Array.isArray(parsedData.assignments)
        ? parsedData.assignments : [];

      CampusOS.data.events = Array.isArray(parsedData.events)
        ? parsedData.events : [];

      CampusOS.data.study = Array.isArray(parsedData.study)
        ? parsedData.study : [];
    }
  } catch (error) {
    console.error("Could not load CampusOS data:", error);
  }
}

// General helpers
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "No date set";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "No date set";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function showToast(message) {
  const toast = $("#toast");

  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// ========================================
// PART 2: LOGIN, LOGOUT & NAVIGATION
// ========================================

function showLogin() {
  const loginScreen = $("#login-screen");
  const app = $("#app");

  if (loginScreen) loginScreen.classList.remove("hidden");
  if (app) app.classList.add("hidden");
}

function showApp() {
  const loginScreen = $("#login-screen");
  const app = $("#app");

  if (loginScreen) loginScreen.classList.add("hidden");
  if (app) app.classList.remove("hidden");

  updateProfile();
  renderDashboard();
  renderCourses();
  renderAssignments();
  renderCalendar();
  renderPlanner();
}

function updateProfile() {
  const email = CampusOS.currentUser || "";
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  const profileEmail = $("#profile-email");
  const profileInitial = $("#profile-initial");

  if (profileEmail) profileEmail.textContent = email;
  if (profileInitial) profileInitial.textContent = initial;
}

// Login form
function setupLogin() {
  const loginForm = $("#login-form");

  if (!loginForm) return;

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = $("#login-email");
    const passwordInput = $("#login-password");
    const error = $("#login-error");

    const email = emailInput?.value.trim().toLowerCase();
    const password = passwordInput?.value;

    if (error) error.textContent = "";

    if (!email || !password) {
      if (error) error.textContent = "Enter your email and password.";
      return;
    }

    if (!emailInput.checkValidity()) {
      if (error) error.textContent = "Enter a valid email address.";
      return;
    }

    // Prototype login only; this is not secure authentication.
    CampusOS.currentUser = email;
    localStorage.setItem(USER_KEY, email);

    loadData();
    showApp();
    showToast("Welcome to CampusOS!");
  });
}

// Logout
function setupLogout() {
  const logoutButton = $("#logout-button");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    CampusOS.currentUser = null;
    showLogin();
    showToast("You've been logged out.");
  });
}

// Page navigation
function showPage(pageName) {
  const pages = $$(".page");

  pages.forEach((page) => {
    page.classList.add("hidden");
  });

  const targetPage = $(`#${pageName}-page`);

  if (targetPage) {
    targetPage.classList.remove("hidden");
  }

  $$("[data-page]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "dashboard") renderDashboard();
  if (pageName === "courses") renderCourses();
  if (pageName === "assignments") renderAssignments();
  if (pageName === "calendar") renderCalendar();
  if (pageName === "planner") renderPlanner();
}

function setupNavigation() {
  $$("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  const settingsButton = $("#settings-button");

  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      showPage("settings");
    });
  }
}

// Restore the previous login session
function restoreSession() {
  const savedUser = localStorage.getItem(USER_KEY);

  if (savedUser) {
    CampusOS.currentUser = savedUser;
    loadData();
    showApp();
  } else {
    showLogin();
  }
}

// ========================================
// PART 3: DASHBOARD, COURSES & ASSIGNMENTS
// ========================================

// Count tasks that have not been completed
function getPendingAssignments() {
  return CampusOS.data.assignments.filter(
    (assignment) => assignment.status !== "completed"
  );
}

// Render the dashboard
function renderDashboard() {
  const courses = CampusOS.data.courses;
  const assignments = CampusOS.data.assignments;
  const events = CampusOS.data.events;

  const totalCourses = $("#total-courses");
  const pendingTasks = $("#pending-tasks");
  const upcomingEvents = $("#upcoming-events");
  const completedTasks = $("#completed-tasks");

  if (totalCourses) totalCourses.textContent = courses.length;

  if (pendingTasks) {
    pendingTasks.textContent = getPendingAssignments().length;
  }

  if (upcomingEvents) {
    upcomingEvents.textContent = events.filter(
      (event) => event.date >= getToday()
    ).length;
  }

  if (completedTasks) {
    completedTasks.textContent = assignments.filter(
      (assignment) => assignment.status === "completed"
    ).length;
  }

  renderTodaySchedule();
  renderDeadlines();
  renderProgress();
}

// Today's schedule
function renderTodaySchedule() {
  const container = $("#today-schedule");
  if (!container) return;

  const today = getToday();

  const todaysEvents = CampusOS.data.events
    .filter((event) => event.date === today)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  if (todaysEvents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No events scheduled for today.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = todaysEvents.map((event) => `
    <div class="item-card">
      <div class="item-content">
        <h3>${escapeHTML(event.title)}</h3>
        <p>${escapeHTML(event.time || "Time not set")}</p>
        ${event.location ? `<p>${escapeHTML(event.location)}</p>` : ""}
      </div>
    </div>
  `).join("");
}

// Upcoming assignment deadlines
function renderDeadlines() {
  const container = $("#deadlines-list");
  if (!container) return;

  const deadlines = getPendingAssignments()
    .filter((assignment) => assignment.dueDate >= getToday())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  if (deadlines.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No upcoming deadlines.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = deadlines.map((assignment) => `
    <div class="item-card">
      <div class="item-content">
        <h3>${escapeHTML(assignment.title)}</h3>
        <p>${escapeHTML(assignment.course || "No course selected")}</p>
        <p>Due: ${formatDate(assignment.dueDate)}</p>
      </div>
    </div>
  `).join("");
}

// Assignment completion progress
function renderProgress() {
  const progressValue = $("#progress-value");
  if (!progressValue) return;

  const assignments = CampusOS.data.assignments;

  const completed = assignments.filter(
    (assignment) => assignment.status === "completed"
  ).length;

  const percentage = assignments.length
    ? Math.round((completed / assignments.length) * 100)
    : 0;

  progressValue.textContent = `${percentage}%`;
}

// Render courses
function renderCourses() {
  const container = $("#courses-list");
  if (!container) return;

  if (CampusOS.data.courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No courses yet</h3>
        <p>Add your courses to start organising your semester.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = CampusOS.data.courses.map((course) => `
    <article class="item-card" data-id="${escapeHTML(course.id)}">
      <div class="item-content">
        <h3>${escapeHTML(course.name)}</h3>
        <p>${escapeHTML(course.code || "No course code")}</p>
        ${course.lecturer ? `<p>Lecturer: ${escapeHTML(course.lecturer)}</p>` : ""}
        ${course.credits ? `<p>Units: ${escapeHTML(course.credits)}</p>` : ""}
      </div>
      <div class="item-actions">
        <button type="button" data-edit-type="course" data-id="${escapeHTML(course.id)}">Edit</button>
        <button type="button" data-delete-type="course" data-id="${escapeHTML(course.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

// Render assignments
function renderAssignments() {
  const container = $("#assignments-list");
  if (!container) return;

  const searchInput = $("#assignment-search");
  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const filteredAssignments = CampusOS.data.assignments.filter((assignment) => {
    const searchableText = [
      assignment.title,
      assignment.course,
      assignment.description,
      assignment.status
    ].join(" ").toLowerCase();

    return searchableText.includes(searchTerm);
  });

  if (filteredAssignments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No assignments found</h3>
        <p>Add an assignment or try a different search.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredAssignments.map((assignment) => `
    <article class="item-card" data-id="${escapeHTML(assignment.id)}">
      <div class="item-content">
        <h3>${escapeHTML(assignment.title)}</h3>
        <p>${escapeHTML(assignment.course || "No course selected")}</p>
        <p>Due: ${formatDate(assignment.dueDate)}</p>
        <p>Status: ${escapeHTML(assignment.status || "pending")}</p>
        ${assignment.description ? `<p>${escapeHTML(assignment.description)}</p>` : ""}
      </div>
      <div class="item-actions">
        <button type="button" data-toggle-assignment="${escapeHTML(assignment.id)}">
          ${assignment.status === "completed" ? "Mark Pending" : "Mark Complete"}
        </button>
        <button type="button" data-edit-type="assignment" data-id="${escapeHTML(assignment.id)}">Edit</button>
        <button type="button" data-delete-type="assignment" data-id="${escapeHTML(assignment.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

// ========================================
// PART 4: CALENDAR & STUDY PLANNER
// ========================================

// Render the calendar
function renderCalendar() {
  const grid = $("#calendar-grid");
  const monthLabel = $("#calendar-month");

  if (!grid || !monthLabel) return;

  const year = CampusOS.calendarDate.getFullYear();
  const month = CampusOS.calendarDate.getMonth();

  monthLabel.textContent = CampusOS.calendarDate.toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  let html = weekdays.map((day) =>
    `<div class="calendar-weekday">${day}</div>`
  ).join("");

  for (let i = 0; i < offset; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    const isToday = dateKey === getToday();
    const isSelected =
      dateKey === dateToKey(CampusOS.selectedDate);

    const hasItems = [
      ...CampusOS.data.events,
      ...CampusOS.data.assignments
    ].some((item) =>
      (item.date || item.dueDate) === dateKey
    );

    html += `
      <button
        type="button"
        class="calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${hasItems ? "has-items" : ""}"
        data-calendar-date="${dateKey}"
      >${day}</button>
    `;
  }

  grid.innerHTML = html;
  renderSelectedDate();
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Show items for the selected date
function renderSelectedDate() {
  const label = $("#selected-date-label");
  const container = $("#selected-date-items");

  if (!container) return;

  const selectedKey = dateToKey(CampusOS.selectedDate);

  if (label) {
    label.textContent = CampusOS.selectedDate.toLocaleDateString(
      "en-GB",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );
  }

  const events = CampusOS.data.events
    .filter((event) => event.date === selectedKey)
    .map((event) => ({
      ...event,
      displayType: "Event",
      displayTime: event.time || "Time not set"
    }));

  const assignments = CampusOS.data.assignments
    .filter((assignment) => assignment.dueDate === selectedKey)
    .map((assignment) => ({
      ...assignment,
      displayType: "Assignment",
      displayTime: assignment.status || "pending"
    }));

  const items = [...events, ...assignments];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nothing scheduled for this date.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((item) => `
    <article class="item-card">
      <div class="item-content">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.displayType)} · ${escapeHTML(item.displayTime)}</p>
      </div>
    </article>
  `).join("");
}

// Move between calendar months
function setupCalendar() {
  const previous = $("#calendar-prev");
  const next = $("#calendar-next");

  if (previous) {
    previous.addEventListener("click", () => {
      CampusOS.calendarDate.setMonth(
        CampusOS.calendarDate.getMonth() - 1
      );
      renderCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      CampusOS.calendarDate.setMonth(
        CampusOS.calendarDate.getMonth() + 1
      );
      renderCalendar();
    });
  }

  const grid = $("#calendar-grid");

  if (grid) {
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-calendar-date]");
      if (!button) return;

      const [year, month, day] =
        button.dataset.calendarDate.split("-").map(Number);

      CampusOS.selectedDate = new Date(year, month - 1, day);
      renderCalendar();
    });
  }
}

// Render study planner
function renderPlanner() {
  const container = $("#study-list");
  if (!container) return;

  if (CampusOS.data.study.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No study sessions yet</h3>
        <p>Add a study session to plan your learning time.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = CampusOS.data.study.map((session) => `
    <article class="item-card">
      <div class="item-content">
        <h3>${escapeHTML(session.title)}</h3>
        <p>${formatDate(session.date)}</p>
        ${session.time ? `<p>${escapeHTML(session.time)}</p>` : ""}
        ${session.duration ? `<p>${escapeHTML(session.duration)} minutes</p>` : ""}
        ${session.notes ? `<p>${escapeHTML(session.notes)}</p>` : ""}
      </div>
      <div class="item-actions">
        <button type="button" data-edit-type="study" data-id="${escapeHTML(session.id)}">Edit</button>
        <button type="button" data-delete-type="study" data-id="${escapeHTML(session.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

// ========================================
// PART 5: ADD, EDIT & DELETE ITEMS
// ========================================

const ITEM_CONFIG = {
  course: {
    collection: "courses",
    title: "Course",
    fields: [
      { name: "name", label: "Course name", type: "text", required: true },
      { name: "code", label: "Course code", type: "text" },
      { name: "lecturer", label: "Lecturer", type: "text" },
      { name: "credits", label: "Course units", type: "number" }
    ]
  },

  assignment: {
    collection: "assignments",
    title: "Assignment",
    fields: [
      { name: "title", label: "Assignment title", type: "text", required: true },
      { name: "course", label: "Course", type: "text" },
      { name: "dueDate", label: "Due date", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["pending", "in progress", "completed"]
      },
      { name: "description", label: "Description", type: "textarea" }
    ]
  },

  event: {
    collection: "events",
    title: "Event",
    fields: [
      { name: "title", label: "Event title", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "time", label: "Time", type: "time" },
      { name: "location", label: "Location", type: "text" }
    ]
  },

  study: {
    collection: "study",
    title: "Study Session",
    fields: [
      { name: "title", label: "Study topic", type: "text", required: true },
      { name: "date", label: "Study date", type: "date", required: true },
      { name: "time", label: "Start time", type: "time" },
      { name: "duration", label: "Duration (minutes)", type: "number" },
      { name: "notes", label: "Notes", type: "textarea" }
    ]
  }
};

function openItemModal(type, item = null) {
  const config = ITEM_CONFIG[type];
  const overlay = $("#modal-overlay");
  const title = $("#modal-title");
  const fieldsContainer = $("#form-fields");
  const form = $("#item-form");
  const error = $("#form-error");

  if (!config || !overlay || !fieldsContainer || !form) {
    showToast("The form could not be opened.");
    return;
  }

  CampusOS.editingItem = item
    ? { type, id: item.id }
    : { type, id: null };

  if (title) {
    title.textContent = item
      ? `Edit ${config.title}`
      : `Add ${config.title}`;
  }

  if (error) error.textContent = "";

  fieldsContainer.innerHTML = config.fields.map((field) => {
    const value = item?.[field.name] ?? "";

    if (field.type === "textarea") {
      return `
        <label class="form-field">
          <span>${escapeHTML(field.label)}</span>
          <textarea
            name="${field.name}"
            ${field.required ? "required" : ""}
          >${escapeHTML(value)}</textarea>
        </label>
      `;
    }

    if (field.type === "select") {
      const options = field.options.map((option) => `
        <option value="${escapeHTML(option)}"
          ${value === option ? "selected" : ""}>
          ${escapeHTML(option.charAt(0).toUpperCase() + option.slice(1))}
        </option>
      `).join("");

      return `
        <label class="form-field">
          <span>${escapeHTML(field.label)}</span>
          <select name="${field.name}">
            ${options}
          </select>
        </label>
      `;
    }

    return `
      <label class="form-field">
        <span>${escapeHTML(field.label)}</span>
        <input
          type="${field.type}"
          name="${field.name}"
          value="${escapeHTML(value)}"
          ${field.required ? "required" : ""}
          ${field.type === "number" ? 'min="0"' : ""}
        >
      </label>
    `;
  }).join("");

  overlay.classList.remove("hidden");
}

function closeItemModal() {
  const overlay = $("#modal-overlay");
  const form = $("#item-form");
  const error = $("#form-error");

  if (overlay) overlay.classList.add("hidden");
  if (form) form.reset();
  if (error) error.textContent = "";

  CampusOS.editingItem = null;
}

function getCollectionForType(type) {
  return ITEM_CONFIG[type]?.collection;
}

function renderAll() {
  renderDashboard();
  renderCourses();
  renderAssignments();
  renderCalendar();
  renderPlanner();
}

function setupItemForm() {
  const form = $("#item-form");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const error = $("#form-error");
    const editing = CampusOS.editingItem;

    if (!editing) return;

    const config = ITEM_CONFIG[editing.type];
    const collectionName = getCollectionForType(editing.type);

    if (!config || !collectionName) return;

    const formData = new FormData(form);
    const itemData = {};

    for (const field of config.fields) {
      itemData[field.name] = String(
        formData.get(field.name) ?? ""
      ).trim();
    }

    const requiredFields = config.fields.filter(
      (field) => field.required
    );

    const missingField = requiredFields.find(
      (field) => !itemData[field.name]
    );

    if (missingField) {
      if (error) {
        error.textContent = `${missingField.label} is required.`;
      }
      return;
    }

    const collection = CampusOS.data[collectionName];

    if (editing.id) {
      const index = collection.findIndex(
        (item) => item.id === editing.id
      );

      if (index !== -1) {
        collection[index] = {
          ...collection[index],
          ...itemData
        };
      }
    } else {
      collection.push({
        id: makeId(),
        ...itemData,
        ...(editing.type === "assignment" && !itemData.status
          ? { status: "pending" }
          : {})
      });
    }

    saveData();
    closeItemModal();
    renderAll();

    showToast(
      editing.id
        ? `${config.title} updated.`
        : `${config.title} added.`
    );
  });
}

// Open the correct form from an Add button
function setupAddButtons() {
  $$("[data-add-type]").forEach((button) => {
    button.addEventListener("click", () => {
      openItemModal(button.dataset.addType);
    });
  });
}

// Edit and delete buttons
function setupItemActions() {
  document.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-type]");

    if (editButton) {
      const type = editButton.dataset.editType;
      const id = editButton.dataset.id;
      const collectionName = getCollectionForType(type);

      const item = collectionName
        ? CampusOS.data[collectionName].find(
            (entry) => entry.id === id
          )
        : null;

      if (item) openItemModal(type, item);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-type]");

    if (deleteButton) {
      const type = deleteButton.dataset.deleteType;
      const id = deleteButton.dataset.id;
      const collectionName = getCollectionForType(type);

      if (!collectionName) return;

      const item = CampusOS.data[collectionName].find(
        (entry) => entry.id === id
      );

      if (!item) return;

      if (!confirm(`Delete "${item.title || item.name}"?`)) {
        return;
      }

      CampusOS.data[collectionName] =
        CampusOS.data[collectionName].filter(
          (entry) => entry.id !== id
        );

      saveData();
      renderAll();
      showToast(`${ITEM_CONFIG[type].title} deleted.`);
      return;
    }

    const toggleButton = event.target.closest(
      "[data-toggle-assignment]"
    );

    if (toggleButton) {
      const assignment = CampusOS.data.assignments.find(
        (item) => item.id === toggleButton.dataset.toggleAssignment
      );

      if (!assignment) return;

      assignment.status =
        assignment.status === "completed"
          ? "pending"
          : "completed";

      saveData();
      renderAll();

      showToast(
        assignment.status === "completed"
          ? "Assignment completed!"
          : "Assignment marked pending."
      );
    }
  });
}

// Modal close and cancel buttons
function setupModalControls() {
  const closeButton = $("#modal-close");
  const cancelButton = $("#modal-cancel");
  const overlay = $("#modal-overlay");

  if (closeButton) {
    closeButton.addEventListener("click", closeItemModal);
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", closeItemModal);
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeItemModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeItemModal();
    }
  });
}

// ========================================
// PART 6: SETTINGS, THEME & SEARCH
// ========================================

// Theme settings
function applyTheme(theme) {
  const validThemes = ["light", "dark", "system"];

  if (!validThemes.includes(theme)) {
    theme = "system";
  }

  const root = document.documentElement;

  if (theme === "system") {
    const prefersDark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    root.dataset.theme = prefersDark ? "dark" : "light";
  } else {
    root.dataset.theme = theme;
  }

  const themeSelect = $("#theme-select");

  if (themeSelect) {
    themeSelect.value = theme;
  }

  localStorage.setItem(THEME_KEY, theme);
}

function setupTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "system";

  applyTheme(savedTheme);

  const themeSelect = $("#theme-select");

  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      applyTheme(themeSelect.value);
      showToast("Theme updated.");
    });
  }

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (localStorage.getItem(THEME_KEY) === "system") {
          applyTheme("system");
        }
      });
  }
}

// Assignment search
function setupSearch() {
  const searchInput = $("#assignment-search");

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    renderAssignments();
  });
}

// Settings page
function setupSettings() {
  const settingsPage = $("#settings-page");

  if (!settingsPage) return;

  const existingButton = $("#export-data-button");

  if (existingButton) {
    existingButton.addEventListener("click", exportData);
  }

  const importButton = $("#import-data-button");

  if (importButton) {
    importButton.addEventListener("click", () => {
      const input = $("#import-data-file");

      if (input) input.click();
    });
  }

  const importInput = $("#import-data-file");

  if (importInput) {
    importInput.addEventListener("change", importData);
  }

  const clearButton = $("#clear-data-button");

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      const confirmed = confirm(
        "Delete all your CampusOS courses, assignments, events and study sessions? This cannot be undone."
      );

      if (!confirmed) return;

      CampusOS.data = {
        courses: [],
        assignments: [],
        events: [],
        study: []
      };

      saveData();
      renderAll();

      showToast("Your CampusOS data has been cleared.");
    });
  }
}

// Export user data as a JSON file
function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    data: CampusOS.data
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "campusos-backup.json";
  link.click();

  URL.revokeObjectURL(url);

  showToast("Your backup has been downloaded.");
}

// Import a previously exported backup
function importData(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parsed.data || parsed;

      const keys = ["courses", "assignments", "events", "study"];

      for (const key of keys) {
        if (!Array.isArray(imported[key])) {
          throw new Error("Invalid backup structure.");
        }
      }

      if (!confirm("Import this backup? Your current data will be replaced.")) {
        event.target.value = "";
        return;
      }

      CampusOS.data = {
        courses: imported.courses,
        assignments: imported.assignments,
        events: imported.events,
        study: imported.study
      };

      saveData();
      renderAll();

      showToast("Backup imported successfully.");
    } catch (error) {
      showToast("That backup file is invalid.");
      console.error("Import failed:", error);
    }

    event.target.value = "";
  };

  reader.onerror = () => {
    showToast("Could not read that file.");
    event.target.value = "";
  };

  reader.readAsText(file);
}

// ========================================
// PART 7: START CAMPUSOS
// ========================================

function startCampusOS() {
  setupLogin();
  setupLogout();
  setupNavigation();
  setupCalendar();
  setupItemForm();
  setupAddButtons();
  setupItemActions();
  setupModalControls();
  setupTheme();
  setupSearch();
  setupSettings();

  restoreSession();

  console.log("CampusOS initialized successfully.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCampusOS);
} else {
  startCampusOS();
}

// ========================================
// CAMPUSOS: BUTTON CONNECTION FIX
// ========================================

// Connect the Create New button
const quickAddButton = document.querySelector("#quick-add-button");

if (quickAddButton) {
  quickAddButton.addEventListener("click", () => {
    const overlay = document.querySelector("#modal-overlay");

    if (overlay) {
      overlay.classList.remove("hidden");

      const title = document.querySelector("#modal-title");
      if (title) title.textContent = "Create new";
    }
  });
}

// Connect the Dark Mode button
const themeToggle = document.querySelector("#theme-toggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const root = document.documentElement;

    const isDark = root.dataset.theme === "dark";
    const newTheme = isDark ? "light" : "dark";

    applyTheme(newTheme);

    const themeSelect = document.querySelector("#theme-select");

    if (themeSelect) {
      themeSelect.value = newTheme;
    }

    themeToggle.textContent =
      newTheme === "dark" ? "Light mode" : "Dark mode";

    showToast(
      newTheme === "dark"
        ? "Dark mode enabled."
        : "Light mode enabled."
    );
  });
}

// Update the page heading when navigating
document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.tagName === "A") {
      event.preventDefault();
    }

    const page = button.dataset.page;

    const titles = {
      dashboard: "Overview",
      courses: "Courses",
      assignments: "Assignments",
      calendar: "Calendar",
      planner: "Study planner",
      settings: "Settings"
    };

    const heading = document.querySelector("#page-title");

    if (heading && titles[page]) {
      heading.textContent = titles[page];
    }
  });
});
// CampusOS Settings Tabs
document.addEventListener("DOMContentLoaded", () => {
  const settingsPage = document.querySelector("#settings-page");

  if (!settingsPage) return;

  const tabButtons = settingsPage.querySelectorAll("[data-settings-tab]");
  const tabPanels = settingsPage.querySelectorAll(".settings-tab");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTab = button.dataset.settingsTab;

      tabButtons.forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });

      tabPanels.forEach((panel) => {
        const active = panel.id === `settings-tab-${selectedTab}`;
        panel.classList.toggle("active", active);
        panel.classList.toggle("hidden", !active);
      });
    });
  });
});


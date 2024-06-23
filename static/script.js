// ===== DOM Ready =====
document.addEventListener("DOMContentLoaded", () => {
  initAnimatedCounters();
  initCustomDropdown();
  initLiveSearch();
  initDeleteModal();
  initFormValidation();
  initMobileMenu();
  initToastAutoDismiss();
});

// ===== Animated Number Counters =====
function initAnimatedCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-counter"));
    const duration = 1200;
    const start = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  });
}

// ===== Custom Dropdown =====
function initCustomDropdown() {
  const dropdownBtn = document.getElementById("dropdown-btn");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const searchField = document.getElementById("search-field");
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  if (!dropdownBtn || !dropdownMenu) return;

  // Move the dropdown menu to the document body so fixed positioning is viewport-relative.
  document.body.appendChild(dropdownMenu);

  const positionDropdown = () => {
    const rect = dropdownBtn.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minMargin = 12;
    const maxWidth = viewportWidth - minMargin * 2;
    const menuWidth = Math.min(Math.max(rect.width, 160), maxWidth);
    let left = rect.left;
    const rightEdge = left + menuWidth;

    if (rightEdge + minMargin > viewportWidth) {
      left = Math.max(viewportWidth - menuWidth - minMargin, minMargin);
    }
    if (left < minMargin) {
      left = minMargin;
    }

    let top = rect.bottom + 8;
    const menuHeight = dropdownMenu.offsetHeight || 260;
    const bottomOverflow = top + menuHeight + minMargin - viewportHeight;

    if (bottomOverflow > 0 && rect.top - 8 - menuHeight > minMargin) {
      top = rect.top - 8 - menuHeight;
      dropdownMenu.style.transformOrigin = "bottom left";
    } else {
      dropdownMenu.style.transformOrigin = "top left";
    }

    dropdownMenu.style.left = `${left}px`;
    dropdownMenu.style.top = `${top}px`;
    dropdownMenu.style.width = `${menuWidth}px`;
    dropdownMenu.style.right = "auto";
  };

  const openDropdown = () => {
    positionDropdown();
    dropdownMenu.classList.add("active");
    dropdownBtn.classList.add("active");
    dropdownMenu.style.visibility = "visible";
    dropdownMenu.style.opacity = "1";
    dropdownMenu.style.transform = "translateY(0) scaleY(1)";
  };

  const closeDropdown = () => {
    dropdownMenu.classList.remove("active");
    dropdownBtn.classList.remove("active");
    dropdownMenu.style.visibility = "hidden";
    dropdownMenu.style.opacity = "0";
    dropdownMenu.style.transform = "translateY(-8px) scaleY(0.95)";
  };

  // Toggle dropdown
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdownMenu.classList.contains("active")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  window.addEventListener("resize", () => {
    if (dropdownMenu.classList.contains("active")) {
      positionDropdown();
    }
  });

  window.addEventListener("scroll", () => {
    if (dropdownMenu.classList.contains("active")) {
      positionDropdown();
    }
  });

  // Handle dropdown item selection
  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      const value = item.getAttribute("data-value");
      const label = item.textContent;

      // Update hidden input
      searchField.value = value;

      // Update button label
      const labelSpan = dropdownBtn.querySelector(".dropdown-label");
      labelSpan.textContent = label;

      // Update active state
      dropdownItems.forEach((i) => i.classList.remove("selected"));
      item.classList.add("selected");

      // Close dropdown
      closeDropdown();

      // Trigger search
      const searchInput = document.getElementById("search-input");
      if (searchInput.value) {
        const query = searchInput.value.trim();
        performSearch(query, value);
      }
    });
  });

  // Keep clicks inside the menu from bubbling up and closing it immediately.
  dropdownMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close dropdown when clicking outside the button or menu.
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".custom-dropdown") &&
      !e.target.closest("#dropdown-menu")
    ) {
      closeDropdown();
    }
  });

  // Set initial selected state
  const initialValue = searchField.value || "all";
  dropdownItems.forEach((item) => {
    if (item.getAttribute("data-value") === initialValue) {
      item.classList.add("selected");
      const labelSpan = dropdownBtn.querySelector(".dropdown-label");
      labelSpan.textContent = item.textContent;
    }
  });
}

// ===== Live Search =====
function initLiveSearch() {
  const searchInput = document.getElementById("search-input");
  const searchField = document.getElementById("search-field");
  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.trim();
      const field = searchField ? searchField.value : "all";
      performSearch(query, field);
    }, 300);
  });
}

function performSearch(query, field = "all") {
  const tableBody = document.getElementById("students-tbody");
  if (!tableBody) return;

  fetch(
    `/search?q=${encodeURIComponent(query)}&field=${encodeURIComponent(field)}`,
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.students.length === 0) {
        tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding: 3rem;">
                            <div class="empty-state">
                                <div class="empty-state-icon">🔍</div>
                                <h3>No students found</h3>
                                <p>Try a different search term</p>
                            </div>
                        </td>
                    </tr>
                `;
        return;
      }

      tableBody.innerHTML = data.students
        .map(
          (s) => `
                <tr>
                    <td><span class="student-id">#${s.id}</span></td>
                    <td><span class="student-name">${escapeHtml(s.name)}</span></td>
                    <td>${s.age}</td>
                    <td><span class="dept-badge">${escapeHtml(s.department)}</span></td>
                    <td>
                        <div class="actions-cell">
                            <a href="/edit/${s.id}" class="btn btn-secondary btn-sm" title="Edit">✏️ Edit</a>
                            <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${s.id}, '${escapeHtml(s.name)}')" title="Delete">🗑️ Delete</button>
                        </div>
                    </td>
                </tr>
            `,
        )
        .join("");
    })
    .catch((err) => console.error("Search error:", err));
}

// ===== Delete Confirmation Modal =====
let deleteStudentId = null;

function initDeleteModal() {
  const overlay = document.getElementById("delete-modal");
  if (!overlay) return;

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDeleteModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDeleteModal();
    }
  });
}

function openDeleteModal(id, name) {
  deleteStudentId = id;
  const overlay = document.getElementById("delete-modal");
  const nameEl = document.getElementById("delete-student-name");
  if (nameEl) nameEl.textContent = name;
  overlay.classList.add("active");
}

function closeDeleteModal() {
  const overlay = document.getElementById("delete-modal");
  if (overlay) overlay.classList.remove("active");
  deleteStudentId = null;
}

function confirmDelete() {
  if (deleteStudentId === null) return;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `/delete/${deleteStudentId}`;
  document.body.appendChild(form);
  form.submit();
}

// ===== Form Validation =====
function initFormValidation() {
  const form = document.getElementById("student-form");
  if (!form) return;

  const nameInput = form.querySelector('input[name="name"]');
  const ageInput = form.querySelector('input[name="age"]');

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const group = nameInput.closest(".form-group");
      if (nameInput.value.trim().length < 2) {
        group.classList.add("error");
        group.querySelector(".input-error").textContent =
          "Name must be at least 2 characters";
      } else {
        group.classList.remove("error");
      }
    });
  }

  if (ageInput) {
    ageInput.addEventListener("input", () => {
      const group = ageInput.closest(".form-group");
      const age = parseInt(ageInput.value);
      if (isNaN(age) || age < 1 || age > 150) {
        group.classList.add("error");
        group.querySelector(".input-error").textContent =
          "Please enter a valid age (1-150)";
      } else {
        group.classList.remove("error");
      }
    });
  }

  form.addEventListener("submit", (e) => {
    let hasError = false;

    if (nameInput && nameInput.value.trim().length < 2) {
      nameInput.closest(".form-group").classList.add("error");
      hasError = true;
    }

    const age = parseInt(ageInput?.value);
    if (ageInput && (isNaN(age) || age < 1 || age > 150)) {
      ageInput.closest(".form-group").classList.add("error");
      hasError = true;
    }

    if (hasError) {
      e.preventDefault();
      return;
    }

    // Show loading state on submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
    }
  });
}

// ===== Mobile Menu =====
function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 768 &&
      !sidebar.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      sidebar.classList.remove("open");
    }
  });
}

// ===== Toast Notifications =====
function initToastAutoDismiss() {
  const toasts = document.querySelectorAll(".toast");
  toasts.forEach((toast) => {
    setTimeout(() => {
      dismissToast(toast);
    }, 3500);
  });
}

function dismissToast(toast) {
  toast.classList.add("removing");
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// ===== Utility =====
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

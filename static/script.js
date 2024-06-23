// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
    initAnimatedCounters();
    initLiveSearch();
    initDeleteModal();
    initFormValidation();
    initMobileMenu();
    initToastAutoDismiss();
});

// ===== Animated Number Counters =====
function initAnimatedCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-counter'));
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

// ===== Live Search =====
function initLiveSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            performSearch(query);
        }, 300);
    });
}

function performSearch(query) {
    const tableBody = document.getElementById('students-tbody');
    if (!tableBody) return;

    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
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

            tableBody.innerHTML = data.students.map(s => `
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
            `).join('');
        })
        .catch(err => console.error('Search error:', err));
}

// ===== Delete Confirmation Modal =====
let deleteStudentId = null;

function initDeleteModal() {
    const overlay = document.getElementById('delete-modal');
    if (!overlay) return;

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDeleteModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDeleteModal();
        }
    });
}

function openDeleteModal(id, name) {
    deleteStudentId = id;
    const overlay = document.getElementById('delete-modal');
    const nameEl = document.getElementById('delete-student-name');
    if (nameEl) nameEl.textContent = name;
    overlay.classList.add('active');
}

function closeDeleteModal() {
    const overlay = document.getElementById('delete-modal');
    if (overlay) overlay.classList.remove('active');
    deleteStudentId = null;
}

function confirmDelete() {
    if (deleteStudentId === null) return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/delete/${deleteStudentId}`;
    document.body.appendChild(form);
    form.submit();
}

// ===== Form Validation =====
function initFormValidation() {
    const form = document.getElementById('student-form');
    if (!form) return;

    const nameInput = form.querySelector('input[name="name"]');
    const ageInput = form.querySelector('input[name="age"]');

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            const group = nameInput.closest('.form-group');
            if (nameInput.value.trim().length < 2) {
                group.classList.add('error');
                group.querySelector('.input-error').textContent = 'Name must be at least 2 characters';
            } else {
                group.classList.remove('error');
            }
        });
    }

    if (ageInput) {
        ageInput.addEventListener('input', () => {
            const group = ageInput.closest('.form-group');
            const age = parseInt(ageInput.value);
            if (isNaN(age) || age < 1 || age > 150) {
                group.classList.add('error');
                group.querySelector('.input-error').textContent = 'Please enter a valid age (1-150)';
            } else {
                group.classList.remove('error');
            }
        });
    }

    form.addEventListener('submit', (e) => {
        let hasError = false;

        if (nameInput && nameInput.value.trim().length < 2) {
            nameInput.closest('.form-group').classList.add('error');
            hasError = true;
        }

        const age = parseInt(ageInput?.value);
        if (ageInput && (isNaN(age) || age < 1 || age > 150)) {
            ageInput.closest('.form-group').classList.add('error');
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
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ===== Toast Notifications =====
function initToastAutoDismiss() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        setTimeout(() => {
            dismissToast(toast);
        }, 3500);
    });
}

function dismissToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// ===== Utility =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

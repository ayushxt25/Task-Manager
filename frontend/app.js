// Use relative path since we are serving frontend from the same server
const API_URL = '/api/tasks';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskPriorityInput = document.getElementById('task-priority');
const taskDateInput = document.getElementById('task-date');
const taskTimeInput = document.getElementById('task-time');
const taskList = document.getElementById('task-list');
const filterControls = document.querySelectorAll('.filter-controls span');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editTitleInput = document.getElementById('edit-title');
const editDescInput = document.getElementById('edit-desc');
const editStatusInput = document.getElementById('edit-status');
const editDateInput = document.getElementById('edit-date');
const editTimeInput = document.getElementById('edit-time');
const closeModal = document.querySelector('.close-modal');

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

let tasks = [];
let currentFilter = 'all';

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Update icon
    const icon = document.querySelector('button[onclick="toggleTheme()"] i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize Theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    // We'll update the icon in DOMContentLoaded if needed, or let the user click it
}

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchTasks);
taskForm.addEventListener('submit', addTask);
editForm.addEventListener('submit', updateTask);
closeModal.addEventListener('click', () => editModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.style.display = 'none';
});

filterControls.forEach(control => {
    control.addEventListener('click', () => {
        // Remove active class from all
        filterControls.forEach(c => c.classList.remove('active'));
        // Add active class to clicked
        control.classList.add('active');
        currentFilter = control.dataset.filter;
        renderTasks();
        currentFilter = control.dataset.filter;
        renderTasks();
    });
});

// Drag Over Container
taskList.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveOrder() {
    if (currentFilter !== 'all') return; // Only save order when viewing all

    const items = [...taskList.querySelectorAll('.task-item')];
    const orderedIds = items.map(item => item.dataset.id);

    try {
        await fetch(`${API_URL}/reorder/all`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ orderedIds })
        });
    } catch (err) {
        console.error('Error saving order', err);
    }
}

// Pagination State
let currentPage = 1;
let totalPages = 1;
const TASKS_PER_PAGE = 10;

// Fetch Tasks
async function fetchTasks(page = 1) {
    try {
        const response = await fetch(`${API_URL}?page=${page}&limit=${TASKS_PER_PAGE}`, {
            headers: { 'Authorization': token }
        });
        if (response.status === 401) logout();

        const data = await response.json();
        tasks = data.tasks;
        currentPage = data.currentPage;
        totalPages = data.totalPages;

        renderTasks();
        renderPagination();
    } catch (err) {
        console.error('Error fetching tasks:', err);
    }
}

// Chart Instances
let statusChartInstance = null;
let priorityChartInstance = null;

function renderPagination() {
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    container.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="fetchTasks(${currentPage - 1})" class="btn-page"><i class="fas fa-chevron-left"></i> Previous</button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="fetchTasks(${currentPage + 1})" class="btn-page">Next <i class="fas fa-chevron-right"></i></button>
    `;
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = '';

    // Update Charts
    renderCharts();

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        return task.status.toLowerCase() === currentFilter;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="task-item" style="justify-content:center; color: #6b7280;">No tasks found.</li>';
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = true;
        li.dataset.id = task._id;

        // Drag Events
        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            saveOrder();
        });

        const statusClass = task.status === 'Completed' ? 'status-completed' : 'status-pending';
        const priorityClass = `priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`;
        const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const formattedTime = task.dueTime ? ` at ${task.dueTime}` : '';

        li.innerHTML = `
            <div class="task-content">
                <div class="task-title">
                    <span class="priority-badge ${priorityClass}">${task.priority || 'Medium'}</span>
                    ${escapeHtml(task.title)}
                </div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                ${formattedDate ? `<div class="task-meta"><i class="far fa-calendar-alt"></i> Due: ${formattedDate}${formattedTime}</div>` : ''}
            </div>
            <div class="task-actions">
                <span class="status-badge ${statusClass}">${task.status}</span>
                <button class="btn-icon btn-edit" onclick="openEditModal('${task._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" onclick="deleteTask('${task._id}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Add Task
async function addTask(e) {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const dueDate = taskDateInput.value;
    const dueTime = taskTimeInput.value;

    if (!title) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ title, description, priority, dueDate, dueTime })
        });

        const newTask = await response.json();

        // Reset form
        taskTitleInput.value = '';
        taskDescInput.value = '';
        taskPriorityInput.value = 'Medium';
        taskDateInput.value = '';
        taskTimeInput.value = '';

        // Fetch page 1 to show the new task at the top
        fetchTasks(1);
    } catch (err) {
        console.error('Error adding task:', err);
    }
}

// Delete Task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        tasks = tasks.filter(task => task._id !== id);
        renderTasks();
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

// Open Edit Modal
window.openEditModal = function (id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    editIdInput.value = task._id;
    editTitleInput.value = task.title;
    editDescInput.value = task.description || '';
    editStatusInput.value = task.status;
    editDateInput.value = task.dueDate || '';
    editTimeInput.value = task.dueTime || '';

    editModal.style.display = 'block';
}

// Update Task
async function updateTask(e) {
    e.preventDefault();

    const id = editIdInput.value;
    const title = editTitleInput.value.trim();
    const description = editDescInput.value.trim();
    const status = editStatusInput.value;
    const dueDate = editDateInput.value;
    const dueTime = editTimeInput.value;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ title, description, status, dueDate, dueTime })
        });

        const updatedTask = await response.json();

        // Update local tasks array
        const index = tasks.findIndex(t => t._id === id);
        if (index !== -1) {
            tasks[index] = updatedTask;
        }

        renderTasks();
        editModal.style.display = 'none';
    } catch (err) {
        console.error('Error updating task:', err);
    }
}

// Utility to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderCharts() {
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    const ctxPriority = document.getElementById('priorityChart').getContext('2d');

    // Status Data
    const pendingCount = tasks.filter(t => t.status === 'Pending').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    // Priority Data
    const highCount = tasks.filter(t => t.priority === 'High').length;
    const mediumCount = tasks.filter(t => !t.priority || t.priority === 'Medium').length;
    const lowCount = tasks.filter(t => t.priority === 'Low').length;

    // Destroy existing charts if they exist
    if (statusChartInstance) statusChartInstance.destroy();
    if (priorityChartInstance) priorityChartInstance.destroy();

    // Create Status Chart
    statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Completed'],
            datasets: [{
                data: [pendingCount, completedCount],
                backgroundColor: ['#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            animation: {
                duration: 0 // Disable animation to prevent stuttering on updates
            }
        }
    });

    // Create Priority Chart
    priorityChartInstance = new Chart(ctxPriority, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                label: 'Tasks',
                data: [lowCount, mediumCount, highCount],
                backgroundColor: ['#0ea5e9', '#f59e0b', '#ef4444'],
                barThickness: 30,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: false }
            },
            animation: {
                duration: 0
            }
        }
    });
}

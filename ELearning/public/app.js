const API_BASE = 'http://localhost:3333';
let currentUser = null;
let authToken = null;

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showDashboard();
        updateNavigation(true);
    }
});

// Navigation functions
function showLogin() {
    hideAllSections();
    document.getElementById('loginForm').style.display = 'block';
}

function showRegister() {
    hideAllSections();
    document.getElementById('registerForm').style.display = 'block';
}

function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard').style.display = 'block';
    loadCourses();
}

function hideAllSections() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

function updateNavigation(isLoggedIn) {
    const loginBtn = document.querySelector('nav button:nth-child(1)');
    const registerBtn = document.querySelector('nav button:nth-child(2)');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        dashboardBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        dashboardBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

// Auth functions
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            showAlert('Login successful!', 'success');
            updateNavigation(true);
            showDashboard();
        } else {
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

async function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            showLogin();
            document.getElementById('registerForm').reset();
        } else {
            showAlert(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateNavigation(false);
    showLogin();
    showAlert('Logged out successfully', 'success');
}

// Course functions
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE}/api/courses`);
        const data = await response.json();

        const coursesList = document.getElementById('coursesList');
        
        if (response.ok && data.length > 0) {
            coursesList.innerHTML = data.map(course => `
                <div class="course-item">
                    <h4>${course.title}</h4>
                    <p>${course.description}</p>
                    <small>Created: ${new Date(course.createdAt).toLocaleDateString()}</small>
                </div>
            `).join('');
        } else {
            coursesList.innerHTML = '<p>No courses available</p>';
        }
    } catch (error) {
        document.getElementById('coursesList').innerHTML = '<p>Error loading courses</p>';
    }
}

async function addCourse(event) {
    event.preventDefault();
    
    if (!authToken) {
        showAlert('Please login first', 'error');
        return;
    }

    const title = document.getElementById('courseTitle').value;
    const description = document.getElementById('courseDescription').value;

    try {
        const response = await fetch(`${API_BASE}/api/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Course added successfully!', 'success');
            document.querySelector('#dashboard form').reset();
            loadCourses();
        } else {
            showAlert(data.message || 'Failed to add course', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

// Chat functions
async function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (response.ok) {
            addMessageToChat(data.response || 'AI response received', 'ai');
        } else {
            addMessageToChat('Sorry, I could not process your request.', 'ai');
        }
    } catch (error) {
        addMessageToChat('Network error. Please try again.', 'ai');
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility functions
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.querySelector('main').insertBefore(alert, document.querySelector('main').firstChild);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}
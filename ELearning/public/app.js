const API_BASE = 'http://localhost:3333';
let currentUser = null;
let authToken = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showDashboard();
        updateNavigation(true);
    } else {
        showLogin();
    }
});

// --- NAVIGATION ---
function hideAllSections() {
    ['loginForm', 'registerForm', 'dashboard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

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

function updateNavigation(isLoggedIn) {
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const navButtons = document.querySelectorAll('nav button:not(#dashboardBtn):not(#logoutBtn)');

    if (isLoggedIn) {
        navButtons.forEach(btn => btn.style.display = 'none');
        if(dashboardBtn) dashboardBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        navButtons.forEach(btn => btn.style.display = 'inline-block');
        if(dashboardBtn) dashboardBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'none';
    }
}

// --- AUTHENTICATION ---
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showAlert('Login Berhasil!', 'success');
            updateNavigation(true);
            showDashboard();
        } else {
            showAlert(data.message || 'Login Gagal', 'error');
        }
    } catch (e) { showAlert('Error koneksi server', 'error'); }
}

async function register(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            showAlert('Registrasi berhasil, silakan login', 'success');
            showLogin();
        } else {
            showAlert(data.message || 'Gagal Register', 'error');
        }
    } catch (e) { showAlert('Error koneksi server', 'error'); }
}

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    updateNavigation(false);
    showLogin();
}

// --- COURSES ---
async function loadCourses() {
    try {
        const res = await fetch(`${API_BASE}/api/courses`);
        const data = await res.json();
        const list = document.getElementById('coursesList');
        if (!list) return;

        if (res.ok && data.length > 0) {
            list.innerHTML = data.map(c => `
                <div style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid #eee;">
                    <h4 style="margin:0 0 5px 0;">${c.title}</h4>
                    <p style="margin:0; color:#666; font-size:14px;">${c.description}</p>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p style="text-align:center; color:#999;">Belum ada materi.</p>';
        }
    } catch (e) { console.error(e); }
}

async function addCourse(event) {
    event.preventDefault();
    if (!authToken) return showAlert('Harap login dulu', 'error');
    
    const title = document.getElementById('courseTitle').value;
    const description = document.getElementById('courseDescription').value;

    try {
        const res = await fetch(`${API_BASE}/api/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ title, description })
        });
        if (res.ok) {
            showAlert('Materi ditambahkan', 'success');
            document.querySelector('.course-form form').reset();
            loadCourses();
        }
    } catch (e) { showAlert('Gagal menambah materi', 'error'); }
}

// --- CHATBOT (AI + YOUTUBE) ---
async function sendMessage(event) {
    if(event) event.preventDefault();
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    const loadingId = addMessage('Sedang mencari video...', 'ai');

    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        
        // Hapus loading
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();

        if (res.ok) {
            addMessage(data.reply, 'ai');

            // Render Video 16:9
            if (data.videos && data.videos.length > 0) {
                const videoHtml = data.videos.map(v => `
                    <div style="margin-top:12px; background:white; border-radius:10px; overflow:hidden; border:1px solid #eee;">
                        <a href="${v.url}" target="_blank" style="text-decoration:none; display:block;">
                            <div style="width:100%; aspect-ratio:16/9; background:#000;">
                                <img src="${v.thumbnail}" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                            <div style="padding:10px;">
                                <p style="font-size:13px; font-weight:600; color:#333; margin:0; line-height:1.4;">📺 ${v.title}</p>
                            </div>
                        </a>
                    </div>
                `).join('');
                addMessage(videoHtml, 'ai', true);
            }
        }
    } catch (e) {
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();
        addMessage('Server error.', 'ai');
    }
}

function addMessage(content, type, isHtml = false) {
    const container = document.getElementById('chatMessages');
    if(!container) return;

    const div = document.createElement('div');
    div.className = `message ${type}-message`;
    div.id = 'msg-' + Date.now();
    
    if(isHtml) {
        div.innerHTML = content;
        div.style.background = 'transparent';
        div.style.padding = 0;
        div.style.boxShadow = 'none';
    } else {
        div.textContent = content;
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

// --- UTILS ---
function showAlert(msg, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = msg;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}
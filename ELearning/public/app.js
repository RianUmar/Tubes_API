const API_BASE = 'http://localhost:3333';
let currentUser = null;
let authToken = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user'); // Simpan data user juga
    
    if (token) {
        authToken = token;
        if (userStr) currentUser = JSON.parse(userStr);
        showDashboard();
        updateNavigation(true);
    } else {
        showLogin();
    }
});

// --- NAVIGATION & UI HELPERS ---
function hideAllSections() {
    ['loginForm', 'registerForm', 'dashboard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
function showLogin() { hideAllSections(); document.getElementById('loginForm').style.display = 'block'; }
function showRegister() { hideAllSections(); document.getElementById('registerForm').style.display = 'block'; }
function showDashboard() { hideAllSections(); document.getElementById('dashboard').style.display = 'block'; loadCourses(); }

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
            currentUser = data.user; // Simpan object user
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser)); // Simpan ke LocalStorage biar persistent
            
            showAlert('Login Berhasil!', 'success');
            updateNavigation(true);
            showDashboard();
        } else {
            showAlert(data.message || 'Login Gagal', 'error');
        }
    } catch (e) { showAlert('Error server', 'error'); }
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
        if (res.ok) {
            showAlert('Registrasi berhasil, silakan login', 'success');
            showLogin();
        } else {
            const data = await res.json();
            showAlert(data.message || 'Gagal Register', 'error');
        }
    } catch (e) { showAlert('Error server', 'error'); }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    updateNavigation(false);
    showLogin();
}

// --- COURSE MANAGEMENT (CRUD) ---
async function loadCourses() {
    try {
        const res = await fetch(`${API_BASE}/api/courses`);
        const data = await res.json();
        const list = document.getElementById('coursesList');
        if (!list) return;

        if (res.ok && data.length > 0) {
            list.innerHTML = data.map(c => {
                // LOGIKA OWNER: Cek apakah ID user login == ID pembuat course
                const isOwner = currentUser && c.userId && (String(c.userId) === String(currentUser.id));
                
                let buttons = '';
                if (isOwner) {
                    buttons = `
                        <div style="margin-top:15px; padding-top:10px; border-top:1px solid #eee; display:flex; gap:10px;">
                            <button onclick="editCourse('${c._id}', '${c.title}', '${c.description}')" style="background:#f39c12; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Edit</button>
                            <button onclick="deleteCourse('${c._id}')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">Hapus</button>
                        </div>
                    `;
                }

                return `
                <div style="background:white; padding:20px; border-radius:12px; margin-bottom:15px; border:1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                    <h4 style="margin:0 0 8px 0; color:#2d3436; font-size:16px;">${c.title}</h4>
                    <p style="margin:0 0 10px 0; color:#636e72; font-size:14px; line-height:1.5;">${c.description}</p>
                    <small style="color:#b2bec3; font-size:11px;">Author: ${c.author || 'Anonymous'}</small>
                    ${buttons}
                </div>
                `;
            }).join('');
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
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${authToken}` 
            },
            body: JSON.stringify({ 
                title, 
                description,
                userId: currentUser.id || currentUser._id // Kirim User ID
            })
        });
        const data = await res.json();
        
        if (res.ok) {
            showAlert('Materi ditambahkan', 'success');
            document.querySelector('.course-form form').reset();
            loadCourses();
        } else {
            showAlert(data.message || 'Gagal', 'error');
        }
    } catch (e) { showAlert('Gagal menambah materi', 'error'); }
}

// --- FITUR UPDATE (MODAL) ---
function editCourse(id, currentTitle, currentDesc) {
    document.getElementById('editCourseId').value = id;
    document.getElementById('editCourseTitle').value = currentTitle;
    document.getElementById('editCourseDesc').value = currentDesc;
    document.getElementById('editModal').style.display = 'flex'; // Buka Modal
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function confirmEdit() {
    const id = document.getElementById('editCourseId').value;
    const newTitle = document.getElementById('editCourseTitle').value;
    const newDesc = document.getElementById('editCourseDesc').value;

    if (!newTitle || !newDesc) return showAlert('Semua field harus diisi', 'error');

    try {
        const res = await fetch(`${API_BASE}/api/courses/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                title: newTitle, 
                description: newDesc,
                userId: currentUser.id || currentUser._id 
            })
        });

        const data = await res.json();
        if (res.ok) {
            showAlert('Berhasil update!', 'success');
            closeEditModal();
            loadCourses();
        } else {
            showAlert(data.message || 'Gagal update', 'error');
        }
    } catch (e) { showAlert('Error koneksi', 'error'); }
}

// Tutup modal jika klik luar
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) closeEditModal();
}

// --- FITUR DELETE ---
async function deleteCourse(id) {
    if (confirm("Yakin hapus materi ini?")) {
        try {
            const res = await fetch(`${API_BASE}/api/courses/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` 
                },
                body: JSON.stringify({ userId: currentUser.id || currentUser._id })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert('Berhasil dihapus', 'success');
                loadCourses();
            } else {
                showAlert(data.message || 'Gagal hapus', 'error');
            }
        } catch (e) { showAlert('Error koneksi', 'error'); }
    }
}

// --- CHATBOT ---
async function sendMessage(event) {
    if(event) event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';
    const loadingId = addMessage('Sedang mencari...', 'ai'); // Teks loading singkat

    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();

        if (res.ok) {
            addMessage(data.reply, 'ai');
            if (data.videos && data.videos.length > 0) {
                const videoHtml = data.videos.map(v => `
                    <div style="margin-top:10px; background:white; border-radius:8px; overflow:hidden; border:1px solid #eee;">
                        <a href="${v.url}" target="_blank" style="text-decoration:none; display:block;">
                            <div style="width:100%; aspect-ratio:16/9; background:#000;">
                                <img src="${v.thumbnail}" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                            <div style="padding:10px;">
                                <p style="font-size:12px; font-weight:600; color:#333; margin:0;">📺 ${v.title}</p>
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
        div.style.background = 'transparent'; div.style.padding = 0; div.style.boxShadow = 'none';
    } else {
        div.textContent = content;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.id;
}

function showAlert(msg, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = msg;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}
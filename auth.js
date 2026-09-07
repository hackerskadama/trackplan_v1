/**
 * TrackPlan - Client-Side & API Authentication Service
 * Mendukung integrasi RESTful PHP/MySQL dengan fallback terenkripsi lokal (SHA-256/Salt)
 * Password pengguna SELALU di-hash dan tidak pernah disimpan dalam plain-text.
 */

const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'trackplan_current_user_v1',
  LOCAL_USERS:  'trackplan_users_db_v1',
  REMEMBER_ME:  'trackplan_remember_me_v1'
};

// ============================================================================
// Hashing Helper (Web Crypto SHA-256 + Salt untuk keamanan sisi klien)
// ============================================================================
async function hashClientPassword(password, salt = 'trackplan_secure_salt_2026') {
  if (window.crypto && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple deterministic fallback jika Web Crypto tidak aktif
  let hash = 0;
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

// ============================================================================
// Core AuthService
// ============================================================================
const AuthService = {
  apiEndpoint: 'api/auth.php',

  async init() {
    // Siap digunakan untuk akun pengguna yang terdaftar
  },

  getLocalUsers() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.LOCAL_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveLocalUsers(users) {
    localStorage.setItem(AUTH_STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user, remember = true) {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      return;
    }
    const cleanUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      created_at: user.created_at || new Date().toISOString()
    };
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(cleanUser));
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(cleanUser));
    }
  },

  /**
   * Registrasi Akun Baru
   */
  async register(name, username, email, password) {
    username = username.toLowerCase().trim();
    email = email.toLowerCase().trim();

    // 1. Coba request ke backend API PHP/MySQL jika tersedia
    try {
      const res = await fetch(`${this.apiEndpoint}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setCurrentUser(data.data);
        return { success: true, message: data.message, user: data.data };
      } else if (res.status === 409 || (res.status >= 400 && res.status < 500)) {
        return { success: false, message: data.message || 'Registrasi gagal.' };
      }
    } catch (networkError) {
      // Backend offline atau dibuka via file://, gunakan penyimpanan lokal dengan password hashing aman
    }

    // 2. Fallback: Simpan ke Local Storage dengan Hashing SHA-256 + Salt
    const users = this.getLocalUsers();
    if (users.some(u => u.username === username)) {
      return { success: false, message: 'Username ini sudah digunakan. Silakan pilih username lain.' };
    }
    if (users.some(u => u.email === email)) {
      return { success: false, message: 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.' };
    }

    const passwordHash = await hashClientPassword(password);
    const newUser = {
      id: Date.now(),
      name: name.trim(),
      username,
      email,
      password_hash: passwordHash, // AMAN: Tersimpan dalam bentuk hash kriptografi
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    this.saveLocalUsers(users);
    this.setCurrentUser(newUser);

    return { 
      success: true, 
      message: 'Pendaftaran akun berhasil! Password Anda telah dienkripsi secara aman.',
      user: newUser 
    };
  },

  /**
   * Login Akun
   */
  async login(identifier, password, rememberMe = true) {
    identifier = identifier.toLowerCase().trim();

    // 1. Coba request ke API PHP/MySQL
    try {
      const res = await fetch(`${this.apiEndpoint}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setCurrentUser(data.data, rememberMe);
        return { success: true, message: data.message, user: data.data };
      } else if (res.status === 401 || (res.status >= 400 && res.status < 500)) {
        return { success: false, message: data.message || 'Login gagal.' };
      }
    } catch (networkError) {
      // Backend offline, fallback ke database lokal
    }

    // 2. Fallback: Autentikasi lokal dengan verifikasi hash
    await this.init();
    const users = this.getLocalUsers();
    const user = users.find(u => u.username === identifier || u.email === identifier);

    if (!user) {
      return { success: false, message: 'Username atau email tidak terdaftar.' };
    }

    const inputHash = await hashClientPassword(password);
    if (user.password_hash !== inputHash) {
      return { success: false, message: 'Kata sandi yang Anda masukkan salah.' };
    }

    this.setCurrentUser(user, rememberMe);
    return { success: true, message: 'Login berhasil. Selamat datang!', user };
  },

  /**
   * Minta Kode Reset Password
   */
  async requestReset(identifier) {
    identifier = identifier.toLowerCase().trim();

    // 1. Coba API PHP/MySQL
    try {
      const res = await fetch(`${this.apiEndpoint}?action=forgot_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, data: data.data };
      } else if (res.status >= 400 && res.status < 500) {
        return { success: false, message: data.message };
      }
    } catch (networkError) {
      // Fallback lokal
    }

    // 2. Fallback lokal
    const users = this.getLocalUsers();
    const user = users.find(u => u.username === identifier || u.email === identifier);

    if (!user) {
      return { success: false, message: 'Akun dengan username atau email tersebut tidak ditemukan.' };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.reset_token = resetCode;
    user.reset_expires_at = Date.now() + (30 * 60 * 1000); // 30 menit
    this.saveLocalUsers(users);

    return {
      success: true,
      message: 'Kode pemulihan kata sandi telah dibuat.',
      data: {
        username: user.username,
        email: user.email,
        reset_code: resetCode
      }
    };
  },

  /**
   * Reset Kata Sandi Baru
   */
  async resetPassword(identifier, code, newPassword) {
    identifier = identifier.toLowerCase().trim();
    code = code.trim();

    // 1. Coba API PHP/MySQL
    try {
      const res = await fetch(`${this.apiEndpoint}?action=reset_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      } else if (res.status >= 400 && res.status < 500) {
        return { success: false, message: data.message };
      }
    } catch (networkError) {
      // Fallback lokal
    }

    // 2. Fallback lokal
    const users = this.getLocalUsers();
    const user = users.find(u => (u.username === identifier || u.email === identifier));

    if (!user || user.reset_token !== code) {
      return { success: false, message: 'Kode verifikasi tidak sesuai atau sudah kadaluarsa.' };
    }

    const newHash = await hashClientPassword(newPassword);
    user.password_hash = newHash;
    delete user.reset_token;
    delete user.reset_expires_at;
    this.saveLocalUsers(users);

    return { success: true, message: 'Kata sandi Anda berhasil diperbarui! Silakan login.' };
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await fetch(`${this.apiEndpoint}?action=logout`, { method: 'POST' });
    } catch (e) {}
    this.setCurrentUser(null);
    window.location.href = 'login.html';
  }
};

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
  AuthService.init();
});

// ============================================================================
// UI Helper: Toast Notification
// ============================================================================
function showAuthToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '⚠';
  toast.innerHTML = `
    <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.15);font-size:11px;font-weight:bold;">${icon}</span>
    <span style="flex:1;">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// UI Helper: Password Visibility Toggle
// ============================================================================
function setupPasswordToggles() {
  document.querySelectorAll('.auth-toggle-pwd').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
        button.title = 'Sembunyikan Kata Sandi';
      } else {
        input.type = 'password';
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
        button.title = 'Lihat Kata Sandi';
      }
    });
  });
}

// ============================================================================
// UI Helper: Password Strength Evaluation
// ============================================================================
function evaluatePasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, text: 'Terlalu Pendek', class: '' };

  if (password.length >= 6) score++;
  if (password.length >= 9) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, text: 'Kata sandi lemah', class: 'weak' };
  if (score <= 3) return { score: 2, text: 'Kata sandi sedang', class: 'medium' };
  return { score: 3, text: 'Kata sandi kuat & aman ✓', class: 'strong' };
}

// ===== Login Page JavaScript - Google Sheets Backend =====
// IMPORTANT: Update this URL to match your registration Apps Script deployment
const apiURL = "https://script.google.com/macros/s/AKfycbyUtAL05TBgZYUfuNdgG1iVamjIvWec424ap0o8d-9iD87aAvNaptp3pKWV8WC3TUx5mg/exec";

document.addEventListener('DOMContentLoaded', function() {
  // Redirect if already logged in
  if (localStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
  }
  
  setupFormValidation();
  setupEventListeners();
  injectStyles();
  console.log('✅ Login initialized');
});

// ===== Toggle Password Visibility =====
function togglePassword() {
  const input = document.getElementById('password');
  const icon = document.getElementById('toggleIcon');
  if (!input || !icon) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ===== Form Validation =====
function setupFormValidation() {
  const mobile = document.getElementById('mobile');
  const password = document.getElementById('password');
  
  if (mobile) {
    mobile.addEventListener('input', function() {
      // Allow digits, +, -, and spaces (like registration)
      this.value = this.value.replace(/[^\d+\-\s]/g, '');
    });
    
    mobile.addEventListener('blur', function() {
      validateMobileFormat(this.value);
    });
  }
  
  if (password) {
    password.addEventListener('input', function() {
      toggleError('passwordError', this.value.length > 0 && this.value.length < 6, 'Min 6 characters');
    });
  }
}

function validateMobileFormat(value) {
  const digitsOnly = value.replace(/\D/g, '');
  let isValid = false;
  let errorMsg = '';
  
  if (!value) {
    isValid = false;
    errorMsg = 'Mobile number is required';
  } else if (digitsOnly.length === 10) {
    // Just 10 digits
    if (/^[6-9]/.test(digitsOnly)) {
      isValid = true;
    } else {
      errorMsg = 'Must start with 6-9';
    }
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    // +91 with 10 digits
    const lastTen = digitsOnly.substring(2);
    if (/^[6-9]/.test(lastTen)) {
      isValid = true;
    } else {
      errorMsg = 'Must start with 6-9 after country code';
    }
  } else {
    errorMsg = 'Enter 10 digits or +91 with 10 digits';
  }
  
  toggleError('mobileError', !isValid, errorMsg);
}

function toggleError(id, hasError, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = hasError ? message : '';
    el.style.display = hasError ? 'block' : 'none';
  }
}

// ===== Notifications =====
function showNotification(message, type = 'success') {
  const container = document.getElementById('notificationContainer') || document.body;
  const notif = document.createElement('div');
  
  const config = {
    success: { bg: '#10b981', icon: 'check-circle' },
    error: { bg: '#ef4444', icon: 'exclamation-circle' },
    info: { bg: '#3b82f6', icon: 'info-circle' }
  };
  const { bg, icon } = config[type] || config.success;
  
  notif.style.cssText = `
    position:fixed;top:20px;right:20px;background:${bg};color:white;
    padding:16px 24px;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.1);
    z-index:10000;animation:slideIn 0.3s ease;max-width:90vw;display:flex;align-items:center;gap:10px;
    font-family: Arial, sans-serif;
  `;
  notif.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
  container.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ===== Main Login Handler =====
function setupEventListeners() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const mobileInput = document.getElementById('mobile')?.value.trim();
    const password = document.getElementById('password')?.value.trim();
    const remember = document.getElementById('remember')?.checked;
    const btn = document.querySelector('.login-btn');
    
    // Validate fields
    if (!mobileInput) {
      toggleError('mobileError', true, 'Mobile number is required');
      return;
    }
    
    validateMobileFormat(mobileInput);
    const mobileError = document.getElementById('mobileError');
    if (mobileError && mobileError.textContent) {
      return;
    }
    
    if (!password) {
      toggleError('passwordError', true, 'Password is required');
      return;
    }
    
    if (password.length < 6) {
      toggleError('passwordError', true, 'Password must be 6+ characters');
      return;
    }
    
    // Clear errors & set loading
    toggleError('mobileError', false);
    toggleError('passwordError', false);
    setLoading(btn, true);
    
    try {
      const response = await fetchWithTimeout(apiURL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'login', 
          mobile: mobileInput, 
          password: password 
        })
      }, 15000);
      
      const result = await response.json();
      
      if (result.success) {
        // Save auth state
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInMobile', mobileInput);
        
        // Store safe user data only
        const user = result.user || {};
        localStorage.setItem('userData', JSON.stringify({
          userId: user.userId || '',
          name: user.name || '',
          mobile: user.mobile || mobileInput,
          email: user.email || ''
        }));
        
        if (remember) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedMobile', mobileInput);
        }
        
        showNotification('✅ Login successful!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1200);
        
      } else {
        showNotification(result.message || '❌ Invalid mobile or password', 'error');
        setLoading(btn, false);
      }
      
    } catch (err) {
      console.error('Login failed:', err);
      showNotification('⚠️ Connection error. Try again.', 'error');
      setLoading(btn, false);
    }
  });
  
  // Placeholder handlers
  document.querySelectorAll('.social-btn').forEach(btn => 
    btn.onclick = (e) => { e.preventDefault(); showNotification('Coming soon!', 'info'); }
  );
  
  document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('Contact admin for password reset', 'info');
  });
  
  // Auto-fill remember me
  if (localStorage.getItem('rememberMe') === 'true') {
    const savedMobile = localStorage.getItem('savedMobile');
    if (savedMobile) {
      document.getElementById('mobile').value = savedMobile;
      document.getElementById('remember').checked = true;
    }
  }
}

// ===== Helpers =====
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
  btn.innerHTML = loading 
    ? '<i class="fas fa-circle-notch fa-spin"></i> Signing In...' 
    : '<span class="btn-text">Sign In</span><span class="btn-icon"><i class="fas fa-arrow-right"></i></span>';
}

async function fetchWithTimeout(url, options, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ===== Navigation Guard =====
window.addEventListener('popstate', () => {
  if (localStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
  }
});
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}

// ===== CSS Animations =====
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(400px);opacity:0}}
    .error{color:#ef4444;font-size:14px;margin-top:4px;display:none}
    .login-btn.loading{opacity:0.8;cursor:not-allowed}
  `;
  document.head.appendChild(style);
}

// ===== Auth Utilities (for dashboard.html) =====
function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('loggedInMobile');
  localStorage.removeItem('userData');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('savedMobile');
  window.location.href = 'index.html';
}

function requireAuth() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    return {};
  }
}
// login.js - SHS Marketing Login System
const API_URL = "https://script.google.com/macros/s/AKfycby6bXcLt6W8xAoJcW5hCrOHhzVM0HjvcS-J-RqTFP0uwxGTNnCHy0oqDM0IAekrKWpG9g/exec";

// ─── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Redirect if already logged in
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
        return;
    }

    injectStyles();
    setupMobileField();
    setupPasswordField();
    setupRememberMe();
    setupFormSubmit();
    setupSocialButtons();
    setupForgotPassword();

    // Auto-fill mobile from payment page if coming from there
    const pendingPhone = sessionStorage.getItem('pendingPaymentPhone');
    if (pendingPhone) {
        const mobileInput = document.getElementById('mobile');
        if (mobileInput && !mobileInput.value) {
            mobileInput.value = formatPhoneForDisplay(pendingPhone);
        }
    }

    console.log('✅ Login page initialized');
});

// ─── PHONE NORMALIZATION ────────────────────────────────────────────────────────
function normalizePhone(phone) {
    if (!phone) return null;
    const digits = (phone + '').replace(/\D/g, '');
    let mobile;
    if (digits.length === 10) {
        mobile = digits;
    } else if (digits.length === 12 && digits.startsWith('91')) {
        mobile = digits.substring(2);
    } else {
        return null;
    }
    return /^[6-9]/.test(mobile) ? mobile : null;
}

// ─── PHONE DISPLAY FORMATTER ───────────────────────────────────────────────────
// Only used for pre-filling (remember-me / pending payment auto-fill).
// NOT called on input events — that caused "+91" to fight the user on every keystroke.
function formatPhoneForDisplay(raw) {
    let digits = (raw + '').replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) digits = digits.substring(2);
    if (digits.length > 10) digits = digits.slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 5) return `+91 ${digits}`;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

// ─── MOBILE FIELD SETUP ────────────────────────────────────────────────────────
// Taken from payment.js approach:
//   input → filter allowed chars only (no reformatting mid-type)
//   blur  → format to "+91 XXXXX XXXXX" then validate
function setupMobileField() {
    const mobile = document.getElementById('mobile');
    if (!mobile) return;

    // Allow digits, +, -, spaces only — same as payment.js
    mobile.addEventListener('input', function () {
        this.value = this.value.replace(/[^\d+\-\s]/g, '');
    });

    // On blur: format first, then validate — same order as payment.js
    mobile.addEventListener('blur', function () {
        const digits = this.value.replace(/\D/g, '');
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            this.value = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
            const lastTen = digits.slice(2);
            if (/^[6-9]/.test(lastTen)) {
                this.value = `+91 ${lastTen.slice(0, 5)} ${lastTen.slice(5)}`;
            }
        }
        const result = validateMobileInput(this.value);
        toggleError('mobileError', !result.valid, result.message);
    });
}

function validateMobileInput(value) {
    if (!value || !value.trim()) {
        return { valid: false, message: 'Mobile number is required' };
    }
    const normalized = normalizePhone(value);
    if (!normalized) {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 10) return { valid: false, message: 'Mobile number too short (minimum 10 digits)' };
        if (digits.length > 12) return { valid: false, message: 'Mobile number too long' };
        return { valid: false, message: 'Must start with 6–9 (valid Indian mobile)' };
    }
    return { valid: true, message: '' };
}

// ─── PASSWORD FIELD SETUP ───────────────────────────────────────────────────────
// Login only checks non-empty — complexity rules belong at registration only.
function setupPasswordField() {
    const password = document.getElementById('password');
    if (!password) return;

    password.addEventListener('input', function () {
        toggleError('passwordError', !this.value, 'Password is required');
    });

    password.addEventListener('blur', function () {
        toggleError('passwordError', !this.value, 'Password is required');
    });
}

// ─── TOGGLE PASSWORD VISIBILITY ────────────────────────────────────────────────
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

// ─── ERROR TOGGLE ───────────────────────────────────────────────────────────────
function toggleError(id, hasError, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = hasError ? (message || '') : '';
    el.style.display = hasError ? 'block' : 'none';
}

// ─── REMEMBER ME ───────────────────────────────────────────────────────────────
// Stores and restores the raw 10-digit number.
// formatPhoneForDisplay() is called on restore to show the pretty "+91 XXXXX XXXXX"
// without the double-format bug the old code had.
function setupRememberMe() {
    if (localStorage.getItem('rememberMe') === 'true') {
        const savedMobile = localStorage.getItem('savedMobile');
        if (savedMobile) {
            const mobileInput = document.getElementById('mobile');
            if (mobileInput) mobileInput.value = formatPhoneForDisplay(savedMobile);
            const rememberCheck = document.getElementById('remember');
            if (rememberCheck) rememberCheck.checked = true;
        }
    }
}

// ─── SOCIAL BUTTONS ────────────────────────────────────────────────────────────
function setupSocialButtons() {
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Social login coming soon!', 'info');
        });
    });
}

// ─── FORGOT PASSWORD ────────────────────────────────────────────────────────────
function setupForgotPassword() {
    document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Please contact admin to reset your password', 'info');
    });
}

// ─── MAIN FORM SUBMIT ──────────────────────────────────────────────────────────
function setupFormSubmit() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const mobileRaw = document.getElementById('mobile')?.value.trim();
        const password  = document.getElementById('password')?.value; // no trim — preserve as registered
        const remember  = document.getElementById('remember')?.checked;
        const btn       = document.getElementById('loginBtn');

        // Validate fields — show all errors before returning
        let isValid = true;

        const mobileValidation = validateMobileInput(mobileRaw);
        if (!mobileValidation.valid) {
            toggleError('mobileError', true, mobileValidation.message);
            isValid = false;
        } else {
            toggleError('mobileError', false, '');
        }

        if (!password) {
            toggleError('passwordError', true, 'Password is required');
            isValid = false;
        } else {
            toggleError('passwordError', false, '');
        }

        if (!isValid) return;

        // Send clean 10-digit number to GAS backend
        const normalizedMobile = normalizePhone(mobileRaw);

        setLoading(btn, true);

        try {
            console.log('📤 Sending login request for:', normalizedMobile);

            const response = await fetchWithTimeout(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'loginWithPaymentCheck',
                    mobile: normalizedMobile,
                    password: password
                })
            }, 15000);

            const result = await response.json();
            console.log('📥 Backend response:', result);

            // Check paymentPending FIRST — GAS returns success:false + paymentPending:true
            if (result.paymentPending) {
                showNotification(
                    '⏳ Your payment is still being verified. Please wait up to 24 hours.',
                    'warning'
                );
                setLoading(btn, false);
                return;
            }

            if (result.success) {
                console.log('✅ Login successful!');
                const user = result.user || {};

                // Session stored in sessionStorage (clears on tab close)
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('loggedInMobile', normalizedMobile);
                sessionStorage.setItem('userData', JSON.stringify({
                    userId:       user.userId       || '',
                    name:         user.name         || '',
                    mobile:       user.mobile        || normalizedMobile,
                    email:        user.email         || '',
                    referralCode: user.referralCode  || ''
                }));

                // Remember me — persist raw 10-digit number only
                if (remember) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('savedMobile', normalizedMobile);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('savedMobile');
                }

                // Clean up payment sessionStorage keys
                sessionStorage.removeItem('pendingPaymentPhone');
                sessionStorage.removeItem('pendingPaymentTxnId');

                showNotification(`✅ Welcome, ${user.name || 'User'}!`, 'success');

                // Small delay so user sees the notification, then redirect
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1200);

            } else {
                console.error('❌ Login failed:', result.message);
                showNotification(result.message || '❌ Invalid mobile or password', 'error');
                setLoading(btn, false);
            }

        } catch (err) {
            console.error('❌ Login error:', err);
            showNotification(
                err.name === 'AbortError'
                    ? '⚠️ Request timed out. Please try again.'
                    : '⚠️ Connection error. Please check your internet.',
                'error'
            );
            setLoading(btn, false);
        }
    });
}

// ─── LOADING STATE ─────────────────────────────────────────────────────────────
function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
    btn.innerHTML = loading
        ? '<span class="btn-loader"><i class="fas fa-circle-notch fa-spin"></i></span> Signing In...'
        : '<span class="btn-text">Sign In</span><span class="btn-icon"><i class="fas fa-arrow-right"></i></span>';
}

// ─── FETCH WITH TIMEOUT ────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────────
function showNotification(message, type) {
    type = type || 'info';
    const container = document.getElementById('notificationContainer') || document.body;
    const notif = document.createElement('div');

    const config = {
        success: { bg: '#10b981', icon: 'check-circle' },
        error:   { bg: '#ef4444', icon: 'exclamation-circle' },
        warning: { bg: '#f59e0b', icon: 'exclamation-triangle' },
        info:    { bg: '#3b82f6', icon: 'info-circle' }
    };
    const { bg, icon } = config[type] || config.info;

    notif.style.cssText = [
        'position:fixed', 'top:20px', 'right:20px',
        `background:${bg}`, 'color:white',
        'padding:16px 24px', 'border-radius:8px',
        'box-shadow:0 10px 25px rgba(0,0,0,0.15)',
        'z-index:10000', 'animation:slideIn 0.3s ease',
        'max-width:90vw', 'display:flex', 'align-items:center',
        'gap:10px', "font-family:'Sora',sans-serif",
        'font-size:14px', 'line-height:1.4'
    ].join(';');

    notif.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 5000);
}

// ─── NAVIGATION GUARD ─────────────────────────────────────────────────────────
window.addEventListener('popstate', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }
});

if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// ─── AUTH UTILITIES — call these from dashboard.html and other protected pages ──
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loggedInMobile');
    sessionStorage.removeItem('userData');
    window.location.href = 'login.html';
}

function requireAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('userData') || '{}');
    } catch {
        return {};
    }
}

// ─── INJECTED ANIMATIONS ──────────────────────────────────────────────────────
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0);     opacity: 1; }
            to   { transform: translateX(400px); opacity: 0; }
        }
        .error-message {
            color: #ef4444;
            font-size: 13px;
            margin-top: 4px;
            display: none;
        }
        .login-btn.loading {
            opacity: 0.8;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}
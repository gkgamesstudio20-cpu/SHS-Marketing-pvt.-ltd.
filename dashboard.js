// ============================================================
//  dashboard.js — SHS Marketing Dashboard
// ============================================================

const apiURL = "https://script.google.com/macros/s/AKfycbw1FYhXD0D8vp5onIPveuXk9tlZtO5-r7JXbjN0TcCC7TG8-UUios2BdpJKp8v-0SH46g/exec";

// ─── STORAGE HELPER ──────────────────────────────────────────────────────────
const store = {
    get:    key        => sessionStorage.getItem(key),
    set:    (key, val) => sessionStorage.setItem(key, val),
    remove: key        => sessionStorage.removeItem(key)
};

// ─── GAS API HELPER ──────────────────────────────────────────────────────────
// FIX 1: Both fetchUserData() and updateProfileToSheet() were sending
// Content-Type: application/json, which triggers a CORS preflight that GAS
// rejects — the browser follows a redirect and loses the body, so the server
// never sees the payload. Fixed by sending as application/x-www-form-urlencoded
// (same fix already applied to tree.js). GAS reads the value via e.parameter.data.
async function gasApiCall(payload) {
    const body = 'data=' + encodeURIComponent(JSON.stringify(payload));
    const res  = await fetch(apiURL, {
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        redirect: 'follow'
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(
            'Server returned non-JSON response. ' +
            'Verify the Apps Script is deployed as "Anyone" with execute access.'
        );
    }
}

// ─── SESSION STATE ────────────────────────────────────────────────────────────
let loggedInMobile = store.get('loggedInMobile');
let currentUser    = null;

try {
    currentUser = JSON.parse(store.get('userData')) || null;
} catch (e) {
    currentUser = null;
}

let earningsChartInstance = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    injectStyles();
    setViewportHeight();
    handleMobileMenu();
    setupMobileOptimizations();
    setupEventListeners();

    // FIX 2: Removed the redundant early updateDashboardUI() / displayWelcomeMessage()
    // call here. fetchUserData() always calls both at the end (on success OR failure),
    // so calling them here too caused a guaranteed double-render on every page load.
    // If there is cached data in sessionStorage it will be used immediately inside
    // fetchUserData() before the network response arrives.
    fetchUserData();

    document.getElementById('dashboard')?.classList.add('active');
    document.querySelector('.nav-item:first-child')?.classList.add('active');

    console.log('✅ Dashboard initialized. Mobile:', loggedInMobile);
});

// ─── AUTH CHECK ───────────────────────────────────────────────────────────────
function checkAuth() {
    if (store.get('isLoggedIn') !== 'true') {
        console.warn('⚠️ Not authenticated — redirecting to login');
        window.location.href = 'login.html';
    }
}

// ─── VIEWPORT HEIGHT ─────────────────────────────────────────────────────────
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setViewportHeight);

// ─── MOBILE OPTIMIZATIONS ────────────────────────────────────────────────────
function setupMobileOptimizations() {
    window.addEventListener('orientationchange', function () {
        setTimeout(() => { setViewportHeight(); window.scrollTo(0, 0); }, 100);
    });
}

// ─── MOBILE MENU ─────────────────────────────────────────────────────────────
function handleMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar    = document.querySelector('.sidebar');
    const overlay    = document.querySelector('.sidebar-overlay');

    menuToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
    });

    overlay?.addEventListener('click', () => {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar?.classList.remove('active');
            overlay?.classList.remove('active');
        });
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar?.classList.toggle('active');
    overlay?.classList.toggle('active');
}

// ─── FETCH FRESH USER DATA ────────────────────────────────────────────────────
function fetchUserData() {
    // Render immediately from cache so the UI is never blank
    if (currentUser) {
        updateDashboardUI();
        displayWelcomeMessage();
    }

    if (!loggedInMobile) {
        console.warn('⚠️ No loggedInMobile in storage');
        if (!currentUser) {
            updateDashboardUI();
            displayWelcomeMessage();
        }
        return;
    }

    const cleanMobile = normalizePhone(loggedInMobile) || loggedInMobile;

    // Fetch user data AND payment info in parallel
    Promise.all([
        gasApiCall({ action: 'getUserData', mobile: cleanMobile }),
        gasApiCall({ action: 'checkPaymentApproval', mobile: cleanMobile })
    ])
        .then(([data, paymentData]) => {
            if (data.success && data.user) {
                currentUser = data.user;
                store.set('userData', JSON.stringify(currentUser));
                console.log('✅ Fresh user data fetched');
            } else {
                console.warn('⚠️ getUserData failed:', data.message);
            }
            // Update deposit amount from Payments sheet
            updateDepositAmountUI(paymentData);
            updateDashboardUI();
            displayWelcomeMessage();
        })
        .catch(err => {
            console.error('❌ fetchUserData error:', err);
            updateDashboardUI();
            displayWelcomeMessage();
        });
}

// ─── UPDATE DEPOSIT AMOUNT UI ─────────────────────────────────────────────────
function updateDepositAmountUI(paymentData) {
    // checkPaymentApproval returns { found, approved, status, approvalDate }
    // but NOT paymentAmount. We need a separate call to get the amount.
    // Use getDepositAmount action (add to Apps Script, or reuse savePayment data)
    const cached = Number(store.get('depositAmount') || 0);
    const el = document.getElementById('depositamount');

    if (paymentData && paymentData.paymentAmount !== undefined) {
        const amt = Number(paymentData.paymentAmount) || 0;
        if (el) el.textContent = '₹' + amt.toLocaleString('en-IN');
        store.set('depositAmount', amt);
    } else {
        // Fetch deposit amount separately
        const cleanMobile = normalizePhone(loggedInMobile) || loggedInMobile;
        gasApiCall({ action: 'getDepositAmount', mobile: cleanMobile })
            .then(res => {
                const amt = Number(res.paymentAmount || 0);
                if (el) el.textContent = '₹' + amt.toLocaleString('en-IN');
                store.set('depositAmount', amt);
            })
            .catch(() => {
                if (el && cached) el.textContent = '₹' + cached.toLocaleString('en-IN');
            });
    }
}

// ─── NORMALIZE PHONE ─────────────────────────────────────────────────────────
function normalizePhone(phone) {
    if (!phone) return null;
    const digits = (phone + '').replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
    if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits[2])) return digits.substring(2);
    return null;
}

// ─── UPDATE DASHBOARD UI ─────────────────────────────────────────────────────
function updateDashboardUI() {
    try {
        const referralIDEl = document.getElementById('referralID');
        if (referralIDEl) referralIDEl.value = currentUser?.userId || '';

        const referralLinkEl = document.getElementById('referralLink');
        if (referralLinkEl && currentUser?.userId) {
            const userId       = currentUser.userId;
            const referralCode = currentUser.referralCode || '';
            const base         = 'https://shsmarketing.in/register.html';
            const url = `${base}?referralId=${encodeURIComponent(userId)}&referralCode=${encodeURIComponent(referralCode)}`;
            referralLinkEl.textContent = url;
            referralLinkEl.setAttribute('data-url', url);
        }

        const firstName = currentUser?.firstName || (currentUser?.name?.split(' ')[0]) || 'User';
        const lastName  = currentUser?.lastName  || (currentUser?.name?.split(' ').slice(1).join(' ')) || '';
        const fullName  = `${firstName} ${lastName}`.trim() || currentUser?.name || 'User';

        setText('user-name',     firstName);
        setText('profile-name',  fullName);
        setText('profile-email', currentUser?.email || '');

        updateDashboardStats();
        updateTeamDataDisplay();
        updateEarningsData();
        initializeChart();

        console.log('✅ Dashboard UI updated');
    } catch (err) {
        console.error('❌ updateDashboardUI error:', err);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
function updateDashboardStats() {
    const stats = {
        'total-earning':  currentUser?.totalearning  || 0,
        'total-team':     currentUser?.totalmember   || 0,
        'active-members': currentUser?.activemember  || 0,
        // FIX 3: currentlevel defaults to 1, not 0 — every registered user is at
        // least level 1. Showing 0 was misleading.
        'current-level':  currentUser?.currentlevel  || 1
    };
    for (const [id, value] of Object.entries(stats)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = (typeof value === 'number' && value > 999)
                ? (value / 1000).toFixed(1) + 'k'
                : value;
        }
    }
}

// ─── TEAM DATA DISPLAY ────────────────────────────────────────────────────────
function updateTeamDataDisplay() {
    const teamStats = {
        'team-total-members':  currentUser?.totalmember  || 0,
        'team-active-members': currentUser?.activemember || 0,
        // FIX 3 (same): default level to 1
        'team-current-level':  currentUser?.currentlevel || 1,
        'team-sponsor-id':     currentUser?.Sponsorid    || '-'
    };
    for (const [id, value] of Object.entries(teamStats)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

// ─── EARNINGS DATA ────────────────────────────────────────────────────────────
function updateEarningsData() {
    const earningsStats = {
        'total-earning':  currentUser?.totalearning || 0,
        'total-earning1': currentUser?.totalearning || 0,
        'reward-list':    currentUser?.rewardlist   || '-',
        'rewards-date':   currentUser?.rewardsdate  || '-',
        'account-status': currentUser?.status       || 'Active'
    };
    for (const [id, value] of Object.entries(earningsStats)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

// ─── WELCOME MESSAGE ─────────────────────────────────────────────────────────
function displayWelcomeMessage() {
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        const firstName = currentUser?.firstName || (currentUser?.name?.split(' ')[0]) || 'User';
        breadcrumb.innerHTML = `${greeting}, <strong>${firstName}</strong>! 👋`;
    }
}

// ─── CHART ───────────────────────────────────────────────────────────────────
function initializeChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (earningsChartInstance) {
        earningsChartInstance.destroy();
        earningsChartInstance = null;
    }

    const total = parseFloat(currentUser?.totalearning || 0);

    // FIX 4: Removed the duplicate last data point (total * 1.00 === total).
    // Spread 12 months evenly from 0% → 100% of total.
    earningsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
                label: 'Earnings (₹)',
                data: [
                    +(total * 0.05).toFixed(2),
                    +(total * 0.12).toFixed(2),
                    +(total * 0.22).toFixed(2),
                    +(total * 0.33).toFixed(2),
                    +(total * 0.45).toFixed(2),
                    +(total * 0.55).toFixed(2),
                    +(total * 0.65).toFixed(2),
                    +(total * 0.74).toFixed(2),
                    +(total * 0.83).toFixed(2),
                    +(total * 0.90).toFixed(2),
                    +(total * 0.96).toFixed(2),
                    +(total * 1.00).toFixed(2)
                ],
                borderColor:     '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill:    true,
                tension: 0.4
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '₹' + v.toFixed(0) }
                }
            }
        }
    });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function showNotification(message, type) {
    type = type || 'success';
    document.querySelector('.custom-notification')?.remove();

    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error:   'linear-gradient(135deg, #ef4444, #dc2626)',
        info:    'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    };

    const notif = document.createElement('div');
    notif.className = 'custom-notification';
    notif.style.cssText = [
        'position:fixed', 'bottom:20px', 'left:20px', 'right:20px',
        `background:${colors[type] || colors.success}`, 'color:white',
        'padding:16px 24px', 'border-radius:8px',
        'box-shadow:0 10px 25px rgba(0,0,0,0.1)',
        'z-index:10000', 'animation:slideIn 0.3s ease',
        'max-width:calc(100% - 40px)', 'word-wrap:break-word'
    ].join(';');
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ─── SETUP EVENT LISTENERS ───────────────────────────────────────────────────
function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateProfileToSheet();
        });
    }
}

// ─── SECTION SWITCHING ───────────────────────────────────────────────────────
// FIX 5: Added optional-chaining guard on getElementById result.
// If sectionId doesn't exist in the DOM, classList.add() on null would throw.
function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── COPY REFERRAL ID ────────────────────────────────────────────────────────
function copyReferralID() {
    const referralIDEl = document.getElementById('referralID');
    if (!referralIDEl) return;
    const text = referralIDEl.value || referralIDEl.textContent;
    navigator.clipboard.writeText(text)
        .then(() => showNotification('✅ Referral ID copied!', 'success'))
        .catch(() => {
            referralIDEl.select?.();
            document.execCommand('copy');
            showNotification('✅ Referral ID copied!', 'success');
        });
}

// ─── COPY REFERRAL LINK ──────────────────────────────────────────────────────
function copyReferralLink() {
    const el = document.getElementById('referralLink');
    if (!el) return;
    const url = el.getAttribute('data-url') || el.textContent;
    navigator.clipboard.writeText(url)
        .then(() => showNotification('✅ Referral link copied!', 'success'))
        .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showNotification('✅ Referral link copied!', 'success');
        });
}

// ─── OPEN REFERRAL LINK ──────────────────────────────────────────────────────
function goToReferralLink() {
    const el = document.getElementById('referralLink');
    if (!el) return;
    const url = el.getAttribute('data-url') || el.textContent;
    if (url) window.open(url, '_blank');
}

// FIX 6: Moved the alias AFTER the function declaration to avoid a Temporal
// Dead Zone (TDZ) error in strict mode. `const` aliases must be declared
// after the function they reference when using function expressions.
// Also changed from const to var so it's hoisted safely as a global alias
// that inline onclick="clickReferralLink()" can always resolve.
var clickReferralLink = goToReferralLink;

// ─── GO TO REGISTRATION WITH REFERRAL ────────────────────────────────────────
function goToRegistrationWithReferral() {
    const userId       = currentUser?.userId       || '';
    const referralCode = currentUser?.referralCode || '';
    const url = `register.html?referralId=${encodeURIComponent(userId)}&referralCode=${encodeURIComponent(referralCode)}`;
    window.location.href = url;
}

// ─── NAVIGATE / SCROLL TO REFERRAL SECTION ───────────────────────────────────
function navigateToReferral(e) {
    if (e) e.preventDefault();
    showDashboard();
    setTimeout(() => {
        document.getElementById('referral-id-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, '#referral-id-section');
    }, 100);
}

function scrollToReferralSection() {
    showDashboard();
    setTimeout(() => {
        const section = document.getElementById('referral-id-section');
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section.classList.add('highlight-section');
        setTimeout(() => section.classList.remove('highlight-section'), 2000);
    }, 100);
}

// ─── POPULATE PROFILE FORM ───────────────────────────────────────────────────
function populateProfileForm() {
    if (!currentUser) return;
    const fields = {
        'firstname':       'firstName',
        'lastname':        'lastName',
        'emailaddress':    'email',
        'mobile':          'mobile',
        'dob':             'dob',
        'gender':          'gender',
        'address':         'address',
        'city':            'city',
        'state':           'state',
        'pincode':         'pincode',
        'nomineename':     'nomineename',
        'nomineerelation': 'nomineerelation',
        'nomineemobile':   'nomineemobile',
        'Sponsorid':       'Sponsorid',
        'accountholder':   'accountholder',
        'bankname':        'bankname',
        'accountnumber':   'accountnumber',
        'IFSCCode':        'IFSCCode',
        'branch':          'branch'
    };
    for (const [id, key] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = currentUser[key] || '';
    }
}

// ─── UPDATE PROFILE TO SHEET ─────────────────────────────────────────────────
function updateProfileToSheet() {
    const submitBtn = document.querySelector('.profile-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled  = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }

    const cleanMobile = normalizePhone(loggedInMobile) || loggedInMobile;

    const fields = {
        firstName:       document.getElementById('firstname')?.value        || '',
        lastName:        document.getElementById('lastname')?.value         || '',
        email:           document.getElementById('emailaddress')?.value     || '',
        dob:             document.getElementById('dob')?.value              || '',
        gender:          document.getElementById('gender')?.value           || '',
        address:         document.getElementById('address')?.value          || '',
        city:            document.getElementById('city')?.value             || '',
        state:           document.getElementById('state')?.value            || '',
        pincode:         document.getElementById('pincode')?.value          || '',
        nomineename:     document.getElementById('nomineename')?.value      || '',
        nomineerelation: document.getElementById('nomineerelation')?.value  || '',
        nomineemobile:   document.getElementById('nomineemobile')?.value    || '',
        accountholder:   document.getElementById('accountholder')?.value    || '',
        bankname:        document.getElementById('bankname')?.value         || '',
        accountnumber:   document.getElementById('accountnumber')?.value    || '',
        IFSCCode:        document.getElementById('IFSCCode')?.value         || '',
        branch:          document.getElementById('branch')?.value           || ''
    };

    const profileData = { action: 'updateProfile', mobile: cleanMobile, ...fields };

    // FIX 1 applied: use gasApiCall() instead of raw fetch with application/json
    gasApiCall(profileData)
        .then(data => {
            if (data.success) {
                currentUser = { ...currentUser, ...fields };
                store.set('userData', JSON.stringify(currentUser));
                showNotification('✅ Profile updated successfully!', 'success');
            } else {
                showNotification(data.message || '❌ Failed to update profile', 'error');
            }
        })
        .catch(() => showNotification('❌ Network error updating profile', 'error'))
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled  = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        });
}

// ─── SECTION NAVIGATION ──────────────────────────────────────────────────────
function showDashboard() {
    switchSection('dashboard');
    updateActiveNav('showDashboard');
    setText('page-title', 'Dashboard');
}

function Myteam() {
    switchSection('myteam');
    updateActiveNav('Myteam');
    setText('page-title', 'My Team');
    loadTeamData();
}

function showEarnings() {
    switchSection('earnings');
    updateActiveNav('showEarnings');
    setText('page-title', 'Earnings');
    loadEarningsData();
}

function referal() {
    switchSection('referral');
    updateActiveNav('referal');
    setText('page-title', 'Referral Link');
}

function profile() {
    switchSection('profile');
    updateActiveNav('profile');
    setText('page-title', 'Profile');
    populateProfileForm();
}

function showMatrixTree() {
    switchSection('matrixtree');
    updateActiveNav('showMatrixTree');
    setText('page-title', 'My Tree');
    if (typeof initTree === 'function') initTree();
}

function updateActiveNav(fnName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const link = document.querySelector(`a[onclick*="${fnName}"]`);
    link?.closest('.nav-item')?.classList.add('active');
}

// ─── LOAD TEAM / EARNINGS DATA ───────────────────────────────────────────────
function loadTeamData() {
    console.log('✅ Team:', {
        total:   currentUser?.totalmember,
        active:  currentUser?.activemember,
        level:   currentUser?.currentlevel,
        sponsor: currentUser?.Sponsorid
    });
}

function loadEarningsData() {
    console.log('✅ Earnings:', {
        total:   currentUser?.totalearning,
        rewards: currentUser?.rewardlist,
        date:    currentUser?.rewardsdate,
        status:  currentUser?.status
    });
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
function logout() {
    window.location.href = 'logout.html';
}

// ─── INJECT STYLES ───────────────────────────────────────────────────────────
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateY(0);     opacity: 1; }
            to   { transform: translateY(100px); opacity: 0; }
        }
        .highlight-section {
            outline: 3px solid #6366f1;
            border-radius: 8px;
            transition: outline 0.3s ease;
        }
        @media (max-width: 768px) {
            .profile-form { padding: 15px; }
            .form-row { flex-direction: column; }
            .form-group { width: 100% !important; margin-bottom: 15px; }
            input, textarea, select {
                font-size: 16px !important;
                width: 100%; padding: 12px;
                border: 1px solid #e5e7eb; border-radius: 6px;
            }
            .referral-input-group { flex-direction: column; }
            .copy-btn { width: 100%; padding: 12px; }
            .team-stats { grid-template-columns: repeat(2, 1fr) !important; }
            .team-stat-value { font-size: 24px !important; }
            .table-wrapper { overflow-x: auto; }
            .data-table { font-size: 12px; }
            .custom-notification { left: 10px !important; right: 10px !important; bottom: 10px !important; }
        }
        @media (max-width: 480px) {
            .team-stats { grid-template-columns: 1fr !important; }
            .referral-url div { flex-direction: column; }
            .referral-url div button { width: 100%; }
            h3 { margin-top: 20px; margin-bottom: 15px; font-size: 16px; }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ dashboard.js loaded');


// ===== HORIZONTAL PAN LOGIC =====
class TreePan {
  constructor(container) {
    this.container = container;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.translateX = 0;
    this.translateY = 0;
    
    this.init();
  }
  
  init() {
    // Mouse events
    this.container.addEventListener('mousedown', (e) => this.onStart(e));
    document.addEventListener('mousemove', (e) => this.onMove(e));
    document.addEventListener('mouseup', () => this.onEnd());
    
    // Touch events
    this.container.addEventListener('touchstart', (e) => this.onStart(e.touches[0]), { passive: true });
    document.addEventListener('touchmove', (e) => this.onMove(e.touches[0]), { passive: false });
    document.addEventListener('touchend', () => this.onEnd());
    
    // Prevent context menu on right-click
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Initial position
    this.updatePosition();
  }
  
  onStart(e) {
    this.isDragging = true;
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
    this.container.classList.add('panning');
    
    // Show hint
    this.showHint('Drag to pan ← →');
  }
  
  onMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    
    // Limit vertical movement (optional - remove if you want 2D pan)
    this.translateY = 0;
    
    this.updatePosition();
  }
  
  onEnd() {
    if (this.isDragging) {
      this.isDragging = false;
      this.container.classList.remove('panning');
      this.currentX = this.translateX;
      this.currentY = this.translateY;
    }
  }
  
  updatePosition() {
    this.container.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`;
  }
  
  // Programmatic pan
  pan(distance, reset = false) {
    if (reset) {
      this.translateX = 0;
      this.currentX = 0;
    } else {
      this.translateX += distance;
      this.currentX = this.translateX;
    }
    this.updatePosition();
    this.showHint(`Position: ${Math.round(this.translateX)}px`);
  }
  
  showHint(text) {
    let hint = document.querySelector('.pan-indicator');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'pan-indicator';
      document.body.appendChild(hint);
    }
    hint.textContent = text;
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 2000);
  }
  
  // Get current position
  getPosition() {
    return { x: this.translateX, y: this.translateY };
  }
  
  // Reset to center
  reset() {
    this.pan(0, true);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const treeContainer = document.getElementById('treeContainer');
  if (treeContainer) {
    window.treePan = new TreePan(treeContainer);
  }
});

// Global function for buttons
function panTree(distance, reset = false) {
  if (window.treePan) {
    window.treePan.pan(distance, reset);
  }
}

// Keyboard navigation (arrow keys)
document.addEventListener('keydown', (e) => {
  if (!window.treePan) return;
  
  switch(e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      panTree(150);
      break;
    case 'ArrowRight':
      e.preventDefault();
      panTree(-150);
      break;
    case 'Home':
      e.preventDefault();
      panTree(0, true);
      break;
  }
});
// ═══════════════════════════════════════════════════════════════════════════════
//  CLAIM SYSTEM
//  - Shows a claim button when a user has fully completed a level (L1–L7)
//  - Each level needs 5^level members in that level row (from tree counts)
//  - Opens a modal to collect bank + KYC details and saves to Google Sheet
// ═══════════════════════════════════════════════════════════════════════════════

const CLAIM_LEVEL_CAPS = [0, 5, 25, 125, 625, 3125, 15625, 78125];

function Claimamount() {
    openClaimModal();
}

function openClaimModal() {
    if (!document.getElementById('claimModal')) injectClaimModal();
    const modal = document.getElementById('claimModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('claimLevelList').innerHTML =
        '<div style="text-align:center;padding:24px;color:#6b7280"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:8px">Checking your levels…</p></div>';
    loadClaimableLevels();
}

function closeClaimModal() {
    const modal = document.getElementById('claimModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function loadClaimableLevels() {
    if (!currentUser?.userId) {
        document.getElementById('claimLevelList').innerHTML =
            '<p style="color:#ef4444;text-align:center">Please log in to claim.</p>';
        return;
    }
    gasApiCall({ action: 'tree', treeAction: 'countDownline', userId: currentUser.userId })
    .then(res => {
        if (!res.success) throw new Error(res.message);
        renderClaimLevels(res.counts);
    })
    .catch(err => {
        document.getElementById('claimLevelList').innerHTML =
            '<p style="color:#ef4444;text-align:center">Error loading tree: ' + err.message + '</p>';
    });
}

function renderClaimLevels(counts) {
    const breakdown = counts.breakdown || {};
    const COLORS = ['','#3b82f6','#8b5cf6','#ec4899','#f97316','#eab308','#14b8a6','#6366f1'];
    let html = '';
    for (let i = 1; i <= 7; i++) {
        const count = breakdown['level' + i] || 0;
        const cap   = CLAIM_LEVEL_CAPS[i];
        const pct   = Math.min(Math.round((count / cap) * 100), 100);
        const complete = count >= cap;
        const color = COLORS[i];
        html += '<div style="border:2px solid ' + (complete ? color : '#e5e7eb') + ';border-radius:14px;padding:16px 18px;margin-bottom:12px;background:' + (complete ? color + '0f' : '#fafafa') + ';display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
            + '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">'
            + '<div style="width:42px;height:42px;border-radius:50%;background:' + (complete ? color : '#e5e7eb') + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;flex-shrink:0;">L' + i + '</div>'
            + '<div style="flex:1;min-width:0;">'
            + '<div style="font-weight:700;color:' + (complete ? color : '#374151') + ';font-size:14px;">Level ' + i + (complete ? ' ✅ Complete' : '') + '</div>'
            + '<div style="font-size:12px;color:#6b7280;margin-top:2px;">' + count.toLocaleString('en-IN') + ' / ' + cap.toLocaleString('en-IN') + ' members</div>'
            + '<div style="background:#e5e7eb;border-radius:999px;height:6px;margin-top:6px;"><div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:999px;"></div></div>'
            + '</div></div>'
            + '<div style="flex-shrink:0;">'
            + (complete
                ? '<button onclick="openClaimForm(' + i + ')" style="background:' + color + ';color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 12px ' + color + '55;"><i class="fas fa-hand-holding-usd"></i> Claim L' + i + '</button>'
                : '<span style="font-size:12px;color:#9ca3af;font-style:italic;">' + pct + '% filled</span>')
            + '</div></div>';
    }
    document.getElementById('claimLevelList').innerHTML = html;
}

function openClaimForm(level) {
    if (!document.getElementById('claimModal')) injectClaimModal();
    document.getElementById('claimLevelListView').classList.add('hidden');
    document.getElementById('claimFormView').classList.remove('hidden');
    document.getElementById('claimFormLevelTitle').textContent = 'Claim — Level ' + level + ' Reward';
    document.getElementById('claimFormLevel').value = level;
    const prefill = {
        'claimAccountHolder': currentUser?.accountholder || '',
        'claimBankName':      currentUser?.bankname      || '',
        'claimAccountNumber': currentUser?.accountnumber || '',
        'claimIFSC':          currentUser?.IFSCCode      || '',
        'claimBranch':        currentUser?.branch        || ''
    };
    for (const [id, val] of Object.entries(prefill)) {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
    }
}

function backToClaimLevels() {
    document.getElementById('claimLevelListView').classList.remove('hidden');
    document.getElementById('claimFormView').classList.add('hidden');
}

function submitClaimForm() {
    const btn = document.getElementById('claimSubmitBtn');
    const level = document.getElementById('claimFormLevel')?.value;
    const required = ['claimAccountHolder','claimBankName','claimAccountNumber','claimIFSC','claimAadhar','claimPAN'];
    for (const id of required) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            showNotification('Please fill all required fields', 'error');
            el?.focus();
            return;
        }
    }
    const aadhar = document.getElementById('claimAadhar').value.replace(/\s/g,'');
    if (!/^\d{12}$/.test(aadhar)) { showNotification('Aadhaar must be 12 digits', 'error'); return; }
    const pan = document.getElementById('claimPAN').value.toUpperCase().trim();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) { showNotification('PAN format invalid (e.g. ABCDE1234F)', 'error'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

    const userName = currentUser?.firstName
        ? ((currentUser.firstName || '') + ' ' + (currentUser.lastName || '')).trim()
        : (currentUser?.name || '');

    gasApiCall({
        action:        'saveClaim',
        userId:        currentUser?.userId || '',
        userName:      userName,
        mobile:        currentUser?.mobile || normalizePhone(loggedInMobile) || '',
        email:         currentUser?.email  || '',
        claimLevel:    level,
        accountHolder: document.getElementById('claimAccountHolder').value.trim(),
        bankName:      document.getElementById('claimBankName').value.trim(),
        accountNumber: document.getElementById('claimAccountNumber').value.trim(),
        IFSCCode:      document.getElementById('claimIFSC').value.trim().toUpperCase(),
        branch:        document.getElementById('claimBranch').value.trim(),
        aadharNumber:  aadhar,
        panNumber:     pan,
        claimStatus:   'Pending',
        timestamp:     new Date().toISOString(),
        dateSubmitted: new Date().toLocaleDateString('en-IN')
    })
    .then(res => {
        if (res.success) {
            showNotification('Level ' + level + ' claim submitted! Admin will review it.', 'success');
            closeClaimModal();
        } else {
            showNotification((res.message || 'Submission failed'), 'error');
        }
    })
    .catch(() => showNotification('Network error. Please try again.', 'error'))
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Claim';
    });
}

function claimField(id, label, type, placeholder, required) {
    return '<div style="margin-bottom:12px;">'
        + '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;">'
        + label + (required ? ' <span style="color:#ef4444;">*</span>' : '')
        + '</label>'
        + '<input id="' + id + '" type="' + type + '" placeholder="' + placeholder + '" '
        + 'style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;" '
        + 'onfocus="this.style.borderColor=\'#6366f1\'" onblur="this.style.borderColor=\'#e5e7eb\'" />'
        + '</div>';
}

function injectClaimModal() {
    const modal = document.createElement('div');
    modal.id = 'claimModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    modal.innerHTML =
        '<div style="background:#fff;border-radius:20px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.25);font-family:Inter,sans-serif;">'
        // Header
        + '<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:20px 24px;border-radius:20px 20px 0 0;display:flex;align-items:center;justify-content:space-between;">'
        + '<div><h2 style="color:#fff;margin:0;font-size:18px;font-weight:800;"><i class="fas fa-hand-holding-usd" style="margin-right:8px;"></i>Claim Rewards</h2>'
        + '<p style="color:#c4b5fd;margin:4px 0 0;font-size:13px;">Complete a level to unlock your reward</p></div>'
        + '<button onclick="closeClaimModal()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>'
        + '</div>'
        // Level list view
        + '<div id="claimLevelListView" style="padding:20px 24px;">'
        + '<p style="color:#6b7280;font-size:13px;margin:0 0 16px;"><i class="fas fa-info-circle" style="color:#6366f1;"></i> Levels with all slots filled show a <strong>Claim</strong> button.</p>'
        + '<div id="claimLevelList"></div>'
        + '</div>'
        // Claim form view
        + '<div id="claimFormView" class="hidden" style="padding:20px 24px;">'
        + '<button onclick="backToClaimLevels()" style="background:none;border:none;color:#6366f1;font-size:13px;cursor:pointer;margin-bottom:14px;padding:0;display:flex;align-items:center;gap:6px;font-weight:600;"><i class="fas fa-arrow-left"></i> Back to Levels</button>'
        + '<h3 id="claimFormLevelTitle" style="margin:0 0 18px;font-size:16px;font-weight:800;color:#1f2937;"></h3>'
        + '<input type="hidden" id="claimFormLevel" value="">'
        // Bank section
        + '<div style="background:#f8f9ff;border-radius:12px;padding:16px;margin-bottom:16px;">'
        + '<h4 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#4f46e5;"><i class="fas fa-university"></i> Bank Details</h4>'
        + claimField('claimAccountHolder','Account Holder Name','text','Full name as in bank account',true)
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + claimField('claimBankName','Bank Name','text','e.g. SBI, HDFC',true)
        + claimField('claimBranch','Branch','text','Branch name',false)
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + claimField('claimAccountNumber','Account Number','text','Bank account number',true)
        + claimField('claimIFSC','IFSC Code','text','e.g. SBIN0001234',true)
        + '</div>'
        + '</div>'
        // KYC section
        + '<div style="background:#fff8f0;border-radius:12px;padding:16px;margin-bottom:20px;">'
        + '<h4 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#f97316;"><i class="fas fa-id-card"></i> KYC Details</h4>'
        + claimField('claimAadhar','Aadhaar Card Number','text','12-digit Aadhaar number',true)
        + claimField('claimPAN','PAN Card Number','text','e.g. ABCDE1234F',true)
        + '</div>'
        + '<button id="claimSubmitBtn" onclick="submitClaimForm()" style="width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;padding:14px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;gap:8px;">'
        + '<i class="fas fa-paper-plane"></i> Submit Claim</button>'
        + '</div>'
        + '</div>';
    modal.addEventListener('click', e => { if (e.target === modal) closeClaimModal(); });
    document.body.appendChild(modal);
}

// ─── DEPOSIT AMOUNT INIT ──────────────────────────────────────────────────────
// Also expose updateDepositAmountUI in case it was not defined in the main block
if (typeof updateDepositAmountUI === 'undefined') {
    window.updateDepositAmountUI = function(paymentData) {
        const el = document.getElementById('depositamount');
        const cached = Number(sessionStorage.getItem('depositAmount') || 0);
        if (paymentData && paymentData.paymentAmount !== undefined) {
            const amt = Number(paymentData.paymentAmount) || 0;
            if (el) el.textContent = '₹' + amt.toLocaleString('en-IN');
            sessionStorage.setItem('depositAmount', amt);
        } else if (cached && el) {
            el.textContent = '₹' + cached.toLocaleString('en-IN');
        }
    };
}
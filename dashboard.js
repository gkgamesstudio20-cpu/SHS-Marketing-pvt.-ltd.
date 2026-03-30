// dashboard.js - SHS Marketing Dashboard
const apiURL = "https://script.google.com/macros/s/AKfycbx5EYEhgaKWh9wPJaY2HYztmbEOD4uGkEKA7iToQb5Sq8NnVtkS3JFS6rAEOMqnal8yXg/exec";

// FIX: Read session from sessionStorage — login.js now writes here, not localStorage
let loggedInMobile = sessionStorage.getItem('loggedInMobile');
let currentUser    = null;

// Try to seed currentUser from sessionStorage cache immediately
// so the UI can paint something while the fresh API call loads
try {
    currentUser = JSON.parse(sessionStorage.getItem('userData')) || null;
} catch (e) {
    currentUser = null;
}

// Track the active Chart.js instance so we can destroy it before re-creating
let earningsChartInstance = null;

// ─── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    injectStyles();
    setViewportHeight();
    handleMobileMenu();
    setupMobileOptimizations();
    setupEventListeners();

    // Paint UI from cached sessionStorage data immediately (no flicker)
    if (currentUser) {
        updateDashboardUI();
        displayWelcomeMessage();
    }

    // Then fetch fresh data from the server and repaint
    fetchUserData();

    // Activate the default section
    const firstSection = document.getElementById('dashboard');
    if (firstSection) firstSection.classList.add('active');

    const firstNavItem = document.querySelector('.nav-item:first-child');
    if (firstNavItem) firstNavItem.classList.add('active');

    console.log('✅ Dashboard initialized. Mobile:', loggedInMobile);
});

// ─── AUTH CHECK ────────────────────────────────────────────────────────────────
// FIX: Was checking localStorage — login.js stores session in sessionStorage
function checkAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        console.warn('⚠️ Not authenticated — redirecting to login');
        window.location.href = 'login.html';
    }
}

// ─── VIEWPORT HEIGHT ──────────────────────────────────────────────────────────
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setViewportHeight);

// ─── MOBILE OPTIMIZATIONS ─────────────────────────────────────────────────────
function setupMobileOptimizations() {
    window.addEventListener('orientationchange', function () {
        setTimeout(() => { setViewportHeight(); window.scrollTo(0, 0); }, 100);
    });
}

// ─── MOBILE MENU ──────────────────────────────────────────────────────────────
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

// ─── FETCH FRESH USER DATA ─────────────────────────────────────────────────────
function fetchUserData() {
    if (!loggedInMobile) {
        console.warn('⚠️ No loggedInMobile in sessionStorage');
        updateDashboardUI();
        displayWelcomeMessage();
        return;
    }

    // FIX: normalizePhone before sending — strip "+91 " display formatting
    const cleanMobile = normalizePhone(loggedInMobile) || loggedInMobile;

    fetch(apiURL, {
        method: 'POST',
        body: JSON.stringify({ action: 'getUserData', mobile: cleanMobile })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success && data.user) {
                currentUser = data.user;
                // FIX: Cache in sessionStorage, not localStorage
                sessionStorage.setItem('userData', JSON.stringify(currentUser));
                console.log('✅ Fresh user data fetched');
            } else {
                console.warn('⚠️ getUserData failed:', data.message);
            }
            // Always repaint after the API call resolves
            updateDashboardUI();
            displayWelcomeMessage();
        })
        .catch(err => {
            console.error('❌ fetchUserData error:', err);
            updateDashboardUI();
            displayWelcomeMessage();
        });
}

// ─── NORMALIZE PHONE ──────────────────────────────────────────────────────────
function normalizePhone(phone) {
    if (!phone) return null;
    const digits = (phone + '').replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
    if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits[2])) return digits.substring(2);
    return null;
}

// ─── UPDATE DASHBOARD UI ──────────────────────────────────────────────────────
function updateDashboardUI() {
    try {
        // Referral ID (userId)
        const referralIDEl = document.getElementById('referralID');
        if (referralIDEl) referralIDEl.value = currentUser?.userId || '';

        // FIX: Build referral URL using both referralId (SHS-XXXXXXXXXX) and referralCode (8-char)
        //      updateDashboardUI sets both #referralID and #referralLink consistently
        const referralLinkEl = document.getElementById('referralLink');
        if (referralLinkEl && currentUser?.userId) {
            const userId       = currentUser.userId;
            const referralCode = currentUser.referralCode || '';
            const base         = 'https://shsmarketing.in/register.html';
            const url = `${base}?referralId=${encodeURIComponent(userId)}&referralCode=${encodeURIComponent(referralCode)}`;
            referralLinkEl.textContent = url;
            referralLinkEl.setAttribute('data-url', url);
        }

        // Name
        const firstName = currentUser?.firstName || 'User';
        const lastName  = currentUser?.lastName  || '';
        const fullName  = `${firstName} ${lastName}`.trim();

        setText('user-name',    firstName);
        setText('profile-name', fullName);
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

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
function updateDashboardStats() {
    const stats = {
        'total-earning':  currentUser?.totalearning  || 0,
        'total-team':     currentUser?.totalmember   || 0,
        'active-members': currentUser?.activemember  || 0,
        'current-level':  currentUser?.currentlevel  || 0
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
        'team-current-level':  currentUser?.currentlevel || 0,
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
        'reward-list':    currentUser?.rewardlist   || '-',
        'rewards-date':   currentUser?.rewardsdate  || '-',
        'account-status': currentUser?.status       || 'Active'
    };
    for (const [id, value] of Object.entries(earningsStats)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

// ─── WELCOME MESSAGE ──────────────────────────────────────────────────────────
// FIX: Moved call to AFTER fetchUserData resolves so name is populated
function displayWelcomeMessage() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        const firstName = currentUser?.firstName || 'User';
        breadcrumb.innerHTML = `${greeting}, <strong>${firstName}</strong>! 👋`;
    }
}

// ─── CHART ────────────────────────────────────────────────────────────────────
// FIX: Track chart instance explicitly and destroy it before re-creating
//      Old code used non-existent Chart.helpers.getChart() causing duplicate charts
function initializeChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (earningsChartInstance) {
        earningsChartInstance.destroy();
        earningsChartInstance = null;
    }

    const total = parseFloat(currentUser?.totalearning || 0);

    earningsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Earnings (₹)',
                data: [
                    total * 0.2,
                    total * 0.3,
                    total * 0.4,
                    total * 0.5,
                    total * 0.7,
                    total
                ],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
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

// ─── SETUP EVENT LISTENERS ────────────────────────────────────────────────────
function setupEventListeners() {
    // Nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Profile form submit
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateProfileToSheet();
        });
    }
}

// ─── COPY REFERRAL ID ────────────────────────────────────────────────────────
// FIX: Use navigator.clipboard instead of deprecated document.execCommand('copy')
function copyReferralID() {
    const referralIDEl = document.getElementById('referralID');
    if (!referralIDEl) return;
    const text = referralIDEl.value || referralIDEl.textContent;
    navigator.clipboard.writeText(text)
        .then(() => showNotification('✅ Referral ID copied!', 'success'))
        .catch(() => {
            // Fallback for non-HTTPS or older browsers
            referralIDEl.select?.();
            document.execCommand('copy');
            showNotification('✅ Referral ID copied!', 'success');
        });
}

// ─── COPY REFERRAL LINK ──────────────────────────────────────────────────────
function copyReferralLink() {
    // FIX: Both copyReferralLink and goToReferralLink now use the same id="referralLink"
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

// ─── OPEN REFERRAL LINK ───────────────────────────────────────────────────────
// FIX: Was using id="referral-link" (different from id="referralLink" set in updateDashboardUI)
function goToReferralLink() {
    const el = document.getElementById('referralLink');
    if (!el) return;
    const url = el.getAttribute('data-url') || el.textContent;
    if (url) window.open(url, '_blank');
}

function clickReferralLink() {
    goToReferralLink();
}

// ─── GO TO REGISTRATION WITH REFERRAL ────────────────────────────────────────
function goToRegistrationWithReferral() {
    const userId       = currentUser?.userId       || '';
    const referralCode = currentUser?.referralCode || '';
    const url = `register.html?referralId=${encodeURIComponent(userId)}&referralCode=${encodeURIComponent(referralCode)}`;
    window.location.href = url;
}

// ─── NAVIGATE / SCROLL TO REFERRAL SECTION ────────────────────────────────────
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
        'firstname':        'firstName',
        'lastname':         'lastName',
        'emailaddress':     'email',
        'mobile':           'mobile',
        'dob':              'dob',
        'gender':           'gender',
        'address':          'address',
        'city':             'city',
        'state':            'state',
        'pincode':          'pincode',
        'nomineename':      'nomineename',
        'nomineerelation':  'nomineerelation',
        'nomineemobile':    'nomineemobile',
        'Sponsorid':        'Sponsorid',
        'accountholder':    'accountholder',
        'bankname':         'bankname',
        'accountnumber':    'accountnumber',
        'IFSCCode':         'IFSCCode',
        'branch':           'branch'
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
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }

    const cleanMobile = normalizePhone(loggedInMobile) || loggedInMobile;

    // Collect only the editable profile fields (NOT action/mobile keys)
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
        Sponsorid:       document.getElementById('Sponsorid')?.value        || '',
        accountholder:   document.getElementById('accountholder')?.value    || '',
        bankname:        document.getElementById('bankname')?.value         || '',
        accountnumber:   document.getElementById('accountnumber')?.value    || '',
        IFSCCode:        document.getElementById('IFSCCode')?.value         || '',
        branch:          document.getElementById('branch')?.value           || ''
    };

    const profileData = { action: 'updateProfile', mobile: cleanMobile, ...fields };

    fetch(apiURL, {
        method: 'POST',
        body: JSON.stringify(profileData)
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                // FIX: Merge only the profile fields, not the action/mobile API keys
                currentUser = { ...currentUser, ...fields };
                // FIX: Update sessionStorage, not localStorage
                sessionStorage.setItem('userData', JSON.stringify(currentUser));
                showNotification('✅ Profile updated successfully!', 'success');
            } else {
                showNotification(data.message || '❌ Failed to update profile', 'error');
            }
        })
        .catch(() => showNotification('❌ Network error updating profile', 'error'))
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        });
}

// ─── SECTION NAVIGATION ───────────────────────────────────────────────────────
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

function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateActiveNav(fnName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const link = document.querySelector(`a[onclick*="${fnName}"]`);
    link?.closest('.nav-item')?.classList.add('active');
}

// ─── LOAD TEAM / EARNINGS (CONSOLE LOGS FOR NOW) ──────────────────────────────
function loadTeamData() {
    console.log('✅ Team:', {
        total: currentUser?.totalmember,
        active: currentUser?.activemember,
        level: currentUser?.currentlevel,
        sponsor: currentUser?.Sponsorid
    });
}

function loadEarningsData() {
    console.log('✅ Earnings:', {
        total: currentUser?.totalearning,
        rewards: currentUser?.rewardlist,
        date: currentUser?.rewardsdate,
        status: currentUser?.status
    });
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// FIX: Was going to logout.html (doesn't exist). Clears session + redirects to login.
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loggedInMobile');
    sessionStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// ─── INJECT STYLES ────────────────────────────────────────────────────────────
// FIX: Moved inside DOMContentLoaded (was at parse time, before document.head exists)
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
// ============================================================
//  Logout Page JavaScript — SHS Marketing Pvt. Ltd.
//  Storage: sessionStorage throughout — matches login.js
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzfHIV2BQHqHsxE5c4Hc9IS_ssXfsLb0sYDtzehoFbb9fbgBYhlUXGI7Zm0bEfKQzR-jg/exec";

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', function () {

  // FIX: was localStorage — login.js writes to sessionStorage
  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  showUserBadge();
  setupEventListeners();

  console.log('✅ Logout page initialized');
});

// ===== Show Logged-In User Badge =====
function showUserBadge() {
  const badge     = document.getElementById('userBadge');
  const badgeText = document.getElementById('userBadgeText');

  if (!badge || !badgeText) return;

  try {
    // FIX: was localStorage — login.js writes userData to sessionStorage
    const raw      = sessionStorage.getItem('userData');
    const userData = raw ? JSON.parse(raw) : null;

    if (userData) {
      // login.js stores {name} (full name); full API data has {firstName, lastName}
      const name = userData.firstName
        ? `${userData.firstName} ${userData.lastName || ''}`.trim()
        : (userData.name || '');

      if (name) {
        badgeText.textContent = name;
        badge.style.display   = 'inline-flex';
        return;
      }
    }

    // Fallback to mobile number
    const mobile = sessionStorage.getItem('loggedInMobile');
    if (mobile) {
      badgeText.textContent = mobile;
      badge.style.display   = 'inline-flex';
    }
  } catch (e) {
    console.warn('Could not parse userData:', e);
  }
}

// ===== Event Listeners =====
function setupEventListeners() {
  const btnCancel = document.getElementById('btnCancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', confirmLogout);
  }
}

// ===== Confirm Logout =====
function confirmLogout() {
  const btnLogout = document.getElementById('btnLogout');
  const btnCancel = document.getElementById('btnCancel');

  if (btnLogout) {
    btnLogout.disabled  = true;
    btnLogout.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logging out…';
  }

  if (btnCancel) {
    btnCancel.style.pointerEvents = 'none';
    btnCancel.style.opacity       = '0.5';
  }

  const loggedInMobile = sessionStorage.getItem('loggedInMobile') || '';

  fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'logout', mobile: loggedInMobile })
  })
    .then(res => res.json())
    .then(data => {
      console.log('✅ Logout API response:', data);
      clearSessionAndRedirect();
    })
    .catch(err => {
      console.warn('⚠️ Logout API error (clearing session anyway):', err);
      clearSessionAndRedirect();
    });
}

// ===== Clear Session & Redirect =====
function clearSessionAndRedirect() {
  // Clear session keys — keep localStorage rememberMe/savedMobile intact for next login
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('loggedInMobile');
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('pendingPaymentPhone');
  sessionStorage.removeItem('pendingPaymentTxnId');

  showNotification('Logged out successfully!', 'success');

  setTimeout(() => {
    window.location.replace('login.html');
  }, 1500);
}

// ===== Notification Helper =====
function showNotification(message, type = 'success') {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
  const icons  = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };

  const notification         = document.createElement('div');
  notification.className     = `notification ${type}`;
  notification.style.background = colors[type] || colors.success;
  notification.innerHTML = `
    <i class="fas fa-${icons[type] || 'check-circle'}" style="font-size:18px;flex-shrink:0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== Back-Button Guard =====
window.addEventListener('popstate', function () {
  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.replace('login.html');
  } else {
    window.location.href = 'dashboard.html';
  }
});

console.log('✅ Logout script loaded');
// Logout Page JavaScript - Fixed Version
// Use the SAME API URL as registration and login
const apiURL = "https://script.google.com/macros/s/AKfycbx5EYEhgaKWh9wPJaY2HYztmbEOD4uGkEKA7iToQb5Sq8NnVtkS3JFS6rAEOMqnal8yXg/exec";

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  setupEventListeners();
  setupAnimations();
  console.log('✅ Logout page initialized');
});

// ===== Setup Event Listeners =====
function setupEventListeners() {
  // Cancel button
  const btnCancel = document.querySelector('.btn-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  // Logout button
  const btnLogout = document.querySelector('.btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', confirmLogout);
  }
}

// ===== Confirm Logout =====
function confirmLogout() {
  const btnLogout = document.querySelector('.btn-logout');
  
  // Disable button and show loading state
  if (btnLogout) {
    btnLogout.disabled = true;
    btnLogout.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logging out...';
  }
  
  const loggedInMobile = localStorage.getItem('loggedInMobile');
  
  // Call logout API
  fetch(apiURL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'logout',
      mobile: loggedInMobile
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Logout API response:', data);
    clearLogoutData();
  })
  .catch(error => {
    console.error('❌ Logout error:', error);
    // Still logout even if API fails
    clearLogoutData();
  });
}

// ===== Clear Logout Data =====
function clearLogoutData() {
  // Remove all auth-related data from localStorage
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('loggedInMobile');
  localStorage.removeItem('userData');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('savedMobile');

  showNotification('✅ Logged out successfully!', 'success');

  // Redirect to login after delay
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1500);
}

// ===== Show Notification =====
function showNotification(message, type = 'success') {
  const container = document.getElementById('notificationContainer') || document.body;
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  let bgColor = '#10b981'; // success
  let icon = 'check-circle';

  if (type === 'error') {
    bgColor = '#ef4444';
    icon = 'exclamation-circle';
  } else if (type === 'info') {
    bgColor = '#3b82f6';
    icon = 'info-circle';
  }

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 90vw;
    word-wrap: break-word;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Sora', sans-serif;
  `;
  
  notification.innerHTML = `
    <i class="fas fa-${icon}" style="font-size: 18px;"></i> 
    <span>${message}</span>
  `;
  
  container.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== Setup Animations =====
function setupAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    @media (max-width: 768px) {
      .logout-container {
        padding: 10px;
      }

      .logout-card {
        border-radius: 12px;
      }

      .logout-actions {
        flex-direction: column;
      }

      .logout-actions button,
      .logout-actions a {
        width: 100%;
      }

      .btn-cancel,
      .btn-logout {
        min-height: 44px;
      }
    }

    @media (max-height: 600px) {
      .logout-card {
        padding: 20px;
      }

      .logout-info {
        margin: 10px 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ===== Handle Back Button =====
window.addEventListener('popstate', function() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  } else {
    window.location.href = 'dashboard.html';
  }
});

console.log('✅ Logout script loaded successfully!');
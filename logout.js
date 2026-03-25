// Logout Page JavaScript - Improved Version
const apiURL = "https://script.google.com/macros/s/AKfycbx53TbxaZcGQz64474vrcGf4xIqhn0iQrgFYBAK5rb3uIIH4mPL5sP_qzahbbIWSpVz/exec";

document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
  console.log('Logout page initialized successfully!');
});

// ===== Confirm Logout =====
function confirmLogout() {
  const btnLogout = document.querySelector('.btn-logout');
  btnLogout.disabled = true;
  btnLogout.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Logging out...`;
  
  const loggedInMobile = localStorage.getItem('loggedInMobile');
  
  fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'logout',
      mobile: loggedInMobile
    })
  })
  .then(response => response.json())
  .then(data => {
    clearLogoutData();
  })
  .catch(error => {
    console.error('Logout error:', error);
    clearLogoutData();
  });
}

// ===== Clear Logout Data =====
function clearLogoutData() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('loggedInMobile');
  localStorage.removeItem('userData');
  localStorage.removeItem('rememberMe');
  
  showNotification('Logged out successfully!', 'success');
  
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
  `;
  notification.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== Setup Cancel Button =====
document.addEventListener('DOMContentLoaded', function() {
  const btnCancel = document.querySelector('.btn-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }
});

// ===== Handle Back Button =====
window.addEventListener('popstate', function() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
});

// ===== Animation Styles =====
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

  .notification {
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .notification i {
    font-size: 18px;
  }
`;
document.head.appendChild(style);
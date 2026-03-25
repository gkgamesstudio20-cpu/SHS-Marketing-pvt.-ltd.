// Logout Page JavaScript
const apiURL = "https://script.google.com/macros/s/AKfycbx53TbxaZcGQz64474vrcGf4xIqhn0iQrgFYBAK5rb3uIIH4mPL5sP_qzahbbIWSpVz/exec";

document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
  console.log('Logout page initialized successfully!');
});

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
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInMobile');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberMe');
    
    showNotification('Logged out successfully!', 'success');
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  })
  .catch(error => {
    console.error('Logout error:', error);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInMobile');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
  });
}

function showNotification(message, type = 'success') {
  const container = document.getElementById('notificationContainer') || document.body;
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

const btnCancel = document.querySelector('.btn-cancel');
if (btnCancel) {
  btnCancel.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'dashboard.html';
  });
}

window.addEventListener('popstate', function() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
});
// Login Page JavaScript
const apiURL = "https://script.google.com/macros/s/AKfycbx53TbxaZcGQz64474vrcGf4xIqhn0iQrgFYBAK5rb3uIIH4mPL5sP_qzahbbIWSpVz/exec";

document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
  }
  setupFormValidation();
  setupEventListeners();
  console.log('Login page initialized successfully!');
});

function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('toggleIcon');
  if (passwordInput && toggleIcon) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
    }
  }
}

function setupFormValidation() {
  const mobileInput = document.getElementById('mobile');
  const passwordInput = document.getElementById('password');
  
  if (mobileInput) {
    mobileInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value.length > 0 && this.value.length !== 10) {
        showError('mobileError', 'Mobile number must be 10 digits');
      } else {
        clearError('mobileError');
      }
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      if (this.value.length > 0 && this.value.length < 6) {
        showError('passwordError', 'Password must be at least 6 characters');
      } else {
        clearError('passwordError');
      }
    });
  }
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

function clearError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = '';
    element.style.display = 'none';
  }
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

function setupEventListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const mobile = document.getElementById('mobile').value.trim();
      const password = document.getElementById('password').value.trim();
      const remember = document.getElementById('remember').checked;
      const loginBtn = document.querySelector('.login-btn');
      
      if (mobile.length !== 10) {
        showError('mobileError', 'Please enter a valid 10-digit mobile number');
        return;
      }
      
      if (password.length < 6) {
        showError('passwordError', 'Password must be at least 6 characters');
        return;
      }
      
      clearError('mobileError');
      clearError('passwordError');
      
      loginBtn.classList.add('loading');
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Signing In...';
      
      try {
        const response = await fetch(apiURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'login',
            mobile: mobile,
            password: password
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('loggedInMobile', mobile);
          localStorage.setItem('userData', JSON.stringify(result.user));
          
          if (remember) {
            localStorage.setItem('rememberMe', 'true');
          }
          
          showNotification('Login successful! Redirecting...', 'success');
          
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          showNotification(result.message || 'Invalid credentials', 'error');
          loginBtn.classList.remove('loading');
          loginBtn.disabled = false;
          loginBtn.innerHTML = 'Sign In';
        }
      } catch (error) {
        console.error('Login error:', error);
        showNotification('Something went wrong. Please try again.', 'error');
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Sign In';
      }
    });
  }
  
  const socialBtns = document.querySelectorAll('.social-btn');
  socialBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      showNotification('Social login coming soon!', 'info');
    });
  });
  
  const forgotLink = document.querySelector('.forgot-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', function(e) {
      e.preventDefault();
      showNotification('Password reset feature coming soon!', 'info');
    });
  }
}

window.addEventListener('popstate', function() {
  if (localStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
  }
});

if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}
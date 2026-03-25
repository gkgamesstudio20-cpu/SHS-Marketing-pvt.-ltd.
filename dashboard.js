// Dashboard JavaScript
const apiURL = "https://script.google.com/macros/s/AKfycbx53TbxaZcGQz64474vrcGf4xIqhn0iQrgFYBAK5rb3uIIH4mPL5sP_qzahbbIWSpVz/exec";
let loggedInMobile = localStorage.getItem("loggedInMobile");
let currentUser = JSON.parse(localStorage.getItem("userData")) || null;

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  fetchUserData();
  initializeChart();
  setupEventListeners();
  displayWelcomeMessage();
  
  const firstSection = document.getElementById('dashboard');
  if (firstSection) {
    firstSection.classList.add('active');
  }
  
  const firstNavItem = document.querySelector('.nav-item:first-child');
  if (firstNavItem) {
    firstNavItem.classList.add('active');
  }
  
  setViewportHeight();
  console.log('Dashboard initialized successfully!');
});

function checkAuth() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
}

function setViewportHeight() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);

function fetchUserData() {
  if (!loggedInMobile) {
    updateDashboardUI();
    return;
  }
  
  fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'getUserData',
      mobile: loggedInMobile
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem('userData', JSON.stringify(currentUser));
    }
    updateDashboardUI();
  })
  .catch(error => {
    console.error("Error fetching user data:", error);
    updateDashboardUI();
  });
}

function updateDashboardUI() {
  const referralIDElement = document.getElementById("referralID");
  const referralLinkElement = document.getElementById("referral-link");
  
  if (referralIDElement) {
    referralIDElement.value = currentUser?.userId || "USER_123456";
  }
  
  if (referralLinkElement) {
    referralLinkElement.textContent = `https://shsmarketing.com/ref/${currentUser?.userId || "USER_123456"}`;
  }
  
  const userName = currentUser?.fullName || "User";
  const userNameElement = document.getElementById("user-name");
  const profileNameElement = document.getElementById("profile-name");
  const profileEmailElement = document.getElementById("profile-email");
  
  if (userNameElement) {
    userNameElement.textContent = userName.split(" ")[0];
  }
  
  if (profileNameElement) {
    profileNameElement.textContent = userName;
  }
  
  if (profileEmailElement) {
    profileEmailElement.textContent = currentUser?.email || "email@example.com";
  }
}

function displayWelcomeMessage() {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12) greeting = "Good afternoon";
  if (hour >= 18) greeting = "Good evening";
  
  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    const userName = currentUser?.fullName?.split(" ")[0] || "User";
    breadcrumb.innerHTML = `${greeting}, <strong>${userName}</strong>! 👋`;
  }
}

function initializeChart() {
  const ctx = document.getElementById('earningsChart');
  if (ctx && typeof Chart !== 'undefined') {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Earnings (₹)',
          data: [500, 800, 1200, 950, 1500, 2000],
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
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        }
      }
    });
  }
}

function showNotification(message) {
  const existingNotification = document.querySelector('.custom-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = 'custom-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function setupEventListeners() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  const withdrawForm = document.getElementById('withdraw-form');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const amount = document.getElementById('withdraw-amount')?.value;
      if (amount && amount >= 100 && amount <= 2500) {
        showNotification(`Withdrawal request of ₹${amount} submitted successfully!`);
        this.reset();
      } else {
        alert('Please enter an amount between ₹100 and ₹2,500');
      }
    });
  }
  
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showNotification('Profile updated successfully!');
    });
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Call logout API
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
    .then(() => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('loggedInMobile');
      localStorage.removeItem('userData');
      showNotification('Logged out successfully!');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    })
    .catch(() => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('loggedInMobile');
      localStorage.removeItem('userData');
      window.location.href = 'login.html';
    });
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

function switchSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));
  
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.classList.add('active');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  if (window.innerWidth <= 1024) {
    toggleSidebar();
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { 
    from { transform: translateX(400px); opacity: 0; } 
    to { transform: translateX(0); opacity: 1; } 
  } 
  @keyframes slideOut { 
    from { transform: translateX(0); opacity: 1; } 
    to { transform: translateX(400px); opacity: 0; } 
  }
`;
document.head.appendChild(style);
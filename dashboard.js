// Dashboard JavaScript - Fixed Version
// Use the SAME API URL as registration and login
const apiURL = "https://script.google.com/macros/s/AKfycbyUtAL05TBgZYUfuNdgG1iVamjIvWec424ap0o8d-9iD87aAvNaptp3pKWV8WC3TUx5mg/exec";

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
  console.log('✅ Dashboard initialized successfully!');
});

// ===== Authentication Check =====
function checkAuth() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    console.warn('⚠️ User not authenticated, redirecting to login');
    window.location.href = 'login.html';
  }
}

// ===== Viewport Height for Mobile =====
function setViewportHeight() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);

// ===== Fetch User Data from Apps Script =====
function fetchUserData() {
  if (!loggedInMobile) {
    console.warn('⚠️ No mobile number found');
    updateDashboardUI();
    return;
  }
  
  fetch(apiURL, {
    method: 'POST',
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
      console.log('✅ User data fetched:', currentUser);
    } else {
      console.warn('⚠️ Could not fetch user data');
    }
    updateDashboardUI();
  })
  .catch(error => {
    console.error('❌ Error fetching user data:', error);
    updateDashboardUI();
  });
}

// ===== Update Dashboard UI with User Data =====
function updateDashboardUI() {
  // Update Referral ID
  const referralIDElement = document.getElementById("referralID");
  if (referralIDElement) {
    referralIDElement.value = currentUser?.userId || "USER_123456";
  }
  
  // Update Referral Link
  const referralLinkElement = document.getElementById("referral-link");
  if (referralLinkElement) {
    referralLinkElement.textContent = `https://shsmarketing.com/ref/${currentUser?.userId || "USER_123456"}`;
  }
  
  // Get user name (handle different formats)
  const userName = currentUser?.name || currentUser?.fullName || "User";
  const firstName = userName.split(" ")[0];
  
  // Update user name in various places
  const userNameElement = document.getElementById("user-name");
  if (userNameElement) {
    userNameElement.textContent = firstName;
  }
  
  const profileNameElement = document.getElementById("profile-name");
  if (profileNameElement) {
    profileNameElement.textContent = userName;
  }
  
  const profileEmailElement = document.getElementById("profile-email");
  if (profileEmailElement) {
    profileEmailElement.textContent = currentUser?.email || "email@example.com";
  }
  
  console.log('✅ Dashboard UI updated with user data');
}

// ===== Display Welcome Message =====
function displayWelcomeMessage() {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12) greeting = "Good afternoon";
  if (hour >= 18) greeting = "Good evening";
  
  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    const userName = (currentUser?.name || currentUser?.fullName || "User").split(" ")[0];
    breadcrumb.innerHTML = `${greeting}, <strong>${userName}</strong>! 👋`;
  }
}

// ===== Initialize Chart.js =====
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

// ===== Show Notification =====
function showNotification(message, type = 'success') {
  const existingNotification = document.querySelector('.custom-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
  };
  
  const notification = document.createElement('div');
  notification.className = 'custom-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
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

// ===== Setup Event Listeners =====
function setupEventListeners() {
  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Withdraw Form
  const withdrawForm = document.getElementById('withdraw-form');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const amount = document.getElementById('withdraw-amount')?.value;
      if (amount && amount >= 100 && amount <= 2500) {
        showNotification(`✅ Withdrawal request of ₹${amount} submitted successfully!`, 'success');
        this.reset();
      } else {
        showNotification('Please enter an amount between ₹100 and ₹2,500', 'error');
      }
    });
  }
  
  // Profile Form
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showNotification('✅ Profile updated successfully!', 'success');
    });
  }
}

// ===== Navigation Functions =====
// All these functions switch sections and update active nav

function showDashboard() {
  switchSection('dashboard');
  updateActiveNav('dashboard');
  document.getElementById('page-title').textContent = 'Dashboard';
}

function Myteam() {
  switchSection('myteam');
  updateActiveNav('myteam');
  document.getElementById('page-title').textContent = 'My Team';
}

function showEarnings() {
  switchSection('earnings');
  updateActiveNav('earnings');
  document.getElementById('page-title').textContent = 'Earnings';
}

function showWithdraw() {
  switchSection('withdraw');
  updateActiveNav('withdraw');
  document.getElementById('page-title').textContent = 'Withdraw';
}

function referal() {
  switchSection('referral');
  updateActiveNav('referral');
  document.getElementById('page-title').textContent = 'Referral Link';
}

function profile() {
  switchSection('profile');
  updateActiveNav('profile');
  document.getElementById('page-title').textContent = 'Profile';
}

function switchSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));
  
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.classList.add('active');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Close sidebar on mobile
  if (window.innerWidth <= 1024) {
    toggleSidebar();
  }
}

function updateActiveNav(sectionId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const link = item.querySelector('a');
    if (link && link.getAttribute('onclick').includes(sectionId === 'myteam' ? 'Myteam' : sectionId === 'referral' ? 'referal' : sectionId)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ===== Logout =====
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Optional: Call logout API
    fetch(apiURL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'logout',
        mobile: loggedInMobile
      })
    })
    .then(() => {
      clearAuthData();
    })
    .catch(() => {
      clearAuthData();
    });
  }
}

function clearAuthData() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('loggedInMobile');
  localStorage.removeItem('userData');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('savedMobile');
  showNotification('✅ Logged out successfully!', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

// ===== Toggle Sidebar (Mobile) =====
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

// ===== CSS Animations =====
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

console.log('✅ Dashboard script loaded successfully!');
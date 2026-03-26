// Dashboard JavaScript - COMPLETE FIXED VERSION
// Use the SAME API URL as registration and login
const apiURL = "https://script.google.com/macros/s/AKfycbwfciFmUJm132SOTEXKrNSgk7Ts2bvUd2oBio49LHS5XUS99zTcCsHTM9F5qsMFvwPfgg/exec";

let loggedInMobile = localStorage.getItem("loggedInMobile");
let currentUser = JSON.parse(localStorage.getItem("userData")) || null;

document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
  fetchUserData();
  setupEventListeners();
  displayWelcomeMessage();
  handleMobileMenu();
  setupMobileOptimizations();

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

// ===== Mobile Optimizations =====
function setupMobileOptimizations() {
  // Prevent zoom on input focus (mobile)
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    document.addEventListener('touchstart', function (e) {
      if (e.target.matches('input, textarea, select')) {
        document.body.style.zoom = 1;
      }
    }, false);
  }

  // Handle landscape orientation
  window.addEventListener('orientationchange', function () {
    setTimeout(() => {
      setViewportHeight();
      window.scrollTo(0, 0);
    }, 100);
  });
}

// ===== Handle Mobile Menu =====
function handleMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('active');
      overlay?.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Close menu when nav item clicked
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar?.classList.remove('active');
      overlay?.classList.remove('active');
    });
  });
}

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
        console.warn('⚠️ Could not fetch user data:', data.message);
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
  try {
    // Update Referral ID (userId)
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
    const firstName = currentUser?.firstName || "User";
    const lastName = currentUser?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    // Update user name in various places
    const userNameElement = document.getElementById("user-name");
    if (userNameElement) {
      userNameElement.textContent = firstName;
    }

    const profileNameElement = document.getElementById("profile-name");
    if (profileNameElement) {
      profileNameElement.textContent = fullName;
    }

    const profileEmailElement = document.getElementById("profile-email");
    if (profileEmailElement) {
      profileEmailElement.textContent = currentUser?.email || "email@example.com";
    }

    // Update Dashboard Stats
    updateDashboardStats();

    // Update Team Data on My Team section
    updateTeamDataDisplay();

    // Update Earnings Data
    updateEarningsData();

    // Initialize Chart
    initializeChart();

    console.log('✅ Dashboard UI updated with user data');
  } catch (error) {
    console.error('❌ Error updating dashboard UI:', error);
  }
}

// ===== Update Dashboard Stats =====
function updateDashboardStats() {
  const stats = {
    'total-earning': currentUser?.totalearning || 0,
    'total-team': currentUser?.totalmember || 0,
    'active-members': currentUser?.activemember || 0,
    'current-level': currentUser?.currentlevel || 0
  };

  for (const [id, value] of Object.entries(stats)) {
    const element = document.getElementById(id);
    if (element) {
      if (typeof value === 'number') {
        element.textContent = value > 999 ? (value / 1000).toFixed(1) + 'k' : value;
      } else {
        element.textContent = value;
      }
    }
  }
}

// ===== Update Team Data Display =====
function updateTeamDataDisplay() {
  const teamStats = {
    'team-total-members': currentUser?.totalmember || 0,
    'team-active-members': currentUser?.activemember || 0,
    'team-current-level': currentUser?.currentlevel || 0,
    'team-sponsor-id': currentUser?.Sponsorid || '-'
  };

  for (const [id, value] of Object.entries(teamStats)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
}

// ===== Update Earnings Data =====
function updateEarningsData() {
  const earningsStats = {
    'total-earning': currentUser?.totalearning || 0,
    'reward-list': currentUser?.rewardlist || '-',
    'rewards-date': currentUser?.rewardsdate || '-',
    'account-status': currentUser?.status || 'Active'
  };

  for (const [id, value] of Object.entries(earningsStats)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
}

// ===== Display Welcome Message =====
function displayWelcomeMessage() {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12) greeting = "Good afternoon";
  if (hour >= 18) greeting = "Good evening";

  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    const firstName = currentUser?.firstName || "User";
    breadcrumb.innerHTML = `${greeting}, <strong>${firstName}</strong>! 👋`;
  }
}

// ===== Initialize Chart.js =====
function initializeChart() {
  const ctx = document.getElementById('earningsChart');
  if (ctx && typeof Chart !== 'undefined') {
    // Destroy existing chart if it exists
    const chartInstance = Chart.helpers?.getChart(ctx) || Chart.helpers?.getChartInstance?.(ctx);
    if (chartInstance) {
      chartInstance.destroy();
    }

    const totalEarning = parseFloat(currentUser?.totalearning || 0);
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Earnings (₹)',
          data: [
            totalEarning * 0.2,
            totalEarning * 0.3,
            totalEarning * 0.4,
            totalEarning * 0.5,
            totalEarning * 0.7,
            totalEarning
          ],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          responsive: true,
          maintainAspectRatio: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return '₹' + value.toFixed(0);
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
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: calc(100% - 40px);
    word-wrap: break-word;
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
    item.addEventListener('click', function (e) {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Profile Form - Update to Google Sheets
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      updateProfileToSheet();
    });
  }
}

// ===== Copy Referral ID =====
function copyReferralID() {
  const referralID = document.getElementById('referralID');
  if (referralID) {
    referralID.select();
    document.execCommand('copy');
    showNotification('✅ Referral ID copied to clipboard!', 'success');
  }
}

// ===== Copy Referral Link =====
function copyReferralLink() {
  const referralLink = document.getElementById('referral-link');
  if (referralLink) {
    const text = referralLink.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showNotification('✅ Referral link copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification('✅ Referral link copied to clipboard!', 'success');
    });
  }
}

// ===== Go to Referral Link =====
function goToReferralLink() {
  const referralLink = document.getElementById('referral-link');
  if (referralLink) {
    const link = referralLink.textContent;
    window.open(link, '_blank');
  }
}

// ===== Update Profile to Google Sheets =====
function updateProfileToSheet() {
  const submitBtn = document.querySelector('.profile-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  }

  // Collect ALL profile data from form
  const profileData = {
    action: 'updateProfile',
    mobile: loggedInMobile,
    firstName: document.getElementById('firstname')?.value || '',
    lastName: document.getElementById('lastname')?.value || '',
    email: document.getElementById('emailaddress')?.value || '',
    dob: document.getElementById('dob')?.value || '',
    gender: document.getElementById('gender')?.value || '',
    address: document.getElementById('address')?.value || '',
    city: document.getElementById('city')?.value || '',
    state: document.getElementById('state')?.value || '',
    pincode: document.getElementById('pincode')?.value || '',
    nomineename: document.getElementById('nomineename')?.value || '',
    nomineerelation: document.getElementById('nomineerelation')?.value || '',
    nomineemobile: document.getElementById('nomineemobile')?.value || '',
    Sponsorid: document.getElementById('Sponsorid')?.value || '',
    accountholder: document.getElementById('accountholder')?.value || '',
    bankname: document.getElementById('bankname')?.value || '',
    accountnumber: document.getElementById('accountnumber')?.value || '',
    IFSCCode: document.getElementById('IFSCCode')?.value || '',
    branch: document.getElementById('branch')?.value || ''
  };

  console.log('Sending profile data:', profileData);

  fetch(apiURL, {
    method: 'POST',
    body: JSON.stringify(profileData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update current user with new data
        currentUser = { ...currentUser, ...profileData };
        localStorage.setItem('userData', JSON.stringify(currentUser));
        showNotification('✅ Profile updated successfully!', 'success');
        console.log('✅ Profile updated:', data.user);
      } else {
        showNotification(data.message || '❌ Failed to update profile', 'error');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      }
    })
    .catch(error => {
      console.error('❌ Error updating profile:', error);
      showNotification('❌ Error updating profile', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      }
    });
}

// ===== Populate Profile Form with User Data =====
function populateProfileForm() {
  const fields = {
    'firstname': 'firstName',
    'lastname': 'lastName',
    'emailaddress': 'email',
    'mobile': 'mobile',
    'dob': 'dob',
    'gender': 'gender',
    'address': 'address',
    'city': 'city',
    'state': 'state',
    'pincode': 'pincode',
    'nomineename': 'nomineename',
    'nomineerelation': 'nomineerelation',
    'nomineemobile': 'nomineemobile',
    'Sponsorid': 'Sponsorid',
    'accountholder': 'accountholder',
    'bankname': 'bankname',
    'accountnumber': 'accountnumber',
    'IFSCCode': 'IFSCCode',
    'branch': 'branch'
  };

  console.log('Populating profile form with:', currentUser);

  for (const [id, key] of Object.entries(fields)) {
    const element = document.getElementById(id);
    if (element) {
      const value = currentUser?.[key] || '';
      element.value = value;
      console.log(`Set ${id} = ${value}`);
    }
  }
}

// ===== Navigation Functions =====
function showDashboard() {
  switchSection('dashboard');
  updateActiveNav('dashboard');
  document.getElementById('page-title').textContent = 'Dashboard';
}

function Myteam() {
  switchSection('myteam');
  updateActiveNav('myteam');
  document.getElementById('page-title').textContent = 'My Team';
  loadTeamData();
}

function showEarnings() {
  switchSection('earnings');
  updateActiveNav('earnings');
  document.getElementById('page-title').textContent = 'Earnings';
  loadEarningsData();
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
  populateProfileForm();
}

function switchSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => section.classList.remove('active'));

  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateActiveNav(sectionId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });

  const activeLink = document.querySelector(`a[onclick*="${sectionId === 'myteam' ? 'Myteam' : sectionId === 'referral' ? 'referal' : sectionId}"]`);
  if (activeLink) {
    activeLink.closest('.nav-item')?.classList.add('active');
  }
}

// ===== Load Team Data =====
function loadTeamData() {
  console.log('✅ Team Data Loaded:', {
    totalMembers: currentUser?.totalmember,
    activeMembers: currentUser?.activemember,
    level: currentUser?.currentlevel,
    sponsorId: currentUser?.Sponsorid
  });
}

// ===== Load Earnings Data =====
function loadEarningsData() {
  console.log('✅ Earnings Data Loaded:', {
    totalEarning: currentUser?.totalearning,
    rewardList: currentUser?.rewardlist,
    rewardDate: currentUser?.rewardsdate,
    status: currentUser?.status
  });
}

// ===== Logout =====
function logout() {
  window.location.href = 'logout.html';
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

// ===== CSS Animations & Mobile Styles =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { 
    from { transform: translateY(100px); opacity: 0; } 
    to { transform: translateY(0); opacity: 1; } 
  } 
  @keyframes slideOut { 
    from { transform: translateY(0); opacity: 1; } 
    to { transform: translateY(100px); opacity: 0; } 
  }

  @media (max-width: 768px) {
    .profile-form {
      padding: 15px;
    }

    .form-row {
      flex-direction: column;
    }

    .form-group {
      width: 100% !important;
      margin-bottom: 15px;
    }

    input, textarea, select {
      font-size: 16px !important; /* Prevents auto-zoom on iOS */
      width: 100%;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .referral-input-group {
      flex-direction: column;
    }

    .copy-btn {
      width: 100%;
      padding: 12px;
    }

    .team-stats {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    .team-stat-value {
      font-size: 24px !important;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      font-size: 12px;
    }

    .custom-notification {
      left: 10px !important;
      right: 10px !important;
      bottom: 10px !important;
    }
  }

  @media (max-width: 480px) {
    .team-stats {
      grid-template-columns: 1fr !important;
    }

    .referral-url div {
      flex-direction: column;
    }

    .referral-url div button {
      width: 100%;
    }

    h3 {
      margin-top: 20px;
      margin-bottom: 15px;
      font-size: 16px;
    }
  }
`;

document.head.appendChild(style);

console.log('✅ Dashboard script loaded successfully!');


function navigateToReferral(e) {
    e.preventDefault();
    
    // Show dashboard first if not already visible
    showDashboard();
    
    // Scroll to referral section
    setTimeout(() => {
        document.getElementById('referral-id-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
    
    // Optional: Update URL hash without page jump
    history.pushState(null, null, '#referral-id-section');
}


function scrollToReferralSection() {
    const section = document.getElementById('referral-id-section');
    if (section) {
        // Ensure dashboard section is visible first
        showDashboard(); // Your existing function to show dashboard
        
        // Smooth scroll after a tiny delay to allow section render
        setTimeout(() => {
            section.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Optional: Add highlight effect
            section.classList.add('highlight-section');
            setTimeout(() => section.classList.remove('highlight-section'), 2000);
        }, 100);
    }
}
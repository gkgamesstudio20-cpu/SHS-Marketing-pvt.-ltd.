// ============================================
// SHS Marketing - Main Navigation Script
// ============================================

// Navigation Functions
function goToLogin() {
    window.location.href = "login.html";
}

function goToRegister() {
    window.location.href = "register.html";
}

function goToDashboard() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
        window.location.href = "dashboard.html";
    } else {
        window.location.href = "login.html";
    }
}

function goToHome() {
    window.location.href = "index.html";
}

function logout() {
    // Clear session data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedInMobile");
    
    // Show logout confirmation
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "index.html";
    }
}

// ============================================
// Button Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Sign In Buttons (Multiple locations)
    const signInButtons = document.querySelectorAll('.btn-signin, .signin-btn, [data-action="signin"]');
    signInButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            goToLogin();
        });
    });
    
    // Get Started Buttons (Multiple locations)
    const getStartedButtons = document.querySelectorAll('.btn-getstarted, .getstarted-btn, [data-action="getstarted"]');
    getStartedButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            goToRegister();
        });
    });
    
    // Start Your Journey Today Links
    const journeyLinks = document.querySelectorAll('.journey-link, [data-action="journey"]');
    journeyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            goToRegister();
        });
    });
    
    // Navbar Auth Buttons
    const loginNavBtn = document.querySelector('.nav-login-btn');
    if (loginNavBtn) {
        loginNavBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goToLogin();
        });
    }
    
    const registerNavBtn = document.querySelector('.nav-register-btn');
    if (registerNavBtn) {
        registerNavBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goToRegister();
        });
    }
    
    // Dashboard Navigation (Sidebar)
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.parentElement.classList.remove('active'));
                
                // Add active class to clicked item
                this.parentElement.classList.add('active');
                
                // Hide all sections
                document.querySelectorAll('.content-section').forEach(sec => {
                    sec.classList.remove('active');
                });
                
                // Show target section
                const targetSection = document.getElementById(section);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
                
                // Update page title
                const pageTitle = document.getElementById('page-title');
                if (pageTitle) {
                    const titleText = this.querySelector('span')?.textContent || section;
                    pageTitle.textContent = titleText;
                }
            }
        });
    });
    
    // Logout Button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Copy Referral ID
    const copyReferralBtn = document.querySelector('.copy-referral-btn');
    if (copyReferralBtn) {
        copyReferralBtn.addEventListener('click', function() {
            const referralId = document.getElementById('referralId');
            if (referralId) {
                navigator.clipboard.writeText(referralId.value).then(() => {
                    showToast('Referral ID copied!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                    // Fallback for older browsers
                    referralId.select();
                    document.execCommand('copy');
                    showToast('Referral ID copied!');
                });
            }
        });
    }
    
    // Copy Referral Link
    const copyLinkBtn = document.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink');
            if (referralLink) {
                navigator.clipboard.writeText(referralLink.textContent).then(() => {
                    showToast('Referral link copied!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                    showToast('Referral link copied!');
                });
            }
        });
    }
    
    // Form Submissions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(this);
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister(this);
        });
    }
    
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleWithdraw(this);
        });
    }
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProfileUpdate(this);
        });
    }
    
    // Password Toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input && input.type === 'password') {
                input.type = 'text';
                this.querySelector('i').classList.remove('fa-eye');
                this.querySelector('i').classList.add('fa-eye-slash');
            } else if (input && input.type === 'text') {
                input.type = 'password';
                this.querySelector('i').classList.remove('fa-eye-slash');
                this.querySelector('i').classList.add('fa-eye');
            }
        });
    });
    
    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(button => {
        button.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            
            // Close other open items
            document.querySelectorAll('.faq-item.active').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current item
            faqItem.classList.toggle('active');
        });
    });
    
    // Chart Controls
    const chartButtons = document.querySelectorAll('.chart-controls button');
    chartButtons.forEach(button => {
        button.addEventListener('click', function() {
            chartButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Search Functionality
    const searchInputs = document.querySelectorAll('.search-input, .search-bar input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.table-card')?.querySelector('.data-table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            }
        });
    });
    
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
                navbar.classList.remove('navbar-transparent');
            } else {
                navbar.classList.remove('navbar-scrolled');
                navbar.classList.add('navbar-transparent');
            }
        });
    }
    
    // Animate Stats on Scroll
    const statValues = document.querySelectorAll('.stat-value, .card-value, .team-stat-value');
    const animateStats = () => {
        statValues.forEach(stat => {
            const rect = stat.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                animateValue(stat);
            }
        });
    };
    
    window.addEventListener('scroll', animateStats);
    animateStats(); // Run on load
    
    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Close Modal on Outside Click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.style.display = 'none';
            }
        });
    });
    
    // Close Modal on Close Button
    const closeButtons = document.querySelectorAll('.close, .modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        });
    });
    
    // Check Login Status on Dashboard
    const isDashboard = window.location.pathname.includes('dashboard.html');
    if (isDashboard) {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        if (isLoggedIn !== "true") {
            // Redirect to login if not logged in
            // Uncomment below for production
            // goToLogin();
            console.log('User not logged in - redirect to login');
        }
    }
    
    // Initialize Toast Container
    initToastContainer();
    
    console.log('SHS Marketing Platform Loaded Successfully!');
});

// ============================================
// Form Handlers
// ============================================

function handleLogin(form) {
    const email = form.querySelector('input[type="email"]')?.value;
    const password = form.querySelector('input[type="password"]')?.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Basic validation
    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    }
    
    // Simulate API call
    setTimeout(() => {
        // Set login status
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify({ email: email }));
        
        showToast('Login successful!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
    }, 1500);
}

function handleRegister(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    }
    
    // Simulate API call
    setTimeout(() => {
        showToast('Registration successful! Please check your email.', 'success');
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    }, 2000);
}

function handleWithdraw(form) {
    const amount = form.querySelector('input[type="number"]')?.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (!amount || amount < 100) {
        showToast('Minimum withdrawal amount is ₹100', 'error');
        return;
    }
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    // Simulate API call
    setTimeout(() => {
        showToast('Withdrawal request submitted successfully!', 'success');
        form.reset();
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Request Withdrawal';
        }
    }, 2000);
}

function handleProfileUpdate(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    // Simulate API call
    setTimeout(() => {
        showToast('Profile updated successfully!', 'success');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    }, 1500);
}

// ============================================
// Utility Functions
// ============================================

// Toast Notification
function initToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.style.cssText = `
        background: white;
        color: #1f2937;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        border-left: 4px solid ${colors[type]};
        animation: slideInRight 0.3s ease;
    `;
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 20px;"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add toast animations
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(toastStyle);

// Animate Value
function animateValue(element) {
    const text = element.textContent;
    const hasPlus = text.includes('+');
    const hasCurrency = text.includes('₹');
    
    // Extract number
    const match = text.match(/[\d,]+/);
    if (!match) return;
    
    const endValue = parseInt(match[0].replace(/,/g, ''));
    if (isNaN(endValue)) return;
    
    const duration = 2000;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.floor(easeOut * endValue);
        
        let displayValue = currentValue.toLocaleString();
        if (hasCurrency) displayValue = '₹' + displayValue;
        if (hasPlus) displayValue += '+';
        
        element.textContent = displayValue;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// Copy to Clipboard
function copyToClipboard(text, message = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
        showToast(message, 'success');
    }).catch(err => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(message, 'success');
    });
}

// Format Currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN');
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Validate Email
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validate Phone (Indian)
function isValidPhone(phone) {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone.replace(/\D/g, ''));
}

// Validate Password Strength
function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
}

// Get URL Parameter
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Set URL Parameter
function setUrlParameter(name, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(name, value);
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
}

// ============================================
// Legacy Functions (Backward Compatibility)
// ============================================

function register() {
    goToRegister();
}

function login() {
    goToLogin();
}

function dashboard() {
    goToDashboard();
}

function home() {
    goToHome();
}

function index() {
    goToHome();
}

function Myteam() {
    window.location.href = "dashboard.html#myteam";
}

function referal() {
    window.location.href = "dashboard.html#referral";
}

function profile() {
    window.location.href = "dashboard.html#profile";
}

function goTo(page) {
    window.location.href = page;
}

function copyrefeeralID() {
    const copyText = document.getElementById("refeeralID");
    if (copyText) {
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        showToast("Referral ID copied: " + copyText.value, 'success');
    }
}

// ============================================
// Console Log
// ============================================

console.log('SHS Marketing Platform Loaded Successfully!');
console.log('Navigation Functions: goToLogin(), goToRegister(), goToDashboard()');
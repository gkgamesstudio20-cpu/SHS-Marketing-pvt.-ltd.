// ============================================
// INITIALIZATION
// ============================================

// Get URL parameters for referral tracking
function getURLParameter(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// Auto-fill referral ID from URL parameter
function autoFillReferralId() {
    const referralId = getURLParameter('referralId');
    const referralCode = getURLParameter('referralCode');
    const refParam = getURLParameter('ref'); // NEW: From full referral link
    
    // Handle referralId parameter (optional)
    if (referralId) {
        const referralIdField = document.getElementById('referralId');
        if (referralIdField) {
            referralIdField.value = decodeURIComponent(referralId);
            console.log('✅ Referral ID auto-filled from URL:', referralId);
        }
    }
    
    // Handle referralCode and ref parameters (REQUIRED)
    // Support both names: referralCode and ref
    const codeValue = referralCode || refParam;
    if (codeValue) {
        const referralCodeField = document.getElementById('referralCode');
        if (referralCodeField) {
            referralCodeField.value = decodeURIComponent(codeValue);
            console.log('✅ Referral Code auto-filled from URL:', codeValue);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Auto-fill referral ID from URL parameters
    autoFillReferralId();
    
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Set DOB constraints
    setDOBConstraints();
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        clearAllErrors();
        
        // Run all validations
        let isValid = true;
        isValid &= validateFirstName();
        isValid &= validateLastName();
        isValid &= validateEmail();
        isValid &= validatePhone();
        isValid &= validateDOB();
        isValid &= validateGender();
        isValid &= validateAddress();
        isValid &= validateCity();
        isValid &= validateState();
        isValid &= validatePincode();
        isValid &= validateUsername();
        isValid &= validatePassword();
        isValid &= validateConfirmPassword();
        isValid &= validateReferralId();
        isValid &= validateReferralCode();
        isValid &= validateTerms();
        
        if (isValid) {
            submitForm();
        }
    });
    
    // Real-time validation
    document.getElementById('firstName').addEventListener('blur', validateFirstName);
    document.getElementById('lastName').addEventListener('blur', validateLastName);
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('phone').addEventListener('blur', validatePhone);
    document.getElementById('phone').addEventListener('input', formatPhoneInput);
    document.getElementById('dob').addEventListener('blur', validateDOB);
    document.getElementById('gender').addEventListener('change', validateGender);
    document.getElementById('address').addEventListener('blur', validateAddress);
    document.getElementById('city').addEventListener('blur', validateCity);
    document.getElementById('state').addEventListener('blur', validateState);
    document.getElementById('pincode').addEventListener('input', formatPincodeInput);
    document.getElementById('pincode').addEventListener('blur', validatePincode);
    document.getElementById('username').addEventListener('blur', validateUsername);
    document.getElementById('password').addEventListener('input', validatePassword);
    document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
    document.getElementById('referralId').addEventListener('blur', validateReferralId);
    document.getElementById('referralCode').addEventListener('blur', validateReferralCode);
    document.getElementById('terms').addEventListener('change', validateTerms);
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function setDOBConstraints() {
    const dobInput = document.getElementById('dob');
    if (!dobInput) return;
    
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    
    dobInput.min = minDate.toISOString().split('T')[0];
    dobInput.max = maxDate.toISOString().split('T')[0];
}

function formatPhoneInput(e) {
    this.value = this.value.replace(/[^\d+\-\s]/g, '');
}

function formatPincodeInput(e) {
    this.value = this.value.replace(/[^\d]/g, '');
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
    
    const inputElements = document.querySelectorAll('input, select, textarea');
    inputElements.forEach(el => el.classList.remove('error'));
}

function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    
    const button = event.target.closest('.toggle-password');
    if (!button) return;
    
    const icon = button.querySelector('i');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateFirstName() {
    const input = document.getElementById('firstName');
    const value = input.value.trim();
    
    if (!value) {
        showError('firstNameError', 'First name is required');
        input.classList.add('error');
        return false;
    }
    if (value.length < 2) {
        showError('firstNameError', 'First name must be at least 2 characters');
        input.classList.add('error');
        return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
        showError('firstNameError', 'First name can only contain letters');
        input.classList.add('error');
        return false;
    }
    
    clearError('firstNameError');
    input.classList.remove('error');
    return true;
}

function validateLastName() {
    const input = document.getElementById('lastName');
    const value = input.value.trim();
    
    if (!value) {
        showError('lastNameError', 'Last name is required');
        input.classList.add('error');
        return false;
    }
    if (value.length < 2) {
        showError('lastNameError', 'Last name must be at least 2 characters');
        input.classList.add('error');
        return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
        showError('lastNameError', 'Last name can only contain letters');
        input.classList.add('error');
        return false;
    }
    
    clearError('lastNameError');
    input.classList.remove('error');
    return true;
}

function validateEmail() {
    const input = document.getElementById('email');
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value) {
        showError('emailError', 'Email is required');
        input.classList.add('error');
        return false;
    }
    if (!emailRegex.test(value)) {
        showError('emailError', 'Please enter a valid email address');
        input.classList.add('error');
        return false;
    }
    
    clearError('emailError');
    input.classList.remove('error');
    return true;
}

function validatePhone() {
    const input = document.getElementById('phone');
    const value = input.value.trim();
    const digitsOnly = value.replace(/\D/g, '');
    
    if (!value) {
        showError('phoneError', 'Phone number is required');
        input.classList.add('error');
        return false;
    }
    
    if (digitsOnly.length === 10) {
        if (!/^[6-9]/.test(digitsOnly)) {
            showError('phoneError', 'Indian mobile must start with 6-9');
            input.classList.add('error');
            return false;
        }
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        const lastTenDigits = digitsOnly.substring(2);
        if (!/^[6-9]/.test(lastTenDigits)) {
            showError('phoneError', 'Indian mobile must start with 6-9');
            input.classList.add('error');
            return false;
        }
    } else {
        showError('phoneError', 'Phone must be 10 digits or +91 with 10 digits');
        input.classList.add('error');
        return false;
    }
    
    clearError('phoneError');
    input.classList.remove('error');
    return true;
}

function validateDOB() {
    const input = document.getElementById('dob');
    const value = input.value;
    
    if (!value) {
        showError('dobError', 'Date of birth is required');
        input.classList.add('error');
        return false;
    }
    
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18) {
        showError('dobError', 'You must be at least 18 years old');
        input.classList.add('error');
        return false;
    }
    if (age > 100) {
        showError('dobError', 'Please enter a valid date of birth');
        input.classList.add('error');
        return false;
    }
    
    clearError('dobError');
    input.classList.remove('error');
    return true;
}

function validateGender() {
    const input = document.getElementById('gender');
    const value = input.value;
    
    if (!value) {
        showError('genderError', 'Please select your gender');
        input.classList.add('error');
        return false;
    }
    
    clearError('genderError');
    input.classList.remove('error');
    return true;
}

function validateAddress() {
    const input = document.getElementById('address');
    const value = input.value.trim();
    
    if (!value) {
        showError('addressError', 'Address is required');
        input.classList.add('error');
        return false;
    }
    if (value.length < 10) {
        showError('addressError', 'Please enter a complete address');
        input.classList.add('error');
        return false;
    }
    
    clearError('addressError');
    input.classList.remove('error');
    return true;
}

function validateCity() {
    const input = document.getElementById('city');
    const value = input.value.trim();
    
    if (!value) {
        showError('cityError', 'City is required');
        input.classList.add('error');
        return false;
    }
    
    clearError('cityError');
    input.classList.remove('error');
    return true;
}

function validateState() {
    const input = document.getElementById('state');
    const value = input.value.trim();
    
    if (!value) {
        showError('stateError', 'State is required');
        input.classList.add('error');
        return false;
    }
    
    clearError('stateError');
    input.classList.remove('error');
    return true;
}

function validatePincode() {
    const input = document.getElementById('pincode');
    const value = input.value.trim();
    
    if (!value) {
        showError('pincodeError', 'PIN code is required');
        input.classList.add('error');
        return false;
    }
    if (value.length !== 6) {
        showError('pincodeError', 'PIN code must be exactly 6 digits');
        input.classList.add('error');
        return false;
    }
    if (!/^[1-9]\d{5}$/.test(value)) {
        showError('pincodeError', 'Please enter a valid PIN code');
        input.classList.add('error');
        return false;
    }
    
    clearError('pincodeError');
    input.classList.remove('error');
    return true;
}

function validateUsername() {
    const input = document.getElementById('username');
    const value = input.value.trim();
    
    if (!value) {
        showError('usernameError', 'Username is required');
        input.classList.add('error');
        return false;
    }
    if (value.length < 6) {
        showError('usernameError', 'Username must be at least 6 characters');
        input.classList.add('error');
        return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        showError('usernameError', 'Username can only contain letters, numbers, and underscores');
        input.classList.add('error');
        return false;
    }
    
    clearError('usernameError');
    input.classList.remove('error');
    return true;
}

function validatePassword() {
    const input = document.getElementById('password');
    const value = input.value;
    
    if (!value) {
        showError('passwordError', 'Password is required');
        input.classList.add('error');
        updatePasswordStrength(0);
        return false;
    }
    if (value.length < 8) {
        showError('passwordError', 'Password must be at least 8 characters');
        input.classList.add('error');
        updatePasswordStrength(1);
        return false;
    }
    
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;
    
    updatePasswordStrength(strength);
    clearError('passwordError');
    input.classList.remove('error');
    
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword.value) {
        validateConfirmPassword();
    }
    
    return true;
}

function updatePasswordStrength(strength) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    strengthFill.className = 'strength-fill';
    
    if (strength <= 1) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#e74c3c';
    } else if (strength <= 2) {
        strengthFill.classList.add('fair');
        strengthText.textContent = 'Fair';
        strengthText.style.color = '#f39c12';
    } else if (strength <= 3) {
        strengthFill.classList.add('good');
        strengthText.textContent = 'Good';
        strengthText.style.color = '#3498db';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#27ae60';
    }
}

function validateConfirmPassword() {
    const input = document.getElementById('confirmPassword');
    const password = document.getElementById('password').value;
    const value = input.value;
    
    if (!value) {
        showError('confirmPasswordError', 'Please confirm your password');
        input.classList.add('error');
        return false;
    }
    if (value !== password) {
        showError('confirmPasswordError', 'Passwords do not match');
        input.classList.add('error');
        return false;
    }
    
    clearError('confirmPasswordError');
    input.classList.remove('error');
    return true;
}

function validateTerms() {
    const input = document.getElementById('terms');
    
    if (!input.checked) {
        showError('termsError', 'You must agree to the terms and conditions');
        return false;
    }
    
    clearError('termsError');
    return true;
}

// ============================================
// FORM SUBMISSION TO GOOGLE APPS SCRIPT
// ============================================

function submitForm() {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Collect all form field values manually to ensure they're included
    const userData = {
        action: 'register',
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        mobile: document.getElementById('phone').value.trim(),
        dob: document.getElementById('dob').value.trim(),
        gender: document.getElementById('gender').value.trim(),
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        pincode: document.getElementById('pincode').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        referralId: document.getElementById('referralId').value.trim(),
        referralCode: document.getElementById('referralCode').value.trim()
    };
    
    console.log('Sending data:', userData);
    
    // Your Google Apps Script URL - UPDATE THIS!
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfciFmUJm132SOTEXKrNSgk7Ts2bvUd2oBio49LHS5XUS99zTcCsHTM9F5qsMFvwPfgg/exec";
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);
        
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        if (data.success) {
            const modal = document.getElementById('successModal');
            const userIdDisplay = document.getElementById('userIdDisplay');
            
            if (userIdDisplay) {
                userIdDisplay.textContent = 'User ID: ' + data.userId;
            }
            
            if (modal) {
                modal.classList.add('active');
            }
            
            document.getElementById('registerForm').reset();
            updatePasswordStrength(0);
        } else {
            alert('Registration failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        alert('Error: ' + error.message);
    });
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

// ===== Validate Referral ID =====
function validateReferralId() {
    const referralId = document.getElementById('referralId').value.trim();
    const errorElement = document.getElementById('referralIdError');
    
    if (!errorElement) {
        console.warn('⚠️ referralIdError element not found');
        return true;
    }
    
    if (!referralId) {
        errorElement.textContent = 'Referral ID is required';
        return false;
    }
    
    // Check if referral ID format is valid (should start with SHS-)
    if (!referralId.startsWith('SHS-') && referralId !== 'USER_123456') {
        // Allow any format for flexibility, but warn if not SHS format
        console.warn('⚠️ Referral ID might not be in correct format');
    }
    
    if (referralId.length < 5) {
        errorElement.textContent = 'Referral ID must be at least 5 characters';
        return false;
    }
    
    errorElement.textContent = '';
    return true;
}

// ===== Validate Referral Code =====
function validateReferralCode() {
    const referralCode = document.getElementById('referralCode').value.trim();
    const errorElement = document.getElementById('referralCodeError');
    
    if (!errorElement) {
        console.warn('⚠️ referralCodeError element not found');
        return true;
    }
    
    if (!referralCode) {
        errorElement.textContent = 'Referral Code is required (Mandatory)';
        return false;
    }
    
    if (referralCode.length < 3) {
        errorElement.textContent = 'Referral Code must be at least 3 characters';
        return false;
    }
    
    errorElement.textContent = '';
    return true;
}

window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (modal && e.target === modal) {
        modal.classList.remove('active');
    }
});
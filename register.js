// Registration Form Validation and Functionality

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Form validation on submit
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset all errors
        clearAllErrors();
        
        // Validate all fields
        let isValid = true;
        
        // Personal Information
        if (!validateFirstName()) isValid = false;
        if (!validateLastName()) isValid = false;
        if (!validateEmail()) isValid = false;
        if (!validatePhone()) isValid = false;
        if (!validateDOB()) isValid = false;
        if (!validateGender()) isValid = false;
        
        // Address Information
        if (!validateAddress()) isValid = false;
        if (!validateCity()) isValid = false;
        if (!validateState()) isValid = false;
        if (!validatePincode()) isValid = false;
        
        // Account Information
        if (!validateUsername()) isValid = false;
        if (!validatePassword()) isValid = false;
        if (!validateConfirmPassword()) isValid = false;
        
        // Terms
        if (!validateTerms()) isValid = false;
        
        // If all valid, submit form
        if (isValid) {
            submitForm();
        }
    });
    
    // Real-time validation
    document.getElementById('firstName').addEventListener('blur', validateFirstName);
    document.getElementById('lastName').addEventListener('blur', validateLastName);
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('phone').addEventListener('blur', validatePhone);
    document.getElementById('dob').addEventListener('blur', validateDOB);
    document.getElementById('gender').addEventListener('change', validateGender);
    document.getElementById('address').addEventListener('blur', validateAddress);
    document.getElementById('city').addEventListener('blur', validateCity);
    document.getElementById('state').addEventListener('blur', validateState);
    document.getElementById('pincode').addEventListener('blur', validatePincode);
    document.getElementById('username').addEventListener('blur', validateUsername);
    document.getElementById('password').addEventListener('input', validatePassword);
    document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
    document.getElementById('terms').addEventListener('change', validateTerms);
    
    // Phone number formatting
    document.getElementById('phone').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    // PIN code formatting
    document.getElementById('pincode').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    // Username validation (check availability simulation)
    document.getElementById('username').addEventListener('blur', function() {
        const username = this.value.trim();
        if (username.length >= 6) {
            // Simulate API call to check username availability
            setTimeout(() => {
                if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'test') {
                    showError('usernameError', 'This username is already taken');
                    this.classList.add('error');
                } else {
                    clearError('usernameError');
                    this.classList.remove('error');
                }
            }, 500);
        }
    });
});

// Validation Functions
function validateFirstName() {
    const input = document.getElementById('firstName');
    const value = input.value.trim();
    const error = document.getElementById('firstNameError');
    
    if (value === '') {
        showError('firstNameError', 'First name is required');
        input.classList.add('error');
        return false;
    } else if (value.length < 2) {
        showError('firstNameError', 'First name must be at least 2 characters');
        input.classList.add('error');
        return false;
    } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        showError('firstNameError', 'First name can only contain letters');
        input.classList.add('error');
        return false;
    } else {
        clearError('firstNameError');
        input.classList.remove('error');
        return true;
    }
}

function validateLastName() {
    const input = document.getElementById('lastName');
    const value = input.value.trim();
    const error = document.getElementById('lastNameError');
    
    if (value === '') {
        showError('lastNameError', 'Last name is required');
        input.classList.add('error');
        return false;
    } else if (value.length < 2) {
        showError('lastNameError', 'Last name must be at least 2 characters');
        input.classList.add('error');
        return false;
    } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        showError('lastNameError', 'Last name can only contain letters');
        input.classList.add('error');
        return false;
    } else {
        clearError('lastNameError');
        input.classList.remove('error');
        return true;
    }
}

function validateEmail() {
    const input = document.getElementById('email');
    const value = input.value.trim();
    const error = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (value === '') {
        showError('emailError', 'Email is required');
        input.classList.add('error');
        return false;
    } else if (!emailRegex.test(value)) {
        showError('emailError', 'Please enter a valid email address');
        input.classList.add('error');
        return false;
    } else {
        clearError('emailError');
        input.classList.remove('error');
        return true;
    }
}

function validatePhone() {
    const input = document.getElementById('phone');
    const value = input.value.trim();
    const error = document.getElementById('phoneError');
    
    if (value === '') {
        showError('phoneError', 'Phone number is required');
        input.classList.add('error');
        return false;
    } else if (value.length !== 10) {
        showError('phoneError', 'Phone number must be 10 digits');
        input.classList.add('error');
        return false;
    } else if (!/^[6-9]\d{9}$/.test(value)) {
        showError('phoneError', 'Please enter a valid Indian mobile number');
        input.classList.add('error');
        return false;
    } else {
        clearError('phoneError');
        input.classList.remove('error');
        return true;
    }
}

function validateDOB() {
    const input = document.getElementById('dob');
    const value = input.value;
    const error = document.getElementById('dobError');
    
    if (value === '') {
        showError('dobError', 'Date of birth is required');
        input.classList.add('error');
        return false;
    } else {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 18) {
            showError('dobError', 'You must be at least 18 years old');
            input.classList.add('error');
            return false;
        } else if (age > 100) {
            showError('dobError', 'Please enter a valid date of birth');
            input.classList.add('error');
            return false;
        } else {
            clearError('dobError');
            input.classList.remove('error');
            return true;
        }
    }
}

function validateGender() {
    const input = document.getElementById('gender');
    const value = input.value;
    const error = document.getElementById('genderError');
    
    if (value === '') {
        showError('genderError', 'Please select your gender');
        input.classList.add('error');
        return false;
    } else {
        clearError('genderError');
        input.classList.remove('error');
        return true;
    }
}

function validateAddress() {
    const input = document.getElementById('address');
    const value = input.value.trim();
    const error = document.getElementById('addressError');
    
    if (value === '') {
        showError('addressError', 'Address is required');
        input.classList.add('error');
        return false;
    } else if (value.length < 10) {
        showError('addressError', 'Please enter a complete address');
        input.classList.add('error');
        return false;
    } else {
        clearError('addressError');
        input.classList.remove('error');
        return true;
    }
}

function validateCity() {
    const input = document.getElementById('city');
    const value = input.value.trim();
    const error = document.getElementById('cityError');
    
    if (value === '') {
        showError('cityError', 'City is required');
        input.classList.add('error');
        return false;
    } else {
        clearError('cityError');
        input.classList.remove('error');
        return true;
    }
}

function validateState() {
    const input = document.getElementById('state');
    const value = input.value.trim();
    const error = document.getElementById('stateError');
    
    if (value === '') {
        showError('stateError', 'State is required');
        input.classList.add('error');
        return false;
    } else {
        clearError('stateError');
        input.classList.remove('error');
        return true;
    }
}

function validatePincode() {
    const input = document.getElementById('pincode');
    const value = input.value.trim();
    const error = document.getElementById('pincodeError');
    
    if (value === '') {
        showError('pincodeError', 'PIN code is required');
        input.classList.add('error');
        return false;
    } else if (value.length !== 6) {
        showError('pincodeError', 'PIN code must be 6 digits');
        input.classList.add('error');
        return false;
    } else if (!/^[1-9]\d{5}$/.test(value)) {
        showError('pincodeError', 'Please enter a valid PIN code');
        input.classList.add('error');
        return false;
    } else {
        clearError('pincodeError');
        input.classList.remove('error');
        return true;
    }
}

function validateUsername() {
    const input = document.getElementById('username');
    const value = input.value.trim();
    const error = document.getElementById('usernameError');
    
    if (value === '') {
        showError('usernameError', 'Username is required');
        input.classList.add('error');
        return false;
    } else if (value.length < 6) {
        showError('usernameError', 'Username must be at least 6 characters');
        input.classList.add('error');
        return false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        showError('usernameError', 'Username can only contain letters, numbers, and underscores');
        input.classList.add('error');
        return false;
    } else {
        clearError('usernameError');
        input.classList.remove('error');
        return true;
    }
}

function validatePassword() {
    const input = document.getElementById('password');
    const value = input.value;
    const error = document.getElementById('passwordError');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (value === '') {
        showError('passwordError', 'Password is required');
        input.classList.add('error');
        updatePasswordStrength(0);
        return false;
    } else if (value.length < 8) {
        showError('passwordError', 'Password must be at least 8 characters');
        input.classList.add('error');
        updatePasswordStrength(1);
        return false;
    } else {
        // Check password strength
        let strength = 0;
        if (value.length >= 8) strength++;
        if (/[a-z]/.test(value)) strength++;
        if (/[A-Z]/.test(value)) strength++;
        if (/[0-9]/.test(value)) strength++;
        if (/[^a-zA-Z0-9]/.test(value)) strength++;
        
        updatePasswordStrength(strength);
        clearError('passwordError');
        input.classList.remove('error');
        
        // Also validate confirm password if it has value
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword.value !== '') {
            validateConfirmPassword();
        }
        
        return true;
    }
}

function updatePasswordStrength(strength) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    strengthFill.className = 'strength-fill';
    
    if (strength <= 1) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = 'var(--danger)';
    } else if (strength <= 2) {
        strengthFill.classList.add('fair');
        strengthText.textContent = 'Fair';
        strengthText.style.color = 'var(--accent)';
    } else if (strength <= 3) {
        strengthFill.classList.add('good');
        strengthText.textContent = 'Good';
        strengthText.style.color = 'var(--info)';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = 'var(--success)';
    }
}

function validateConfirmPassword() {
    const input = document.getElementById('confirmPassword');
    const password = document.getElementById('password').value;
    const value = input.value;
    const error = document.getElementById('confirmPasswordError');
    
    if (value === '') {
        showError('confirmPasswordError', 'Please confirm your password');
        input.classList.add('error');
        return false;
    } else if (value !== password) {
        showError('confirmPasswordError', 'Passwords do not match');
        input.classList.add('error');
        return false;
    } else {
        clearError('confirmPasswordError');
        input.classList.remove('error');
        return true;
    }
}

function validateTerms() {
    const input = document.getElementById('terms');
    const error = document.getElementById('termsError');
    
    if (!input.checked) {
        showError('termsError', 'You must agree to the terms and conditions');
        return false;
    } else {
        clearError('termsError');
        return true;
    }
}

// Helper Functions
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
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
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

function submitForm() {
    const submitBtn = document.getElementById('submitBtn');
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Hide loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        // Show success modal
        const modal = document.getElementById('successModal');
        modal.classList.add('active');
        
        // Store user data (for demo purposes)
        const formData = new FormData(document.getElementById('registerForm'));
        const userData = Object.fromEntries(formData);
        console.log('Registration Data:', userData);
        
        // In production, you would send this to your backend
        // fetch('/api/register', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(userData)
        // });
        
    }, 2000);
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Set minimum date for DOB (18 years ago)
document.addEventListener('DOMContentLoaded', function() {
    const dobInput = document.getElementById('dob');
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    
    dobInput.min = minDate.toISOString().split('T')[0];
    dobInput.max = maxDate.toISOString().split('T')[0];
});
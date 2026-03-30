// payment.js - Payment Verification System
const API_URL = "https://script.google.com/macros/s/AKfycbx5EYEhgaKWh9wPJaY2HYztmbEOD4uGkEKA7iToQb5Sq8NnVtkS3JFS6rAEOMqnal8yXg/exec";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const transactionId = document.getElementById('transactionId');
  const termsCheckbox = document.getElementById('terms');
  const formMessage = document.getElementById('formMessage');

  // Auto-format transaction ID input
  transactionId.addEventListener('input', function(e) {
    let value = e.target.value.toUpperCase().replace(/\s/g, '');
    e.target.value = value;
  });

  // ===== PHONE INPUT FILTERING (Copied from Login Page) =====
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    // Allow only digits, +, -, and spaces (same as login mobile field)
    phoneInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^\d+\-\s]/g, '');
    });
    
    // Validate on blur
    phoneInput.addEventListener('blur', function() {
      validatePhoneFormat(this.value);
    });
  }

  // ===== VALIDATE PHONE FORMAT (Updated: No 6-9 check for +91 format) =====
  function validatePhoneFormat(value) {
    const digitsOnly = value.replace(/\D/g, '');
    let isValid = false;
    let errorMsg = '';
    
    if (!value) {
      isValid = false;
      errorMsg = 'Phone number is required';
    } else if (digitsOnly.length === 10) {
      // Just 10 digits - still check starts with 6-9
      if (/^[6-9]/.test(digitsOnly)) {
        isValid = true;
      } else {
        errorMsg = 'Must start with 6-9';
      }
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      // +91 with 10 digits - ✅ Accept any 10 digits after country code
      isValid = true;
    } else {
      errorMsg = 'Enter 10 digits or +91 with 10 digits';
    }
    
    togglePhoneError(!isValid, errorMsg);
    return isValid;
  }

  function togglePhoneError(hasError, message) {
    let errorEl = document.getElementById('phoneError');
    
    // Create error element if it doesn't exist
    if (!errorEl && phoneInput) {
      errorEl = document.createElement('div');
      errorEl.id = 'phoneError';
      errorEl.className = 'error';
      errorEl.style.cssText = 'color:#ef4444;font-size:14px;margin-top:4px;display:none';
      phoneInput.parentNode.insertBefore(errorEl, phoneInput.nextSibling);
    }
    
    if (errorEl) {
      errorEl.textContent = hasError ? message : '';
      errorEl.style.display = hasError ? 'block' : 'none';
    }
  }

  // ===== NORMALIZE PHONE NUMBER (for backend submission) =====
  function normalizePhoneNumber(phone) {
    const digits = (phone + "").replace(/\D/g, '');
    
    let cleanMobile = digits;
    
    if (digits.startsWith('91') && digits.length === 12) {
      cleanMobile = digits.substring(2); // Remove '91' prefix
      // ✅ No 6-9 validation for +91 format - accept any 10 digits
    } else if (digits.length === 10) {
      cleanMobile = digits;
      // Still validate 10-digit numbers start with 6-9 (Indian mobile standard)
      if (!/^[6-9]/.test(cleanMobile)) {
        return null;
      }
    } else {
      return null; // Invalid length
    }
    
    return cleanMobile;
  }

  // ===== VALIDATE PHONE BEFORE SUBMISSION =====
  function validatePhone() {
    const phone = phoneInput?.value.trim();
    
    if (!phone) {
      togglePhoneError(true, 'Phone number is required');
      return false;
    }
    
    const isValid = validatePhoneFormat(phone);
    if (!isValid) {
      return false;
    }
    
    togglePhoneError(false);
    return true;
  }

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMessage.textContent = '';
    formMessage.className = 'message';

    // Validation
    if (!termsCheckbox.checked) {
      showMessage('Please agree to the Terms & Conditions.', 'error');
      return;
    }

    // Validate full name
    const fullName = document.getElementById('fullName').value.trim();
    if (!fullName) {
      showMessage('Please enter your full name.', 'error');
      return;
    }

    // Validate phone with normalization
    if (!validatePhone()) {
      return;
    }

    // Get normalized phone number for backend
    const normalizedPhone = normalizePhoneNumber(phoneInput.value.trim());

    // Validate transaction ID format
    const txnPattern = /^[A-Za-z0-9\-]{10,50}$/;
    if (!txnPattern.test(transactionId.value.trim())) {
      showMessage('Please enter a valid Transaction ID (min 10 characters).', 'error');
      return;
    }

    try {
      showMessage('Processing payment verification... Please wait.', 'info');
      
      const paymentData = {
        action: 'savePayment',
        fullName: fullName,
        phone: normalizedPhone,
        transactionId: transactionId.value.trim().toUpperCase(),
        paymentMethod: 'UPI',
        upiId: 'shsbrandgroup@oksbi',
        paymentStatus: 'Pending',
        approvalStatus: 'Waiting for Admin Approval',
        timestamp: new Date().toISOString(),
        dateSubmitted: new Date().toLocaleDateString()
      };

      console.log('📤 Sending payment data to backend:', paymentData);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      console.log('📥 Backend response:', result);

      if (result.success) {
        showMessage(
          `✅ Payment submitted successfully!\n\nTransaction ID: ${paymentData.transactionId}\n\nPlease wait for admin approval (up to 24 hours). You will receive a confirmation email.`,
          'success'
        );
        
        localStorage.setItem('pendingPaymentPhone', normalizedPhone);
        localStorage.setItem('pendingPaymentTxnId', transactionId.value.trim().toUpperCase());
        
        form.reset();
        togglePhoneError(false); // Clear any phone errors
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 5000);
      } else {
        showMessage(`❌ Error: ${result.message || 'Payment submission failed'}`, 'error');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      showMessage(`❌ Error: ${error.message}`, 'error');
    }
  });

  // Show user messages
  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `message ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        if (formMessage.textContent.includes('Transaction ID')) {
          formMessage.textContent = '';
          formMessage.className = 'message';
        }
      }, 8000);
    }
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ===== OPTIONAL: Display Formatting (Visual Only) =====
  if (phoneInput) {
    phoneInput.addEventListener('focus', function() {
      // Store raw value on focus
      this.dataset.raw = this.value.replace(/\D/g, '');
    });
    
    phoneInput.addEventListener('blur', function() {
      const digits = (this.dataset.raw || this.value).replace(/\D/g, '');
      if (digits.length === 10) {
        this.value = `+91 ${digits.slice(0,5)} ${digits.slice(5)}`;
      } else if (digits.length === 12 && digits.startsWith('91')) {
        const lastTen = digits.slice(2);
        this.value = `+91 ${lastTen.slice(0,5)} ${lastTen.slice(5)}`;
      }
      // Validation already runs on blur via validatePhoneFormat
    });
  }

  // Copy UPI ID to clipboard
  const upiIDElement = document.querySelector('.upi-id');
  if (upiIDElement) {
    upiIDElement.addEventListener('click', () => {
      const upiID = 'shsbrandgroup@oksbi';
      navigator.clipboard.writeText(upiID).then(() => {
        showMessage('✓ UPI ID copied to clipboard!', 'success');
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    });
    upiIDElement.style.cursor = 'pointer';
    upiIDElement.title = 'Click to copy UPI ID';
  }
});
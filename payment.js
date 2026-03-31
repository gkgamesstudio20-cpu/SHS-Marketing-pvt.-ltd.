// payment.js - Payment Verification System
const API_URL = "https://script.google.com/macros/s/AKfycbzM7cHUc_jvP447AJUGCOPRXk78RdayAmdhPmUMjaKxy5Fn9_UiHqDVHSlr8YKOpREaGg/exec";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const transactionIdInput = document.getElementById('transactionId');
    const termsCheckbox = document.getElementById('terms');
    const formMessage = document.getElementById('formMessage');
    const phoneInput = document.getElementById('phone');
    const submitBtn = document.getElementById('submitBtn');

    // ─── AUTO-FILL FROM REGISTRATION sessionStorage ───────────────────────────
    // register.js saves these keys on successful registration:
    //   reg_mobile     — raw phone entered by user (e.g. "9876543210")
    //   reg_fullName   — "FirstName LastName"
    //   reg_referralId — sponsor's SHS-XXXXXXXXXX (may be empty)
    //   reg_userId     — newly assigned SHS-XXXXXXXXXX for this user
    (function autoFillFromRegistration() {
        const savedMobile    = sessionStorage.getItem('reg_mobile')     || '';
        const savedFullName  = sessionStorage.getItem('reg_fullName')   || '';
        const savedReferralId = sessionStorage.getItem('reg_referralId') || '';
        const savedUserId    = sessionStorage.getItem('reg_userId')     || '';

        const hasData = savedMobile || savedFullName;

        if (savedFullName) {
            const fullNameInput = document.getElementById('fullName');
            fullNameInput.value = savedFullName;
            // Allow editing in case they want to correct it
        }

        if (savedMobile) {
            // Format for display: "+91 XXXXX XXXXX"
            const digits = savedMobile.replace(/\D/g, '');
            const mobile10 = digits.length === 12 && digits.startsWith('91')
                ? digits.slice(2) : digits;

            if (mobile10.length === 10) {
                phoneInput.value = `+91 ${mobile10.slice(0, 5)} ${mobile10.slice(5)}`;
            } else {
                phoneInput.value = savedMobile; // fallback: show as-is
            }

            // Lock the phone field — it must match the registered account
            phoneInput.readOnly = true;
            phoneInput.style.background = '#f8fafc';
            phoneInput.style.color = '#64748b';
            phoneInput.style.cursor = 'default';
            phoneInput.title = 'Phone number is locked to your registered account';
        }

        // Show Sponsor ID field only if a referralId exists
        if (savedReferralId) {
            const referralIdGroup = document.getElementById('referralIdGroup');
            const referralIdDisplay = document.getElementById('referralIdDisplay');
            if (referralIdGroup && referralIdDisplay) {
                referralIdDisplay.value = savedReferralId;
                referralIdGroup.style.display = 'block';
            }
        }

        // Show the auto-fill banner if we have any data
        if (hasData) {
            const banner = document.getElementById('autoFillBanner');
            const bannerText = document.getElementById('autoFillBannerText');
            if (banner) {
                let msg = 'Details auto-filled from your registration.';
                if (savedUserId) msg += ` Your User ID: ${savedUserId}.`;
                msg += ' Please verify before submitting.';
                if (bannerText) bannerText.textContent = msg;
                banner.style.display = 'flex';
            }
        }
    })();

    // ─── AUTO-FORMAT TRANSACTION ID ───────────────────────────────────────────
    transactionIdInput.addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/\s/g, '');
    });

    // ─── PHONE INPUT: Allow digits, +, -, spaces ──────────────────────────────
    phoneInput.addEventListener('input', function () {
        if (!this.readOnly) {
            this.value = this.value.replace(/[^\d+\-\s]/g, '');
        }
    });

    // ─── NORMALIZE PHONE (returns clean 10-digit string or null) ─────────────
    function normalizePhone(phone) {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, '');

        let mobile;
        if (digits.length === 12 && digits.startsWith('91')) {
            mobile = digits.substring(2);
        } else if (digits.length === 10) {
            mobile = digits;
        } else {
            return null;
        }

        if (!/^[6-9]/.test(mobile)) return null;
        return mobile;
    }

    // ─── PHONE VALIDATION (UI feedback) ──────────────────────────────────────
    function validatePhone() {
        const raw = phoneInput.value.trim();
        const errorEl = document.getElementById('phoneError');

        if (!raw) {
            showFieldError(errorEl, 'Phone number is required');
            return false;
        }
        if (!normalizePhone(raw)) {
            showFieldError(errorEl, 'Enter a valid 10-digit Indian mobile or +91 format');
            return false;
        }
        clearFieldError(errorEl);
        return true;
    }

    function showFieldError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.style.display = 'block';
    }

    function clearFieldError(el) {
        if (!el) return;
        el.textContent = '';
        el.style.display = 'none';
    }

    // Phone blur: format display then validate
    phoneInput.addEventListener('blur', function () {
        if (this.readOnly) return; // skip if locked (auto-filled)

        const digits = this.value.replace(/\D/g, '');
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            this.value = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
        } else if (digits.length === 12 && digits.startsWith('91')) {
            const lastTen = digits.slice(2);
            if (/^[6-9]/.test(lastTen)) {
                this.value = `+91 ${lastTen.slice(0, 5)} ${lastTen.slice(5)}`;
            }
        }
        validatePhone();
    });

    // ─── FORM SUBMISSION ──────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';
        formMessage.className = 'message';

        let isValid = true;

        // Full Name
        const fullName = document.getElementById('fullName').value.trim();
        const fullNameError = document.getElementById('fullNameError');
        if (!fullName) {
            showFieldError(fullNameError, 'Full name is required');
            isValid = false;
        } else if (fullName.length < 3) {
            showFieldError(fullNameError, 'Please enter your complete name');
            isValid = false;
        } else {
            clearFieldError(fullNameError);
        }

        // Phone
        if (!validatePhone()) isValid = false;

        // Transaction ID
        const txnVal = transactionIdInput.value.trim();
        const txnError = document.getElementById('transactionIdError');
        const txnPattern = /^[A-Za-z0-9\-]{10,50}$/;
        if (!txnVal) {
            showFieldError(txnError, 'Transaction ID is required');
            isValid = false;
        } else if (!txnPattern.test(txnVal)) {
            showFieldError(txnError, 'Transaction ID must be 10–50 characters (letters, numbers, hyphens only)');
            isValid = false;
        } else {
            clearFieldError(txnError);
        }

        // Terms
        const termsError = document.getElementById('termsError');
        if (!termsCheckbox.checked) {
            showFieldError(termsError, 'You must agree to the Terms & Conditions');
            isValid = false;
        } else {
            clearFieldError(termsError);
        }

        if (!isValid) return;

        const normalizedPhone = normalizePhone(phoneInput.value.trim());
        if (!normalizedPhone) {
            showMessage('Invalid phone number. Please re-enter.', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            showMessage('Processing payment verification… Please wait.', 'info');

            const paymentData = {
                action: 'savePayment',
                fullName: fullName,
                phone: normalizedPhone,
                transactionId: txnVal.toUpperCase(),
                // referralId: referralId,
                paymentMethod: 'UPI',
                upiId: 'shsbrandgroup@oksbi',
                paymentStatus: 'Pending',
                approvalStatus: 'Waiting for Admin',
                timestamp: new Date().toISOString(),
                dateSubmitted: new Date().toLocaleDateString('en-IN')
            };

            console.log('📤 Sending payment data:', { ...paymentData });

            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();
            console.log('📥 Backend response:', result);

            if (result.success) {
                showMessage(
                    `✅ Payment submitted successfully!\n\nTransaction ID: ${paymentData.transactionId}\n\nPlease wait for admin approval (up to 24 hours). Redirecting to login…`,
                    'success'
                );

                // Keep phone for login page convenience; clear registration data
                sessionStorage.setItem('pendingPaymentPhone', normalizedPhone);
                sessionStorage.setItem('pendingPaymentTxnId', paymentData.transactionId);
                sessionStorage.removeItem('reg_mobile');
                sessionStorage.removeItem('reg_fullName');
                sessionStorage.removeItem('reg_referralId');
                sessionStorage.removeItem('reg_userId');

                form.reset();

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 5000);

            } else {
                showMessage(`❌ ${result.message || 'Payment submission failed. Please try again.'}`, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Submit &amp; Verify Payment';
            }

        } catch (error) {
            console.error('❌ Fetch error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Submit &amp; Verify Payment';
        }
    });

    // ─── SHOW MESSAGE ─────────────────────────────────────────────────────────
    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = `message ${type}`;
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ─── COPY UPI ID ─────────────────────────────────────────────────────────
    const upiIDElement = document.querySelector('.upi-id');
    if (upiIDElement) {
        upiIDElement.style.cursor = 'pointer';
        upiIDElement.title = 'Click to copy UPI ID';
        upiIDElement.addEventListener('click', () => {
            navigator.clipboard.writeText('shsbrandgroup@oksbi')
                .then(() => showMessage('✓ UPI ID copied to clipboard!', 'success'))
                .catch(() => showMessage('UPI ID: shsbrandgroup@oksbi (copy manually)', 'info'));
        });
    }

});
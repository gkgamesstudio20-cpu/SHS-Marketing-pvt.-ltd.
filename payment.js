// payment.js - Payment Verification System
const API_URL = "https://script.google.com/macros/s/AKfycbw1FYhXD0D8vp5onIPveuXk9tlZtO5-r7JXbjN0TcCC7TG8-UUios2BdpJKp8v-0SH46g/exec";

// ─── PLAN CONFIG ─────────────────────────────────────────────────────────────
// Keep this in sync with the <select> options in payment.html
const PLANS = {
    "500":   { label: "₹500",    name: "Starter Plan",  svg: "500.svg"   },
    "2000":  { label: "₹2,000",  name: "Basic Plan",    svg: "2000.svg"  },
    "5000":  { label: "₹5,000",  name: "Standard Plan", svg: "5000.svg"  },
    "10000": { label: "₹10,000", name: "Premium Plan",  svg: "10000.svg" },
    "20000": { label: "₹20,000", name: "Elite Plan",    svg: "20000.svg" }
};

document.addEventListener('DOMContentLoaded', () => {
    const form              = document.getElementById('registrationForm');
    const transactionIdInput = document.getElementById('transactionId');
    const termsCheckbox     = document.getElementById('terms');
    const formMessage       = document.getElementById('formMessage');
    const phoneInput        = document.getElementById('phone');
    const submitBtn         = document.getElementById('submitBtn');

    // Amount dropdown elements
    const amountSelect       = document.getElementById('paymentAmount');
    const upiQRCode          = document.getElementById('upiQRCode');
    const qrPlaceholder      = document.getElementById('qrPlaceholder');
    const selectedAmountBadge = document.getElementById('selectedAmountBadge');
    const selectedAmountText  = document.getElementById('selectedAmountText');
    const planInfoTag         = document.getElementById('planInfoTag');
    const planInfoText        = document.getElementById('planInfoText');
    const amountError         = document.getElementById('amountError');

    // ─── AUTO-FILL FROM REGISTRATION sessionStorage ───────────────────────────
    (function autoFillFromRegistration() {
        const savedMobile     = sessionStorage.getItem('reg_mobile')     || '';
        const savedFullName   = sessionStorage.getItem('reg_fullName')   || '';
        const savedReferralId = sessionStorage.getItem('reg_referralId') || '';
        const savedUserId     = sessionStorage.getItem('reg_userId')     || '';

        const hasData = savedMobile || savedFullName;

        if (savedFullName) {
            document.getElementById('fullName').value = savedFullName;
        }

        if (savedMobile) {
            const digits   = savedMobile.replace(/\D/g, '');
            const mobile10 = digits.length === 12 && digits.startsWith('91')
                ? digits.slice(2) : digits;

            phoneInput.value = mobile10.length === 10
                ? `+91 ${mobile10.slice(0, 5)} ${mobile10.slice(5)}`
                : savedMobile;

            phoneInput.readOnly           = true;
            phoneInput.style.background   = '#f8fafc';
            phoneInput.style.color        = '#64748b';
            phoneInput.style.cursor       = 'default';
            phoneInput.title              = 'Phone number is locked to your registered account';
        }

        if (savedReferralId) {
            const referralIdGroup   = document.getElementById('referralIdGroup');
            const referralIdDisplay = document.getElementById('referralIdDisplay');
            if (referralIdGroup && referralIdDisplay) {
                referralIdDisplay.value        = savedReferralId;
                referralIdGroup.style.display  = 'block';
            }
        }

        if (hasData) {
            const banner     = document.getElementById('autoFillBanner');
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

    // ─── AMOUNT DROPDOWN → QR SWAP ────────────────────────────────────────────
    amountSelect.addEventListener('change', function () {
        const value = this.value;
        amountError.style.display = 'none';

        if (!value || !PLANS[value]) {
            // Reset to placeholder state
            upiQRCode.style.display   = 'none';
            qrPlaceholder.style.display = 'flex';
            selectedAmountBadge.classList.remove('visible');
            planInfoTag.classList.remove('visible');
            return;
        }

        const plan = PLANS[value];

        // Fade out → swap src → fade in
        upiQRCode.classList.add('fade');

        setTimeout(() => {
            upiQRCode.src             = plan.svg;
            upiQRCode.alt             = `QR Code for ${plan.name} — ${plan.label}`;
            upiQRCode.style.display   = 'block';
            qrPlaceholder.style.display = 'none';
            upiQRCode.classList.remove('fade');
        }, 250);

        // Amount badge
        selectedAmountText.textContent = `${plan.label} — ${plan.name}`;
        selectedAmountBadge.classList.add('visible');

        // Plan info tag
        planInfoText.textContent = `You selected the ${plan.name} (${plan.label}). Please scan the QR above and pay exactly this amount.`;
        planInfoTag.classList.add('visible');
    });

    // ─── AUTO-FORMAT TRANSACTION ID ───────────────────────────────────────────
    transactionIdInput.addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/\s/g, '');
    });

    // ─── PHONE INPUT ──────────────────────────────────────────────────────────
    phoneInput.addEventListener('input', function () {
        if (!this.readOnly) {
            this.value = this.value.replace(/[^\d+\-\s]/g, '');
        }
    });

    // ─── NORMALIZE PHONE ─────────────────────────────────────────────────────
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

    // ─── PHONE VALIDATION ─────────────────────────────────────────────────────
    function validatePhone() {
        const raw     = phoneInput.value.trim();
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
        el.textContent    = msg;
        el.style.display  = 'block';
    }

    function clearFieldError(el) {
        if (!el) return;
        el.textContent    = '';
        el.style.display  = 'none';
    }

    phoneInput.addEventListener('blur', function () {
        if (this.readOnly) return;
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
        formMessage.className   = 'message';

        let isValid = true;

        // Full Name
        const fullName      = document.getElementById('fullName').value.trim();
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

        // Payment Amount  ← NEW validation
        const selectedAmount = amountSelect.value;
        if (!selectedAmount || !PLANS[selectedAmount]) {
            amountError.style.display = 'block';
            amountError.textContent   = 'Please select a payment plan';
            isValid = false;
        } else {
            amountError.style.display = 'none';
        }

        // Transaction ID
        const txnVal     = transactionIdInput.value.trim();
        const txnError   = document.getElementById('transactionIdError');
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

        const plan = PLANS[selectedAmount];

        try {
            submitBtn.disabled   = true;
            submitBtn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            showMessage('Processing payment verification… Please wait.', 'info');

            const paymentData = {
                action         : 'savePayment',
                fullName       : fullName,
                phone          : normalizedPhone,
                transactionId  : txnVal.toUpperCase(),
                paymentMethod  : 'UPI',
                upiId          : 'shsbrandgroup@oksbi',

                // ── NEW fields sent to Google Sheets ──
                paymentAmount  : selectedAmount,          // e.g. "5000"
                paymentPlan    : plan.name,               // e.g. "Standard Plan"
                paymentCategory: `${plan.name} (${plan.label})`, // e.g. "Standard Plan (₹5,000)"

                paymentStatus  : 'Pending',
                approvalStatus : 'Waiting for Admin',
                timestamp      : new Date().toISOString(),
                dateSubmitted  : new Date().toLocaleDateString('en-IN')
            };

            console.log('📤 Sending payment data:', { ...paymentData });

            const response = await fetch(API_URL, {
                method : 'POST',
                body   : JSON.stringify(paymentData)
            });

            const result = await response.json();
            console.log('📥 Backend response:', result);

            if (result.success) {
                showMessage(
                    `✅ Payment submitted successfully!\n\nPlan: ${plan.name} (${plan.label})\nTransaction ID: ${paymentData.transactionId}\n\nPlease wait for admin approval (up to 24 hours). Redirecting to login…`,
                    'success'
                );

                sessionStorage.setItem('pendingPaymentPhone', normalizedPhone);
                sessionStorage.setItem('pendingPaymentTxnId', paymentData.transactionId);
                sessionStorage.setItem('pendingPaymentPlan',  plan.name);
                sessionStorage.removeItem('reg_mobile');
                sessionStorage.removeItem('reg_fullName');
                sessionStorage.removeItem('reg_referralId');
                sessionStorage.removeItem('reg_userId');

                form.reset();
                // Reset QR area after form reset
                upiQRCode.style.display      = 'none';
                qrPlaceholder.style.display  = 'flex';
                selectedAmountBadge.classList.remove('visible');
                planInfoTag.classList.remove('visible');

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 5000);

            } else {
                showMessage(`❌ ${result.message || 'Payment submission failed. Please try again.'}`, 'error');
                submitBtn.disabled  = false;
                submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Submit &amp; Verify Payment';
            }

        } catch (error) {
            console.error('❌ Fetch error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
            submitBtn.disabled  = false;
            submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Submit &amp; Verify Payment';
        }
    });

    // ─── SHOW MESSAGE ─────────────────────────────────────────────────────────
    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className   = `message ${type}`;
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ─── COPY UPI ID ─────────────────────────────────────────────────────────
    const upiIDElement = document.querySelector('.upi-id');
    if (upiIDElement) {
        upiIDElement.style.cursor = 'pointer';
        upiIDElement.title        = 'Click to copy UPI ID';
        upiIDElement.addEventListener('click', () => {
            navigator.clipboard.writeText('shsbrandgroup@oksbi')
                .then(() => showMessage('✓ UPI ID copied to clipboard!', 'success'))
                .catch(() => showMessage('UPI ID: shsbrandgroup@oksbi (copy manually)', 'info'));
        });
    }

});
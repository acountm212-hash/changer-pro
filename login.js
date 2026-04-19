// Firebase login function import kar rahe hain (Google aur Reset wala bhi)
import { loginUser, signInWithGoogle, resetPassword } from './firebase.js';

// =========================================
// 1. Password Visibility Toggle (DIRECT & FIXED) 🔥
// =========================================
const eyeToggleBtn = document.getElementById('eyeToggle');
const passwordInput = document.getElementById('password');

if (eyeToggleBtn && passwordInput) {
    eyeToggleBtn.addEventListener('click', function(e) {
        e.preventDefault(); // Default behavior roko
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeToggleBtn.innerHTML = '🙈'; // Eye closed
        } else {
            passwordInput.type = 'password';
            eyeToggleBtn.innerHTML = '👁️'; // Eye open
        }
    });
}

// =========================================
// 2. 2D DRAGON LAYERED MOUSE TRACKING
// =========================================
const dragonTracker = document.getElementById('dragonTracker');
if (dragonTracker) {
    document.addEventListener('mousemove', (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        const moveX = mouseX / 25; 
        const moveY = mouseY / 25;
        const rotateDeg = mouseX / 80;
        dragonTracker.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotateDeg}deg)`;
    });
    document.addEventListener('mouseleave', () => {
        dragonTracker.style.transform = `translate(0px, 0px) rotate(0deg)`;
    });
}

// =========================================
// 3. ENHANCED THUNDER / ELECTRICITY FLASH
// =========================================
const lightningFlash = document.getElementById('lightningFlash');
function randomLightning() {
    const randomTime = Math.random() * 6000 + 4000;
    setTimeout(() => {
        if(lightningFlash) {
            lightningFlash.style.opacity = '1';
            setTimeout(() => lightningFlash.style.opacity = '0.3', 50);
            setTimeout(() => lightningFlash.style.opacity = '1', 100);
            setTimeout(() => lightningFlash.style.opacity = '0.1', 180);
            setTimeout(() => lightningFlash.style.opacity = '1', 220);
            setTimeout(() => lightningFlash.style.opacity = '0', 280);
        }
        randomLightning();
    }, randomTime);
}
if (lightningFlash) randomLightning();

// =========================================
// 4. FIREBASE CONNECTED FORM SUBMISSION (EMAIL/PASS)
// =========================================
const loginForm = document.getElementById('loginForm');
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        
        loginBtn.innerHTML = 'Connecting <span class="arrow">⚡</span>';
        loginBtn.style.opacity = '0.9';
        loginBtn.style.pointerEvents = 'none'; 
        
        loginUser(email, password).then((user) => {
            if (user) {
                loginBtn.innerHTML = 'Access Granted ✔️';
                loginBtn.style.background = '#10b981'; 
                loginBtn.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.5)';
                setTimeout(() => { window.location.href = 'index.html'; }, 1000);
            } else {
                loginBtn.innerHTML = originalText;
                loginBtn.style.background = '';
                loginBtn.style.boxShadow = '';
                loginBtn.style.pointerEvents = 'auto';
            }
        });
    });
}

// =========================================
// 5. GOOGLE SIGN-IN BUTTON EVENT
// =========================================
const googleBtn = document.querySelector('.social-login .btn-secondary');
if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const originalText = googleBtn.innerHTML; // Store original text here
        googleBtn.innerHTML = 'Connecting Google... ⏳';
        
        signInWithGoogle().then((user) => {
            if(user) {
                // Login successful with Google
                window.location.href = 'index.html'; 
            } else {
                googleBtn.innerHTML = originalText; // Use stored original text
            }
        });
    });
}

// =========================================
// 6. Button Haptic Pop Effects
// =========================================
document.addEventListener('mousedown', function(e) {
    const btn = e.target.closest('.interactive, .eye-toggle');
    if (btn) {
        btn.classList.remove('pop-effect');
        void btn.offsetWidth; 
        btn.classList.add('pop-effect');
    }
});

// =========================================
// 7. FORGOT PASSWORD LOGIC 🔥
// =========================================
const forgotPassBtn = document.querySelector('.forgot-pass');

if (forgotPassBtn) {
    forgotPassBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Stop the link from jumping the page
        
        // Ask for email via browser prompt
        const emailToReset = prompt("Enter your registered email address to reset password:");
        
        if (emailToReset && emailToReset.trim() !== "") {
            forgotPassBtn.innerText = 'Sending Link... ⏳';
            forgotPassBtn.style.pointerEvents = 'none';
            
            resetPassword(emailToReset).then((success) => {
                if (success) {
                    alert("A password reset link has been sent. Check your inbox (and spam folder).");
                }
                forgotPassBtn.innerText = 'Forgot Password?';
                forgotPassBtn.style.pointerEvents = 'auto';
            });
        } else if (emailToReset !== null) {
            // Null means user clicked cancel, so we only alert if they left it blank
            alert("Email address cannot be empty.");
        }
    });
}
import { auth, onAuthStateChanged, logoutUser } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // 1. FIREBASE AUTH GUARD (Verification)
    // =========================================
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // User login nahi hai, login page par bhej do
            window.location.href = 'login.html';
        } else {
            // Login wale ko welcome karo
            console.log("Welcome Editor:", user.email);
            const userDisplay = document.getElementById('editorUserDisplay');
            if(userDisplay) {
                // User ki email ka pehla part display karenge (jaise arun)
                userDisplay.textContent = "Hi, " + user.email.split('@')[0];
            }
        }
    });

    // Editor se Logout button ka logic
    const logoutBtn = document.getElementById('editorLogoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutUser();
        });
    }

    // =========================================
    // 2. LIQUID UI ANIMATIONS (Pop & Hover)
    // =========================================
    const interactives = document.querySelectorAll('.interactive');
    
    interactives.forEach(el => {
        // Trigger on Mouse Down / Touch Start (Pakka click hone par)
        const triggerPop = function() {
            this.classList.remove('pop-effect');
            void this.offsetWidth; // Reflow to reset animation
            this.classList.add('pop-effect');
        };

        el.addEventListener('mousedown', triggerPop);
        el.addEventListener('touchstart', triggerPop, {passive: true});
        
        // Hover Scale effect for standard buttons
        el.addEventListener('mouseenter', function() {
            if(!this.classList.contains('upload-label') && !this.classList.contains('toggle-switch')) {
               this.style.transform = "scale(1.05)";
               this.style.transition = "transform 0.2s ease";
            }
        });
        el.addEventListener('mouseleave', function() {
            if(!this.classList.contains('upload-label') && !this.classList.contains('toggle-switch')) {
               this.style.transform = "scale(1)";
            }
        });
    });
});
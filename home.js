// Firebase Imports at the top
import { auth, onAuthStateChanged, logoutUser } from './firebase.js';

let isUserLoggedIn = false; // User check karne ke liye variable

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // 0. FIREBASE AUTH LOGIC & BUTTON CLICKS (NEW)
    // =========================================
    const loginBtnNav = document.getElementById('loginBtnNav');
    const signupBtnNav = document.getElementById('signupBtnNav');
    const logoutBtnNav = document.getElementById('logoutBtnNav');
    const startEditingBtn = document.getElementById('startEditingBtn');

    // User Login hai ya nahi, background me check ho raha hai
    onAuthStateChanged(auth, (user) => {
        if (user) {
            isUserLoggedIn = true;
            if(loginBtnNav) loginBtnNav.style.display = 'none';
            if(signupBtnNav) signupBtnNav.style.display = 'none';
            if(logoutBtnNav) logoutBtnNav.style.display = 'inline-block';
        } else {
            isUserLoggedIn = false;
            if(loginBtnNav) loginBtnNav.style.display = 'inline-block';
            if(signupBtnNav) signupBtnNav.style.display = 'inline-block';
            if(logoutBtnNav) logoutBtnNav.style.display = 'none';
        }
    });

    // Start Editing Now logic
    if (startEditingBtn) {
        startEditingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isUserLoggedIn) {
                window.location.href = 'editor.html'; // Login hai toh editor kholo
            } else {
                window.location.href = 'login.html'; // Login nahi hai toh login kholo
            }
        });
    }

    // Logout logic
    if (logoutBtnNav) {
        logoutBtnNav.addEventListener('click', () => {
            logoutUser();
        });
    }


    // =========================================
    // 1. Sliding Panel Logic (Untouched)
    // =========================================
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const slidePanel = document.getElementById('slidePanel');
    const closePanelBtn = document.getElementById('closePanelBtn');

    function toggleSlideMenu() {
        if(slidePanel) slidePanel.classList.toggle('active');
    }

    if(menuToggleBtn) menuToggleBtn.addEventListener('click', toggleSlideMenu);
    if(closePanelBtn) closePanelBtn.addEventListener('click', toggleSlideMenu);

    window.addEventListener('click', (event) => {
        if (slidePanel && slidePanel.classList.contains('active')) {
            if (!slidePanel.contains(event.target) && !menuToggleBtn.contains(event.target)) {
                slidePanel.classList.remove('active');
            }
        }
    });

    // =========================================
    // 2. Global "Pop" Animation Injection (Untouched)
    // =========================================
    const interactives = document.querySelectorAll('.interactive');
    
    interactives.forEach(el => {
        // Trigger on Mouse Down / Touch Start
        const triggerPop = function() {
            this.classList.remove('pop-effect');
            void this.offsetWidth; // Force browser reflow to restart animation
            this.classList.add('pop-effect');
        };

        el.addEventListener('mousedown', triggerPop);
        el.addEventListener('touchstart', triggerPop, {passive: true});
        
        // Also add a nice hover scale for buttons and general interactive elements
        // (feature-card is excluded here because we gave it a dedicated CSS hover animation now)
        el.addEventListener('mouseenter', function() {
            if(!this.classList.contains('feature-card') && !this.classList.contains('rotating-element')) {
               this.style.transform = "scale(1.05)";
               this.style.transition = "transform 0.2s ease";
            }
        });
        el.addEventListener('mouseleave', function() {
            if(!this.classList.contains('feature-card') && !this.classList.contains('rotating-element')) {
               this.style.transform = "scale(1)";
            }
        });
    });

    // =========================================
    // 3. Crash-Proof 360° Mouse Rotation (Untouched)
    // =========================================
    const visualBox = document.getElementById('visualBox');
    const rotatingElement = document.getElementById('rotatingElement');

    if (visualBox && rotatingElement) {
        
        const perspectiveDepth = 1500; 
        const maxRotation = 25; // Safe rotation limit to prevent Safari/Mobile crash

        function handleMouseRotate(e) {
            const boxRect = visualBox.getBoundingClientRect();
            
            // True center point of the fixed box
            const centerX = boxRect.left + (boxRect.width / 2);
            const centerY = boxRect.top + (boxRect.height / 2);
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            // Math for rotation
            const percentX = mouseX / (boxRect.width / 2);
            const percentY = mouseY / (boxRect.height / 2);
            
            const rotateY = percentX * maxRotation;
            const rotateX = -(percentY * maxRotation); 

            // Apply style dynamically
            rotatingElement.style.transform = `perspective(${perspectiveDepth}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }

        // Fast response when active
        visualBox.addEventListener('mouseenter', () => {
            rotatingElement.style.transition = "transform 0.1s linear";
        });

        visualBox.addEventListener('mousemove', handleMouseRotate);
        
        // Smooth return to center
        visualBox.addEventListener('mouseleave', () => {
            rotatingElement.style.transition = "transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; // Springy return
            rotatingElement.style.transform = `perspective(${perspectiveDepth}px) rotateX(0deg) rotateY(0deg)`;
        });
    }
});
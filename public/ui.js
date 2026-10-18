// ==========================================
// ui.js - Handles all visual updates & Modal logic
// ==========================================

// 1. Select all the DOM Elements
const loginModal = document.getElementById('login-modal');
const authBtn = document.getElementById('auth-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const toggleAuthMode = document.getElementById('toggle-auth-mode');
const togglePrompt = document.getElementById('toggle-prompt');
const nameInputs = document.getElementById('name-inputs');
const authUi = document.getElementById('auth-ui');
const successUi = document.getElementById('success-ui');
const successMsgText = document.getElementById('success-message-text');
const successCloseBtn = document.getElementById('success-close-btn');
const signupExtras = document.getElementById('signup-extras');
const passwordInput = document.getElementById('password-input');
const confirmPasswordInput = document.getElementById('confirm-password-input');
const strengthLabel = document.getElementById('strength-label');
const strengthBarFill = document.getElementById('strength-bar-fill');
const reqLength = document.getElementById('req-length');
const reqComplex = document.getElementById('req-complex');
const reqCase = document.getElementById('req-case'); 

// 2. Manage UI State
let isLoginMode = true; 
let isPasswordValid = false;

// 3. UI Functions
function resetModalUi() {
    loginForm.reset();
    
    const allFormElements = loginForm.querySelectorAll('input, button');
    allFormElements.forEach(el => el.disabled = false);
    modalSubmitBtn.innerText = isLoginMode ? "Log In" : "Create Account";
    modalSubmitBtn.style.opacity = "1";
    modalSubmitBtn.style.cursor = "pointer";
    
    authUi.style.display = 'block';
    successUi.style.display = 'none';
    loginError.style.display = 'none';
    
    strengthBarFill.style.width = "0%";
    reqLength.classList.remove('req-met');
    reqComplex.classList.remove('req-met');
    if(reqCase) reqCase.classList.remove('req-met');
    
    strengthLabel.innerText = "Weak";
    strengthLabel.style.color = "var(--text-muted)";
    strengthBarFill.style.backgroundColor = "#f97316";
    
    confirmPasswordInput.style.display = 'none';
    isPasswordValid = false;
}

function showSuccessState(isSignup = false) {
    loginError.style.display = 'none';
    authUi.style.display = 'none';
    successUi.style.display = 'flex';
    
    if (isSignup) {
        successMsgText.innerHTML = "Thanks for creating an account! 🎉<br><br>A verification link has been sent to your email.<br><br><span style='color: var(--primary); font-weight: 900;'>Please check your inbox AND your spam folder!</span>";
    } else {
        successMsgText.innerHTML = "You have successfully logged in!";
        setTimeout(() => {
            loginModal.style.display = 'none';
            setTimeout(resetModalUi, 300);
        }, 1500);
    }
}

function showError(msg) {
    loginError.innerText = msg;
    loginError.style.display = 'block';
    
    const card = loginModal.querySelector('.form-card');
    card.style.transform = 'translateX(10px)';
    setTimeout(() => card.style.transform = 'translateX(-10px)', 100);
    setTimeout(() => card.style.transform = 'translateX(0)', 200);
}

// 4. UI Event Listeners
closeModalBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    setTimeout(resetModalUi, 300); 
});

successCloseBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    setTimeout(resetModalUi, 300);
});

toggleAuthMode.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode; 
    resetModalUi(); 
    
    if (isLoginMode) {
        modalTitle.innerText = "Log In";
        modalSubtitle.innerText = "Sign in to sync your jobs across devices.";
        modalSubmitBtn.innerText = "Log In";
        togglePrompt.innerText = "Don't have an account?";
        toggleAuthMode.innerText = "Sign Up";
        nameInputs.style.display = 'none';
        signupExtras.style.display = 'none';
    } else {
        modalTitle.innerText = "Sign Up";
        modalSubtitle.innerText = "Create an account to start syncing.";
        modalSubmitBtn.innerText = "Create Account";
        togglePrompt.innerText = "Already have an account?";
        toggleAuthMode.innerText = "Log In";
        nameInputs.style.display = 'flex';
        signupExtras.style.display = 'flex';
    }
});

passwordInput.addEventListener('input', (e) => {
    if (isLoginMode) return; 
    
    const pass = e.target.value;
    let score = 0;
    
    if (pass.length >= 6 && pass.length <= 64) {
        reqLength.classList.add('req-met'); score += 1;
    } else { reqLength.classList.remove('req-met'); }
    
    if (/[^a-zA-Z\s]/.test(pass)) {
        reqComplex.classList.add('req-met'); score += 1;
    } else { reqComplex.classList.remove('req-met'); }

    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) {
        if(reqCase) reqCase.classList.add('req-met'); score += 1;
    } else { if(reqCase) reqCase.classList.remove('req-met'); }
    
    if (score === 0 || pass.length === 0) {
        strengthLabel.innerText = "Weak";
        strengthLabel.style.color = "var(--text-muted)";
        strengthBarFill.style.width = pass.length > 0 ? "20%" : "0%";
        strengthBarFill.style.backgroundColor = "#f97316"; 
        isPasswordValid = false;
        confirmPasswordInput.style.display = 'none'; 
        confirmPasswordInput.value = '';             
    } else if (score === 1) {
        strengthLabel.innerText = "Weak";
        strengthLabel.style.color = "var(--text-main)";
        strengthBarFill.style.width = "40%";
        strengthBarFill.style.backgroundColor = "#f97316"; 
        isPasswordValid = false;
        confirmPasswordInput.style.display = 'none'; 
        confirmPasswordInput.value = '';             
    } else if (score === 2) {
        strengthLabel.innerText = "Fair";
        strengthLabel.style.color = "var(--text-main)";
        strengthBarFill.style.width = "70%";
        strengthBarFill.style.backgroundColor = "#eab308"; 
        isPasswordValid = false;
        confirmPasswordInput.style.display = 'none'; 
        confirmPasswordInput.value = '';             
    } else if (score === 3) {
        strengthLabel.innerText = "Strong";
        strengthLabel.style.color = "var(--status-offer)";
        strengthBarFill.style.width = "100%";
        strengthBarFill.style.backgroundColor = "var(--status-offer)"; 
        isPasswordValid = true;
        confirmPasswordInput.style.display = 'block'; 
    }
});

// 5. EXPORT what main.js needs!
export { 
    loginModal, authBtn, loginForm, modalSubmitBtn, passwordInput, confirmPasswordInput, 
    isLoginMode, isPasswordValid, showSuccessState, showError 
};
// ==========================================
// auth.js - Handles User Login & Registration
// ==========================================
import { auth, db } from './config.js'; 
import { 
    loginForm, modalSubmitBtn, passwordInput, confirmPasswordInput, 
    isLoginMode, isPasswordValid, showSuccessState, showError 
} from './ui.js';

// Submit Form (Firebase logic)
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide old errors visually
    document.getElementById('login-error').style.display = 'none'; 
    
    const email = document.getElementById('email-input').value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const firstName = document.getElementById('first-name-input').value.trim();
    const lastName = document.getElementById('last-name-input').value.trim();
    
    const bannedDomains = [ "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com" ];
    const emailParts = email.split('@');
    const emailDomain = emailParts.length > 1 ? emailParts[1].toLowerCase() : "";
    
    // Check validation based on login vs signup mode
    if (!isLoginMode) {
        if (!firstName) return showError("Please enter your First Name.");
        if (!lastName) return showError("Please enter your Last Name.");
        if (!isPasswordValid) return showError("Please meet all password requirements.");
        if (password !== confirmPassword) return showError("Passwords do not match.");
        if (bannedDomains.includes(emailDomain)) return showError("Please use a real email address.");
    }
    if (!email) return showError("Email Address cannot be empty.");
    if (!password) return showError("Please enter your Password.");
    
    // Lock inputs visually
    const allFormElements = loginForm.querySelectorAll('input, button');
    allFormElements.forEach(el => el.disabled = true);
    const originalBtnText = modalSubmitBtn.innerText;
    modalSubmitBtn.innerText = "Processing...";
    modalSubmitBtn.style.opacity = "0.7";
    modalSubmitBtn.style.cursor = "not-allowed";

    try {
        if (isLoginMode) {
            // LOGIN LOGIC
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            if (!userCredential.user.emailVerified) {
                await auth.signOut();
                throw new Error("Please check your email and verify your account before logging in.");
            }
            showSuccessState(false); 
        } else {
            // SIGNUP LOGIC
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save user data to Firestore
            user.updateProfile({ displayName: `${firstName} ${lastName}` }).catch(console.warn);
            db.collection('users').doc(user.uid).set({
                firstName: firstName,
                lastName: lastName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(console.warn);
            
            // --- THE DEVELOPER OVERRIDE ---
            // Force Firebase to use your custom verify.html page
            const actionCodeSettings = {
                url: 'https://job-tracker-project-c4e87.web.app/verify.html',
                handleCodeInApp: true 
            };
            
            await user.sendEmailVerification(actionCodeSettings);
            // ------------------------------

            await auth.signOut();
            showSuccessState(true); 
        }
    } catch (error) {
        if (error.code === 'auth/invalid-email') showError("Please enter a valid email address.");
        else if (error.code === 'auth/email-already-in-use') showError("An account with this email already exists.");
        else if (error.code === 'auth/weak-password') showError("Your password is too weak.");
        else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') showError("Invalid email or password.");
        else showError(error.message); 
    } finally {
        // Always unlock inputs when finished
        allFormElements.forEach(el => el.disabled = false);
        modalSubmitBtn.innerText = originalBtnText;
        modalSubmitBtn.style.opacity = "1";
        modalSubmitBtn.style.cursor = "pointer";
    }
});
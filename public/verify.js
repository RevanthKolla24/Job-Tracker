// ==========================================
// verify.js - Handles Email Verification Link
// ==========================================
import { auth } from './config.js'; 
import './theme.js'; 

const titleText = document.getElementById('verify-title');
const messageText = document.getElementById('verify-message');
const returnBtn = document.getElementById('return-btn');

// Extract the secret code from the URL bar
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const actionCode = urlParams.get('oobCode');

if (mode === 'verifyEmail' && actionCode) {
    
    auth.applyActionCode(actionCode)
        .then(() => {
            titleText.innerText = "Success! 🎉";
            titleText.style.color = "var(--status-offer)";
            messageText.innerText = "Your email has been successfully verified. You can now log in to your account.";
            returnBtn.style.display = 'block';
        })
        .catch((error) => {
            titleText.innerText = "Link Expired ❌";
            titleText.style.color = "var(--status-rejected)";
            messageText.innerText = "This link is invalid or has already been used. Please try logging in or signing up again.";
            returnBtn.style.display = 'block';
            console.error("Verification Error:", error);
        });
        
} else {
    titleText.innerText = "Invalid Link";
    titleText.style.color = "var(--status-rejected)";
    messageText.innerText = "No verification code was found. Please click the link directly from your email.";
    returnBtn.style.display = 'block';
}
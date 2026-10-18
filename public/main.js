// ==========================================
// main.js - The Core Application Manager
// ==========================================

// 1. IMPORT MODULES
import { auth, db } from './config.js'; 
import './theme.js'; 
import { loginModal, authBtn } from './ui.js';
import './auth.js'; 
import { handleAuthStateChange, saveNewJob } from './jobs.js'; 

// ==========================================
// 2. GLOBAL EVENT LISTENERS & AUTH STATE
// ==========================================

auth.onAuthStateChanged(async (user) => {
    const isValidUser = user && user.emailVerified;

    if (isValidUser) {
        const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Account';
        authBtn.innerText = `Log Out (${firstName})`;
        document.getElementById('settings-fab').style.display = 'flex'; 
        
        // Check if the user is an Admin
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                document.getElementById('admin-dashboard-btn').style.display = 'block';
            }
        } catch (error) {
            console.log("Not an admin or error checking role.");
        }

    } else {
        authBtn.innerText = "Log In / Sign Up";
        document.getElementById('settings-fab').style.display = 'none'; 
        document.getElementById('admin-dashboard-btn').style.display = 'none';
        
        document.getElementById('settings-page').style.display = 'none';
        document.getElementById('admin-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    }

    handleAuthStateChange(isValidUser ? user : null);
});

authBtn.addEventListener('click', () => {
    if (auth.currentUser) {
        auth.signOut(); 
    } else {
        loginModal.style.display = 'flex'; 
    }
});


// ==========================================
// 3. JOB FORM VALIDATION & SUBMISSION
// ==========================================

const addJobForm = document.getElementById('job-form'); 
const companyInput = document.getElementById('company');
const jobTitleInput = document.getElementById('title');
const formErrorMessage = document.getElementById('job-form-error');

if (addJobForm) {
    addJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        jobTitleInput.classList.remove('input-error');
        companyInput.classList.remove('input-error');
        if (formErrorMessage) formErrorMessage.style.display = 'none';

        const companyValue = companyInput.value.trim();
        const titleValue = jobTitleInput.value.trim();
        const statusValue = document.getElementById('status').value;

        if (!companyValue) return showFieldError(companyInput, "Please enter a Company Name.");
        if (!titleValue) return showFieldError(jobTitleInput, "Please enter a Job Title.");

        try {
            await saveNewJob(companyValue, titleValue, statusValue);
            
            companyInput.value = '';
            jobTitleInput.value = '';
            document.getElementById('status').value = 'Applied';
            
        } catch (error) {
            console.error("Error saving job:", error);
            if (formErrorMessage) {
                formErrorMessage.innerText = "Error saving job. Please try again.";
                formErrorMessage.style.display = 'block';
            }
        }
    });

    function showFieldError(inputElement, message) {
        inputElement.classList.remove('input-error');
        void inputElement.offsetWidth; 
        
        inputElement.classList.add('input-error');
        inputElement.focus();
        
        if (formErrorMessage) {
            formErrorMessage.innerText = message;
            formErrorMessage.style.display = 'block';
        }
    }

    [jobTitleInput, companyInput].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
            if (formErrorMessage) formErrorMessage.style.display = 'none';
        });
    });
}

// ==========================================
// 4. SETTINGS PAGE LOGIC (SPA ROUTING)
// ==========================================
const dashboard = document.getElementById('dashboard');
const settingsPage = document.getElementById('settings-page');
const settingsFab = document.getElementById('settings-fab');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

const settingsForm = document.getElementById('settings-form');
const updateNameInput = document.getElementById('update-name-input');
const readOnlyEmail = document.getElementById('read-only-email');
const settingsError = document.getElementById('settings-form-error');
const settingsSuccess = document.getElementById('settings-success-msg');
const settingsSubmitBtn = document.getElementById('settings-submit-btn');

if (settingsFab && backToDashboardBtn) {
    settingsFab.addEventListener('click', () => {
        dashboard.style.display = 'none';
        settingsPage.style.display = 'block';
        
        if (auth.currentUser) {
            updateNameInput.value = auth.currentUser.displayName || '';
            readOnlyEmail.value = auth.currentUser.email || '';
        }
        
        settingsError.style.display = 'none';
        settingsSuccess.style.display = 'none';
        updateNameInput.classList.remove('input-error');
    });

    backToDashboardBtn.addEventListener('click', () => {
        settingsPage.style.display = 'none';
        dashboard.style.display = 'block';
    });
}

if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = updateNameInput.value.trim();

        if (!newName) {
            updateNameInput.classList.remove('input-error');
            void updateNameInput.offsetWidth;
            updateNameInput.classList.add('input-error');
            settingsError.innerText = "Name cannot be empty.";
            settingsError.style.display = 'block';
            return;
        }

        try {
            settingsSubmitBtn.innerText = "Saving...";
            settingsSubmitBtn.disabled = true;

            await auth.currentUser.updateProfile({ displayName: newName });
            auth.updateCurrentUser(auth.currentUser); 
            
            settingsSubmitBtn.innerText = "Save Changes";
            settingsSubmitBtn.disabled = false;
            settingsSuccess.innerText = "Profile Updated!";
            settingsSuccess.style.display = 'block';
            
            setTimeout(() => settingsSuccess.style.display = 'none', 3000);

        } catch (error) {
            settingsSubmitBtn.innerText = "Save Changes";
            settingsSubmitBtn.disabled = false;
            settingsError.innerText = "Error updating profile. Try again.";
            settingsError.style.display = 'block';
        }
    });
}


// ==========================================
// 5. ACCOUNT SECURITY (EMAIL & PASSWORD)
// ==========================================
const emailForm = document.getElementById('settings-email-form');
const emailInput = document.getElementById('update-email-input');
const currentPasswordEmailInput = document.getElementById('current-password-email-input');
const emailError = document.getElementById('email-error-msg');
const emailSuccess = document.getElementById('email-success-msg');
const emailBtn = document.getElementById('update-email-btn');

const passwordForm = document.getElementById('settings-password-form');
const currentPasswordInput = document.getElementById('current-password-input');
const passwordInput = document.getElementById('update-password-input');
const confirmPasswordInput = document.getElementById('update-confirm-password-input');
const passwordError = document.getElementById('password-error-msg');
const passwordSuccess = document.getElementById('password-success-msg');
const passwordBtn = document.getElementById('update-password-btn');

const settingsStrengthLabel = document.getElementById('settings-strength-label');
const settingsStrengthBarFill = document.getElementById('settings-strength-bar-fill');
const settingsReqLength = document.getElementById('settings-req-length');
const settingsReqComplex = document.getElementById('settings-req-complex');
const settingsReqCase = document.getElementById('settings-req-case'); 

function showSettingsSecurityError(errorElement, inputElement, message) {
    if (inputElement) {
        inputElement.classList.remove('input-error');
        void inputElement.offsetWidth; 
        inputElement.classList.add('input-error');
    }
    errorElement.innerText = message;
    errorElement.style.display = 'block';
}

[emailInput, currentPasswordEmailInput, currentPasswordInput, passwordInput, confirmPasswordInput].forEach(input => {
    if (input) {
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
            if (emailError) emailError.style.display = 'none';
            if (passwordError) passwordError.style.display = 'none';
        });
    }
});

// Core Re-Authentication Function
async function reauthenticateUser(currentPassword) {
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
}

// Handle Email Update
if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPass = currentPasswordEmailInput.value;
        const newEmail = emailInput.value.trim();

        if (!currentPass) return showSettingsSecurityError(emailError, currentPasswordEmailInput, "Please enter your current password.");
        if (!newEmail || !newEmail.includes('@')) return showSettingsSecurityError(emailError, emailInput, "Please enter a valid email address.");

        try {
            emailBtn.disabled = true;
            emailBtn.innerText = "Updating...";
            
            await reauthenticateUser(currentPass);
            await auth.currentUser.updateEmail(newEmail);
            
            const readOnlyEmail = document.getElementById('read-only-email');
            if(readOnlyEmail) readOnlyEmail.value = newEmail;
            
            emailSuccess.innerText = "Email Updated Successfully!";
            emailSuccess.style.display = 'block';
            
            emailInput.value = '';
            currentPasswordEmailInput.value = '';
            
            setTimeout(() => emailSuccess.style.display = 'none', 4000);
            
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                showSettingsSecurityError(emailError, currentPasswordEmailInput, "Incorrect current password.");
            } else if (error.code === 'auth/email-already-in-use') {
                showSettingsSecurityError(emailError, emailInput, "This email is already registered to another account.");
            } else {
                showSettingsSecurityError(emailError, null, error.message);
            }
        } finally {
            emailBtn.disabled = false;
            emailBtn.innerText = "Update Email";
        }
    });
}

// Handle Password Strength Real-Time Check
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        let score = 0;

        if (val.length >= 6 && val.length <= 64) {
            settingsReqLength.classList.add('req-met');
            score++;
        } else {
            settingsReqLength.classList.remove('req-met');
        }

        if (/[0-9!@#$%^*-_+=]/.test(val)) {
            settingsReqComplex.classList.add('req-met');
            score++;
        } else {
            settingsReqComplex.classList.remove('req-met');
        }

        if (/[a-z]/.test(val) && /[A-Z]/.test(val)) {
            settingsReqCase.classList.add('req-met');
            score++;
        } else {
            settingsReqCase.classList.remove('req-met');
        }

        if (val.length === 0) {
            settingsStrengthBarFill.style.width = '0%';
            settingsStrengthLabel.innerText = 'Weak';
        } else if (score <= 1) {
            settingsStrengthBarFill.style.width = '33%';
            settingsStrengthBarFill.style.backgroundColor = '#ff3b30'; 
            settingsStrengthLabel.innerText = 'Weak';
        } else if (score === 2) {
            settingsStrengthBarFill.style.width = '66%';
            settingsStrengthBarFill.style.backgroundColor = '#EAB308'; 
            settingsStrengthLabel.innerText = 'Fair';
        } else if (score === 3) {
            settingsStrengthBarFill.style.width = '100%';
            settingsStrengthBarFill.style.backgroundColor = 'var(--status-offer)'; 
            settingsStrengthLabel.innerText = 'Strong';
        }
    });
}

// Handle Password Update Submit
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPass = currentPasswordInput.value;
        const newPass = passwordInput.value;
        const confirmPass = confirmPasswordInput.value;

        if (!currentPass) return showSettingsSecurityError(passwordError, currentPasswordInput, "Please enter your current password.");
        if (newPass.length < 6 || newPass.length > 64) return showSettingsSecurityError(passwordError, passwordInput, "Password must be 6-64 characters long.");
        if (!/[0-9!@#$%^*-_+=]/.test(newPass)) return showSettingsSecurityError(passwordError, passwordInput, "Password must contain a number or symbol.");
        if (!(/[a-z]/.test(newPass) && /[A-Z]/.test(newPass))) return showSettingsSecurityError(passwordError, passwordInput, "Password must contain both uppercase and lowercase letters.");
        
        if (newPass !== confirmPass) {
            confirmPasswordInput.classList.add('input-error');
            return showSettingsSecurityError(passwordError, passwordInput, "Passwords do not match.");
        }

        try {
            passwordBtn.disabled = true;
            passwordBtn.innerText = "Updating...";
            
            await reauthenticateUser(currentPass);
            await auth.currentUser.updatePassword(newPass);
            
            passwordSuccess.innerText = "Password Updated Successfully!";
            passwordSuccess.style.display = 'block';
            
            currentPasswordInput.value = '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';
            settingsStrengthBarFill.style.width = '0%';
            settingsStrengthLabel.innerText = 'Weak';
            settingsReqLength.classList.remove('req-met');
            settingsReqComplex.classList.remove('req-met');
            settingsReqCase.classList.remove('req-met'); 
            
            setTimeout(() => passwordSuccess.style.display = 'none', 4000);
            
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                showSettingsSecurityError(passwordError, currentPasswordInput, "Incorrect current password.");
            } else {
                showSettingsSecurityError(passwordError, null, error.message);
            }
        } finally {
            passwordBtn.disabled = false;
            passwordBtn.innerText = "Update Password";
        }
    });
}

// ==========================================
// 6. DANGER ZONE (DELETE ACCOUNT)
// ==========================================
const deleteForm = document.getElementById('delete-account-form');
const deletePasswordInput = document.getElementById('delete-password-input');
const deleteErrorMsg = document.getElementById('delete-error-msg');
const deleteBtn = document.getElementById('delete-account-btn');

if (deletePasswordInput) {
    deletePasswordInput.addEventListener('input', () => {
        deletePasswordInput.classList.remove('input-error');
        if (deleteErrorMsg) deleteErrorMsg.style.display = 'none';
    });
}

if (deleteForm) {
    deleteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPass = deletePasswordInput.value;
        if (!currentPass) return showSettingsSecurityError(deleteErrorMsg, deletePasswordInput, "Please enter your password to confirm deletion.");

        const confirmText = prompt("Type 'DELETE' to permanently erase your account and all saved jobs.");
        if (confirmText !== 'DELETE') return; 

        try {
            deleteBtn.disabled = true;
            deleteBtn.innerText = "Deleting...";
            
            await reauthenticateUser(currentPass);
            await auth.currentUser.delete();
            
            alert("Your account has been successfully deleted.");
            
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                showSettingsSecurityError(deleteErrorMsg, deletePasswordInput, "Incorrect password.");
            } else {
                showSettingsSecurityError(deleteErrorMsg, null, error.message);
            }
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.innerText = "Delete Account";
        }
    });
}

// ==========================================
// 7. ADMIN DASHBOARD LOGIC
// ==========================================
const adminDashboardBtn = document.getElementById('admin-dashboard-btn');
const adminPage = document.getElementById('admin-page');
const adminBackBtn = document.getElementById('admin-back-btn');
const adminJobList = document.getElementById('admin-job-list');

if (adminDashboardBtn) {
    adminDashboardBtn.addEventListener('click', async () => {
        document.getElementById('dashboard').style.display = 'none';
        adminPage.style.display = 'block';
        adminJobList.innerHTML = '<tr><td colspan="4">Loading all platform jobs...</td></tr>';

        try {
            // Fetch EVERY job from EVERY user using a collectionGroup query
            const snapshot = await db.collectionGroup('jobs').orderBy('createdAt', 'desc').get();
            adminJobList.innerHTML = '';
            
            if (snapshot.empty) {
                adminJobList.innerHTML = '<tr><td colspan="4">No jobs found on the platform yet.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const job = doc.data();
                const userId = doc.ref.parent.parent.id; 
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${userId}</td>
                    <td class="fw-medium">${job.company}</td>
                    <td>${job.title}</td>
                    <td><span class="status-${(job.status || 'applied').toLowerCase()}" style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; color: #000;">${job.status}</span></td>
                `;
                adminJobList.appendChild(tr);
            });

        } catch (error) {
            console.error("Admin Fetch Error:", error);
            adminJobList.innerHTML = `<tr><td colspan="4" style="color: red;">Error loading jobs. (Check browser console for the Index link!)</td></tr>`;
        }
    });

    adminBackBtn.addEventListener('click', () => {
        adminPage.style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    });
}
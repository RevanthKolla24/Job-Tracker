// ==========================================
// jobs.js - Handles the Hybrid Job Tracker
// ==========================================
import { db } from './config.js';

// 1. DOM Elements
const jobList = document.getElementById('job-list');
const dateInput = document.getElementById('apply-date');

// Initialize Calendar
const datePicker = flatpickr(dateInput, { defaultDate: "today", dateFormat: "M j, Y", disableMobile: true });

// 2. State Variables
let currentUser = null;
let unsubscribeJobs = null;
let localJobs = JSON.parse(localStorage.getItem('guest_jobs')) || [];

// 3. EXPORTED auth handler
export function handleAuthStateChange(user) {
    currentUser = user;
    if (user) {
        listenToFirebaseJobs();
    } else {
        if (unsubscribeJobs) {
            unsubscribeJobs();
            unsubscribeJobs = null;
        }
        renderLocalJobs();
    }
}

// 4. Core Job Logic
function saveLocalJobs() { 
    localStorage.setItem('guest_jobs', JSON.stringify(localJobs)); 
}

function renderLocalJobs() {
    jobList.innerHTML = ''; 
    localJobs.forEach(job => renderRow(job, job.id, false));
}

function listenToFirebaseJobs() {
    if (!currentUser) return;
    const userJobsRef = db.collection('users').doc(currentUser.uid).collection('jobs');
    unsubscribeJobs = userJobsRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        jobList.innerHTML = '';
        snapshot.forEach(doc => renderRow(doc.data(), doc.id, true));
    });
}

function renderRow(job, id, isFirebase) {
    const currentStatus = (job.status || 'Applied').toLowerCase();
    const statusClass = `status-${currentStatus}`;
    
    // Calculate Time Elapsed
    const appliedDate = new Date(job.date).getTime();
    const now = Date.now();
    const daysPassed = (now - appliedDate) / (1000 * 60 * 60 * 24);
    
    // 1. Show the Ghosted BUTTON only if 7 days passed AND it's stuck in limbo
    let ghostButtonHtml = '';
    if (daysPassed >= 7 && (currentStatus === 'applied' || currentStatus === 'interviewing')) {
        ghostButtonHtml = `<button class="ghost-btn" onclick="updateStatus('${id}', 'Ghosted', ${isFirebase})">Ghosted</button>`;
    }

    // 2. Show the Ghosted DROPDOWN option if it's already ghosted, 
    // OR if 7 days passed but the status is Offer/Rejected (the escape hatch!)
    let ghostOptionHtml = '';
    if (currentStatus === 'ghosted' || (daysPassed >= 7 && currentStatus !== 'applied' && currentStatus !== 'interviewing')) {
        ghostOptionHtml = `<option value="Ghosted" ${currentStatus === 'ghosted' ? 'selected' : ''}>Ghosted</option>`;
    }

    // Safely select the current dropdown option regardless of capitalization
    const isApplied = currentStatus === 'applied' ? 'selected' : '';
    const isInterviewing = currentStatus === 'interviewing' ? 'selected' : '';
    const isOffer = currentStatus === 'offer' ? 'selected' : '';
    const isRejected = currentStatus === 'rejected' ? 'selected' : '';

    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="fw-medium">${job.company}</td>
        <td>${job.title}</td>
        <td class="text-muted">${job.date}</td>
        <td>
            <select class="${statusClass}" onchange="updateStatus('${id}', this.value, ${isFirebase})">
                <option value="Applied" ${isApplied}>Applied</option>
                <option value="Interviewing" ${isInterviewing}>Interviewing</option>
                <option value="Offer" ${isOffer}>Offer</option>
                <option value="Rejected" ${isRejected}>Rejected</option>
                ${ghostOptionHtml}
            </select>
        </td>
        <td>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                ${ghostButtonHtml}
                <button class="delete-btn" onclick="deleteJob('${id}', ${isFirebase})">Remove</button>
            </div>
        </td>
    `;
    jobList.appendChild(row);
}
// ==========================================
// 5. EXPORTED Save Job Function 
// ==========================================
export async function saveNewJob(company, title, status) {
    let dateVal = dateInput.value;
    if (!dateVal) {
        dateVal = datePicker.formatDate(new Date(), "M j, Y");
    }
    
    const newJob = {
        company: company,
        title: title,
        status: status,
        date: dateVal,
        createdAt: currentUser ? firebase.firestore.FieldValue.serverTimestamp() : Date.now()
    };
    
    if (currentUser) {
        await db.collection('users').doc(currentUser.uid).collection('jobs').add(newJob);
    } else {
        newJob.id = Date.now().toString(); 
        localJobs.unshift(newJob); 
        saveLocalJobs();
        renderLocalJobs();
    }
}

// 6. Global Window Functions
window.deleteJob = function(id, isFirebase) {
    if (isFirebase) db.collection('users').doc(currentUser.uid).collection('jobs').doc(id).delete();
    else {
        localJobs = localJobs.filter(job => job.id !== id);
        saveLocalJobs();
        renderLocalJobs();
    }
}

window.updateStatus = function(id, newStatus, isFirebase) {
    if (isFirebase) db.collection('users').doc(currentUser.uid).collection('jobs').doc(id).update({ status: newStatus });
    else {
        const job = localJobs.find(job => job.id === id);
        if (job) job.status = newStatus;
        saveLocalJobs();
        renderLocalJobs();
    }
}
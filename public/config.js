// ==========================================
// config.js - Firebase Initialization
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyArx1pcI2Pz89TH6RFIUaoEjthQy241S0M",
    authDomain: "job-tracker-project-c4e87.firebaseapp.com",
    projectId: "job-tracker-project-c4e87",
    storageBucket: "job-tracker-project-c4e87.firebasestorage.app",
    messagingSenderId: "731379897908",
    appId: "1:731379897908:web:781e1fa750aecb46101c61"
};

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
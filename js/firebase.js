// =========================
// FIREBASE - HOTEL GARCOM
// =========================

import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =========================
// CONFIGURAÇÃO FIREBASE
// =========================

const firebaseConfig = {

    apiKey: "AIzaSyDaj28MSSHMKfsofE27DfKcsdCD2MUngGA",

    authDomain:
        "hotel-garcom.firebaseapp.com",

    projectId:
        "hotel-garcom",

    storageBucket:
        "hotel-garcom.firebasestorage.app",

    messagingSenderId:
        "357749341622",

    appId:
        "1:357749341622:web:b5ff6267d5be911d681517"

};


// =========================
// INICIAR FIREBASE
// =========================

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);


// =========================
// DISPONIBILIZAR PARA O SITE
// =========================

window.firebaseHotel = {

    db,

    collection,
    addDoc,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp

};


console.log(
    "🔥 Firebase Hotel Garcom conectado"
);

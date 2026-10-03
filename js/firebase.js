import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    setDoc,
    updateDoc,
    getDocs,
    getDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyAEj82ZchuqIEzbG1PhbLclqiSbIEPifWU",
    authDomain: "hotel-garcom-teste.firebaseapp.com",
    projectId: "hotel-garcom-teste",
    storageBucket: "hotel-garcom-teste.firebasestorage.app",
    messagingSenderId: "608879824533",
    appId: "1:608879824533:web:2c6e47be27336607b8559c"
};


const app =
    initializeApp(
        firebaseConfig
    );


const db =
    getFirestore(
        app
    );


const storage =
    getStorage(
        app
    );


window.firebaseHotel = {

    db,

    storage,

    collection,

    addDoc,

    deleteDoc,

    doc,

    onSnapshot,

    query,

    orderBy,

    serverTimestamp,

    setDoc,

    updateDoc,

    getDocs,

    getDoc,

    runTransaction,

    ref,

    uploadBytes,

    getDownloadURL

};


export {

    db,

    storage,

    collection,

    addDoc,

    deleteDoc,

    doc,

    onSnapshot,

    query,

    orderBy,

    serverTimestamp,

    setDoc,

    updateDoc,

    getDocs,

    getDoc,

    runTransaction,

    ref,

    uploadBytes,

    getDownloadURL

};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, limit, startAfter, endBefore, limitToLast }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAro5OAah2l442qSiCqzyiWEn5aTftg0rc",
    authDomain: "wotascape.firebaseapp.com",
    projectId: "wotascape",
    storageBucket: "wotascape.firebasestorage.app",
    messagingSenderId: "78630756298",
    appId: "1:78630756298:web:25e920980892ede4f17933",
    measurementId: "G-XKY5XBTSN6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
    auth, db,
    signInWithEmailAndPassword, signOut, onAuthStateChanged,
    collection, getDocs, addDoc, doc, deleteDoc, updateDoc,
    query, orderBy, limit, startAfter, endBefore, limitToLast
};
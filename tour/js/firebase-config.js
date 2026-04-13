import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, limit, startAfter, endBefore, limitToLast }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQnRlq7sDRM9WOAZrydncVk05Y4fryRJM",
    authDomain: "kavviar-web.firebaseapp.com",
    projectId: "kavviar-web",
    storageBucket: "kavviar-web.firebasestorage.app",
    messagingSenderId: "350597383174",
    appId: "1:350597383174:web:fcba637f4ab5dc30322f87"
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
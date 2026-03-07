import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBXdJ8bhfizESJOl3kibEhjS7cyd5HkR9g",
  authDomain: "windowsnotes-87a34.firebaseapp.com",
  projectId: "windowsnotes-87a34",
  storageBucket: "windowsnotes-87a34.firebasestorage.app",
  messagingSenderId: "427308605709",
  appId: "1:427308605709:web:a74099fd0cbe85ae379044",
  measurementId: "G-FQ6WDP2J0Q",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };

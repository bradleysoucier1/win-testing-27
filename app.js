import { auth, db, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const googleSigninButton = document.getElementById("google-signin");
const emailAuthForm = document.getElementById("email-auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signoutButton = document.getElementById("signout");
const authMessage = document.getElementById("auth-message");
const notesList = document.getElementById("notes-list");
const newNoteButton = document.getElementById("new-note");
const authForms = document.getElementById("auth-forms");
const authUser = document.getElementById("auth-user");
const welcomeText = document.getElementById("welcome-text");

const HOME_URL = "https://bradleysoucier1.github.io/WindowsNotes/";
const NOTE_URL = "https://bradleysoucier1.github.io/WindowsNotes/note/?id=";

let unsubscribeNotes;

function setMessage(text, isError = false) {
  authMessage.textContent = text;
  authMessage.classList.toggle("error", isError);
}

function renderNotes(snapshot) {
  notesList.innerHTML = "";

  if (snapshot.empty) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "No notes yet. Create your first note.";
    notesList.append(item);
    return;
  }

  snapshot.forEach((docSnap) => {
    const note = docSnap.data();
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `${NOTE_URL}${docSnap.id}`;
    link.textContent = note.title?.trim() || "Untitled";
    const updated = document.createElement("small");
    const date = note.updatedAt?.toDate?.() || new Date();
    updated.textContent = `Updated ${date.toLocaleString()}`;
    li.append(link, updated);
    notesList.append(li);
  });
}

function startNotesListener(userId) {
  if (unsubscribeNotes) unsubscribeNotes();
  const notesRef = collection(db, "users", userId, "notes");
  const notesQuery = query(notesRef, orderBy("updatedAt", "desc"));
  unsubscribeNotes = onSnapshot(notesQuery, renderNotes, () => setMessage("Failed loading notes", true));
}

googleSigninButton.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    setMessage("Signed in with Google.");
  } catch (error) {
    setMessage(error.message, true);
  }
});

emailAuthForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = event.submitter?.dataset.mode;
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    if (mode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created and signed in.");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Signed in.");
    }
  } catch (error) {
    setMessage(error.message, true);
  }
});

signoutButton.addEventListener("click", async () => {
  await signOut(auth);
  setMessage("Signed out.");
});

newNoteButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const noteRef = await addDoc(collection(db, "users", user.uid, "notes"), {
    title: "Untitled",
    body: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  window.location.href = `${NOTE_URL}${noteRef.id}`;
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    authForms.classList.add("hidden");
    authUser.classList.remove("hidden");
    newNoteButton.disabled = false;
    welcomeText.textContent = `Signed in as ${user.email || user.displayName}`;
    startNotesListener(user.uid);
  } else {
    authForms.classList.remove("hidden");
    authUser.classList.add("hidden");
    newNoteButton.disabled = true;
    notesList.innerHTML = "";
    if (unsubscribeNotes) unsubscribeNotes();
  }
});

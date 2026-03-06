import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const noteId = params.get("id");

const titleInput = document.getElementById("note-title");
const bodyInput = document.getElementById("note-body");
const saveStatus = document.getElementById("save-status");
const deleteButton = document.getElementById("delete-note");

const HOME_URL = "https://bradleysoucier1.github.io/WindowsNotes/";

let noteRef;
let saveTimer;

function setStatus(text, isError = false) {
  saveStatus.textContent = text;
  saveStatus.classList.toggle("error", isError);
}

async function saveNote() {
  if (!noteRef) return;

  try {
    await updateDoc(noteRef, {
      title: titleInput.value,
      body: bodyInput.value,
      updatedAt: serverTimestamp(),
    });
    setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
  } catch {
    setStatus("Save failed", true);
  }
}

function queueSave() {
  clearTimeout(saveTimer);
  setStatus("Saving...");
  saveTimer = setTimeout(saveNote, 350);
}

onAuthStateChanged(auth, async (user) => {
  if (!user || !noteId) {
    window.location.href = HOME_URL;
    return;
  }

  noteRef = doc(db, "users", user.uid, "notes", noteId);
  const snapshot = await getDoc(noteRef);

  if (!snapshot.exists()) {
    setStatus("Note not found", true);
    deleteButton.disabled = true;
    return;
  }

  const note = snapshot.data();
  titleInput.value = note.title || "";
  bodyInput.value = note.body || "";
  setStatus("Loaded");
});

titleInput.addEventListener("input", queueSave);
bodyInput.addEventListener("input", queueSave);

deleteButton.addEventListener("click", async () => {
  if (!noteRef) return;
  if (!confirm("Delete this note permanently?")) return;

  await deleteDoc(noteRef);
  window.location.href = HOME_URL;
});

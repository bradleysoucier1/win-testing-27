import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const noteId = params.get("id");
const HOME_URL = "https://bradleysoucier1.github.io/WindowsNotes/";
window.NOTES_HOME_URL = HOME_URL;

const editor = document.getElementById("editor");
const windowTitle = document.getElementById("window-title");
const encoding = document.getElementById("encoding");

let noteRef;
let saveTimer;
let currentTitle = "Untitled";

function setStatus(text, isError = false) {
  encoding.textContent = text;
  encoding.style.color = isError ? "#b00020" : "";
}

function deriveTitle(value) {
  const firstLine = value.split("\n").find((line) => line.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 60) : "Untitled";
}

function syncWindowTitle() {
  windowTitle.textContent = `${currentTitle} - Notepad`;
}

async function saveNote() {
  if (!noteRef) return;

  currentTitle = deriveTitle(editor.value);
  syncWindowTitle();

  try {
    await updateDoc(noteRef, {
      title: currentTitle,
      body: editor.value,
      updatedAt: serverTimestamp(),
    });
    setStatus(`Synced ${new Date().toLocaleTimeString()}`);
  } catch {
    setStatus("Sync failed", true);
  }
}

function queueSave() {
  clearTimeout(saveTimer);
  setStatus("Syncing...");
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
    return;
  }

  const note = snapshot.data();
  editor.value = note.body || "";
  currentTitle = note.title || deriveTitle(editor.value);
  syncWindowTitle();
  setStatus("UTF-8");
});

editor.addEventListener("input", queueSave);

window.addEventListener("beforeunload", () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveNote();
  }
});

window.addEventListener("keydown", async (event) => {
  if (!event.ctrlKey) return;

  if (event.key.toLowerCase() === "d") {
    event.preventDefault();
    await window.deleteCurrentNote();
  }

  if (event.key.toLowerCase() === "b") {
    event.preventDefault();
    window.location.href = HOME_URL;
  }
});


window.deleteCurrentNote = async function deleteCurrentNote() {
  if (!noteRef) {
    setStatus("Note not loaded", true);
    return;
  }
  if (!confirm("Delete this file permanently?")) return;
  await deleteDoc(noteRef);
  window.location.href = HOME_URL;
};

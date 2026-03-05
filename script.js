const editor = document.getElementById("editor");
const lineCol = document.getElementById("line-col");
const zoomLabel = document.getElementById("zoom");
const statusBar = document.getElementById("status-bar");
const statusBarState = document.getElementById("status-bar-state");
const wordWrapState = document.getElementById("word-wrap-state");
const darkModeState = document.getElementById("dark-mode-state");
const windowTitle = document.getElementById("window-title");
const fileInput = document.getElementById("file-input");
const fontDialog = document.getElementById("font-dialog");
const fontSearch = document.getElementById("font-search");
const fontList = document.getElementById("font-list");
const fontClose = document.getElementById("font-close");
const contextMenu = document.getElementById("context-menu");
const mobileContextTrigger = document.getElementById("mobile-context-trigger");

const fontOptions = [
  "Consolas", "Courier New", "Lucida Console", "Segoe UI", "Arial", "Calibri", "Cambria", "Candara",
  "Comic Sans MS", "Georgia", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Impact",
  "Palatino Linotype", "Garamond", "Book Antiqua", "Franklin Gothic Medium", "Century Gothic", "Monaco",
  "Menlo", "Fira Code", "JetBrains Mono", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Source Sans Pro", "Inter", "Nunito", "Ubuntu", "PT Sans", "Merriweather", "Inconsolata", "IBM Plex Mono",
  "Noto Sans", "Noto Serif", "Aptos", "Baskerville", "Didot", "Optima", "Helvetica", "Helvetica Neue",
  "Gill Sans", "Rockwell", "Bodoni MT", "Copperplate", "Cascadia Code", "Anonymous Pro", "Space Mono"
];

let zoomLevel = 100;
let hasSaved = false;
let currentFileName = "Untitled";
let lastSearchTerm = "";
let activeFont = "Consolas";
let touchTimer;

function updateTitle() { windowTitle.textContent = `${currentFileName} - Notepad`; }
function updateCursorInfo() {
  const lines = editor.value.slice(0, editor.selectionStart).split("\n");
  lineCol.textContent = `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`;
}
function closeMenus() { document.querySelectorAll(".menu-item.open").forEach((i) => i.classList.remove("open")); }
function closeContextMenu() { contextMenu.classList.add("hidden"); }

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showContextMenu(x, y) {
  const width = 200;
  const height = 300;
  contextMenu.style.left = `${Math.min(x, window.innerWidth - width)}px`;
  contextMenu.style.top = `${Math.min(y, window.innerHeight - height)}px`;
  contextMenu.classList.remove("hidden");
}

function findNextOccurrence(term, fromIndex = editor.selectionEnd) {
  const index = editor.value.toLowerCase().indexOf(term.toLowerCase(), fromIndex);
  if (index === -1) return false;
  editor.focus();
  editor.setSelectionRange(index, index + term.length);
  updateCursorInfo();
  return true;
}

function setFontFamily(name) {
  activeFont = name;
  editor.style.fontFamily = `"${name}", "Segoe UI", monospace`;
}

function renderFontList(filterText = "") {
  const filtered = fontOptions.filter((f) => f.toLowerCase().includes(filterText.trim().toLowerCase()));
  fontList.innerHTML = "";
  filtered.forEach((font) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `font-option${font === activeFont ? " active" : ""}`;
    btn.style.fontFamily = `"${font}", sans-serif`;
    btn.textContent = font;
    btn.addEventListener("click", () => {
      setFontFamily(font);
      closeFontMenu();
      editor.focus();
    });
    fontList.append(btn);
  });
  if (!filtered.length) {
    const none = document.createElement("div");
    none.className = "font-option";
    none.textContent = "No fonts match your search.";
    fontList.append(none);
  }
}

function openFontMenu() {
  fontSearch.value = "";
  renderFontList();
  fontDialog.classList.remove("hidden");
  fontSearch.focus();
}
function closeFontMenu() { fontDialog.classList.add("hidden"); }

function performAction(action) {
  switch (action) {
    case "new":
      if (editor.value && !confirm("Discard current text and create a new file?")) return;
      editor.value = "";
      currentFileName = "Untitled";
      hasSaved = false;
      updateTitle();
      updateCursorInfo();
      break;
    case "new-window": window.open(window.location.href, "_blank"); break;
    case "open": fileInput.click(); break;
    case "save": if (!hasSaved || currentFileName === "Untitled") return performAction("save-as"); downloadText(`${currentFileName}.txt`, editor.value); break;
    case "save-as": {
      const requested = prompt("Save file as:", currentFileName);
      if (!requested) return;
      currentFileName = requested.replace(/\.txt$/i, "") || "Untitled";
      hasSaved = true;
      updateTitle();
      downloadText(`${currentFileName}.txt`, editor.value);
      break;
    }
    case "page-setup": alert("Page Setup is not supported in-browser. Use Print settings in your browser."); break;
    case "print": window.print(); break;
    case "exit": alert("In a browser demo, Exit cannot close the tab unless it was opened by script."); break;
    case "undo": case "redo": case "cut": case "copy": case "paste": case "delete": document.execCommand(action); break;
    case "find": {
      const term = prompt("Find:", lastSearchTerm);
      if (!term) return;
      lastSearchTerm = term;
      if (!findNextOccurrence(term, 0)) alert(`Cannot find "${term}"`);
      break;
    }
    case "find-next":
      if (!lastSearchTerm) return alert("Use Find first to set a search term.");
      if (!findNextOccurrence(lastSearchTerm, editor.selectionEnd) && !findNextOccurrence(lastSearchTerm, 0)) alert(`Cannot find "${lastSearchTerm}"`);
      break;
    case "replace": {
      const findText = prompt("Find what:", lastSearchTerm);
      if (!findText) return;
      const replaceWith = prompt("Replace with:", "");
      if (replaceWith === null) return;
      lastSearchTerm = findText;
      editor.value = editor.value.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), replaceWith);
      updateCursorInfo();
      break;
    }
    case "go-to": {
      const targetLine = Number.parseInt(prompt("Go to line:", "1") || "", 10);
      if (Number.isNaN(targetLine) || targetLine < 1) return;
      const lines = editor.value.split("\n");
      let index = 0;
      for (let i = 0; i < Math.min(targetLine - 1, lines.length - 1); i += 1) index += lines[i].length + 1;
      editor.focus();
      editor.setSelectionRange(index, index);
      updateCursorInfo();
      break;
    }
    case "select-all": editor.select(); updateCursorInfo(); break;
    case "time-date": editor.setRangeText(new Date().toLocaleString(), editor.selectionStart, editor.selectionEnd, "end"); updateCursorInfo(); break;
    case "word-wrap": editor.classList.toggle("no-wrap"); wordWrapState.textContent = editor.classList.contains("no-wrap") ? "" : "✓"; break;
    case "font-size-up": editor.style.fontSize = `${Math.min(Number.parseFloat(getComputedStyle(editor).fontSize) + 1, 40)}px`; break;
    case "font-size-down": editor.style.fontSize = `${Math.max(Number.parseFloat(getComputedStyle(editor).fontSize) - 1, 9)}px`; break;
    case "font-reset": editor.style.fontSize = "1rem"; setFontFamily("Consolas"); break;
    case "font-menu": openFontMenu(); break;
    case "zoom-in": zoomLevel = Math.min(500, zoomLevel + 10); editor.style.zoom = `${zoomLevel}%`; zoomLabel.textContent = `${zoomLevel}%`; break;
    case "zoom-out": zoomLevel = Math.max(20, zoomLevel - 10); editor.style.zoom = `${zoomLevel}%`; zoomLabel.textContent = `${zoomLevel}%`; break;
    case "zoom-reset": zoomLevel = 100; editor.style.zoom = "100%"; zoomLabel.textContent = "100%"; break;
    case "status-bar": statusBar.classList.toggle("hidden"); statusBarState.textContent = statusBar.classList.contains("hidden") ? "" : "✓"; break;
    case "toggle-dark-mode": document.body.classList.toggle("dark"); darkModeState.textContent = document.body.classList.contains("dark") ? "✓" : ""; break;
    case "view-help": alert("Notepad Help\n\nUse File to open/save text files and Edit for basic editing commands."); break;
    case "keyboard-shortcuts": alert("Shortcuts\nCtrl+S Save\nCtrl+F Find\nCtrl+H Replace\nRight click / long press: context menu"); break;
    case "about": alert("Notepad\nWindows 10 styled web clone\nVersion 1.3"); break;
    default: break;
  }
}

document.querySelectorAll(".menu-trigger").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const item = event.currentTarget.parentElement;
    const isOpen = item.classList.contains("open");
    closeMenus();
    if (!isOpen) item.classList.add("open");
  });
});

document.querySelectorAll(".dropdown-menu li[data-action], .context-menu li[data-action]").forEach((option) => {
  option.addEventListener("click", (event) => {
    performAction(event.currentTarget.dataset.action);
    closeMenus();
    closeContextMenu();
    if (event.currentTarget.dataset.action !== "font-menu") editor.focus();
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-item") && !event.target.closest("#context-menu") && event.target !== mobileContextTrigger) {
    closeMenus();
    closeContextMenu();
  }
});

editor.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  showContextMenu(event.clientX, event.clientY);
});

editor.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  touchTimer = setTimeout(() => showContextMenu(touch.clientX, touch.clientY), 450);
}, { passive: true });
editor.addEventListener("touchend", () => clearTimeout(touchTimer));
editor.addEventListener("touchmove", () => clearTimeout(touchTimer));
mobileContextTrigger.addEventListener("click", () => showContextMenu(window.innerWidth - 210, window.innerHeight - 260));

fontSearch.addEventListener("input", (event) => renderFontList(event.target.value));
fontClose.addEventListener("click", closeFontMenu);
fontDialog.addEventListener("click", (event) => { if (event.target === fontDialog) closeFontMenu(); });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFontMenu();
    closeContextMenu();
    editor.focus();
  }
  if (!event.ctrlKey) return;
  const key = event.key.toLowerCase();
  if (key === "s") { event.preventDefault(); performAction("save"); }
  else if (key === "f") { event.preventDefault(); performAction("find"); }
  else if (key === "h") { event.preventDefault(); performAction("replace"); }
});

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (readEvent) => {
    editor.value = String(readEvent.target.result ?? "");
    currentFileName = file.name.replace(/\.txt$/i, "") || "Untitled";
    hasSaved = true;
    updateTitle();
    updateCursorInfo();
  };
  reader.readAsText(file);
  fileInput.value = "";
});

editor.addEventListener("keyup", updateCursorInfo);
editor.addEventListener("click", updateCursorInfo);
editor.addEventListener("input", updateCursorInfo);

setFontFamily("Consolas");
updateTitle();
updateCursorInfo();

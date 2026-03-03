const editor = document.getElementById("editor");
const lineCol = document.getElementById("line-col");

function updateCursorInfo() {
  const caret = editor.selectionStart;
  const textUntilCaret = editor.value.slice(0, caret);
  const lines = textUntilCaret.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  lineCol.textContent = `Ln ${line}, Col ${column}`;
}

editor.addEventListener("keyup", updateCursorInfo);
editor.addEventListener("click", updateCursorInfo);
editor.addEventListener("input", updateCursorInfo);

updateCursorInfo();

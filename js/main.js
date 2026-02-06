const scenes = [
  { year: "2024", desktop: "html/2024_msh_NLCD.html", mobile: "html/2024_msh_NLCD_mobile.html" },
  { year: "2023", desktop: "html/2023_msh_NLCD.html", mobile: "html/2023_msh_NLCD_mobile.html" },
  { year: "2022", desktop: "html/2022_msh_NLCD.html", mobile: "html/2022_msh_NLCD_mobile.html" },
  { year: "2021", mobile: "html/2021_msh_NLCD_mobile.html" },
  { year: "2020", desktop: "html/2020_msh_NLCD.html" }
];

const yearSelect = document.getElementById("year");
const viewer = document.getElementById("viewer");
const note = document.getElementById("note");
const modeButtons = Array.from(document.querySelectorAll(".mode button"));

let mode = "auto";

function isMobile() {
  return window.matchMedia("(max-width: 900px)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getScene(year) {
  return scenes.find(s => s.year === year);
}

function pickFile(scene) {
  if (!scene) return null;
  if (mode === "desktop") return scene.desktop || scene.mobile || null;
  if (mode === "mobile") return scene.mobile || scene.desktop || null;
  return isMobile() ? (scene.mobile || scene.desktop || null) : (scene.desktop || scene.mobile || null);
}

function updateNote(scene) {
  const missingDesktop = scene && !scene.desktop;
  const missingMobile = scene && !scene.mobile;
  if (missingDesktop && missingMobile) {
    note.textContent = "No files available for this year.";
  } else if (mode === "desktop" && missingDesktop) {
    note.textContent = "Desktop file missing. Falling back to mobile.";
  } else if (mode === "mobile" && missingMobile) {
    note.textContent = "Mobile file missing. Falling back to desktop.";
  } else {
    note.textContent = "";
  }
}

function loadSelected() {
  const scene = getScene(yearSelect.value);
  const file = pickFile(scene);
  updateNote(scene);
  if (file) viewer.src = file;
}

function setMode(newMode) {
  mode = newMode;
  modeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === newMode);
  });
  loadSelected();
}

function populateYears() {
  scenes.forEach(scene => {
    const option = document.createElement("option");
    option.value = scene.year;
    option.textContent = scene.year;
    yearSelect.appendChild(option);
  });
  yearSelect.value = scenes[0].year;
}

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

yearSelect.addEventListener("change", loadSelected);
window.addEventListener("resize", () => { if (mode === "auto") loadSelected(); });

populateYears();
loadSelected();

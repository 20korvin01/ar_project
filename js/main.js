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
const landClassSelect = document.getElementById("land-class");
const landClassChip = document.getElementById("land-class-chip");
const landClassSearch = document.getElementById("land-class-search");
const landClassLegendTitle = document.getElementById("land-class-legend-title");
const landClassLegendDesc = document.getElementById("land-class-legend-desc");

let mode = "auto";
let landClassCache = [];

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

function updateLandClassChip() {
  if (!landClassSelect || !landClassChip) return;
  const selected = landClassSelect.options[landClassSelect.selectedIndex];
  const color = selected ? selected.dataset.color : null;
  landClassChip.style.backgroundColor = color || "transparent";
  landClassChip.style.borderColor = color ? "#777" : "#bbb";
}

function updateLandClassLegend() {
  if (!landClassSelect || !landClassLegendTitle || !landClassLegendDesc) return;
  const selected = landClassSelect.options[landClassSelect.selectedIndex];
  if (!selected || selected.value === "all") {
    landClassLegendTitle.textContent = "All classes";
    landClassLegendDesc.textContent = "Showing all land cover classes.";
    return;
  }

  const code = Number.parseInt(selected.value, 10);
  const item = landClassCache.find(entry => entry.code === code);
  landClassLegendTitle.textContent = selected.textContent || "";
  landClassLegendDesc.textContent = item && item.category ? item.category : "";
}

function buildLandClassOptions(filterText) {
  if (!landClassSelect) return;
  const query = (filterText || "").trim().toLowerCase();
  const previousValue = landClassSelect.value;

  landClassSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All classes";
  landClassSelect.appendChild(allOption);

  landClassCache.forEach(item => {
    const haystack = `${item.land_cover} ${item.code} ${item.category || ""}`.toLowerCase();
    if (query && !haystack.includes(query)) return;
    const option = document.createElement("option");
    option.value = String(item.code);
    option.textContent = `${item.land_cover} (${item.code})`;
    option.dataset.color = item.color;
    if (item.category) option.title = item.category;
    landClassSelect.appendChild(option);
  });

  const hasPrevious = Array.from(landClassSelect.options).some(opt => opt.value === previousValue);
  landClassSelect.value = hasPrevious ? previousValue : "all";
  updateLandClassChip();
  updateLandClassLegend();
}

function populateLandClasses() {
  if (!landClassSelect) return;
  landClassCache = Array.isArray(window.NLCD_COLORS) ? window.NLCD_COLORS : [];
  buildLandClassOptions(landClassSearch ? landClassSearch.value : "");
}

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

yearSelect.addEventListener("change", loadSelected);
if (landClassSelect) {
  landClassSelect.addEventListener("change", () => {
    updateLandClassChip();
    updateLandClassLegend();
  });
}
if (landClassSearch) {
  landClassSearch.addEventListener("input", () => {
    buildLandClassOptions(landClassSearch.value);
  });
}
window.addEventListener("resize", () => { if (mode === "auto") loadSelected(); });

populateYears();
populateLandClasses();
loadSelected();

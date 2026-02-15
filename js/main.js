// Sidepanel toggle logic
document.addEventListener("DOMContentLoaded", function() {
  const sidepanel = document.getElementById("sidepanel");
  const toggleBtn = document.getElementById("sidepanel-toggle");
  if (sidepanel && toggleBtn) {
    toggleBtn.addEventListener("click", function() {
      const closed = sidepanel.classList.toggle("closed");
      // Change icon direction
      toggleBtn.innerHTML = closed ? "&#x2039;" : "&#x203A;";
    });
    // Set initial icon
    toggleBtn.innerHTML = sidepanel.classList.contains("closed") ? "&#x2039;" : "&#x203A;";
  }
});
// Dynamisch alle Jahre aus dem html-Ordner erfassen
// Annahme: Jede Datei heißt z.B. 1986.html, 1978_pre_eruption.html usw.
// scenes = [{ year: "1986", file: "html/1986.html" }, ...]
const scenes = [];
const htmlFiles = [
  "1978_pre_eruption.html",
  "1986.html","1987.html","1988.html","1989.html","1990.html","1991.html","1992.html","1993.html","1994.html","1995.html","1996.html","1997.html","1998.html","1999.html","2000.html","2001.html","2002.html","2003.html","2004.html","2005.html","2006.html","2007.html","2008.html","2009.html","2010.html","2011.html","2012.html","2013.html","2014.html","2015.html","2016.html","2017.html","2018.html","2019.html","2020.html","2021.html","2022.html","2023.html","2024.html","2026_satellite.html"
];
htmlFiles.forEach(f => {
  let year = f.replace('.html', '');
  scenes.push({ year: year, file: `html/${f}` });
});

const yearSelect = document.getElementById("year");
const viewer = document.getElementById("viewer");
const note = document.getElementById("note");
const landClassSelect = document.getElementById("land-class");
const landClassChip = document.getElementById("land-class-chip");
const landClassSearch = document.getElementById("land-class-search");
const landClassLegendTitle = document.getElementById("land-class-legend-title");
const landClassLegendDesc = document.getElementById("land-class-legend-desc");

const mode = "auto";
let landClassCache = [];
const landClassHighlightTolerance = 0.18;

function sendLandClassHighlight() {
  if (!viewer || !viewer.contentWindow || !landClassSelect) return;

  // If dropdown is disabled (e.g. pre-eruption), explicitly clear highlight in iframe
  if (landClassSelect.disabled) {
    viewer.contentWindow.postMessage({ type: "nlcd:highlight", enabled: false, color: null, tolerance: landClassHighlightTolerance }, "*");
    return;
  }

  const selected = landClassSelect.options[landClassSelect.selectedIndex];
  const enabled = selected && selected.value !== "all";
  const color = selected ? selected.dataset.color : null;

  viewer.contentWindow.postMessage({
    type: "nlcd:highlight",
    enabled: Boolean(enabled && color),
    color: color || null,
    tolerance: landClassHighlightTolerance
  }, "*");
}

function isMobile() {
  return window.matchMedia("(max-width: 900px)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getScene(year) {
  return scenes.find(s => s.year === year);
}

function pickFile(scene) {
  if (!scene) return null;
  return scene.file;
}

function updateNote(scene) {
  if (!scene) {
    note.textContent = "No file available for this year.";
  } else {
    note.textContent = "";
  }
}

function loadSelected() {
  const scene = getScene(yearSelect.value);

  // enable/disable land-class UI immediately based on selected scene
  updateLandClassAvailability();

  const file = pickFile(scene);
  updateNote(scene);
  if (file) viewer.src = file;
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

  // When dropdown is disabled, show neutral chip
  if (landClassSelect.disabled) {
    landClassChip.style.backgroundColor = "transparent";
    landClassChip.style.borderColor = "#bbb";
    landClassChip.title = "Land class highlighting disabled for this scene";
    return;
  }

  const selected = landClassSelect.options[landClassSelect.selectedIndex];
  const color = selected ? selected.dataset.color : null;
  landClassChip.style.backgroundColor = color || "transparent";
  landClassChip.style.borderColor = color ? "#777" : "#bbb";
  landClassChip.title = selected ? selected.textContent : "";
}

function updateLandClassLegend() {
  if (!landClassSelect || !landClassLegendTitle || !landClassLegendDesc) return;

  // If disabled for the selected scene, show unavailable message
  if (landClassSelect.disabled) {
    landClassLegendTitle.textContent = "Not available";
    landClassLegendDesc.textContent = "Land class highlighting is disabled for this scene.";
    return;
  }

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

function updateLandClassAvailability() {
  if (!landClassSelect || !yearSelect) return;
  // disable for specific scenes (e.g. 1978 pre-eruption and 2026 satellite)
  const disabled = yearSelect.value === "1978_pre_eruption" || yearSelect.value === "2026_satellite";

  // disable/enable controls
  landClassSelect.disabled = disabled;
  if (landClassSearch) landClassSearch.disabled = disabled;

  // update UI widgets
  updateLandClassChip();
  updateLandClassLegend();

  // ensure iframe highlight state matches availability
  if (viewer && viewer.contentWindow) {
    if (disabled) {
      viewer.contentWindow.postMessage({ type: "nlcd:highlight", enabled: false, color: null, tolerance: landClassHighlightTolerance }, "*");
    } else {
      // re-apply currently selected highlight for enabled scenes
      sendLandClassHighlight();
    }
  }
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

    // color only the option text (font color)
    // - force Snow/Ice (NLCD code 12) to black for readability
    // - all other classes use their NLCD color as text color
    try {
      const isSnow = item.code === 12 || /snow|ice/i.test(item.land_cover);
      const textColor = isSnow ? '#000' : (item.color || '#000');
      option.style.color = textColor;
      option.style.fontWeight = '500';
    } catch (e) {
      /* some browsers restrict styling <option> — ignore */
    }

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
  // ensure dropdown enabled/disabled state matches the currently selected year
  updateLandClassAvailability();
  // ensure dropdown enabled/disabled state matches the currently selected year
  updateLandClassAvailability();
  // ensure dropdown enabled/disabled state matches the currently selected year
  updateLandClassAvailability();
}

yearSelect.addEventListener("change", loadSelected);
if (landClassSelect) {
  landClassSelect.addEventListener("change", () => {
    updateLandClassChip();
    updateLandClassLegend();
    sendLandClassHighlight();
  });
}
if (landClassSearch) {
  landClassSearch.addEventListener("input", () => {
    buildLandClassOptions(landClassSearch.value);
  });
}
window.addEventListener("resize", () => { if (mode === "auto") loadSelected(); });
viewer.addEventListener("load", () => {
  sendLandClassHighlight();

  
});

populateYears();
populateLandClasses();
loadSelected();

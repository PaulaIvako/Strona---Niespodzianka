// Cztery warstwy tła płynnie zmieniają kolor wraz z lokalną porą dnia.
const skyPalette = [
  { hour: 0, colors: ["#101d38", "#10162e", "#223b63", "#25264b"] },
  { hour: 5, colors: ["#101d38", "#10162e", "#223b63", "#25264b"] },
  { hour: 7, colors: ["#ffead9", "#e9dff5", "#ffc7ad", "#cfc9ef"] },
  { hour: 11, colors: ["#fff3ce", "#ffebea", "#ffe1a8", "#ffd6e2"] },
  { hour: 17, colors: ["#fff3ce", "#ffebea", "#ffe1a8", "#ffd6e2"] },
  { hour: 19, colors: ["#d48f7e", "#9b718e", "#ee987a", "#6e537c"] },
  { hour: 20.5, colors: ["#d48f7e", "#9b718e", "#ee987a", "#6e537c"] },
  { hour: 22, colors: ["#101d38", "#10162e", "#223b63", "#25264b"] },
  { hour: 24, colors: ["#101d38", "#10162e", "#223b63", "#25264b"] }
];

function mixSkyColors(from, to, amount) {
  const channel = (color, index) => parseInt(color.slice(index, index + 2), 16);
  return "#" + [1, 3, 5].map((index) => {
    const value = Math.round(channel(from, index) + (channel(to, index) - channel(from, index)) * amount);
    return value.toString(16).padStart(2, "0");
  }).join("");
}

function getCurrentHour() {
  const current = new Date();
  return current.getHours() + current.getMinutes() / 60 + current.getSeconds() / 3600;
}

function updateSkyColors() {
  const preview = new URLSearchParams(window.location.search).get("podglad");
  const previewHours = { poranek: 7, dzien: 13, afterwork: 16, wieczor: 19, noc: 23 };
  const hour = Object.hasOwn(previewHours, preview) ? previewHours[preview] : getCurrentHour();
  const nextIndex = skyPalette.findIndex((stop) => stop.hour > hour);
  const from = skyPalette[Math.max(0, nextIndex - 1)];
  const to = skyPalette[nextIndex];
  const progress = (hour - from.hour) / (to.hour - from.hour);
  const smooth = progress * progress * (3 - 2 * progress);
  ["--bg-a", "--bg-b", "--glow-a", "--glow-b"].forEach((name, index) => {
    document.body.style.setProperty(name, mixSkyColors(from.colors[index], to.colors[index], smooth));
  });
}

updateSkyColors();
window.setInterval(updateSkyColors, 10000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateSkyColors();
});

const todayEl = document.getElementById("today");
const holidayEl = document.getElementById("holiday");
const imageEl = document.getElementById("greeting-image");
const nextBtn = document.getElementById("next-btn");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");


function focusSearchInput() {
  if (!searchInput) return;
  window.requestAnimationFrame(() => {
    searchInput.focus({ preventScroll: true });
  });
}

let now = new Date();
function getDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
let DATE_KEY = getDateKey(now);
let holidayCalendar = null;
let currentPeriod = null;
let lastImageUrl = "";
let imageRequest = 0;

function getPeriod(hour) {
  if (hour >= 6 && hour < 11) return "Morning";
  if (hour >= 11 && hour < 16) return "Midday";
  if (hour >= 16 && hour < 17) return "After Work";
  if (hour >= 17 && hour < 22) return "Evening";
  return "Night";
}

function setDateLine() {
  todayEl.textContent = now.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function computeEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(dateString, days) {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFallbackDays(year) {
  const easter = computeEasterDate(year);
  return {
    [DATE_KEY]: [],
    [`${year}-01-21`]: ["Dzień Babci"],
    [`${year}-01-22`]: ["Dzień Dziadka"],
    [`${year}-02-14`]: ["Walentynki"],
    [`${year}-03-06`]: ["Europejski Dzień Logopedy"],
    [`${year}-03-08`]: ["Dzień Kobiet"],
    [`${year}-03-20`]: ["Pierwszy dzień wiosny"],
    [`${year}-04-01`]: ["Prima Aprilis"],
    [`${year}-05-26`]: ["Dzień Matki"],
    [`${year}-06-01`]: ["Dzień Dziecka"],
    [`${year}-06-23`]: ["Dzień Ojca"],
    [`${year}-07-30`]: ["Międzynarodowy Dzień Przyjaźni"],
    [`${year}-10-01`]: ["Międzynarodowy Dzień Kawy"],
    [`${year}-12-31`]: ["Sylwester"],
    [easter]: ["Wielkanoc"],
    [addDays(easter, 1)]: ["Poniedziałek Wielkanocny"]
  };
}

async function loadHolidayCalendar() {
  if (holidayCalendar) return holidayCalendar;
  const data = typeof HOLIDAYS_DATA !== "undefined" ? HOLIDAYS_DATA : null;
  holidayCalendar = data && typeof data === "object" ? data : getFallbackDays(now.getFullYear());

  return holidayCalendar;
}

async function getOccasion() {
  const calendar = await loadHolidayCalendar();
  const holidayNames = Array.isArray(calendar[DATE_KEY]) ? calendar[DATE_KEY] : [];
  const title = holidayNames.slice(0, 2).join(", ");

  if (title) {
    return `Dziś obchodzimy: ${title}`;
  }

  return "Dziś nie ma u nas dodatkowego święta dnia";
}

function usedImagesKey(period) {
  return `used-images-${new Date().getFullYear()}-${period}`;
}

function getUsedImages(period) {
  try {
    const parsed = JSON.parse(localStorage.getItem(usedImagesKey(period)) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveUsedImages(period, used) {
  try {
    localStorage.setItem(usedImagesKey(period), JSON.stringify([...used]));
  } catch {
    // Losowanie nadal działa, jeśli przeglądarka nie zapisuje historii.
  }
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}

async function renderNewImage(period) {
  const request = ++imageRequest;
  nextBtn.disabled = true;
  const all = typeof IMAGE_POOLS !== "undefined" && Array.isArray(IMAGE_POOLS[period])
    ? [...new Set(IMAGE_POOLS[period])] : [];
  const used = getUsedImages(period);
  let remaining = all.filter((url) => !used.has(url) && url !== lastImageUrl);
  if (!remaining.length) {
    used.clear();
    remaining = all.filter((url) => url !== lastImageUrl);
    if (!remaining.length) remaining = [...all];
  }
  while (remaining.length) {
    const index = Math.floor(Math.random() * remaining.length);
    const [url] = remaining.splice(index, 1);
    try {
      await preloadImage(url);
      if (request !== imageRequest) return;
      imageEl.src = url;
      imageEl.alt = "Laurka dnia";
      lastImageUrl = url;
      used.add(url);
      saveUsedImages(period, used);
      nextBtn.disabled = false;
      return;
    } catch {
      // Spróbuj kolejnego obrazka z tego samego folderu.
    }
  }
  if (request !== imageRequest) return;
  imageEl.removeAttribute("src");
  imageEl.alt = "Brak dostępnych obrazków dla tej pory dnia";
  nextBtn.disabled = false;
}

async function updateSchedule() {
  const current = new Date();
  const dateKey = getDateKey(current);
  if (dateKey !== DATE_KEY) {
    if (current.getFullYear() !== now.getFullYear()) holidayCalendar = null;
    now = current;
    DATE_KEY = dateKey;
    setDateLine();
    holidayEl.textContent = await getOccasion();
  }
  const period = getPeriod(getCurrentHour());
  if (period !== currentPeriod) {
    currentPeriod = period;
    imageEl.removeAttribute("src");
    renderNewImage(period);
  }
}

let periodTimer;
function scheduleNextPeriod() {
  window.clearTimeout(periodTimer);
  const current = new Date();
  const next = new Date(current);
  const nextHour = [6, 11, 16, 17, 22].find((hour) => hour > current.getHours());
  if (nextHour === undefined) {
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  } else {
    next.setHours(nextHour, 0, 0, 0);
  }
  periodTimer = window.setTimeout(() => {
    updateSchedule();
    scheduleNextPeriod();
  }, Math.max(0, next - current));
}

async function init() {
  setDateLine();
  holidayEl.textContent = await getOccasion();
  await updateSchedule();
  scheduleNextPeriod();
  focusSearchInput();
}

init();
nextBtn.addEventListener("click", () => {
  const period = getPeriod(getCurrentHour());
  currentPeriod = period;
  renderNewImage(period);
});
window.setInterval(updateSchedule, 10000);
window.addEventListener("pageshow", () => { focusSearchInput(); updateSchedule(); scheduleNextPeriod(); });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { updateSchedule(); scheduleNextPeriod(); }
});

function buildSearchUrl(value) {
  const raw = value.trim();
  if (!raw) return "https://www.google.com";

  const hasProtocol = /^https?:\/\//i.test(raw);
  const looksLikeDomain = /\.[a-z]{2,}(\/|$)/i.test(raw);

  if (hasProtocol) return raw;
  if (looksLikeDomain) return `https://${raw}`;

  return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = buildSearchUrl(searchInput.value);
  window.open(url, "_blank", "noopener,noreferrer");
});

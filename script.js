const todayEl = document.getElementById("today");
const holidayEl = document.getElementById("holiday");
const jokeEl = document.getElementById("joke");
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

const now = new Date();
const DATE_KEY = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0")
].join("-");
const YEAR_KEY = String(now.getFullYear());
const USED_KEY = `used-images-${YEAR_KEY}`;
const USED_SUCHARY_KEY = `used-suchary-${YEAR_KEY}`;

const FALLBACK_SUCHARY = [
  { text: "Jak się nazywa latający kot? Kotlecik.", image: "" },
  { text: "Co mówi ściana do ściany? Spotkajmy się na rogu.", image: "" },
  { text: "Dlaczego komputerowi jest zimno? Bo ma otwarte okna.", image: "" }
];

const DAILY_SPECIAL_DAYS = [
  "Dzień Uśmiechu",
  "Dzień Dobrych Wiadomości",
  "Dzień Przytulania",
  "Dzień Spokojnej Kawy",
  "Dzień Łapania Promieni Słońca",
  "Dzień Dobrego Słowa",
  "Dzień Małych Przyjemności",
  "Dzień Miłych Niespodzianek",
  "Dzień Czekolady",
  "Dzień Przyjaźni",
  "Dzień Roślin Domowych",
  "Dzień Dobrego Humoru",
  "Dzień Marzycieli",
  "Dzień Odpoczynku",
  "Dzień Wdzięczności",
  "Dzień Serca"
];

let imagePools = null;
let sucharyPool = null;
let currentTheme = "daily";
let lastImageUrl = "";
let lastSucharText = "";


function isPinterestImageUrl(url) {
  return typeof url === "string" && /^https:\/\/i\.pinimg\.com\//i.test(url);
}

function sanitizeImagePoolList(list) {
  return unique((list || []).filter(isPinterestImageUrl));
}

function setDateLine() {
  todayEl.textContent = now.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getSeasonTheme(monthIndex) {
  if (monthIndex >= 2 && monthIndex <= 4) return "spring";
  if (monthIndex >= 5 && monthIndex <= 7) return "summer";
  if (monthIndex >= 8 && monthIndex <= 10) return "autumn";
  return "winter";
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

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function getDailyRotatingOccasion() {
  const index = (getDayOfYear(now) - 1) % DAILY_SPECIAL_DAYS.length;
  return DAILY_SPECIAL_DAYS[index];
}

function getInternationalDays(year) {
  const easter = computeEasterDate(year);
  return {
    "01-21": { name: "Dzień Babci", theme: "podziekowania" },
    "01-22": { name: "Dzień Dziadka", theme: "podziekowania" },
    "02-14": { name: "Walentynki", theme: "milosc" },
    "03-08": { name: "Dzień Kobiet", theme: "milosc" },
    "03-20": { name: "Pierwszy dzień wiosny", theme: "daily" },
    "04-01": { name: "Prima Aprilis", theme: "powodzenia" },
    "05-26": { name: "Dzień Matki", theme: "podziekowania" },
    "06-01": { name: "Dzień Dziecka", theme: "zaproszenia" },
    "06-23": { name: "Dzień Ojca", theme: "podziekowania" },
    "07-30": { name: "Międzynarodowy Dzień Przyjaźni", theme: "powodzenia" },
    "10-01": { name: "Międzynarodowy Dzień Kawy", theme: "pobudka" },
    "12-31": { name: "Sylwester", theme: "zaproszenia" },
    [easter.slice(5)]: { name: "Wielkanoc", theme: "zaproszenia" },
    [addDays(easter, 1).slice(5)]: { name: "Poniedziałek Wielkanocny", theme: "zaproszenia" }
  };
}

function mapThemeFromHolidayName(text) {
  const lower = text.toLowerCase();
  if (lower.includes("walentyn") || lower.includes("miło") || lower.includes("milos")) return "milosc";
  if (lower.includes("dzię") || lower.includes("dzień matki") || lower.includes("dzień ojca") || lower.includes("babci") || lower.includes("dziadka")) {
    return "podziekowania";
  }
  if (lower.includes("kaw")) return "pobudka";
  if (lower.includes("przyja") || lower.includes("powodzenia")) return "powodzenia";
  if (lower.includes("wielkanoc") || lower.includes("zapros") || lower.includes("sylwester") || lower.includes("dziecka")) {
    return "zaproszenia";
  }
  return "daily";
}

async function getPublicHolidayName() {
  const year = now.getFullYear();
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/PL`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const holidays = await response.json();
    const todayHoliday = holidays.find((item) => item.date === DATE_KEY);
    return todayHoliday ? todayHoliday.localName || todayHoliday.name : null;
  } catch {
    return null;
  }
}

async function getOccasion() {
  const international = getInternationalDays(now.getFullYear());
  const key = DATE_KEY.slice(5);
  const intl = international[key] || null;
  const publicHoliday = await getPublicHolidayName();

  if (publicHoliday && intl && publicHoliday !== intl.name) {
    const name = `${publicHoliday} i ${intl.name}`;
    return { title: `Dziś obchodzimy: ${name}`, theme: mapThemeFromHolidayName(name) };
  }

  if (publicHoliday) {
    return { title: `Dziś obchodzimy: ${publicHoliday}`, theme: mapThemeFromHolidayName(publicHoliday) };
  }

  if (intl) {
    return { title: `Dziś obchodzimy: ${intl.name}`, theme: intl.theme };
  }

  return { title: `Dziś obchodzimy: ${getDailyRotatingOccasion()}`, theme: "daily" };
}

async function loadImagePools() {
  if (imagePools) return imagePools;
  try {
    const data = typeof IMAGE_POOLS !== "undefined" ? IMAGE_POOLS : null;
    if (!data) throw new Error("Brak IMAGE_POOLS");

    imagePools = {
      daily: sanitizeImagePoolList(data.daily),
      pobudka: sanitizeImagePoolList(data.pobudka),
      powodzenia: sanitizeImagePoolList(data.powodzenia),
      zaproszenia: sanitizeImagePoolList(data.zaproszenia),
      all: sanitizeImagePoolList(data.all)
    };
  } catch {
    imagePools = { all: [] };
  }
  return imagePools;
}

async function loadSucharyPool() {
  if (sucharyPool) return sucharyPool;
  try {
    const data = typeof SUCHARY_SHORT !== "undefined" ? SUCHARY_SHORT : null;
    if (!data) throw new Error("Brak SUCHARY_SHORT");
    const clean = data.filter((item) => item && typeof item.text === "string" && item.text.trim().length > 8);
    sucharyPool = clean.length ? clean : FALLBACK_SUCHARY;
  } catch {
    sucharyPool = FALLBACK_SUCHARY;
  }
  return sucharyPool;
}

function getUsedImages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USED_KEY) || "[]");
    const clean = (Array.isArray(parsed) ? parsed : []).filter(isPinterestImageUrl);
    if (clean.length !== parsed.length) saveUsedImages(clean);
    return clean;
  } catch {
    return [];
  }
}

function saveUsedImages(urls) {
  localStorage.setItem(USED_KEY, JSON.stringify(urls.slice(-1500)));
}

function getUsedSuchary() {
  try {
    return JSON.parse(localStorage.getItem(USED_SUCHARY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsedSuchary(items) {
  localStorage.setItem(USED_SUCHARY_KEY, JSON.stringify(items.slice(-5000)));
}

function unique(list) {
  return [...new Set(list)];
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function pickRandomDifferentByText(list, lastText) {
  if (!list.length) return null;
  const filtered = list.filter((item) => item.text !== lastText);
  return pickRandom(filtered.length ? filtered : list);
}

function buildCandidatePool(pools, theme) {
  return unique([
    ...(pools[theme] || []),
    ...(pools.daily || []),
    ...(pools.pobudka || []),
    ...(pools.powodzenia || []),
    ...(pools.all || [])
  ]);
}

function getNextImageUrl(pools, theme, blocked) {
  const pool = buildCandidatePool(pools, theme).filter((url) => !blocked.has(url));
  if (!pool.length) throw new Error("Pula obrazków jest pusta");

  const used = new Set(getUsedImages());
  const fresh = pool.filter((url) => !used.has(url) && url !== lastImageUrl);
  const options = fresh.length ? fresh : pool.filter((url) => url !== lastImageUrl);
  const selected = pickRandom(options.length ? options : pool);

  const updatedUsed = fresh.length ? [...used, selected] : [selected];
  saveUsedImages(updatedUsed);
  return selected;
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}

async function renderNewImage() {
  try {
    const pools = await loadImagePools();
    const blocked = new Set();

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const url = getNextImageUrl(pools, currentTheme, blocked);
      try {
        await preloadImage(url);
        imageEl.src = url;
        lastImageUrl = url;
        return;
      } catch {
        blocked.add(url);
      }
    }

    throw new Error("Nie udało się załadować obrazka");
  } catch {
    const pools = await loadImagePools();
    const fallback = (pools.all && pools.all[0]) || "";
    if (fallback) {
      imageEl.src = fallback;
      lastImageUrl = fallback;
    }
  }
}

async function renderNewSuchar() {
  const pool = await loadSucharyPool();
  const used = new Set(getUsedSuchary());

  let available = pool.filter((item) => !used.has(item.text) && item.text !== lastSucharText);

  if (!available.length) {
    // Start a new cycle only after exhausting the full pool.
    saveUsedSuchary([]);
    available = pool.filter((item) => item.text !== lastSucharText);
  }

  const selected = pickRandom(available.length ? available : pool);

  if (selected && selected.text) {
    jokeEl.textContent = selected.text;
    lastSucharText = selected.text;
    saveUsedSuchary([...used, selected.text]);
    return;
  }

  const fallback = pickRandom(FALLBACK_SUCHARY);
  jokeEl.textContent = fallback.text;
  lastSucharText = fallback.text;
}

async function generateAll() {
  nextBtn.disabled = true;
  await Promise.all([renderNewImage(), renderNewSuchar()]);
  nextBtn.disabled = false;
}

async function init() {
  setDateLine();

  const occasion = await getOccasion();
  holidayEl.textContent = occasion.title;
  currentTheme = occasion.theme;

  await generateAll();
  focusSearchInput();
}

init();
nextBtn.addEventListener("click", generateAll);
window.addEventListener("pageshow", focusSearchInput);


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

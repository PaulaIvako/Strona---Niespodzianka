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

// Obrazki wybrane po przeglądzie jakości wyświetlamy w mniejszym rozmiarze.
const SMALLER_IMAGE_PATHS = new Set([
  "obrazki/Morning/00ed964d5a13ddbdf3361c3965463517.jpg",
  "obrazki/Morning/19996de26d50eb837077cb1aaaaf0db7.jpg",
  "obrazki/Morning/29a1d7f630aea6a8ec28b9fb2f85c849.jpg",
  "obrazki/Morning/513e1805e9a2c5759b95.jpg",
  "obrazki/Morning/6b1a36e7e35f1259642c33c8a1d98806.jpg",
  "obrazki/Morning/6eb7111ce7c34c00e687.png",
  "obrazki/Morning/730a7ce9c390d91fb22cfa8ff94ce567.jpg",
  "obrazki/Morning/738d727d6ab5f92369034b4450dcff24.jpg",
  "obrazki/Morning/8c9842acf616273f66c4.png",
  "obrazki/Morning/b53c73efcff8bf1cc7e210193881fa4f.jpg",
  "obrazki/Morning/c07bac81db6a3ef155f1e4bab55c0208.jpg",
  "obrazki/Morning/d7d5c2db6050f628ae98d613d9bf3c80.jpg",
  "obrazki/Midday/0490513c0050659d1712fb0a416be983.jpg",
  "obrazki/Midday/0c0c200ee666f333c9b73a9dd197160d.jpg",
  "obrazki/Midday/1316c631f23bc01d9b3b37e917edd9a8.jpg",
  "obrazki/Midday/1b1f341d185055c55e41718bfca18dc3.jpg",
  "obrazki/Midday/39ca8976824a7201e71f030fd024d847.jpg",
  "obrazki/Midday/48fdb46bf6af63024f4583c4f07374a5.jpg",
  "obrazki/Midday/505bffa305eb944e9ccf573ff9d231a9.jpg",
  "obrazki/Midday/584156b385c480156e7f95772150af54.jpg",
  "obrazki/Midday/95e878c4eb5b62c64c9b.jpg",
  "obrazki/Midday/ad9c48a4d67c6061438b3d3619704417.jpg",
  "obrazki/Midday/beb81f96a49a13f940a1288d38253d98.jpg",
  "obrazki/Midday/c8e7451bb9fb8d733fbf893b3fe6f242.jpg",
  "obrazki/After Work/26c03e1e66b0f5cc39e023e711d95c02.jpg",
  "obrazki/After Work/9d6fbcd8bd269b0d7066441e9c437e40.jpg",
  "obrazki/Evening/6901af05e39beabad38ab810987e7596.jpg",
  "obrazki/Evening/7777601527f66a1ce0e9e4b912b8cd4e.jpg",
  "obrazki/Evening/c6f42b4e5a0f2dbdddd792fa063b31bf.jpg",
  "obrazki/Night/018ae694a4aec6129592dc8b5a843fe6.jpg",
  "obrazki/Night/034892bd3270c44b8416b7fc7b5b61c1.jpg",
  "obrazki/Night/37c9c5af2cebbf382db037127cf69c39.jpg",
  "obrazki/Night/3bff8906385ddeb8ffce6b9b4460f8cd.jpg",
  "obrazki/Night/57b7b183b8398528f61e553e011c01d1.jpg",
  "obrazki/Night/61a8dbf0d7902d082c5821c5320789ae.jpg",
  "obrazki/Night/6b3ec9b5cb996676472087cefce50ced.jpg",
  "obrazki/Night/797c676936a0f189ebf3c5bfd8df2a68.jpg",
  "obrazki/Night/939a4ca15898dcd39af41d48d001f8a3.gif",
  "obrazki/Night/Zrzut ekranu 2026-11-25 o 15.53.29.png",
  "obrazki/Night/b330a33e3dfca9f1e07152212c050de6.jpg",
  "obrazki/Night/f102ecef987c7c334b291dd9c908aec3.jpg"
]);

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
      imageEl.classList.toggle("smaller-image", SMALLER_IMAGE_PATHS.has(url));
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

#!/usr/bin/env python3

import json
import re
import sys
from datetime import date
from html import unescape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT_DIR / "holidays-data.json"
OUTPUT_JS_PATH = ROOT_DIR / "holidays-data.js"
MONTH_URL_TEMPLATE = "https://www.kalendarzswiat.pl/kalendarz_{month}/{year}"
USER_AGENT = "Mozilla/5.0 (compatible; CodexHolidayUpdater/1.0)"
MONTH_SLUGS = [
    "styczen",
    "luty",
    "marzec",
    "kwiecien",
    "maj",
    "czerwiec",
    "lipiec",
    "sierpien",
    "wrzesien",
    "pazdziernik",
    "listopad",
    "grudzien",
]


def fetch_html(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def strip_tags(html: str) -> str:
    text = re.sub(r"<br\s*/?>", ", ", html, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" ,")


def split_holidays(text: str) -> list[str]:
    return [item.strip() for item in text.split(",") if item.strip()]


def parse_year_page(year: int) -> dict[str, list[str]]:
    parsed: dict[str, list[str]] = {}
    pattern = re.compile(
        r'<tr class="(?:odd|even)".*?data-date="(?P<date>\d{4}-\d{1,2}-\d{1,2})".*?</td>\s*<td>(?P<label>.*?)<span class="days_left">',
        re.DOTALL,
    )

    for month in MONTH_SLUGS:
        html = fetch_html(MONTH_URL_TEMPLATE.format(month=month, year=year))

        for match in pattern.finditer(html):
            raw_date = match.group("date")
            label = strip_tags(match.group("label"))
            if not label:
                continue

            year_str, month_str, day_str = raw_date.split("-")
            iso_date = f"{year_str}-{int(month_str):02d}-{int(day_str):02d}"
            items = split_holidays(label)

            if not items:
                continue

            current_items = parsed.setdefault(iso_date, [])
            for item in items:
                if item not in current_items:
                    current_items.append(item)

    return parsed


def build_calendar(years: list[int]) -> dict[str, object]:
    calendar: dict[str, object] = {
        "_meta": {
            "source": "https://www.kalendarzswiat.pl/",
            "generated_at": date.today().isoformat(),
            "years": years,
        }
    }

    for year in years:
        year_data = parse_year_page(year)
        for iso_date, names in sorted(year_data.items()):
            calendar[iso_date] = names

    return calendar


def main() -> int:
    current_year = date.today().year
    years = [current_year, current_year + 1]

    try:
        calendar = build_calendar(years)
    except (HTTPError, URLError, TimeoutError) as error:
        print(f"Nie udało się pobrać świąt: {error}", file=sys.stderr)
        return 1

    OUTPUT_PATH.write_text(
        json.dumps(calendar, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    OUTPUT_JS_PATH.write_text(
        "const HOLIDAYS_DATA = "
        + json.dumps(calendar, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    today_key = date.today().isoformat()
    today_value = calendar.get(today_key, [])
    print(f"Zapisano {OUTPUT_PATH.name}.")
    print(f"Zapisano {OUTPUT_JS_PATH.name}.")
    print(f"Dziś ({today_key}): {', '.join(today_value) if today_value else 'brak wpisu'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

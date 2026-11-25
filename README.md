# Strona niespodzianka

Strona wyświetla datę, maksymalnie dwa pierwsze święta dnia, wyszukiwarkę i losowy obrazek. Przycisk „Losuj” wybiera obrazek z folderu właściwego dla aktualnej pory. Kolory tła zmieniają się stopniowo w zależności od lokalnej godziny.

## Co jest w folderze

- `obrazki/` — obrazki podzielone na foldery odpowiadające porom dnia.
- `materialy-archiwalne/` — dawne kopie, zapisane strony z Pinteresta i pomocnicze dane. Nie są potrzebne do działania strony i pozostają tylko na tym komputerze.
- `index.html`, `style.css`, `script.js`, `data.js` i `favicon.svg` — pliki strony.
- `holidays-data.js` i `holidays-data.json` — kalendarz świąt.
- `scripts/` — narzędzia pomocnicze projektu.

## Aktualizacja świąt

Generator pobiera dane z `https://www.kalendarzswiat.pl/` i zapisuje je w plikach kalendarza. Ręczne odświeżenie: `python3 scripts/update_holidays.py`.

## Harmonogram obrazków

Według lokalnej godziny: Morning 6:00–10:59, Midday 11:00–15:59, After Work 16:00–16:59, Evening 17:00–21:59, Night 22:00–5:59.

Po zmianie zawartości folderów odśwież spis obrazków poleceniem `python3 scripts/update_images.py`.

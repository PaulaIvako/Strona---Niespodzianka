# Strona niespodzianka

Statyczna strona dla GitHub Pages.

## Pliki
- `index.html`
- `style.css`
- `script.js`
- `image-pools.json`
- `suchary.json`

## Działanie
- Pokazuje aktualną datę i okazję.
- Pokazuje suchara.
- Pokazuje laurkę z wybranych kategorii e-kartki.
- Przycisk `Zgeneruj` losuje nową laurkę i nowego suchara.

## Aktualizacja świąt
- Dane świąt są zapisywane w `holidays-data.json` i `holidays-data.js`.
- Generator pobiera święta z `https://www.kalendarzswiat.pl/`.
- Ręczne odświeżenie: `python3 scripts/update_holidays.py`

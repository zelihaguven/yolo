# Editing the spot data

All spots live in `spots.json`. The site reads this file on every page load, so a change is live as soon as it is merged into `main`.

## Fields

| Field | Required | Example | Notes |
|---|---|---|---|
| `id` | yes | `"hn-experimenta"` | Unique, never change it later: reviews, saved lists and shared links point to it. |
| `city` | yes | `"heilbronn"` | Must match an `id` in the `cities` list. |
| `name` | yes | `"experimenta Science Center"` | |
| `category` | yes | `"museum"` | One of `cafe`, `food`, `bar`, `park`, `museum`, `sight`, `study`. |
| `price` | yes | `2` | `0` free, `1` € (under 10 €), `2` €€ (10 to 20 €), `3` €€€ (over 20 €). A number, no quotes. |
| `lat`, `lng` | yes | `49.1474`, `9.2152` | Right-click the place on openstreetmap.org → "Show address" to read them. |
| `studentDiscount` | no | `true` | |
| `area` | no | `"Kraneninsel"` | Neighbourhood, shown as a tag. |
| `tip` | no | `"Plan at least half a day."` | One or two sentences. |
| `address` | no | `"Experimenta-Platz, 74072 Heilbronn"` | Shown instead of area + city on the detail page. |
| `hours` | no | see below | Leave it out if you are not sure. |
| `photo` | no | `"photos/hn-experimenta.jpg"` | A file in `docs/photos/`. |
| `photoCredit` | no | `"Sofia W."` | Shown on the photo. |
| `verified` | no | `true` | Set to `true` once you have checked price and discount. This removes the "not checked yet" note. |

## Opening hours

```json
"hours": [
  { "days": "Monday – Friday", "time": "09:00 – 17:00" },
  { "days": "Saturday", "time": "10:00 – 18:00" },
  { "days": "Sunday", "time": "Closed" }
]
```

The word `Closed` is shown in red.

## Photos

Put the file in `docs/photos/` and name it after the spot id, for example `docs/photos/hn-experimenta.jpg`. Use your own photos, or photos whose licence allows reuse, and fill in `photoCredit`. Keep files small: about 1200 px wide and under 300 KB.

## If something goes wrong

- A spot with a missing or wrong required field is left out of the site. Open the browser console (F12) to see which one and why.
- If the whole list is empty with a "Could not load the spot list" message, the file has a syntax error, usually a missing comma or quote. Paste it into jsonlint.com to find the line.

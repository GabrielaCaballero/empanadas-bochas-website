# Weekend availability (Google Sheet tab)

Kitchen pickup and delivery are weekend-only. Which weekend days are
actually open is controlled from the **Sheet3** tab of the same Google
Sheet that holds the events and delivery prices (published to the web, gid
`847530003`). Changes show up on the website within about 5 minutes.

## Columns (row 1 is the header — keep these names)

| Column | Values | Meaning |
|---|---|---|
| Date | `10/3/2026` (M/D/YYYY) | One row per Saturday and Sunday |
| Delivery | `Yes` / `No` | `No` closes delivery for that day |
| Pickup Hours | free text, e.g. `10AM-1PM` | Optional. Kitchen pickup window, shown on the day card and in the confirmation |
| Delivery Hours | free text, e.g. `10AM-1PM` | Optional. Same, for delivery |
| Kitchen Pickup | `Yes` / `No` | **Optional column, not needed.** Only add it to close kitchen pickup on a weekend that has no pop-up |

Blank cells in Delivery count as **Yes**. A weekend day
that isn't in the sheet at all is treated as open, and if the tab is empty
or can't be reached the site just treats every weekend as open — a sheet
mistake can never shut the shop by accident.

## Rules the site applies on top of the sheet

- **Delivery**: any weekend day not marked `No`, whether or not there is a
  pop-up that day.
- **Kitchen pickup**: any weekend day with no pop-up event on that day. Pop-ups
  are read from **Sheet1 (the events tab)** — nothing to repeat in this tab. On pop-up days customers pick up at the
  event instead; the day shows as "Pop-up at <venue> — pick up there".
- Earliest bookable day is tomorrow; customers can book up to 4 weeks out
  (`MIN_LEAD_DAYS` / `WINDOW_DAYS` in `src/lib/weekend-dates.ts`).

## Setting it up

Paste `docs/availability-template.csv` into Sheet3 (File → Import → Upload →
"Replace current sheet", or just paste). It lists every Saturday and Sunday
from 10/3/2026 through 12/31/2027, all set to `Yes`, with empty hours.

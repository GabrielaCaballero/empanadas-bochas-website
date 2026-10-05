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
| Kitchen Pickup | `Yes` / `No` | `No` closes kitchen pickup for that day |
| Pickup Hours | free text, e.g. `11am – 2pm` | Optional. Shown on the day card and in the confirmation |
| Delivery Hours | free text, e.g. `12pm – 5pm` | Optional. Same |

Blank cells in Delivery / Kitchen Pickup count as **Yes**. A weekend day
that isn't in the sheet at all is treated as open, and if the tab is empty
or can't be reached the site just treats every weekend as open — a sheet
mistake can never shut the shop by accident.

## Rules the site applies on top of the sheet

- **Delivery**: any weekend day not marked `No`, whether or not there is a
  pop-up that day.
- **Kitchen pickup**: any weekend day not marked `No` **and** with no pop-up
  event (events tab) on that day. On pop-up days customers pick up at the
  event instead; the day shows as "Pop-up at <venue> — pick up there".
- Earliest bookable day is tomorrow; customers can book up to 4 weeks out
  (`MIN_LEAD_DAYS` / `WINDOW_DAYS` in `src/lib/weekend-dates.ts`).

## Setting it up

Paste `docs/availability-template.csv` into Sheet3 (File → Import → Upload →
"Replace current sheet", or just paste). It lists every Saturday and Sunday
from 10/3/2026 through 12/31/2027, all set to `Yes`.

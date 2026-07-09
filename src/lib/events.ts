export type EventEntry = {
  date: string; // ISO yyyy-mm-dd
  venue: string;
  address: string;
  time: string;
  instagram?: string;
};

// Placeholder data — replace with real upcoming stops before launch.
export const events: EventEntry[] = [
  {
    date: "2026-07-12",
    venue: "Placeholder Brewery Co.",
    address: "123 Sample St, Astoria, NY 11106",
    time: "12:00 PM – 6:00 PM",
    instagram: "https://instagram.com/",
  },
  {
    date: "2026-07-18",
    venue: "Sample Beer Garden",
    address: "456 Example Ave, Long Island City, NY 11101",
    time: "5:00 PM – 9:00 PM",
  },
  {
    date: "2026-07-27",
    venue: "TBD Pop-Up Spot",
    address: "789 Draft Ln, Sunnyside, NY 11104",
    time: "1:00 PM – 5:00 PM",
    instagram: "https://instagram.com/",
  },
];

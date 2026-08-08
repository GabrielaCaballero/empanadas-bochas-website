export type MonthTheme = {
  label: string;
  blurb: string;
  from: string;
  to: string;
  emoji: string;
};

// Seasonal NYC flavor for each month's calendar banner, each blurb tying the
// season back to why an empanada fits it — colors pulled from the brand
// palette plus a couple of seasonal accents, indexed 0 = January.
export const MONTH_THEMES: MonthTheme[] = [
  {
    label: "January",
    blurb:
      "Ringing in the new year under the Times Square ball — pocket-sized and pocket-warm.",
    from: "#1c2b4a",
    to: "#3c1214",
    emoji: "🎆",
  },
  {
    label: "February",
    blurb:
      "Cozy season: a warm empanada in one hand, someone you love in the other.",
    from: "#5c1f2e",
    to: "#7e3023",
    emoji: "❤️",
  },
  {
    label: "March",
    blurb: "Kites over the Hudson, empanadas in the picnic basket.",
    from: "#2f6b4f",
    to: "#3c1214",
    emoji: "🪁",
  },
  {
    label: "April",
    blurb:
      "Cherry blossoms in Sakura Park pair perfectly with a still-warm empanada.",
    from: "#c9789e",
    to: "#7e3023",
    emoji: "🌸",
  },
  {
    label: "May",
    blurb: "Rooftop season is back — and so is the easiest snack to bring up the stairs.",
    from: "#4d7a52",
    to: "#3c1214",
    emoji: "🌱",
  },
  {
    label: "June",
    blurb: "Pride month color floods Fifth Avenue — grab one and join the parade.",
    from: "#c75f3a",
    to: "#8eaed7",
    emoji: "🏳️‍🌈",
  },
  {
    label: "July",
    blurb: "Fireworks over the East River, empanada in hand for the show.",
    from: "#3c1214",
    to: "#c75f3a",
    emoji: "🎇",
  },
  {
    label: "August",
    blurb: "Peak summer, beer gardens, and a handheld bite that doesn't need a fork.",
    from: "#c9862f",
    to: "#7e3023",
    emoji: "☀️",
  },
  {
    label: "September",
    blurb: "Stoop-sitting weather and an empanada that travels as easily as you do.",
    from: "#a3491f",
    to: "#3c1214",
    emoji: "🍂",
  },
  {
    label: "October",
    blurb: "Foliage, jack-o'-lanterns, and a warm empanada for the walk.",
    from: "#7e3023",
    to: "#1c2b4a",
    emoji: "🎃",
  },
  {
    label: "November",
    blurb: "Parade floats down Central Park West — save room for an empanada after.",
    from: "#7e3023",
    to: "#c9862f",
    emoji: "🦃",
  },
  {
    label: "December",
    blurb: "String lights and the Rockefeller tree, empanadas to keep your hands warm.",
    from: "#1c2b4a",
    to: "#3c1214",
    emoji: "🎄",
  },
];

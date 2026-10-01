// Small reusable "(V)" vegetarian marker — green is the universal menu
// convention for vegetarian, kept separate from the brand's warm palette on
// purpose so it still reads instantly next to a flavor name.
export function VegBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 align-middle text-xs font-bold text-green-700">
      🌱 V
    </span>
  );
}

function AllergenChip({
  icon,
  label,
  tone,
}: {
  icon: string;
  label: string;
  tone: "terracotta" | "blue" | "cream" | "green";
}) {
  const toneClasses = {
    terracotta: "border-terracotta/25 bg-terracotta/10 text-rust",
    blue: "border-dusty-blue/50 bg-dusty-blue/20 text-maroon",
    cream: "border-maroon/15 bg-background text-maroon",
    green: "border-green-200 bg-green-100 text-green-700",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${toneClasses}`}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </span>
  );
}

// Shown wherever flavors or ingredients are listed (the home page flavor
// showcase and each product's PDP) so it's visible without needing to click
// into any one specific item.
export default function AllergenLegend() {
  return (
    <div className="rounded-3xl bg-cream p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta/15 text-xl">
          🌾
        </span>
        <h3 className="font-display text-lg font-semibold text-maroon">
          Dietary &amp; Allergen Info
        </h3>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AllergenChip icon="🌾" label="Wheat / Gluten" tone="terracotta" />
        <AllergenChip icon="🥛" label="Dairy" tone="blue" />
        <AllergenChip icon="🥚" label="Egg" tone="cream" />
        <AllergenChip icon="🌱" label="Vegetarian = (V)" tone="green" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-maroon/70">
        All empanada doughs contain wheat (gluten), and every empanada is
        brushed with egg wash before baking. Fillings with cheese or cream
        also contain dairy — and the Beef Malbec filling includes
        hard-boiled egg.
      </p>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-terracotta/30 bg-background px-4 py-3">
        <span className="text-xl leading-none">⚠️</span>
        <p className="text-sm font-medium text-maroon">
          Our food is prepared in a facility that handles wheat, dairy,
          eggs, and other common allergens. Have a severe food allergy or
          special dietary restriction? Please let us know before ordering.
        </p>
      </div>
    </div>
  );
}

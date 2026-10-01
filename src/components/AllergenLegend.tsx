// Shared dietary/allergen notice — shown wherever flavors or ingredients are
// listed (the home page flavor showcase and each product's PDP) so it's
// visible without needing to click into any one specific item.
export default function AllergenLegend() {
  return (
    <div className="rounded-2xl border border-maroon/15 bg-cream px-5 py-4 text-sm text-maroon/70">
      <p>
        <span className="font-semibold text-maroon">Dairy &amp; wheat:</span>{" "}
        All empanada doughs contain wheat (gluten). Fillings with cheese or
        cream also contain dairy. All empanadas are brushed with egg wash
        before baking. Hard-boiled egg is included in the Beef Malbec
        filling.
      </p>
      <p className="mt-2">
        <span className="font-semibold text-maroon">(V)</span> marks
        vegetarian flavors.
      </p>
      <p className="mt-2">
        Our food is prepared in a facility that handles wheat, dairy, eggs,
        and other common allergens. If you have a severe food allergy or
        special dietary restriction, please let us know before ordering.
      </p>
    </div>
  );
}

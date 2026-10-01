export type FlavorInfo = {
  name: string;
  image: string | null;
  description: string;
  ingredients: string;
  // Shown as a "(V)" tag next to the flavor name wherever it's listed.
  vegetarian?: boolean;
};

export const flavorInfo: FlavorInfo[] = [
  {
    name: "Beef Malbec",
    image: "/menu/beef-malbec.webp",
    description:
      "Slow-cooked beef, tender and flavorful, marinated in Argentine Malbec wine. Rich, juicy, and deeply savory.",
    ingredients:
      "Beef, onion, red bell pepper, green scallions, Malbec wine, hard-boiled egg, paprika, black pepper, salt, empanada dough (wheat flour, salt, sunflower oil).",
  },
  {
    name: "Chicken Scallion",
    image: "/menu/chicken-scallion.webp",
    description:
      "Creamy chicken filling with fresh scallions, perfectly balanced and comforting, with a smooth and savory finish.",
    ingredients:
      "Chicken, onion, green scallions, butter, olive oil, black pepper, smoked paprika, garlic powder, salt, empanada dough (wheat flour, salt, sunflower oil).",
  },
  {
    name: "Fugazzeta",
    image: "/menu/fugazzeta.webp",
    description:
      "Sweet caramelized onions and melted mozzarella cheese, inspired by the classic Argentine pizza. Bold, cheesy, and irresistible.",
    ingredients:
      "Caramelized onion, mozzarella cheese, salt, oregano, black pepper, empanada dough (wheat flour, salt, sunflower oil).",
    vegetarian: true,
  },
  {
    name: "Ham & Cheese",
    image: "/menu/ham-cheese.webp",
    description:
      "Classic ham and melted cheese wrapped in a golden baked crust. Simple, comforting, and always a favorite.",
    ingredients:
      "Ham, mozzarella cheese, empanada dough (wheat flour, butter).",
  },
  {
    name: "Spinach White",
    image: "/menu/spinach-white.webp",
    description:
      "Spinach folded into a creamy white sauce with mozzarella and a touch of nutmeg. Comforting, earthy, and rich.",
    ingredients:
      "Spinach, white (bechamel) sauce, mozzarella cheese, nutmeg, empanada dough (wheat flour, butter).",
    vegetarian: true,
  },
  {
    name: "Pork BBQ",
    image: "/menu/pork-bbq.webp",
    description:
      "Slow-cooked pulled pork tossed in smoky BBQ sauce with melted cheese. Sweet, smoky, and satisfying.",
    ingredients:
      "Pulled pork, BBQ sauce, onion, garlic, salt, smoked paprika, empanada dough (wheat flour, salt, sunflower oil).",
  },
  {
    name: "Buffalo Chicken",
    image: "/menu/buffalo-chicken.webp",
    description:
      "Shredded chicken tossed in spicy buffalo sauce with a touch of cream cheese. Bold, tangy, and packs some heat.",
    ingredients:
      "Chicken, buffalo sauce, cream cheese, mozzarella cheese, green scallions, spices, empanada dough (wheat flour, salt, sunflower oil).",
  },
  {
    name: "Cheeseburger",
    image: "/menu/cheeseburger.webp",
    description:
      "Juicy seasoned beef, crispy bacon, and melted cheddar cheese, all wrapped in our handmade dough and baked to perfection.",
    ingredients:
      "Beef, bacon, cheddar cheese, empanada dough (wheat flour, butter).",
  },
];

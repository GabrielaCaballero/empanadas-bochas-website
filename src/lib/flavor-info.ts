export type FlavorInfo = {
  name: string;
  image: string | null;
  description: string;
  ingredients: string;
};

export const flavorInfo: FlavorInfo[] = [
  {
    name: "Beef Malbec",
    image: "/menu/beef-malbec.webp",
    description:
      "Slow-cooked beef, tender and flavorful, marinated in Argentine Malbec wine. Rich, juicy, and deeply savory.",
    ingredients:
      "Beef, onion, red bell pepper, hard-boiled egg, green olives, cumin, paprika, Malbec wine, empanada dough (wheat flour, butter).",
  },
  {
    name: "Chicken Scallion",
    image: "/menu/chicken-scallion.webp",
    description:
      "Creamy chicken filling with fresh scallions, perfectly balanced and comforting, with a smooth and savory finish.",
    ingredients:
      "Chicken, scallions, cream, mozzarella cheese, empanada dough (wheat flour, butter).",
  },
  {
    name: "Fugazzeta",
    image: "/menu/fugazzeta.webp",
    description:
      "Sweet caramelized onions and melted mozzarella cheese, inspired by the classic Argentine pizza. Bold, cheesy, and irresistible.",
    ingredients:
      "Caramelized onion, mozzarella cheese, oregano, empanada dough (wheat flour, butter).",
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
  },
  {
    name: "Pork BBQ",
    image: null,
    description:
      "Slow-cooked pulled pork tossed in smoky BBQ sauce with melted cheese. Sweet, smoky, and satisfying.",
    ingredients:
      "Pulled pork, BBQ sauce, mozzarella cheese, empanada dough (wheat flour, butter).",
  },
];

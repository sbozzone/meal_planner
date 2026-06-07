import {
  format,
  startOfWeek,
  addDays,
  isToday,
  parseISO,
} from "date-fns";

export function getWeekStart(date: Date = new Date()): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function getWeekDays(weekStart: string) {
  const start = parseISO(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE"),
      shortName: format(date, "EEE"),
      dayNumber: format(date, "d"),
      isToday: isToday(date),
    };
  });
}

export function formatWeekLabel(weekStart: string): string {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  const endFmt = start.getMonth() === end.getMonth() ? "d" : "MMM d";
  return `${format(start, "MMM d")} – ${format(end, endFmt)}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

const MEAL_EMOJI_MAP: [string[], string][] = [
  [["shrimp", "prawn", "crab", "lobster", "scallop", "clam", "oyster", "mussel", "seafood"], "🦐"],
  [["salmon", "tuna", "cod", "tilapia", "halibut", "trout", "mahi", "flounder", "bass", "fish"], "🐟"],
  [["steak", "beef", "brisket", "ribeye", "sirloin", "pot roast", "short rib", "ground beef", "meatball", "burger"], "🥩"],
  [["pork", "ham", "bacon", "sausage", "chorizo", "ribs", "pulled pork", "carnitas", "loin chop"], "🐷"],
  [["lamb", "mutton"], "🐑"],
  [["chicken", "turkey", "duck", "poultry", "hen", "wing"], "🍗"],
  [["pizza"], "🍕"],
  [["taco", "burrito", "enchilada", "quesadilla", "fajita", "nachos", "tamale"], "🌮"],
  [["pasta", "spaghetti", "lasagna", "fettuccine", "penne", "linguine", "ravioli", "noodle", "mac and cheese", "macaroni", "risotto", "gnocchi"], "🍝"],
  [["soup", "stew", "chili", "broth", "bisque", "chowder", "ramen", "pho"], "🥣"],
  [["curry", "tikka", "masala", "korma", "saag", "biryani", "dal"], "🫕"],
  [["stir fry", "fried rice", "pad thai", "lo mein", "teriyaki", "bulgogi", "sushi", "hibachi"], "🍱"],
  [["salad"], "🥗"],
  [["egg", "frittata", "quiche", "omelette", "shakshuka", "benedict"], "🥚"],
  [["casserole", "gratin", "bake"], "🫕"],
];

export function getMealEmoji(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [keywords, emoji] of MEAL_EMOJI_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return emoji;
  }
  return null;
}

// A web-search URL for finding a recipe by dish name. Used as a fallback when a
// dish has no saved source_url (e.g. brand-new AI suggestions).
export function recipeSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} recipe`)}`;
}

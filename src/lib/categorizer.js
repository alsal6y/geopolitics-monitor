const COUNTRY_KEYWORDS = [
  { name: "United States", short: "US", keywords: ["united states", "washington dc", "pentagon", "white house", "congress", "nato "] },
  { name: "Iran", short: "Iran", keywords: ["iran", "tehran", "irgc", "iranian"] },
  { name: "Israel", short: "Israel", keywords: ["israel", "tel aviv", "idf", "israeli", "netanyahu"] },
  { name: "Gaza", short: "Gaza", keywords: ["gaza", "hamas", "rafah", "khan younis"] },
  { name: "Russia", short: "Russia", keywords: ["russia", "moscow", "kremlin", "putin", "russian"] },
  { name: "Ukraine", short: "Ukraine", keywords: ["ukraine", "kyiv", "zelensky", "ukrainian"] },
  { name: "China", short: "China", keywords: ["china", "beijing", "xi jinping", "pla", "chinese"] },
  { name: "Taiwan", short: "Taiwan", keywords: ["taiwan", "taipei"] },
  { name: "North Korea", short: "N. Korea", keywords: ["north korea", "pyongyang", "kim jong"] },
  { name: "South Korea", short: "S. Korea", keywords: ["south korea", "seoul"] },
  { name: "UK", short: "UK", keywords: ["britain", " uk ", "united kingdom", "london", "british"] },
  { name: "France", short: "France", keywords: ["france", "paris", "french"] },
  { name: "Germany", short: "Germany", keywords: ["germany", "berlin", "german"] },
  { name: "Saudi Arabia", short: "Saudi", keywords: ["saudi", "riyadh"] },
  { name: "Yemen", short: "Yemen", keywords: ["yemen", "sanaa", "houthi"] },
  { name: "Lebanon", short: "Lebanon", keywords: ["lebanon", "beirut", "hezbollah"] },
  { name: "Syria", short: "Syria", keywords: ["syria", "damascus", "syrian"] },
  { name: "Iraq", short: "Iraq", keywords: ["iraq", "baghdad", "iraqi"] },
  { name: "Pakistan", short: "Pakistan", keywords: ["pakistan", "islamabad"] },
  { name: "India", short: "India", keywords: ["india", "new delhi", "modi"] },
  { name: "Turkey", short: "Turkey", keywords: ["turkey", "ankara", "erdogan", "turkish"] },
  { name: "Egypt", short: "Egypt", keywords: ["egypt", "cairo", "egyptian"] },
  { name: "Libya", short: "Libya", keywords: ["libya", "tripoli"] },
  { name: "Sudan", short: "Sudan", keywords: ["sudan", "khartoum"] },
  { name: "Somalia", short: "Somalia", keywords: ["somalia", "mogadishu"] },
  { name: "Ethiopia", short: "Ethiopia", keywords: ["ethiopia", "addis ababa"] },
  { name: "Nigeria", short: "Nigeria", keywords: ["nigeria", "abuja"] },
  { name: "Venezuela", short: "Venezuela", keywords: ["venezuela", "caracas"] },
  { name: "Cuba", short: "Cuba", keywords: ["cuba", "havana"] },
  { name: "Japan", short: "Japan", keywords: ["japan", "tokyo"] },
  { name: "Philippines", short: "Philippines", keywords: ["philippines", "manila"] },
  { name: "Afghanistan", short: "Afghanistan", keywords: ["afghanistan", "kabul", "taliban"] },
  { name: "Bahrain", short: "Bahrain", keywords: ["bahrain", "manama"] },
  { name: "Qatar", short: "Qatar", keywords: ["qatar", "doha"] },
];

const EVENT_TYPES = [
  {
    type: "Strike",
    color: "#ff3333",
    keywords: ["strike", "attack", "bomb", "missile", "airstrike", "drone strike", "killed", "troops", "assault", "offensive", "explosion", "blast", "rocket", "shell", "artillery", "invad", "raid"],
  },
  {
    type: "Threat",
    color: "#ff8800",
    keywords: ["threat", "warn", "ultimatum", "escalat", "tension", "provocat", "standoff", "hell", "retaliat", "confrontat", "hostile"],
  },
  {
    type: "Sanctions",
    color: "#ffdd00",
    keywords: ["sanction", "tariff", "embargo", "ban ", "restrict", "penalt", "trade war", "export control", "blacklist", "freeze assets"],
  },
  {
    type: "Diplomacy",
    color: "#44aaff",
    keywords: ["talks", "deal", "agreement", "treaty", "summit", "negotiat", "diplomat", "peace", "ceasefire", "truce", "accord", "visit", "meeting"],
  },
  {
    type: "Espionage",
    color: "#44ffcc",
    keywords: ["spy", "espionage", "hack", "cyber", "intelligence", "leak", "covert", "surveil", "intercept", "defect"],
  },
  {
    type: "Unrest",
    color: "#cc66ff",
    keywords: ["protest", "demonstrat", "riot", "uprising", "revolt", "clashes", "crackdown", "coup", "instabilit", "chaos", "collapse"],
  },
  {
    type: "Aid",
    color: "#44dd44",
    keywords: ["aid", "humanitarian", "relief", "evacuat", "refugee", "crisis", "famine", "displace", "shelter", "rescue"],
  },
  {
    type: "Arrest",
    color: "#ff6644",
    keywords: ["arrest", "detain", "prison", "sentence", "trial", "indict", "charge", "convict", "captive"],
  },
];

export function extractCountries(text) {
  const lower = " " + text.toLowerCase() + " ";
  return COUNTRY_KEYWORDS.filter((c) =>
    c.keywords.some((kw) => lower.includes(kw))
  ).map((c) => ({ name: c.name, short: c.short }));
}

export function extractEventType(text) {
  const lower = text.toLowerCase();
  for (const event of EVENT_TYPES) {
    if (event.keywords.some((kw) => lower.includes(kw))) {
      return { type: event.type, color: event.color };
    }
  }
  return { type: "Report", color: "#888888" };
}

export function categorizeAll(articles) {
  return articles.map((article) => {
    const text = article.title + " " + article.description;
    const countries = extractCountries(text);
    const { type: eventType, color: eventColor } = extractEventType(text);
    // Region is derived from first matched country for backwards compat
    const zone = countries.length > 0 ? countries[0].name : "Global";
    return {
      ...article,
      countries,
      eventType,
      eventColor,
      zone,
      color: eventColor,
    };
  });
}

export { EVENT_TYPES };
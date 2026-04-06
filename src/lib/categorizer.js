const COUNTRY_KEYWORDS = [
  { name: "United States", short: "US",           keywords: ["united states", "washington dc", "pentagon", "white house", "congress", "nato ", "trump"] },
  { name: "Iran",          short: "Iran",          keywords: ["iran", "tehran", "irgc", "iranian"] },
  { name: "Israel",        short: "Israel",        keywords: ["israel", "tel aviv", "idf", "israeli", "netanyahu"] },
  { name: "Gaza",          short: "Gaza",          keywords: ["gaza", "hamas", "rafah", "khan younis"] },
  { name: "Russia",        short: "Russia",        keywords: ["russia", "moscow", "kremlin", "putin", "russian"] },
  { name: "Ukraine",       short: "Ukraine",       keywords: ["ukraine", "kyiv", "zelensky", "ukrainian"] },
  { name: "China",         short: "China",         keywords: ["china", "beijing", "xi jinping", "chinese"] },
  { name: "Taiwan",        short: "Taiwan",        keywords: ["taiwan", "taipei"] },
  { name: "North Korea",   short: "N. Korea",      keywords: ["north korea", "pyongyang", "kim jong"] },
  { name: "South Korea",   short: "S. Korea",      keywords: ["south korea", "seoul"] },
  { name: "UK",            short: "UK",            keywords: ["britain", " uk ", "united kingdom", "london", "british"] },
  { name: "France",        short: "France",        keywords: ["france", "paris", "french"] },
  { name: "Germany",       short: "Germany",       keywords: ["germany", "berlin", "german"] },
  { name: "Saudi Arabia",  short: "Saudi",         keywords: ["saudi", "riyadh"] },
  { name: "Yemen",         short: "Yemen",         keywords: ["yemen", "sanaa", "houthi"] },
  { name: "Lebanon",       short: "Lebanon",       keywords: ["lebanon", "lebanese", "beirut", "hezbollah"] },
  { name: "Syria",         short: "Syria",         keywords: ["syria", "damascus", "syrian"] },
  { name: "Iraq",          short: "Iraq",          keywords: ["iraq", "baghdad", "iraqi"] },
  { name: "Pakistan",      short: "Pakistan",      keywords: ["pakistan", "islamabad"] },
  { name: "India",         short: "India",         keywords: ["india", "new delhi", "modi"] },
  { name: "Turkey",        short: "Turkey",        keywords: ["turkey", "ankara", "erdogan", "turkish"] },
  { name: "Egypt",         short: "Egypt",         keywords: ["egypt", "cairo", "egyptian"] },
  { name: "Libya",         short: "Libya",         keywords: ["libya", "tripoli"] },
  { name: "Sudan",         short: "Sudan",         keywords: ["sudan", "khartoum"] },
  { name: "Somalia",       short: "Somalia",       keywords: ["somalia", "mogadishu"] },
  { name: "Ethiopia",      short: "Ethiopia",      keywords: ["ethiopia", "addis ababa"] },
  { name: "Nigeria",       short: "Nigeria",       keywords: ["nigeria", "abuja"] },
  { name: "Venezuela",     short: "Venezuela",     keywords: ["venezuela", "caracas"] },
  { name: "Cuba",          short: "Cuba",          keywords: ["cuba", "havana"] },
  { name: "Japan",         short: "Japan",         keywords: ["japan", "tokyo"] },
  { name: "Philippines",   short: "Philippines",   keywords: ["philippines", "manila"] },
  { name: "Afghanistan",   short: "Afghanistan",   keywords: ["afghanistan", "kabul", "taliban"] },
  { name: "Bahrain",       short: "Bahrain",       keywords: ["bahrain", "manama"] },
  { name: "Qatar",         short: "Qatar",         keywords: ["qatar", "doha"] },
];

const EVENT_TYPES = [
  {
    type: "Strike",
    color: "#ff3333",
    keywords: ["strike", "attack", " bomb", "missile", "airstrike", "drone strike", "killed", "assault", "offensive", "explosion", "blast", "rocket", "shell", "artillery", "invad", "raid"],
  },
  {
    type: "Threat",
    color: "#ff8800",
    keywords: ["threat", "warn", "ultimatum", "escalat", "tension", "provocat", "standoff", "retaliat", "confrontat", "hostile"],
  },
  {
    type: "Sanctions",
    color: "#ffdd00",
    keywords: ["sanction", "tariff", "embargo", "ban ", "restrict", "penalt", "trade war", "export control", "blacklist", "freeze assets"],
  },
  {
    type: "Espionage",
    color: "#44ffcc",
    keywords: ["spy", "espionage", "hack", "cyber", "intelligence", "leak", "covert", "surveil", "intercept", "defect"],
  },
  {
    type: "Arrest",
    color: "#ff6644",
    keywords: ["arrest", "detain", "prison", "sentence", "trial", "indict", "charge", "convict", "captive"],
  },
  {
    type: "Unrest",
    color: "#cc66ff",
    keywords: ["protest", "demonstrat", "riot", "uprising", "revolt", "clashes", "crackdown", "coup d", "junta", "instabilit", "chaos", "collapse"],
  },
  {
    type: "Diplomacy",
    color: "#44aaff",
    keywords: ["talks", "deal", "agreement", "treaty", "summit", "negotiat", "diplomat", "peace", "ceasefire", "truce", "accord"],
  },
  {
    type: "Aid",
    color: "#44dd44",
    keywords: ["humanitarian", "relief", "evacuat", "refugee", "famine", "displace", "rescue"],
  },
  {
    // Not keyword-triggered — assigned exclusively by applyCoherence().
    // Represents: a party confirms or discusses a bilateral event (strike/sanctions)
    // but the headline names fewer than 2 countries, so the bilateral relationship
    // cannot be confirmed from the title alone.
    type: "Statement",
    color: "#aaaaaa",
    keywords: [],
  },
];

// Returns countries sorted by first appearance in text (earliest mention first)
export function extractCountries(text) {
  const lower = " " + text.toLowerCase() + " ";
  return COUNTRY_KEYWORDS
    .filter((c) => c.keywords.some((kw) => lower.includes(kw)))
    .map((c) => {
      const pos = Math.min(
        ...c.keywords.map((kw) => {
          const i = lower.indexOf(kw);
          return i === -1 ? Infinity : i;
        })
      );
      return { name: c.name, short: c.short, pos };
    })
    .sort((a, b) => a.pos - b.pos)
    .map(({ name, short }) => ({ name, short }));
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

// Coherence layer: validates that the event type is consistent with the
// number of countries identified in the headline.
// Strike and Sanctions are bilateral by nature — if fewer than 2 countries
// are named in the title, the bilateral relationship is unconfirmed and the
// article is more likely a statement/report about conflict than the action itself.
function applyCoherence(article) {
  const titleCount = (article.titleCountries || []).length;
  const { eventType } = article;

  if (eventType === "Strike" || eventType === "Sanctions") {
    if (titleCount < 2) {
      return { ...article, eventType: "Statement", eventColor: "#aaaaaa", color: "#aaaaaa" };
    }
  }

  return article;
}

export function categorizeAll(articles) {
  return articles.map((article) => {
    const text = article.title + " " + article.description;
    const countries = extractCountries(text);
    // Track which countries appear in the title specifically (used by arcMapper)
    const titleCountries = extractCountries(article.title).map((c) => c.name);
    const { type: eventType, color: eventColor } = extractEventType(article.title);
    const zone = countries.length > 0 ? countries[0].name : "Global";
    const base = {
      ...article,
      countries,
      titleCountries,
      eventType,
      eventColor,
      zone,
      color: eventColor,
    };

    return applyCoherence(base);
  });
}

export { EVENT_TYPES };

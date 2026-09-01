// PRD §13.2 — 36 Nigerian states + FCT. Shared by waitlist and ambassador
// registration, which collect the same profile fields.
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const EXPERIENCE_BANDS = ["<1", "1-3", "3-5", "5+"] as const;

// Reserved words that may never be claimed as a public slug.
export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "dashboard", "portfolio", "login", "signup",
  "logout", "verify", "reset", "forgot", "settings", "help", "support",
  "about", "contact", "terms", "privacy", "legal", "san", "www", "mail",
  "blog", "offline", "manifest", "robots", "sitemap", "static", "assets",
  "cdn", "null", "undefined", "true", "false", "root", "system",
]);

export const PHONE_REGEX = /^\+234\d{10}$/;
export const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;

/** QTAC ATAR Navigator subject codes (from atar-navigator.qtac.edu.au/subjects.js). */

export type QtacSubject = {
  slug: string;
  code: string;
  name: string;
  english?: boolean;
};

export const QTAC_SUBJECTS: QtacSubject[] = [
  { slug: "english", code: "0001", name: "English", english: true },
  { slug: "literature", code: "0026", name: "Literature", english: true },
  { slug: "english-extension", code: "0002", name: "English and Literature Extension", english: true },
  { slug: "eal", code: "0003", name: "English as an Additional Language", english: true },
  { slug: "general-maths", code: "0052", name: "General Mathematics" },
  { slug: "methods", code: "0053", name: "Mathematical Methods" },
  { slug: "specialist", code: "0054", name: "Specialist Mathematics" },
  { slug: "biology", code: "0042", name: "Biology" },
  { slug: "chemistry", code: "0040", name: "Chemistry" },
  { slug: "physics", code: "0041", name: "Physics" },
  { slug: "psychology", code: "0079", name: "Psychology" },
  { slug: "earth-science", code: "0043", name: "Earth and Environmental Science" },
  { slug: "marine-science", code: "0047", name: "Marine Science" },
  { slug: "economics", code: "0027", name: "Economics" },
  { slug: "accounting", code: "0060", name: "Accounting" },
  { slug: "business", code: "0066", name: "Business" },
  { slug: "legal-studies", code: "0029", name: "Legal Studies" },
  { slug: "modern-history", code: "0021", name: "Modern History" },
  { slug: "ancient-history", code: "0020", name: "Ancient History" },
  { slug: "geography", code: "0024", name: "Geography" },
  { slug: "philosophy", code: "0033", name: "Philosophy and Reason" },
  { slug: "study-of-religion", code: "0086", name: "Study of Religion" },
  { slug: "digital-solutions", code: "0049", name: "Digital Solutions" },
  { slug: "engineering", code: "0074", name: "Engineering" },
  { slug: "design", code: "0048", name: "Design" },
  { slug: "health", code: "0067", name: "Health" },
  { slug: "physical-education", code: "0068", name: "Physical Education" },
  { slug: "food-nutrition", code: "0069", name: "Food and Nutrition" },
  { slug: "japanese", code: "0009", name: "Japanese" },
  { slug: "french", code: "0005", name: "French" },
  { slug: "german", code: "0006", name: "German" },
  { slug: "chinese", code: "0011", name: "Chinese" },
  { slug: "spanish", code: "0018", name: "Spanish" },
  { slug: "italian", code: "0008", name: "Italian" },
];

export const ENGLISH_CODES = new Set(["0001", "0002", "0003", "0026", "4001", "6121"]);

export function qtacBySlug(slug: string): QtacSubject | undefined {
  return QTAC_SUBJECTS.find((s) => s.slug === slug.toLowerCase());
}

export function qtacByCode(code: string): QtacSubject | undefined {
  return QTAC_SUBJECTS.find((s) => s.code === code);
}

/**
 * QCE subject scaling coefficients (logistic form) derived from the
 * Maths Videos Australia / ATAR Predictions QLD SET Plan model (2023 fit).
 * scaled = 100 / (1 + exp(-(a * raw + k)))
 */

export type MvaCoef = { a: number; k: number };

/** 2023 logistic a,k by subject slug */
export const MVA_2023: Record<string, MvaCoef> = {
  accounting: { a: 0.062285738111, k: -3.206479615023 },
  "ancient-history": { a: 0.061432220623, k: -3.623512977979 },
  biology: { a: 0.089416613917, k: -5.935608815518 },
  business: { a: 0.056406445314, k: -3.202367208104 },
  chemistry: { a: 0.112709292077, k: -7.343993349524 },
  chinese: { a: 0.050696096361, k: -2.759671934922 },
  design: { a: 0.0467019848, k: -2.674307460422 },
  "digital-solutions": { a: 0.068610246572, k: -3.677811298031 },
  "earth-science": { a: 0.091990864379, k: -6.491746194767 },
  economics: { a: 0.082031846016, k: -4.434562809764 },
  engineering: { a: 0.074918711344, k: -3.710661746027 },
  english: { a: 0.068467038641, k: -3.818392242142 },
  "english-extension": { a: 0.069620413382, k: -3.675556265257 },
  eal: { a: 0.059052497069, k: -3.212469639285 },
  "food-nutrition": { a: 0.04886357183, k: -2.867223091234 },
  french: { a: 0.101866395218, k: -5.539037529408 },
  "general-maths": { a: 0.049307349338, k: -2.856226257691 },
  geography: { a: 0.066481333424, k: -3.667340341789 },
  german: { a: 0.111030604024, k: -6.630259202218 },
  health: { a: 0.054559879264, k: -3.217234382426 },
  italian: { a: 0.057993501192, k: -2.796200906288 },
  japanese: { a: 0.062366322164, k: -3.116923625173 },
  "legal-studies": { a: 0.058624561822, k: -3.122230228985 },
  literature: { a: 0.078759114586, k: -4.501297587277 },
  "marine-science": { a: 0.072808276692, k: -4.783552533579 },
  methods: { a: 0.07115882201, k: -3.214711445077 },
  "modern-history": { a: 0.068450595624, k: -4.032576065268 },
  philosophy: { a: 0.068948726859, k: -3.565731300069 },
  "physical-education": { a: 0.054872659877, k: -3.386562402043 },
  physics: { a: 0.108826802397, k: -6.990515761711 },
  psychology: { a: 0.07508919922, k: -5.024816536148 },
  spanish: { a: 0.085430522867, k: -4.640656935523 },
  specialist: { a: 0.085635544094, k: -3.923350567581 },
  "study-of-religion": { a: 0.072299873228, k: -4.032184266479 },
};

/** Fallback mid-strength scaling when subject unknown */
const DEFAULT_COEF: MvaCoef = { a: 0.065, k: -3.5 };

export function mvaScaleRaw(subject: string, raw: number): number {
  const r = Math.max(0, Math.min(100, raw));
  const { a, k } = MVA_2023[subject.toLowerCase()] || DEFAULT_COEF;
  const scaled = 100 / (1 + Math.exp(-(a * r + k)));
  return Math.max(0, Math.min(100, Math.round(scaled * 100) / 100));
}

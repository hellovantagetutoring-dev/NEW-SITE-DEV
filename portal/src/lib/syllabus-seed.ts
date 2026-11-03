/** Topic-level Unit 3/4 maps (study-design structure). Titles are short labels for teaching: not full QCAA wording. */

export type SeedTopic = {
 subject: string;
 unit: "unit_3" | "unit_4";
 topic_code: string;
 title: string;
 sort_key: number;
};

const M = (
 subject: string,
 unit: "unit_3" | "unit_4",
 items: [string, string][]
): SeedTopic[] =>
 items.map(([topic_code, title], i) => ({
 subject,
 unit,
 topic_code,
 title,
 sort_key: unit === "unit_3" ? i + 1 : 100 + i + 1,
 }));

export const SYLLABUS_SEED: SeedTopic[] = [
 ...M("methods", "unit_3", [
 ["3.1.1", "Further differentiation: chain, product, quotient"],
 ["3.1.2", "Derivatives of exponential & logarithmic functions"],
 ["3.1.3", "Derivatives of trigonometric functions"],
 ["3.1.4", "Applications of differentiation (rates, optimisation)"],
 ["3.2.1", "Anti-differentiation & indefinite integrals"],
 ["3.2.2", "Definite integrals & area"],
 ["3.2.3", "Fundamental theorem & applications"],
 ["3.3.1", "Discrete random variables"],
 ["3.3.2", "Binomial distribution"],
 ["3.3.3", "Continuous random variables & normal"],
 ]),
 ...M("methods", "unit_4", [
 ["4.1.1", "Further integration techniques"],
 ["4.1.2", "Volumes of solids of revolution"],
 ["4.1.3", "Differential equations (simple models)"],
 ["4.2.1", "Discrete growth & finance models"],
 ["4.2.2", "Logarithmic & exponential models"],
 ["4.3.1", "Sample means & confidence intervals"],
 ["4.3.2", "Hypothesis testing (intro)"],
 ["4.4.1", "Exam technique: calculator & non-calculator"],
 ["4.4.2", "Mixed revision: Units 3 & 4"],
 ]),
 ...M("specialist", "unit_3", [
 ["3.1.1", "Complex numbers: arithmetic & polar form"],
 ["3.1.2", "De Moivre & roots of complex numbers"],
 ["3.2.1", "Matrices: operations & inverse"],
 ["3.2.2", "Transformations & linear systems"],
 ["3.3.1", "Vectors in 2D & 3D"],
 ["3.3.2", "Vector proofs & geometry"],
 ["3.4.1", "Further trigonometry & identities"],
 ["3.4.2", "Proof techniques"],
 ]),
 ...M("specialist", "unit_4", [
 ["4.1.1", "Integration by parts & partial fractions"],
 ["4.1.2", "Volumes & applications of integration"],
 ["4.2.1", "Differential equations & slope fields"],
 ["4.2.2", "Kinematics with calculus"],
 ["4.3.1", "Statistical inference for means"],
 ["4.3.2", "Hypothesis testing"],
 ["4.4.1", "Exam technique: Specialist"],
 ["4.4.2", "Mixed revision: Units 3 & 4"],
 ]),
 ...M("physics", "unit_3", [
 ["3.1.1", "Gravity & motion"],
 ["3.1.2", "Special relativity (intro concepts)"],
 ["3.2.1", "Electromagnetic induction"],
 ["3.2.2", "AC & transformers"],
 ["3.3.1", "Quantum model & photoelectric effect"],
 ["3.3.2", "Wave-particle duality"],
 ]),
 ...M("physics", "unit_4", [
 ["4.1.1", "Particle physics & the Standard Model"],
 ["4.1.2", "Nuclear physics & radioactivity"],
 ["4.2.1", "Waves & superposition"],
 ["4.2.2", "Optics & interference"],
 ["4.3.1", "Student experiment skills"],
 ["4.3.2", "Research investigation skills"],
 ["4.4.1", "External exam technique"],
 ]),
 ...M("chemistry", "unit_3", [
 ["3.1.1", "Chemical equilibrium systems"],
 ["3.1.2", "Equilibrium constants & Le Chatelier"],
 ["3.2.1", "Oxidation & reduction"],
 ["3.2.2", "Electrochemical cells"],
 ["3.3.1", "Organic chemistry: structure"],
 ["3.3.2", "Organic reactions & pathways"],
 ]),
 ...M("chemistry", "unit_4", [
 ["4.1.1", "Structure & properties: materials"],
 ["4.1.2", "Analytical techniques"],
 ["4.2.1", "Chemical synthesis"],
 ["4.2.2", "Green chemistry & design"],
 ["4.3.1", "Student experiment skills"],
 ["4.3.2", "Research investigation skills"],
 ["4.4.1", "External exam technique"],
 ]),
];

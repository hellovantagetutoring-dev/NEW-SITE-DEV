#!/usr/bin/env python3
"""Build merged EA question bank: textbooks + QCAA mocks + CU+ items."""
import fitz, re, json, hashlib, random, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ea_stem_math import is_math_broken, repair_exam_math, marks_to_tokens, flatten_exam_stem
METHODS_MOCK = Path('/Users/liu/Documents/School/❤️ MOCKS/QCAA/Methods')
SPEC_MOCK = Path('/Users/liu/Documents/School/❤️ MOCKS/QCAA/Specialist')
LEGACY_JSON = ROOT / 'assets/vai-ea-textbook-bank.json'

COPY_PATTERNS = [
    r'Cambridge Senior Maths for Queensland.*?party\.?',
    r'ISBN\s*978[\d\-Xx]+\s*©.*?party\.?',
    r'©\s*Evans et al\.\s*\d{4}.*?party\.?',
    r'Photocopying is restricted under law.*?party\.?',
    r'Cambridge University Press',
    r'University Printing House.*?',
    r'Clear zone.*?assessment',
    r'Attach your barcode ID label here',
    r'Book of books used',
    r'of books used',
    r'LUI School code.*?Family name',
    r'Given name/s\s+Family name',
    r'Work in this book will not be marked',
    r'Perusal time.*?Working time',
    r'Mathematical Methods marking guide External assessment',
    r'Specialist Mathematics marking guide',
    r'Question and response book.*?(?=QUESTION\s+\d+|Question\s+\d+|$)',
    r'Multiple choice question book.*?(?=\d{1,2}\s+[A-Za-z]|$)',
    r'Sample assessment\s+\d{4}.*?(?=QUESTION\s+\d+|Question\s+\d+|\d{1,2}\s+[A-Za-z]|$)',
    r'External assessment\s+\d{4}',
    r'Mathematical Methods Paper\s+\d+.*?(?=QUESTION\s+\d+|Question\s+\d+|Section\s+\d|$)',
    r'Specialist Mathematics Paper\s+\d+.*?(?=QUESTION\s+\d+|Question\s+\d+|Section\s+\d|$)',
    r'Time allowed\s*•.*?Planning paper will not be marked\.?',
    r'General instructions\s*•.*?(?=Section\s+\d|QUESTION\s+\d+|Question\s+\d+|$)',
    r'Section\s+\d+\s*\(\d+\s*marks?\).*?Instructions\s*•.*?(?=QUESTION\s+\d+|Question\s+\d+|DO NOT WRITE|$)',
    r'Section\s+\d+\s+Instructions\s*•.*?(?=QUESTION\s+\d+|Question\s+\d+|\d{1,2}\s*\.|$)',
    r'Use a 2B pencil.*?answer bubble.*?',
    r'Ensure you have filled an answer bubble.*?',
    r'A\s+B\s+C\s+D\s+Example:.*?',
    r'QCAA formula (?:book|sheet) provided\.?',
    r'Calculators are not permitted\.?',
    r'Answer all questions in this question and response book\.?',
    r'DO NOT WRITE ON THIS PAGE.*?',
    r'THIS PAGE WILL NOT BE MARKED.*?',
    r'CONTINUE TO THE NEXT PAGE.*?',
    r'Do not write outside this box\.?',
    r'margin trimmed off',
    r'Technology-free',
    r'Technology-active',
]

QUESTION_VERB = re.compile(
    r'\b(find|show|prove|evaluate|calculate|solve|which|determine|sketch|explain|'
    r'write|simplify|expand|factor|differentiate|integrate|state|graph|given|let|'
    r'hence|verify|identify|select|choose|true|false)\b',
    re.I,
)

JUNK_MARKERS = (
    'question and response book',
    'multiple choice question book',
    'lui school code',
    'attach your barcode',
    'section 1 instructions',
    'use a 2b pencil',
    'general instructions',
    'planning paper will not be marked',
)

SYLLABUS_TITLES = {
    'mm-u3-t1': 'Topic 1: Differentiation of exponential and logarithmic functions',
    'mm-u3-t2': 'Topic 2: Differentiation of trigonometric functions and differentiation rules',
    'mm-u3-t3': 'Topic 3: Further applications of differentiation',
    'mm-u3-t4': 'Topic 4: Introduction to integration',
    'mm-u3-t5': 'Topic 5: Discrete random variables',
    'mm-u4-t1': 'Topic 1: Further integration',
    'mm-u4-t2': 'Topic 2: Trigonometry',
    'mm-u4-t3': 'Topic 3: Continuous random variables and the normal distribution',
    'mm-u4-t4': 'Topic 4: Sampling and proportions',
    'mm-u4-t5': 'Topic 5: Interval estimates for proportions',
    'sm-u3-t1': 'Topic 1: Mathematical induction',
    'sm-u3-t2': 'Topic 2: Vectors and matrices',
    'sm-u3-t3': 'Topic 3: Complex numbers',
    'sm-u3-t4': 'Topic 4: Further integration and applications',
    'sm-u3-t5': 'Topic 5: Vector calculus',
    'sm-u4-t1': 'Topic 1: Integration techniques',
    'sm-u4-t2': 'Topic 2: Differential equations',
    'sm-u4-t3': 'Topic 3: Modelling motion',
    'sm-u4-t4': 'Topic 4: Statistical inference',
    'sm-u4-t5': 'Topic 5: Further applications of calculus',
}

OLD_TO_MM = {
    'u3-log': 'mm-u3-t1', 'u3-diff': 'mm-u3-t3', 'u3-trig': 'mm-u3-t2', 'u3-int': 'mm-u3-t4',
    'u4-exp': 'mm-u3-t1', 'u4-disc': 'mm-u3-t5', 'u4-cont': 'mm-u4-t3',
}
OLD_TO_SM = {
    'sm-ind': 'sm-u3-t1', 'sm-vec': 'sm-u3-t2', 'sm-veq': 'sm-u3-t2', 'sm-linear': 'sm-u3-t3',
    'sm-mat': 'sm-u3-t3', 'sm-vcalc': 'sm-u3-t5', 'sm-cplx': 'sm-u3-t4', 'sm-int': 'sm-u4-t1',
    'sm-appint': 'sm-u4-t5', 'sm-de': 'sm-u4-t2', 'sm-motion': 'sm-u4-t3', 'sm-stats': 'sm-u4-t4',
}

MM_RULES = [
    ('mm-u3-t1', r'logarithm|exponential|e\^|ln\('),
    ('mm-u3-t2', r'trigonometric|sin\(|cos\(|tan\(|differentiation rule|chain rule|product rule'),
    ('mm-u3-t3', r'optimis|tangent|stationary|graph sketch|maximum|minimum'),
    ('mm-u3-t4', r'integrat|anti-deriv|area under'),
    ('mm-u3-t5', r'discrete random|expected value|variance|binomial'),
    ('mm-u4-t1', r'further integration|substitution|volumes of revolution'),
    ('mm-u4-t2', r'radian|identit|trigonometry|solve.*sin'),
    ('mm-u4-t3', r'normal distribution|continuous random|probability density'),
    ('mm-u4-t4', r'sample|proportion|survey'),
    ('mm-u4-t5', r'confidence interval|interval estimate'),
]
SM_RULES = [
    ('sm-u3-t1', r'induction|prove.*for all'),
    ('sm-u3-t2', r'vector|scalar product|projection|matrix'),
    ('sm-u3-t3', r'complex|argand|de moivre|cis'),
    ('sm-u3-t4', r'integrat|area|volume'),
    ('sm-u3-t5', r'projectile|vector calculus|kinematic'),
    ('sm-u4-t1', r'integration|substitution|partial fraction|by parts'),
    ('sm-u4-t2', r'differential equation|implicit|logistic|separable'),
    ('sm-u4-t3', r'simple harmonic|newton|force|inclined plane|motion'),
    ('sm-u4-t4', r'confidence|sample mean|statistical inference'),
    ('sm-u4-t5', r'simpson|revolution|application'),
]


def strip_exam_footers(s):
    """Remove QCAA page chrome that PDF extraction appends to question text."""
    prev = None
    while prev != s:
        prev = s
        s = re.sub(
            r'\s+\d{1,2}\s+of\s+\d{1,2}\s+DO NOT WRITE[\s\S]*?(?=(?:QUESTION|Question)\s+\d+|$)',
            ' ',
            s,
            flags=re.I,
        )
        s = re.sub(
            r'\s+\d{1,2}\s+of\s+\d{1,2}(?:\s+DO NOT WRITE[\s\S]*)?$',
            ' ',
            s,
            flags=re.I,
        )
    s = re.sub(r'\s+END OF PAPER\s*', ' ', s, flags=re.I)
    s = re.sub(r'(\s+\d{1,2}\s+of\s+\d{1,2})+', ' ', s)
    s = re.sub(r'\s+Do not write outside this box\.?\s*', ' ', s, flags=re.I)
    return s


def repair_stem_math(s):
    """Restore formulas lost when QCAA PDFs export as images."""
    uniform_pdf = (
        '[[DISPLAY:f(x)=\\begin{cases}\\dfrac{1}{b-a}, & a \\le x \\le b \\\\ '
        '0, & \\text{otherwise}\\end{cases}]]'
    )
    uniform_ev = '[[DISPLAY:E(X)=\\dfrac{a+b}{2},\\quad \\mathrm{Var}(X)=\\dfrac{(b-a)^2}{12}.]]'
    uniform_gap = re.compile(
        r'defined over the interval\s*,\s*is uniformly distributed if its probability density function is defined by:\s*'
        r'The expected value and variance of a uniform random variable X are\s*',
        re.I,
    )

    def _uniform(m):
        return (
            'defined over the interval [a, b], is uniformly distributed if its probability density function is defined by:\n\n'
            + uniform_pdf + '\n\n'
            'The expected value and variance of a uniform random variable X are\n\n'
            + uniform_ev + '\n\n'
        )

    s = uniform_gap.sub(_uniform, s)
    s = re.sub(r'defined over the interval\s*,\s*is', 'defined over the interval [a, b], is', s, flags=re.I)
    pdf_only = '[[DISPLAY:f(x)=\\dfrac{1}{b-a}\\ \\text{for}\\ a \\le x \\le b\\ \\text{(0 otherwise)}]]'
    s = re.sub(
        r'probability density function is defined by:\s*(?=The expected value)',
        lambda _m: 'probability density function is defined by:\n\n' + pdf_only + '\n\n',
        s,
        flags=re.I,
    )
    return s


def clean(s):
    s = flatten_exam_stem(s)
    for p in COPY_PATTERNS:
        s = re.sub(p, ' ', s, flags=re.I | re.S)
    s = strip_exam_footers(s)
    s = repair_stem_math(s)
    s = repair_exam_math(s)
    s = marks_to_tokens(s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def is_exam_junk(stem):
    if len(stem) < 40:
        return True
    low = stem.lower()
    if any(m in low for m in JUNK_MARKERS) and not QUESTION_VERB.search(stem):
        return True
    if re.match(r'(?i)(?:sample assessment|external assessment|section\s+\d+\s*\()', stem):
        if not QUESTION_VERB.search(stem):
            return True
    return False


def normalize_mock_stem(part):
    m = re.match(r'(?is)(?:QUESTION|Question)\s+(\d+)\s*(.*)', part.strip())
    if not m:
        return None, None
    qn = m.group(1)
    stem = clean('QUESTION ' + qn + ' ' + (m.group(2) or ''))
    if is_math_broken(stem) or is_exam_junk(stem):
        return None, None
    return qn, stem


def classify(stem, rules, default):
    for tid, pat in rules:
        if re.search(pat, stem, re.I):
            return tid
    return default


def infer_diff(stem, qtype=None):
    if qtype == 'mc':
        return 'sf'
    if re.search(r'\bshow that\b|\bprove\b', stem, re.I):
        return 'cu'
    if len(stem) > 450:
        return 'cu'
    if len(stem) > 220:
        return 'cf'
    return 'sf'


def detailed_steps(stem, topic_id, diff, extra=None):
    title = SYLLABUS_TITLES.get(topic_id, topic_id)
    steps = [
        {'t': 'text', 'v': 'Read the entire question. Highlight command words (find, show, prove, evaluate, sketch) and list given data versus what you must obtain.'},
        {'t': 'text', 'v': 'This item is from ' + title + '. Recall the definitions and formulas from that topic before you start calculating.'},
        {'t': 'text', 'v': 'Write a clear plan: which theorem or rule applies first, and how later parts connect (especially for multi-part questions).'},
    ]
    if diff == 'cuplus':
        steps.append({'t': 'text', 'v': 'CU+ items deliberately combine two syllabus topics. Solve each part separately, then link the results in a final conclusion.'})
    elif diff == 'cu':
        steps.append({'t': 'text', 'v': 'Complex unfamiliar questions often need an intermediate result. Establish that result explicitly before the final answer.'})
    snippet = stem[:280] + ('…' if len(stem) > 280 else '')
    steps.append({'t': 'text', 'v': 'Set up the working from the stem: ' + snippet})
    if extra:
        for part in re.split(r'(?<=[.!?])\s+', extra[:1500]):
            if len(part) > 30:
                steps.append({'t': 'text', 'v': part})
    else:
        steps.extend([
            {'t': 'text', 'v': 'Show every algebraic step; QCAA marking awards method marks for logical progression even if the final number is wrong.'},
            {'t': 'text', 'v': 'Use exact values (fractions, surds, π) until the final line unless the question asks for a decimal.'},
        ])
    steps.append({'t': 'text', 'v': 'State the final answer with units if needed. Check domain, reasonableness, and that you answered what was asked.'})
    return steps


def year_from(name):
    m = re.search(r'(?:^|_)(\d{2})_ea|specialist_(\d{2})', name)
    if m:
        g = m.group(1) or m.group(2)
        return '20' + g
    return 'unknown'


def pdf_text(doc):
    return '\n'.join(doc.load_page(i).get_text('text', sort=True) for i in range(doc.page_count))


def extract_mocks(folder, subject, rules, default):
    items = []
    if not folder.exists():
        return items
    for rp in sorted(folder.glob('*.pdf')):
        name = rp.name.lower()
        if 'question_response' not in name and 'smple_question_response' not in name:
            continue
        doc = fitz.open(rp)
        full = clean(pdf_text(doc))
        parts = re.split(r'(?=QUESTION\s+\d+)|(?=Question\s+\d+\b)', full, flags=re.I)
        y = year_from(rp.name)
        paper = 'p1' if '_p1_' in name or 'p1_' in name else ('p2' if '_p2_' in name else 'p1')
        for part in parts:
            part = part.strip()
            if len(part) < 80:
                continue
            qn, stem = normalize_mock_stem(part[:4000])
            if not stem:
                continue
            stem = stem[:2400]
            tid = classify(stem, rules, default)
            diff = infer_diff(stem)
            qid = hashlib.md5((subject + y + paper + qn + stem[:160]).encode()).hexdigest()[:14]
            items.append({
                'id': 'mock-' + qid,
                'subject': subject,
                'topic': tid,
                'diff': diff,
                'stem': stem,
                'source': 'mock',
                'year': y,
                'paper': paper,
                'qtype': 'response',
                'tech': 'Technology-free' if paper == 'p1' else 'Technology-active',
                'marks': '4 marks' if diff != 'sf' else '3 marks',
                'parts': 'Past exam · EA ' + y + ' · Paper ' + paper[-1],
            })
    for mp in sorted(folder.glob('*mc_question*.pdf')):
        doc = fitz.open(mp)
        full = clean(pdf_text(doc))
        y = year_from(mp.name)
        name = mp.name.lower()
        paper = 'p1' if '_p1_' in name else 'p2'
        chunks = re.split(r'(?=QUESTION\s+\d+\b)', full, flags=re.I)
        for ch in chunks:
            ch = clean(ch.strip())
            if len(ch) < 45 or len(ch) > 2400:
                continue
            if is_exam_junk(ch):
                continue
            tid = classify(ch, rules, default)
            qid = hashlib.md5(('mc' + subject + y + ch[:100]).encode()).hexdigest()[:14]
            items.append({
                'id': 'mc-' + qid,
                'subject': subject,
                'topic': tid,
                'diff': 'sf',
                'stem': ch,
                'source': 'mock',
                'year': y,
                'paper': paper,
                'qtype': 'mc',
                'tech': 'Technology-free' if paper == 'p1' else 'Technology-active',
                'marks': '1 mark',
                'parts': 'Past exam · Multiple choice · ' + y,
            })
    return items


def load_textbook():
    items = []
    if not LEGACY_JSON.exists():
        return items
    for it in json.loads(LEGACY_JSON.read_text()):
        if it.get('source') == 'mock':
            continue
        stem = clean(it.get('stem', ''))
        if len(stem) < 40 or is_exam_junk(stem):
            continue
        it['stem'] = stem
        it['source'] = 'textbook'
        if it['subject'] == 'methods':
            it['topic'] = OLD_TO_MM.get(it['topic'], it['topic'])
        else:
            it['topic'] = OLD_TO_SM.get(it['topic'], it['topic'])
        items.append(it)
    return items


def build_cuplus():
    out = []
    random.seed(42)
    mm = list(SYLLABUS_TITLES.keys())[:10]
    sm = list(SYLLABUS_TITLES.keys())[10:20]
    for subject, topics, prefix in [
        ('methods', mm, 'methods-cuplus'),
        ('specialist', sm, 'specialist-cuplus'),
    ]:
        for i in range(30):
            a, b = random.sample(topics, 2)
            ta = SYLLABUS_TITLES[a]
            tb = SYLLABUS_TITLES[b]
            stem = (
                f'Extended response (CU+): Part A uses {ta}. Part B uses {tb}. '
                f'Show all reasoning and link the results in a conclusion.'
            )
            out.append({
                'id': f'cuplus-{subject}-{i}',
                'subject': subject,
                'topic': prefix,
                'topics': [a, b],
                'diff': 'cuplus',
                'stem': stem,
                'source': 'synthetic',
                'year': 'practice',
                'qtype': 'response',
                'tech': 'Technology-active',
                'marks': '6 marks',
                'parts': 'CU+ cross-topic',
            })
    return out


def main():
    textbook = load_textbook()
    mocks = extract_mocks(METHODS_MOCK, 'methods', MM_RULES, 'mm-u3-t1')
    mocks += extract_mocks(SPEC_MOCK, 'specialist', SM_RULES, 'sm-u3-t1')
    cuplus = build_cuplus()
    all_items = textbook + mocks + cuplus

    seen = set()
    final = []
    for it in all_items:
        it['stem'] = clean(it.get('stem', ''))
        if it.get('source') == 'mock' and is_math_broken(it['stem']):
            continue
        if len(it['stem']) < 40 or is_exam_junk(it['stem']):
            continue
        key = it['stem'][:100]
        if key in seen:
            continue
        seen.add(key)
        it['steps'] = detailed_steps(it['stem'], it['topic'], it.get('diff', 'cf'))
        final.append(it)

    out_js = ROOT / 'assets/vai-ea-textbook-bank.js'
    out_js.write_text('window.VaiEaTextbookBank=' + json.dumps(final, ensure_ascii=False) + ';\n')
    (ROOT / 'assets/vai-ea-textbook-bank.json').write_text(json.dumps(final, ensure_ascii=False))
    print(f'Wrote {len(final)} questions ({len(textbook)} textbook, {len(mocks)} mock, {len(cuplus)} CU+)')

if __name__ == '__main__':
    main()

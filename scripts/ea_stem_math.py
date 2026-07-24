"""Flatten QCAA PDF stems and repair scrambled / image-only maths."""
import re

MARK_RE = re.compile(r'\[\s*(\d+)\s*marks?\s*\]', re.I)


def flatten_exam_stem(s):
    s = s.replace('\u200b', '').replace('\ufeff', '')
    s = s.replace('\xa0', ' ')
    s = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', ' ', s)
    lines = s.split('\n')
    out = []
    buf = []

    def flush():
        if buf:
            out.append(' '.join(buf))
            buf.clear()

    for line in lines:
        t = line.strip()
        if not t:
            flush()
            continue
        if re.match(r'^QUESTION\s+\d+', t, re.I):
            flush()
            out.append(t)
            continue
        if re.match(r'^[a-z]\)\s*', t, re.I):
            flush()
            out.append(t)
            continue
        if len(t) <= 14 and not re.match(r'^[A-Z][a-z]{4,}', t):
            buf.append(t)
        else:
            flush()
            out.append(t)
    flush()
    s = '\n'.join(out)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


def _norm_funcs(s):
    s = re.sub(r'\b([fgh])\s*\(\s*x\s*\)', r'\1(x)', s, flags=re.I)
    s = re.sub(r"\b([fgh])'\s*\(\s*x\s*\)", r"\1'(x)", s, flags=re.I)
    s = re.sub(r"\(\s*\)\s*'\s*([fgh])\s+([ex])\b", r"\1'(\2)", s, flags=re.I)
    s = re.sub(r'\(\s*x\s*\)', '(x)', s)
    return s


def repair_exam_math(s):
    s = _norm_funcs(s)

    s = re.sub(
        r'Determine the derivative of\s*\(\s*\)\s*2\s*1\s*3\s*\+\s*=\s*x\s+f\s+x\s+e\b',
        r'Determine the derivative of [[INLINE:f(x)=3e^{2x+1}]]',
        s,
        flags=re.I,
    )
    s = re.sub(
        r'Determine the derivative of\s+f\s*\(\s*x\s*\)\s*=\s*3\s*e\s*2\s*x\s*\+\s*1',
        r'Determine the derivative of [[INLINE:f(x)=3e^{2x+1}]]',
        s,
        flags=re.I,
    )
    s = re.sub(
        r'Determine the derivative of\s+f\s*\(\s*x\s*\)\s*=\s*3e\s*2x\s*\+\s*1',
        r'Determine the derivative of [[INLINE:f(x)=3e^{2x+1}]]',
        s,
        flags=re.I,
    )

    s = re.sub(
        r'Given that\s*\(\s*\)\s*\(\s*\)\s*ln\s*=\s*x\s+g\s+x\s+x\b',
        r'Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]]',
        s,
        flags=re.I,
    )
    s = re.sub(
        r'Given that\s+g\s*\(\s*x\s*\)\s*=\s*ln\s*\(\s*x\s*\)\s*/\s*x',
        r'Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]]',
        s,
        flags=re.I,
    )
    s = re.sub(
        r'Given that\s+g\s*\(\s*x\s*\)\s*=\s*\\frac\{\\ln x\}\{x\}',
        r'Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]]',
        s,
        flags=re.I,
    )

    s = re.sub(
        r'determine the simplest value of\s+g\s*\(\s*\)\s*\'\s*\(\s*e\s*\)',
        r"determine the simplest value of [[INLINE:g'(e)]]",
        s,
        flags=re.I,
    )
    s = re.sub(
        r'determine the simplest value of\s+g\'\s*\(\s*e\s*\)',
        r"determine the simplest value of [[INLINE:g'(e)]]",
        s,
        flags=re.I,
    )
    s = re.sub(
        r"determine the simplest value of\s+g\s*[′']\s*\(\s*e\s*\)\s*\.?",
        r"determine the simplest value of [[INLINE:g'(e)]].",
        s,
        flags=re.I,
    )

    s = re.sub(
        r'\[\[MARK:1\]\]\s*ln\s*\(\s*x\s*\)\s*b\)\s*Given that\s+g\s*\(\s*x\s*\)\s*=\s*,',
        r'[[MARK:1]] b) Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]],',
        s,
        flags=re.I,
    )
    s = re.sub(
        r'ln\s*\(\s*x\s*\)\s*b\)\s*Given that\s+g\s*\(\s*x\s*\)\s*=\s*,',
        r'b) Given that [[INLINE:g(x)=\\dfrac{\\ln x}{x}]],',
        s,
        flags=re.I,
    )
    s = re.sub(r'\s+x\s+c\)\s', ' c) ', s, flags=re.I)
    s = re.sub(r'\s+x\s+(?=c\))', ' ', s, flags=re.I)

    s = re.sub(
        r'Determine the second derivative of\s*\(\s*\)\s*\(\s*\)\s*sin\s*=\s*x\s+h\s+x\s+x\b',
        r'Determine the second derivative of [[INLINE:h(x)=x\\sin x]]',
        s,
        flags=re.I,
    )
    s = re.sub(
        r'Determine the second derivative of\s+h\s*\(\s*x\s*\)\s*=\s*x\s*sin\s*\(\s*x\s*\)',
        r'Determine the second derivative of [[INLINE:h(x)=x\\sin x]]',
        s,
        flags=re.I,
    )

    s = re.sub(r'3\s*e\s*2\s*x\s*\+\s*1', '3e^{2x+1}', s)
    return s


def is_math_broken(s):
    if re.search(r'\(\s*\)\s*[\d\+\s]{2,}\s*=\s*x\s+f\s+x', s, re.I):
        return True
    if re.search(r'\(\s*\)\s*\(\s*\)\s*ln\s*=\s*x', s, re.I):
        return True
    if re.search(r'\(\s*\)\s*\(\s*\)\s*sin\s*=\s*x', s, re.I):
        return True
    if s.count('( )') >= 2:
        return True
    return False


def marks_to_tokens(s):
    return MARK_RE.sub(r' [[MARK:\1]] ', s)


def prepare_exam_stem(s):
    s = flatten_exam_stem(s)
    s = marks_to_tokens(s)
    s = repair_exam_math(s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()

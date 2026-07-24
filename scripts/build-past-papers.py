#!/usr/bin/env python3
"""Regenerate the Vantage AI past-papers viewer assets.

Renders local QCAA past-paper PDFs (CC BY 4.0, (c) State of Queensland QCAA)
to page images and rebuilds the manifest consumed by
vantage-ai/past-papers/index.html.

Output layout (matches the live viewer):
  vantage-ai/past-papers/img/{docId}/{n}.jpg   e.g. img/mm-20-p1-mc/1.jpg
  vantage-ai/past-papers/manifest.js           window.PP_MANIFEST = {...}
"""
import os, re, json
import fitz

SRC = {
    'mm': '/Users/liu/Documents/School/\u2764\ufe0f MOCKS/QCAA/Methods',
    'sm': '/Users/liu/Documents/School/\u2764\ufe0f MOCKS/QCAA/Specialist',
}
SUBJECT_NAMES = {'mm': 'Mathematical Methods', 'sm': 'Specialist Mathematics'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'vantage-ai', 'past-papers')
ZOOM, QUALITY = 1.8, 72

KIND_LABEL = {
    'mc': 'Multiple choice question book',
    'qr': 'Question & response book',
    'guide': 'Marking guide',
}

def parse(fname):
    n = fname.lower().replace(' (1)', '')
    if not n.endswith('.pdf'):
        return None
    m = re.search(r'_(2[0-9])_ea', n)
    if not m:
        return None
    d = {'year': 2000 + int(m.group(1)),
         'sample': ('sample' in n) or ('smple' in n)}
    pm = re.search(r'p([12])', n)
    d['paper'] = int(pm.group(1)) if pm else None
    if 'mark_guide' in n or 'mark guide' in n:
        d['kind'] = 'guide'
    elif 'mc_question' in n:
        d['kind'] = 'mc'
    elif 'question_response' in n:
        d['kind'] = 'qr'
    else:
        return None
    return d

def doc_id(subj, d):
    bits = [subj, str(d['year'] % 100)]
    if d['sample']:
        bits.append('smpl')
    bits.append('p%d' % d['paper'] if d['paper'] else 'all')
    bits.append(d['kind'])
    return '-'.join(bits)

def label(d):
    lab = KIND_LABEL[d['kind']]
    core = ('Paper %d \u2014 %s' % (d['paper'], lab)) if d['paper'] else \
           (lab + ' (Papers 1 & 2)')
    return ('Sample: ' + core) if d['sample'] else core

def sort_key(d):
    # Within a year: P1 mc/qr/guide, P2 mc/qr/guide, combined guide; samples last.
    kind_order = {'mc': 0, 'qr': 1, 'guide': 2}
    return (d['sample'], d['paper'] or 3, kind_order[d['kind']])

subjects = []
total = 0
for subj in ('mm', 'sm'):
    seen, docs = set(), []
    for fname in sorted(os.listdir(SRC[subj])):
        d = parse(fname)
        if not d:
            continue
        key = (d['year'], d['sample'], d['paper'], d['kind'])
        if key in seen:
            continue
        seen.add(key)
        d['file'] = os.path.join(SRC[subj], fname)
        d['id'] = doc_id(subj, d)
        d['label'] = label(d)
        docs.append(d)

    years = {}
    for d in docs:
        out_dir = os.path.join(OUT, 'img', d['id'])
        os.makedirs(out_dir, exist_ok=True)
        pdf = fitz.open(d['file'])
        d['pages'] = len(pdf)
        for i in range(len(pdf)):
            out_path = os.path.join(out_dir, '%d.jpg' % (i + 1))
            if not os.path.exists(out_path):
                pdf[i].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM)).save(
                    out_path, jpg_quality=QUALITY)
        total += d['pages']
        years.setdefault(d['year'], []).append(d)
        print('%-24s %2d pages  %s' % (d['id'], d['pages'], d['label']))

    subjects.append({'id': subj, 'name': SUBJECT_NAMES[subj], 'years': [
        {'year': y, 'docs': [
            {k: d[k] for k in ('id', 'year', 'sample', 'paper', 'kind', 'label', 'pages')}
            for d in sorted(years[y], key=sort_key)]}
        for y in sorted(years)]})

with open(os.path.join(OUT, 'manifest.js'), 'w') as f:
    f.write('window.PP_MANIFEST = ' + json.dumps({'subjects': subjects}) + ';\n')
print('\nTotal pages:', total)

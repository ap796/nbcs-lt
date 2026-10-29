#!/usr/bin/env python3
"""Check local page/asset references without third-party dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re, sys, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'public'
errors = []
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.ids=set(); self.refs=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'):
            if a['id'] in self.ids: errors.append('Duplicate id: '+a['id'])
            self.ids.add(a['id'])
        for key in ('src','href','poster'):
            if a.get(key): self.refs.append(a[key])
        if tag=='img' and 'alt' not in a: errors.append('Image missing alt text')
        if tag=='iframe' and not a.get('title'): errors.append('Iframe missing title')

pages={p:Page(p.read_text(encoding='utf-8')) for p in ROOT.rglob('*.html')}
refs=0

def check(base, ref):
    global refs
    u=urlsplit(ref)
    if u.scheme or u.netloc: return
    refs+=1
    target=(ROOT/unquote(u.path).lstrip('/')) if u.path.startswith('/') else (base.parent/unquote(u.path)) if u.path else base
    target=target.resolve()
    if target.is_dir(): target=target/'index.html'
    if not target.is_relative_to(ROOT.resolve()): errors.append('Path outside public: '+ref); return
    if not target.is_file(): errors.append(f'{base.relative_to(ROOT)}: missing {ref}'); return
    if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
        errors.append(f'{base.relative_to(ROOT)}: missing fragment {ref}')

for p,page in pages.items():
    for ref in page.refs: check(p,ref)
for p in ROOT.rglob('*.css'):
    for ref in re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)',p.read_text()): check(p,ref)
for p in ROOT.rglob('*.svg'):
    try:
        tree=ET.fromstring(p.read_text())
        if not tree.tag.endswith('svg'): errors.append('Not an SVG: '+str(p))
    except ET.ParseError as e: errors.append(str(e))
for p in ROOT.rglob('*'):
    if p.is_file() and p.stat().st_size>25*1024*1024: errors.append('Oversize Pages asset: '+str(p))
    if p.suffix in ('.html','.css','.js'):
        text=p.read_text()
        if re.search(r'chatgpt\.site|appgprj_|git\.chatgpt-team',text): errors.append('Sites hosting dependency: '+str(p))
for line in (ROOT/'_redirects').read_text().splitlines():
    if not line.strip() or line.startswith('#'): continue
    parts=line.split()
    if len(parts)!=3 or parts[2] not in ('301','302','303','307','308'): errors.append('Invalid redirect: '+line)
    else: check(ROOT/'index.html',parts[1])
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(pages)} HTML pages, {refs} local references, SVG files, redirect destinations and asset sizes.')
print('External services, actual Pages routing and browser interactions require a live check.')

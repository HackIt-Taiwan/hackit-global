from pathlib import Path
from lxml import html
import re
root = Path(__file__).resolve().parent.parent / 'source/static'
original = html.parse(str(root / 'index.html'))
for locale in ['zh-TW', 'zh-HK', 'zh-CN', 'en']:
    markup = (root / locale / 'index.html').read_text()
    doc = html.document_fromstring(markup)
    for expr in ['//script[not(@src) and not(@type)]', '//*[@onload]', '//*[@onerror]']:
        before = original.xpath(expr)
        after = doc.xpath(expr)
        assert len(before) == len(after), (locale, expr)
        for a, b in zip(before, after):
            assert a.text == b.text, (locale, 'inline script changed')
            for key in ['onload', 'onerror']:
                assert a.get(key) == b.get(key), (locale, key)
    assert 'viewBox=' in markup, (locale, 'SVG case lost')
    assert len(doc.xpath('//details[@class="ssr-story-full"]')) == 3
    assert len(doc.xpath('//noscript//a[@hreflang]')) == 4
    if locale == 'en':
        for el in doc.iter():
            if el.tag in ['script', 'style']:
                continue
            for value in [el.text, el.tail, *el.attrib.values()]:
                if value and re.search('[一-鿿]', value):
                    assert el.tag == 'a' and el.get('hreflang') in ['zh-TW', 'zh-HK', 'zh-CN'], ('English Chinese residue', value)
print('SSR HTML parity passed: entry scripts, load/error attributes, SVG geometry attribute case, native story details and language links, English localization residue scan.')

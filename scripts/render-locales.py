"""Build-only lxml renderer. Localized content is present before browser JS executes."""
from pathlib import Path
import json, re, sys, html as esc
from lxml import html, etree
root = Path(__file__).resolve().parent.parent
payload = json.load(sys.stdin)
source = (root / 'source/static/index.html').read_text()
svgs = []

def protect(m):
    svgs.append(m.group(0))
    return '<div data-ssr-svg="' + str(len(svgs) - 1) + '"></div>'
protected = re.sub('<svg\\b.*?</svg>', protect, source, flags=re.S)

def cls(name):
    return 'contains(concat(" ",normalize-space(@class)," ")," ' + name + ' ")'

def clear(el):
    for child in list(el):
        el.remove(child)
    el.text = None

def put(el, value):
    clear(el)
    el.text = str(value)

def append_text(el, value):
    if len(el):
        el[-1].tail = (el[-1].tail or '') + value
    else:
        el.text = (el.text or '') + value
for locale in payload['locales']:
    d = payload['dictionaries'][locale]
    doc = html.document_fromstring(protected, parser=html.HTMLParser(no_network=True))
    doc.set('lang', locale)
    doc.set('data-locale', locale)

    def nodes(x):
        return doc.xpath(x)

    def text(x, v):
        for e in nodes(x):
            put(e, v)

    def attr(x, k, v):
        for e in nodes(x):
            e.set(k, str(v))

    def C(c):
        return '//*[' + cls(c) + ']'

    def lines(x, values, span=False):
        for el in nodes(x):
            clear(el)
            for i, v in enumerate(values):
                if i:
                    el.append(html.Element('br'))
                if i and span:
                    child = html.Element('span')
                    child.text = v
                    el.append(child)
                else:
                    append_text(el, v)
    text('//title', d['title'])
    attr('//meta[@name="description"]', 'content', d['description'])
    attr('//meta[@name="robots"]', 'content', 'index,follow,max-image-preview:large' if payload['indexing'] else 'noindex,nofollow')
    text('//*[@id="skip-story"]', d['skip'])
    attr(C('map-scene'), 'aria-label', d['map'])
    attr(C('reading-map'), 'alt', d['mapDetail'])
    attr(C('map-controls'), 'aria-label', d['mapView'])
    text(C('map-pan-hint'), d['panWorld'])
    attr(C('map-viewport'), 'aria-label', d['panWorldLabel'])
    text('//*[@data-view="asia"]', d['asia'])
    text('//*[@data-view="world"]', d['world'])
    attr(C('panel-close'), 'aria-label', d['closeTaiwan'])
    text(C('country-name') + '/span', '' if locale == 'en' else d['taiwan'])
    text(C('country-panel') + '/a', d['goTaiwan'].replace(' ↗', ''))
    text(C('reading-region') + '/a', d['taiwanLabel'])
    for el in nodes(C('wall-header') + '/h2'):
        clear(el)
        for v in d['wallTitle']:
            child = html.Element('span')
            child.text = v
            if locale == 'en':
                child.tail = ' '
            el.append(child)
    text(C('wall-header') + '/p', d['wallNote'])
    lines(C('photo-heading'), d['photoHeading'])
    text(C('mission-scene') + '/*[' + cls('small-label') + ']', d['belief'])
    lines('//*[@id="mission-title"]', d['mission'], True)
    for el in nodes('//div[' + cls('mission-body') + ']'):
        clear(el)
        for block in payload['missionBlocks'][locale]:
            node = html.Element(block['tag'])
            node.set('class', block['className'])
            if block.get('editorial'):
                node.set('data-editorial', 'true')
            if block.get('sectionIndex') == 5:
                for i, line in enumerate(block['text'].split('\n')):
                    if i:
                        append_text(node, '\n')
                    row = html.Element('span')
                    row.set('class', 'force-row')
                    row.text = line
                    node.append(row)
            elif block.get('sectionIndex') == 7 and '^' in block['text']:
                a, b = block['text'].split('^', 1)
                node.text = a
                marker = html.Element('span')
                marker.set('class', 'formula-power-marker')
                marker.text = '^'
                node.append(marker)
                sup = html.Element('sup')
                sup.set('class', 'formula-exponent')
                sup.text = b
                node.append(sup)
            else:
                node.text = block['text']
            el.append(node)
    text(C('join-scene') + '/*[' + cls('small-label') + ']', d['joinLabel'])
    lines('//*[@id="join-title"]', d['joinTitle'])
    for el in nodes(C('join-open')):
        put(el, d['join'] + ' ')
        arrow = html.Element('span')
        arrow.set('class', 'corner-arrow')
        arrow.set('aria-hidden', 'true')
        el.append(arrow)
    lines(C('reading-view') + '/h2', d['readingTitle'])
    text(C('reading-view') + '/p[not(' + cls('reading-region') + ')]', d['readingCopy'])
    attr('//*[@id="join-dialog"]//button', 'aria-label', d['closeJoin'])
    text('//*[@id="join-dialog"]/*[' + cls('small-label') + ']', d['dialogLabel'])
    text('//*[@id="join-dialog-title"]', d['dialogTitle'])
    text('//*[@id="join-dialog"]/p[not(' + cls('small-label') + ')]', d['dialogCopy'])
    text(C('region-link') + '//small', '' if locale == 'en' else d['taiwan'])
    text(C('dialog-contact') + '/span', d['collaborate'])
    text(C('no-js-links') + '/a[@href="https://hackit.tw"]', d['goTaiwan'])
    text(C('no-js-links') + '/a[starts-with(@href,"mailto:")]', d['contact'])
    for el in nodes('//*[@data-quote-index]'):
        i = int(el.get('data-quote-index'))
        q = re.sub('\\*\\*([^*]+)\\*\\*', '\\1', payload['quotes'][locale][i])
        put(el.find('blockquote'), d['quoteOpen'] + q + d['quoteClose'])
        el.find('blockquote').set('lang', locale)
        put(el.find('figcaption'), payload['credits'][locale][i])
    for el in nodes('//*[@data-photo-index]'):
        i = int(el.get('data-photo-index'))
        el.find('img').set('alt', el.find('figcaption').text_content() + ' — ' + payload['photoAlts'][locale][i])
    for el in nodes('//*[@data-story-title-index]'):
        put(el, payload['stories'][locale][int(el.get('data-story-title-index'))]['title'])
    for el in nodes('//*[@data-story-preview-index]'):
        put(el, payload['stories'][locale][int(el.get('data-story-preview-index'))]['summary'])
    for el in nodes('//*[@data-story-credit-index]'):
        put(el, payload['stories'][locale][int(el.get('data-story-credit-index'))]['credit'] + ' · ' + d['storySummaryLabel'])
    for el in nodes(C('story-read-more')):
        item = payload['stories'][locale][int(el.get('data-story-index'))]
        put(el, d['readStory'])
        el.set('aria-label', d['readStory'] + ' — ' + item['title'])
    attr(C('story-dialog-close'), 'aria-label', d['closeStory'])
    attr('//*[@id="story-dialog"]', 'lang', locale)
    first = payload['stories'][locale][0]
    text('//*[@id="story-dialog-title"]', first['title'])
    text('//*[@id="story-dialog-body"]', first['text'])
    text('//*[@id="story-dialog-credit"]', first['credit'] + ' · ' + first['renderingLabel'])
    reading = nodes('//*[@id="overview"]')[0]
    switch = html.Element('noscript')
    language_line = html.Element('p')
    language_line.set('class', 'reading-language-links')
    language_line.set('aria-label', d['language'])
    for lang, name in [('zh-TW', '繁體中文（台灣）'), ('zh-HK', '繁體中文（香港）'), ('zh-CN', '简体中文'), ('en', 'English')]:
        a = html.Element('a')
        a.set('href', '/' + lang + '/')
        a.set('hreflang', lang)
        a.set('lang', lang)
        a.text = name
        a.tail = ' · '
        language_line.append(a)
    switch.append(language_line)
    reading.insert(0, switch)
    for i, item in enumerate(payload['stories'][locale]):
        detail = html.Element('details')
        detail.set('class', 'ssr-story-full')
        detail.set('data-ssr-story-index', str(i))
        summary = html.Element('summary')
        summary.text = item['title']
        detail.append(summary)
        credit = html.Element('p')
        credit.text = item['credit'] + ' · ' + item['renderingLabel']
        detail.append(credit)
        for para in item['text'].split('\n\n'):
            p = html.Element('p')
            p.text = para
            detail.append(p)
        reading.append(detail)
    head = nodes('//head')[0]
    for old in head.xpath('./base|./link[@rel="canonical"]|./link[@rel="alternate"]|./script[@type="application/ld+json"]'):
        head.remove(old)
    base = html.Element('base')
    base.set('href', '/')
    head.insert(1, base)
    canonical = payload['origin'] + '/' + locale + '/'
    for anchor in nodes('//a[starts-with(@href,"#")]'):
        anchor.set('href', '/' + locale + '/' + anchor.get('href'))
    link = html.Element('link')
    link.set('rel', 'canonical')
    link.set('href', canonical)
    head.append(link)
    for lang in payload['locales']:
        link = html.Element('link')
        link.set('rel', 'alternate')
        link.set('hreflang', lang)
        link.set('href', payload['origin'] + '/' + lang + '/')
        head.append(link)
    link = html.Element('link')
    link.set('rel', 'alternate')
    link.set('hreflang', 'x-default')
    link.set('href', payload['origin'] + '/')
    head.append(link)
    for prop, value in [('og:type', 'website'), ('og:title', d['title']), ('og:description', d['description']), ('og:url', canonical), ('og:locale', locale.replace('-', '_') if locale != 'en' else 'en_US'), ('og:site_name', 'HackIt'), ('og:image', payload['origin'] + '/assets/hackit-transparent.png'), ('og:image:width', '1746'), ('og:image:height', '809'), ('og:image:alt', 'HackIt')]:
        meta = html.Element('meta')
        meta.set('property', prop)
        meta.set('content', value)
        head.append(meta)
    for other in payload['locales']:
        if other == locale:
            continue
        meta = html.Element('meta')
        meta.set('property', 'og:locale:alternate')
        meta.set('content', other.replace('-', '_') if other != 'en' else 'en_US')
        head.append(meta)
    for name, value in [('twitter:card', 'summary_large_image'), ('twitter:title', d['title']), ('twitter:description', d['description']), ('twitter:image', payload['origin'] + '/assets/hackit-transparent.png'), ('twitter:image:alt', 'HackIt')]:
        meta = html.Element('meta')
        meta.set('name', name)
        meta.set('content', value)
        head.append(meta)
    structured = {'@context': 'https://schema.org', '@graph': [{'@type': 'Organization', '@id': payload['origin'] + '/#organization', 'name': 'HackIt', 'url': payload['origin'] + '/', 'email': 'hello@hackit.one', 'sameAs': ['https://hackit.tw'], 'contactPoint': {'@type': 'ContactPoint', 'email': 'hello@hackit.one', 'contactType': 'general enquiries'}, 'description': d['description']}, {'@type': 'WebPage', '@id': canonical + '#webpage', 'url': canonical, 'name': d['title'], 'description': d['description'], 'inLanguage': locale, 'isPartOf': {'@id': payload['origin'] + '/#website'}, 'about': {'@id': payload['origin'] + '/#organization'}}, {'@type': 'WebSite', '@id': payload['origin'] + '/#website', 'url': payload['origin'] + '/', 'name': 'HackIt', 'publisher': {'@id': payload['origin'] + '/#organization'}}]}
    script = html.Element('script')
    script.set('type', 'application/ld+json')
    script.text = json.dumps(structured, ensure_ascii=False).replace('<', '\\u003c')
    head.append(script)
    result = '<!doctype html>\n' + html.tostring(doc, encoding='unicode', method='html')
    for i, svg in enumerate(svgs):
        svg = re.sub('(<svg\\b[^>]*aria-label=")[^"]*', lambda m: m.group(1) + esc.escape(d['mapDetail'], quote=True), svg, count=1)
        svg = re.sub('(<g\\b[^>]*class="map-activation"[^>]*aria-label=")[^"]*', lambda m: m.group(1) + esc.escape(d['openTaiwan'], quote=True), svg, count=1)
        svg = re.sub('(<text\\b[^>]*>)Taiwan 台灣(</text>)', lambda m: m.group(1) + esc.escape(d['taiwanLabel']) + m.group(2), svg)
        result = result.replace('<div data-ssr-svg="' + str(i) + '"></div>', svg)
    out = root / 'source/static' / locale
    out.mkdir(exist_ok=True)
    (out / 'index.html').write_text(result)
    print(locale + ': ' + str(len(result.encode())) + ' bytes localized HTML')

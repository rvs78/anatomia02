"""Partida completa automatitzada: python3 tests/e2e.py [url] [carpeta_captures]"""
import json, re, sys, os
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'shots'
os.makedirs(OUT, exist_ok=True)
atlas = json.loads(re.search(r'export const ATLAS = (\{.*\});', open('atlas-data.js', encoding='utf-8').read(), re.S).group(1))
name_of = {t['id']: t['name'] for s in atlas.values() for t in s['targets']}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 768})
    pg.on('console', lambda m: m.type == 'error' and 'fonts' not in m.text and errors.append(m.text))
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.route(re.compile(r'fonts\.(googleapis|gstatic)'), lambda r: r.abort())
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.screenshot(path=f'{OUT}/0_login.png')
    pg.fill('input[name=email]', 'prova@isvh.cat'); pg.fill('input[name=password]', 'alumnesap'); pg.click('button.btn')
    pg.wait_for_selector('.slot'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/1_level1_start.png')
    # 1) error deliberat amb clic+clic
    chip = pg.locator('.chip').first; nm = chip.inner_text()
    wrong = next(i for i, n in name_of.items() if i.startswith('art') and n != nm and pg.locator(f'.slot[data-target="{i}"]:not(.off)').count())
    chip.click(); pg.click(f'.slot[data-target="{wrong}"]')
    assert 'no va' in pg.inner_text('#fb'), pg.inner_text('#fb')
    # 2) arrossegar correctament
    tid = next(i for i, n in name_of.items() if n == nm and i.startswith('art'))
    sb = pg.locator(f'.slot[data-target="{tid}"]').bounding_box(); cb = pg.locator(f'.chip[data-name="{nm}"]').bounding_box()
    pg.mouse.move(cb['x'] + 10, cb['y'] + 10); pg.mouse.down(); pg.mouse.move(cb['x'] + 40, cb['y'] + 40, steps=5)
    pg.mouse.move(sb['x'] + sb['width'] / 2, sb['y'] + sb['height'] / 2, steps=12); pg.screenshot(path=f'{OUT}/2_dragging.png'); pg.mouse.up()
    assert 'Correcte' in pg.inner_text('#fb'), 'drag: ' + pg.inner_text('#fb')
    # 3) pista
    pg.locator('.chip:not(.gone)').first.click(); pg.click('#hint'); pg.wait_for_timeout(200)
    pg.screenshot(path=f'{OUT}/3_hint.png')
    # 4) zoom i pas sobre punt (clic al punt en lloc de la casella)
    sel = pg.locator('.chip[aria-pressed=true]'); nm2 = sel.inner_text()
    tid2 = next(i for i, n in name_of.items() if n == nm2 and i.startswith('art'))
    db = pg.locator(f'.dot[data-target="{tid2}"]').bounding_box()
    pg.mouse.move(db['x'] + db['width'] / 2, db['y'] + db['height'] / 2)
    for _ in range(5): pg.mouse.wheel(0, -100); pg.wait_for_timeout(40)
    pg.click(f'.dot[data-target="{tid2}"]'); assert 'Correcte' in pg.inner_text('#fb'), 'zoom dot: ' + pg.inner_text('#fb')
    pg.screenshot(path=f'{OUT}/4_zoomed.png'); pg.click('[data-z=fit]')
    # completar tots els nivells
    for lvl in range(9):
        while pg.locator('.chip:not(.gone)').count():
            c = pg.locator('.chip:not(.gone)').first; n = c.get_attribute('data-name')
            sys_ = pg.evaluate('document.body.dataset.system')
            t = next(i for i, x in name_of.items() if x == n and i.startswith(sys_))
            c.click(); pg.click(f'.slot[data-target="{t}"]')
        if lvl in (4, 8): pg.screenshot(path=f'{OUT}/5_level{lvl+1}_done.png')
        pg.click('#next')
    # test
    pg.wait_for_selector('.choice'); pg.screenshot(path=f'{OUT}/6_quiz.png')
    for i in range(20):
        pg.keyboard.press('1'); pg.wait_for_selector('#next')
        if i == 0: pg.screenshot(path=f'{OUT}/7_quiz_answer.png')
        pg.click('#next')
    # mapa mut
    pg.wait_for_selector('#term'); pg.screenshot(path=f'{OUT}/8_map.png')
    first = True
    for i in range(24):
        cur = pg.evaluate("JSON.parse(localStorage.getItem('ap-ra2-vascular-v5')).p3")
        tid = cur['order'][cur['i']]
        if first:
            pg.fill('#term', 'xxxx'); pg.click('#ans .btn'); assert 'No és' in pg.inner_text('#fb'); first = False
        pg.fill('#term', name_of[tid].lower()); pg.click('#ans .btn')
        pg.wait_for_function(f"JSON.parse(localStorage.getItem('ap-ra2-vascular-v5')).p3.i > {cur['i']} || document.querySelector('.report')", timeout=5000)
        pg.wait_for_timeout(50)
    pg.wait_for_selector('.report'); pg.screenshot(path=f'{OUT}/9_report.png', full_page=True)
    st = pg.evaluate("JSON.parse(localStorage.getItem('ap-ra2-vascular-v5'))")
    print('punts', st['points'], 'encerts', st['correct'], 'errors', st['errors'], 'pistes', st['hints'], 'fases', st['phasePts'])
    # resolucions
    for w, h in [(1280, 720), (1440, 900), (1920, 1080), (390, 844)]:
        q = b.new_page(viewport={'width': w, 'height': h}); q.route(re.compile(r'fonts\.'), lambda r: r.abort())
        q.goto(URL); q.evaluate("""s=>{const x=JSON.parse(s);x.phase=1;x.p1.level=8;x.p1.placed={};x.p1.bank={};localStorage.setItem('ap-ra2-vascular-v5',JSON.stringify(x))}""", json.dumps(st))
        q.reload(); q.wait_for_selector('.slot'); q.wait_for_timeout(300)
        sw = q.evaluate('document.documentElement.scrollWidth')
        overlap = q.evaluate("""()=>{const b=[...document.querySelectorAll('.slot:not(.off)')].map(e=>e.getBoundingClientRect());let n=0;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const a=b[i],c=b[j];if(a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom)n++}return n}""")
        print(f'{w}x{h}: scrollWidth={sw} overlaps={overlap}')
        q.screenshot(path=f'{OUT}/r_{w}x{h}.png'); q.close()
    b.close()
print('errors:', errors or 'cap')

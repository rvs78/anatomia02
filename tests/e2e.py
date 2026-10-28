"""Partida completa automatitzada: python3 tests/e2e.py [url] [carpeta_captures]"""
import json, re, sys, os
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'shots'
KEY = 'ap-ra2-vascular-v5'
os.makedirs(OUT, exist_ok=True)
atlas = json.loads(re.search(r'export const ATLAS = (\{.*\});', open('atlas-data.js', encoding='utf-8').read(), re.S).group(1))
name_of = {t['id']: t['name'] for s in atlas.values() for t in s['targets']}
errors = []


def tid_for(pg, name):
    sys_ = pg.evaluate('document.body.dataset.system')
    return next(i for i, x in name_of.items() if x == name and i.startswith(sys_))


def close_intro(pg, shot=None):
    pg.wait_for_selector('#intro-go'); pg.wait_for_timeout(900)
    assert pg.locator('#intro').count() == 1, 'un sol sobre'
    if shot:
        pg.screenshot(path=shot)
    pg.click('#intro-go'); pg.wait_for_selector('#intro', state='detached')


def state(pg):
    return pg.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 768})
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/0_login.png')
    # Contrasenya errònia → missatge
    pg.fill('input[name=email]', 'prova@isvh.cat'); pg.fill('input[name=password]', 'xx'); pg.click('#login .btn')
    assert 'contrasenya' in pg.inner_text('#fb').lower()
    pg.fill('input[name=password]', 'alumnesap'); pg.click('#login .btn')
    close_intro(pg, f'{OUT}/1_intro_atles.png')
    pg.wait_for_selector('.slot'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/2_level1.png')

    # 1) error amb clic+clic: el cromo rebota i torna al munt
    chip = pg.locator('.chip').first; nm = chip.get_attribute('data-name')
    wrong = next(i for i, n in name_of.items() if i.startswith('art') and n != nm and pg.locator(f'.slot[data-target="{i}"]:not(.off)').count())
    chip.click(); pg.click(f'.slot[data-target="{wrong}"]')
    pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/3_wrong_bounce.png')
    assert 'no va' in pg.inner_text('#fb'), pg.inner_text('#fb')
    pg.wait_for_timeout(700)
    assert pg.locator(f'.chip[data-name="{nm}"]:not(.gone)').count() == 1, 'el cromo ha de tornar al munt'

    # 2) arrossegar correctament; doble clic durant el vol no compta (Review Focus 1)
    tid = tid_for(pg, nm)
    errs_before = state(pg)['errors']
    sb = pg.locator(f'.slot[data-target="{tid}"]').bounding_box(); cb = pg.locator(f'.chip[data-name="{nm}"]').bounding_box()
    pg.mouse.move(cb['x'] + 10, cb['y'] + 10); pg.mouse.down(); pg.mouse.move(cb['x'] + 40, cb['y'] + 40, steps=5)
    pg.mouse.move(sb['x'] + sb['width'] / 2, sb['y'] + sb['height'] / 2, steps=12); pg.screenshot(path=f'{OUT}/4_dragging.png'); pg.mouse.up()
    other = pg.locator('.chip:not(.gone):not(.lifting)').first
    other.click(); pg.click(f'.slot[data-target="{wrong}"]', force=True)
    pg.wait_for_selector(f'.slot[data-target="{tid}"].done', timeout=1500)
    pg.wait_for_timeout(120); pg.screenshot(path=f'{OUT}/5_stuck.png')
    assert state(pg)['errors'] == errs_before, 'cap error durant el vol'
    assert nm in pg.inner_text('#fb'), 'drag: ' + pg.inner_text('#fb')
    pg.wait_for_timeout(800)

    # 3) pista
    pg.locator('.chip:not(.gone)').first.click()
    if pg.locator('.chip[aria-pressed=true]').count() == 0:
        pg.locator('.chip:not(.gone)').first.click()
    pg.click('#hint'); pg.wait_for_timeout(250)
    pg.screenshot(path=f'{OUT}/6_hint.png')

    # 4) zoom amb la roda sobre un vas i clic al punt
    nm2 = pg.locator('.chip[aria-pressed=true]').get_attribute('data-name'); tid2 = tid_for(pg, nm2)
    db = pg.locator(f'.dot[data-target="{tid2}"]').bounding_box()
    pg.mouse.move(db['x'] + db['width'] / 2, db['y'] + db['height'] / 2)
    for _ in range(5): pg.mouse.wheel(0, -100); pg.wait_for_timeout(40)
    db = pg.locator(f'.dot[data-target="{tid2}"]').bounding_box()
    pg.mouse.click(db['x'] + db['width'] / 2, db['y'] + db['height'] / 2); pg.wait_for_selector(f'.slot[data-target="{tid2}"].done', timeout=1500)
    pg.screenshot(path=f'{OUT}/7_zoomed.png'); pg.click('[data-z=fit]')

    # 4b) punts molt propers: clicar el centre exacte del punt de l'aorta toràcica no pot puntuar el tronc celíac
    if pg.locator('.chip[data-name="Aorta toràcica"]:not(.gone)').count():
        pg.locator('.chip[data-name="Aorta toràcica"]').click()
        t_ao = next(i for i, x in name_of.items() if x == 'Aorta toràcica' and i.startswith('art'))
        db = pg.locator(f'.dot[data-target="{t_ao}"]').bounding_box()
        e0 = state(pg)['errors']
        pg.mouse.click(db['x'] + db['width'] / 2, db['y'] + db['height'] / 2)
        pg.wait_for_selector(f'.slot[data-target="{t_ao}"].done', timeout=1500)
        assert state(pg)['errors'] == e0, 'punt proper mal resolt'
    # 5) recàrrega a mig nivell: els cromos enganxats es mantenen (Review Focus 4)
    done_before = pg.locator('.slot.done').count()
    pg.reload(); pg.wait_for_selector('.slot')
    assert pg.locator('.slot.done').count() == done_before, 'persistència a mig nivell'
    assert pg.locator('#intro').count() == 0, 'el sobre no torna a sortir'

    # Resta del joc amb moviment reduït per anar ràpid
    pg.emulate_media(reduced_motion='reduce')
    for lvl in range(9):
        while pg.locator('.chip:not(.gone)').count():
            c = pg.locator('.chip:not(.gone)').first; n = c.get_attribute('data-name'); t = tid_for(pg, n)
            c.click(); pg.click(f'.slot[data-target="{t}"]'); pg.wait_for_selector(f'.slot[data-target="{t}"].done')
        if lvl == 0:
            pg.emulate_media(reduced_motion='no-preference'); pg.wait_for_timeout(50)
        if lvl in (0, 8):
            pg.wait_for_timeout(1100); pg.screenshot(path=f'{OUT}/8_level{lvl+1}_done.png')
        if lvl == 0:
            pg.emulate_media(reduced_motion='reduce')
        pg.click('#next')
    # Test
    pg.emulate_media(reduced_motion='no-preference')
    close_intro(pg, f'{OUT}/9_intro_test.png')
    for i in range(20):
        pg.keyboard.press('1'); pg.wait_for_selector('#next')
        if i == 0:
            pg.wait_for_timeout(250); pg.screenshot(path=f'{OUT}/10_quiz_answer.png')
        pg.click('#next')
    # Mapa mut
    close_intro(pg)
    pg.wait_for_selector('#term'); pg.screenshot(path=f'{OUT}/11_map.png')
    first = True
    for i in range(24):
        cur = state(pg)['p3']; tid = cur['order'][cur['i']]
        if first:
            pg.fill('#term', 'xxxx'); pg.click('#ans .btn'); assert 'No és' in pg.inner_text('#fb'); first = False
            pg.wait_for_timeout(150); pg.screenshot(path=f'{OUT}/12_map_wrong.png')
        pg.fill('#term', name_of[tid].lower()); pg.click('#ans .btn')
        if i == 0:
            pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/13_map_right.png')
        pg.wait_for_function(f"JSON.parse(localStorage.getItem('{KEY}')).p3.i > {cur['i']} || document.querySelector('.report')", timeout=6000)
        pg.wait_for_timeout(50)
    pg.wait_for_selector('.report'); pg.wait_for_timeout(1200); pg.screenshot(path=f'{OUT}/14_report.png', full_page=True)
    st = state(pg)
    print('punts', st['points'], 'encerts', st['correct'], 'errors', st['errors'], 'pistes', st['hints'], 'fases', st['phasePts'])

    # So: el botó silencia i es recorda
    pg.click('#sound'); assert pg.evaluate("localStorage.getItem('vq-sound')") == 'off'
    pg.reload(); assert pg.get_attribute('#sound', 'aria-pressed') == 'false'

    # Sense Web Audio (Review Focus 2)
    q = b.new_page(viewport={'width': 1280, 'height': 720})
    q.add_init_script('delete window.AudioContext; delete window.webkitAudioContext;')
    q.on('pageerror', lambda e: errors.append('sense àudio: ' + str(e)))
    q.goto(URL); q.evaluate('localStorage.clear()'); q.reload()
    q.fill('input[name=email]', 'a@isvh.cat'); q.fill('input[name=password]', 'alumnesap'); q.click('#login .btn')
    close_intro(q); c = q.locator('.chip').first; n = c.get_attribute('data-name'); c.click(); q.click(f'.slot[data-target="{tid_for(q, n)}"]')
    q.wait_for_selector('.slot.done'); q.close()

    # Resolucions (nivell 9 i sobre d'instruccions)
    for w, h in [(1280, 720), (1366, 768), (1440, 900), (1920, 1080), (390, 844)]:
        q = b.new_page(viewport={'width': w, 'height': h})
        q.goto(URL)
        q.evaluate("""s=>{const x=JSON.parse(s);x.phase=1;x.p1.level=8;x.p1.placed={};x.p1.bank={};x.seen={};localStorage.setItem('ap-ra2-vascular-v5',JSON.stringify(x))}""", json.dumps(st))
        q.reload(); q.wait_for_selector('#intro-go'); q.wait_for_timeout(1200)
        sw_intro = q.evaluate('document.documentElement.scrollWidth')
        q.screenshot(path=f'{OUT}/r_{w}x{h}_intro.png')
        q.click('#intro-go'); q.wait_for_selector('#intro', state='detached'); q.wait_for_timeout(200)
        sw = q.evaluate('document.documentElement.scrollWidth')
        overlap = q.evaluate("""()=>{const b=[...document.querySelectorAll('.slot:not(.off)')].map(e=>e.getBoundingClientRect());let n=0;for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const a=b[i],c=b[j];if(a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom)n++}return n}""")
        print(f'{w}x{h}: scrollWidth={sw} (sobre {sw_intro}) overlaps={overlap}')
        assert sw <= w and sw_intro <= w and overlap == 0
        q.screenshot(path=f'{OUT}/r_{w}x{h}.png'); q.close()
    b.close()

errors = [e for e in errors if 'tutorial' not in e]
print('errors:', errors or 'cap')
assert not errors

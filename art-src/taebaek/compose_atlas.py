"""Add the Taebaek cut-outs to the art atlas (public/textures/art/atlas.webp + atlas.json).

The original atlas (git revision ORIGINAL_REV, cached in art-src/taebaek/base/) is where every run starts, so the script is repeatable.
New sprites are packed into the empty strip below the original sprites (y >= PACK_Y) and listed in atlas.json
with  rect, aspect, kind, tone  (the runtime contract) plus  outline  (die-cut polygons, normalised to the rect,
y down) and kit: true. The outlines are what src/world/kit.js cuts the cards with.

Korean sign lettering is printed on the blank signboards here (the generator was told to leave them empty).
Run after slice_items.py:  python art-src/taebaek/compose_atlas.py
"""
import json
import os
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ITEMS = os.path.join(HERE, 'items')
BASE = os.path.join(HERE, 'base')
ART = os.path.join(ROOT, 'public', 'textures', 'art')
FONTS = os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\Windows\Fonts')

PACK_Y = 2600
GUTTER = 8
ALPHA_CUT = 102  # = the shader's die-cut threshold (uPaperArt.w = 0.4)

F_ALLIM = 'Hakgyoansim Allimjang TTF B.ttf'
F_JUA = 'BMJUA_ttf.ttf'
F_DOHYEON = 'BMDOHYEON_ttf.ttf'
F_BATANG = 'HakgyoansimBareonbatangB.ttf'

# name: (target width px, kind, signs)   sign = (box x0, y0, x1, y1 in item px, lines, font, colour)
ITEMS_SPEC = {
    # ---- buildings and landmarks
    'school_front': (720, 'kit_facade', [((781, 424, 1121, 484), ['황지중앙초등학교'], F_ALLIM, '#5b3a26')]),
    'daiso_front': (640, 'kit_facade', [((96, 20, 1659, 168), ['다이소'], F_JUA, '#fff7ec')]),
    'claw_front': (520, 'kit_facade', [((327, 91, 1235, 214), ['인형뽑기'], F_JUA, '#b9505f')]),
    'library_front': (560, 'kit_facade', [((528, 313, 993, 421), ['산소드림도서관'], F_ALLIM, '#6a4630')]),
    'kkachibal_front': (360, 'kit_facade', [((296, 492, 717, 587), ['철암 다방'], F_DOHYEON, '#5b3b2a')]),
    'coal_plant': (560, 'kit_landmark', []),
    'mine_entrance': (520, 'kit_landmark', []),
    'gumunso': (600, 'kit_landmark', []),
    'cheonjedan': (600, 'kit_landmark', []),
    'geomnyongso': (520, 'kit_landmark', []),
    # ---- trees
    'tb_yew': (300, 'kit_tree', []), 'tb_yew_rime': (300, 'kit_tree', []), 'tb_fir': (220, 'kit_tree', []),
    'tb_birch': (280, 'kit_tree', []), 'tb_oak': (300, 'kit_tree', []), 'tb_magnolia': (300, 'kit_tree', []),
    'hj_juniper': (300, 'kit_tree', []), 'hj_forsythia': (300, 'kit_bush', []),
    # ---- plants
    'gd_wildflowers': (300, 'kit_flowers', []), 'gd_iris': (280, 'kit_flowers', []), 'mb_cabbage': (360, 'kit_flowers', []),
    'mb_sunflower': (300, 'kit_flowers', []), 'gd_azalea': (280, 'kit_bush', []),
    # ---- props
    'hj_claw_machine': (180, 'kit_prop', []), 'hj_o2_mobile': (240, 'kit_prop', []), 'hj_statue': (190, 'kit_prop', []),
    'ch_cart': (240, 'kit_prop', []), 'ch_briquettes': (240, 'kit_prop', []), 'mb_turbine_pole': (170, 'kit_prop', []),
    'mb_turbine_blades': (260, 'kit_sails', []), 'mb_samsu': (270, 'kit_prop', []),
    'hj_stone': (250, 'kit_prop', [((165, 120, 350, 420), ['낙동강', '1300리', '발원지'], F_BATANG, '#463b33')]),
    'hj_slide': (270, 'kit_prop', []),
    'hj_gatepost': (180, 'kit_prop', [((85, 165, 285, 270), ['황지중앙', '초등학교'], F_BATANG, '#4a372c')]),
    # ---- animals / fossils (cards)
    'an_jay': (230, 'kit_animal', []), 'an_goral': (250, 'kit_animal', []), 'an_lenok': (250, 'kit_animal', []),
    'an_trilobite': (220, 'kit_prop', []),
    # ---- round 2: legend storyboards (four scenes each)
    **{f'lg_{k}_{i}': (232, 'kit_story', []) for k in ('hb', 'gr', 'gm', 'dj') for i in range(1, 5)},
    # ---- festivals: one wooden and one snow arch, lettered per festival (4th item = source image)
    'fv_arch_sunflower': (330, 'kit_arch', [((110, 160, 455, 228), ['태백 해바라기 축제'], F_JUA, '#8a3a22')], 'fv_arch_wood'),
    'fv_arch_maple': (330, 'kit_arch', [((110, 160, 455, 228), ['철암 단풍 축제'], F_JUA, '#8a3a22')], 'fv_arch_wood'),
    'fv_arch_azalea': (330, 'kit_arch', [((110, 160, 455, 228), ['태백산 철쭉제'], F_JUA, '#8a3a22')], 'fv_arch_wood'),
    'fv_arch_snowfest': (340, 'kit_arch', [((120, 140, 495, 205), ['태백산 눈축제'], F_JUA, '#365f80')], 'fv_arch_snow'),
    'fv_snow_dragon': (260, 'kit_prop', []), 'fv_snow_castle': (270, 'kit_prop', []), 'fv_snowman': (190, 'kit_prop', []),
    'fv_maple_red': (300, 'kit_tree', []), 'fv_ginkgo': (270, 'kit_tree', []), 'fv_maple_orange': (290, 'kit_tree', []),
    # ---- stream fish (the leaping fish of life/fish.js; an_lenok = 열목어)
    'fish_kumgang': (170, 'kit_fish', []), 'fish_beodeul': (170, 'kit_fish', []), 'fish_dukjung': (170, 'kit_fish', []),
    'fish_miyugi': (190, 'kit_fish', []),
}


# The untouched Papertrails sheets live in git history; base/ is a local cache of them (not committed).
ORIGINAL_REV = '5a284f7'


def restore_base(names):
    os.makedirs(BASE, exist_ok=True)
    for f in names:
        dst = os.path.join(BASE, f)
        if not os.path.exists(dst):
            data = subprocess.run(['git', 'show', ORIGINAL_REV + ':public/textures/art/' + f], cwd=ROOT,
                                  capture_output=True, check=True).stdout
            with open(dst, 'wb') as fp:
                fp.write(data)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def print_sign(im, box, lines, fname, colour):
    """Print lettering into box (item px): auto-fitted, centred, slightly soft like ink on paper."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    n = len(lines)
    size = int(bh * 0.8 / n)
    while size > 6:
        f = font(fname, size)
        widths = [f.getbbox(t)[2] - f.getbbox(t)[0] for t in lines]
        if max(widths) <= bw * 0.86 and size * n * 1.12 <= bh * 0.86:
            break
        size -= 1
    f = font(fname, size)
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    lh = size * 1.12
    top = y0 + (bh - lh * n) / 2 + size * 0.06
    for i, t in enumerate(lines):
        bb = f.getbbox(t)
        tw = bb[2] - bb[0]
        d.text((x0 + (bw - tw) / 2 - bb[0], top + i * lh - bb[1] + (lh - (bb[3] - bb[1])) / 2), t, font=f, fill=colour)
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    a = np.asarray(layer).astype(np.float32)
    a[:, :, 3] *= 0.93  # a little paper fibre shows through the ink
    out = Image.alpha_composite(im, Image.fromarray(a.astype(np.uint8)))
    # keep the item's own die-cut alpha (the ink only sits on the card)
    o = np.asarray(out).copy()
    o[:, :, 3] = np.asarray(im)[:, :, 3]
    return Image.fromarray(o)


def bleed(arr):
    """Colour-bleed: every transparent pixel takes the colour of the nearest card pixel (mip / filter safe)."""
    a = arr[:, :, 3]
    hole = a < 16
    if not hole.any() or hole.all():
        return arr
    _, (iy, ix) = ndimage.distance_transform_edt(hole, return_indices=True)
    out = arr.copy()
    out[:, :, :3] = arr[iy, ix, :3]
    out[:, :, 3] = a
    return out


def outlines(alpha):
    """Die-cut polygons around everything that survives the shader cut, normalised to the rect (y down)."""
    h, w = alpha.shape
    m = (alpha >= ALPHA_CUT).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=1)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    polys = []
    for c in sorted(cs, key=cv2.contourArea, reverse=True):
        if cv2.contourArea(c) < 0.004 * w * h:
            continue
        ap = cv2.approxPolyDP(c, max(1.2, 0.004 * max(w, h)), True).reshape(-1, 2)
        if len(ap) < 3:
            continue
        polys.append([[round(min(max(x / w, 0), 1), 4), round(min(max(y / h, 0), 1), 4)] for x, y in ap])
    return polys


def centre_on_hub(im):
    """Rotor blades: a square canvas centred on the hub (alpha centroid of a 3-blade rotor), because the runtime
    spins the sail layer about the centre of its bounding box (world.js spinSplit)."""
    a = np.asarray(im)[:, :, 3].astype(np.float64)
    ys, xs = np.nonzero(a > 8)
    w = a[ys, xs]
    cx, cy = (xs * w).sum() / w.sum(), (ys * w).sum() / w.sum()
    r = int(np.ceil(np.sqrt(((xs - cx) ** 2 + (ys - cy) ** 2).max()))) + 3
    out = Image.new('RGBA', (2 * r, 2 * r), (0, 0, 0, 0))
    out.paste(im, (int(round(r - cx)), int(round(r - cy))))
    return out


def tone(arr):
    a = arr[:, :, 3] > 200
    c = arr[:, :, :3][a].mean(axis=0) if a.any() else np.array([200, 180, 150])
    return '#%02X%02X%02X' % tuple(int(v) for v in c)


def main():
    restore_base(('atlas.webp', 'atlas.json'))
    atlas = Image.open(os.path.join(BASE, 'atlas.webp')).convert('RGBA')
    meta = json.load(open(os.path.join(BASE, 'atlas.json'), encoding='utf-8'))
    AW, AH = meta['size']
    used = max(s['rect'][1] + s['rect'][3] for s in meta['sprites'].values())
    assert used + GUTTER <= PACK_Y, used

    lettered = []
    for name, spec in ITEMS_SPEC.items():
        tw, kind, signs = spec[:3]
        src = spec[3] if len(spec) > 3 else name
        im = Image.open(os.path.join(ITEMS, src + '.png')).convert('RGBA')
        for box, lines, fname, col in signs:
            im = print_sign(im, box, lines, fname, col)
        if kind == 'kit_sails':
            im = centre_on_hub(im)
        lettered.append((name, kind, tw, im))

    # shelf packing, tallest first; when the strip is too small every sprite shrinks a little and we try again
    scale = 1.0
    while True:
        sprites = []
        for name, kind, tw, im in lettered:
            w = max(8, round(tw * scale))
            sprites.append((name, kind, im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)))
        order = sorted(sprites, key=lambda s: -s[2].height)
        x, y, shelf = GUTTER, PACK_Y, 0
        placed = {}
        full = False
        for name, kind, im in order:
            w, h = im.size
            if x + w + GUTTER > AW:
                x, y, shelf = GUTTER, y + shelf + GUTTER, 0
            if y + h + GUTTER > AH:
                full = True
                break
            placed[name] = (x, y)
            x += w + GUTTER
            shelf = max(shelf, h)
        if not full:
            break
        scale *= 0.96
        if scale < 0.55:
            raise SystemExit('atlas full even at scale %.2f' % scale)
    print('packed down to y =', y + shelf, 'of', AH, '- sprite scale %.2f' % scale)

    canvas = np.asarray(atlas).copy()
    for name, kind, im in sprites:
        px, py = placed[name]
        w, h = im.size
        # bleed inside the sprite plus half the gutter so filtering at the cut never meets a foreign colour
        g = GUTTER // 2
        pad = np.zeros((h + 2 * g, w + 2 * g, 4), np.uint8)
        pad[g:g + h, g:g + w] = np.asarray(im)
        pad = bleed(pad)
        y0, x0 = py - g, px - g
        canvas[y0:y0 + h + 2 * g, x0:x0 + w + 2 * g] = pad
        arr = np.asarray(im)
        meta['sprites'][name] = {
            'rect': [px, py, w, h], 'aspect': round(w / h, 4), 'kind': kind, 'tone': tone(arr),
            'outline': outlines(arr[:, :, 3]), 'kit': True,
        }
    Image.fromarray(canvas).save(os.path.join(ART, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=4)
    with open(os.path.join(ART, 'atlas.json'), 'w', encoding='utf-8') as fp:
        json.dump(meta, fp, ensure_ascii=False, separators=(',', ':'))
    print('sprites', len(meta['sprites']), 'atlas bytes', os.path.getsize(os.path.join(ART, 'atlas.webp')))


if __name__ == '__main__':
    main()

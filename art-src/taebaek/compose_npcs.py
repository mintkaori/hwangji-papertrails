"""Add the class mascots (paper cut-out redraws in art-src/taebaek/npc/raw/) to the living-animal sheet.

public/textures/art/animals.(png|json) is full, so the sheet grows downward: the original 2048 x 2048 sheet (git revision
ORIGINAL_REV, cached in art-src/taebaek/base/) is where every run starts. Each mascot becomes an "animal" npc_<id> with three poses
'stand' (A-pose), 'step' and 'wave' (feet at the bottom, anchor in the middle); src/core/config/animals.js gives each its own species.
Run: python art-src/taebaek/compose_npcs.py
"""
import json
import os
import subprocess

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
RAW = os.path.join(HERE, 'npc', 'raw')
BASE = os.path.join(HERE, 'base')
ART = os.path.join(ROOT, 'public', 'textures', 'art')

FRAME_H = 236          # px height of every mascot frame
WORLD_H = 0.28         # world height of a frame before CONFIG.animals.scale (x1.5) and the species size
GUTTER = 8
# sheet id -> three-pose sheet in npc/pose/ (A-pose stand, walking step, wave; drawn from the paper redraws in npc/raw/)
MASCOTS = {
    'npc_dog': 'dog', 'npc_cat': 'cat', 'npc_elephant': 'elephant', 'npc_monkey': 'monkey', 'npc_duck': 'duck',
    'npc_bear': 'bear', 'npc_bunny': 'bunny', 'npc_milk': 'milk', 'npc_otter': 'otter', 'npc_korea': 'korea',
    'npc_blob': 'blob',
}
POSES = ['stand', 'step', 'wave']
# Taebaek birds (art-src/taebaek/items, cut from sheet_birds / sheet_animals): sheet id -> (item, frame px, world height)
WILDLIFE = {
    'bird_dipper': ('bird_dipper', 120, 0.105), 'bird_mandarin': ('bird_mandarin', 112, 0.1),
    'bird_scops': ('bird_scops', 130, 0.12), 'bird_woodpecker': ('bird_woodpecker', 140, 0.13), 'bird_jay': ('an_jay', 124, 0.11),
}
ITEMS = os.path.join(HERE, 'items')
POSE = os.path.join(HERE, 'npc', 'pose')


def split_poses(im):
    """The three figures of a pose sheet, left to right (largest connected parts, each cropped to its alpha)."""
    a = np.asarray(im)[:, :, 3] > 8
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=4))
    parts = []
    for k in range(1, n + 1):
        m = lab == k
        if m.sum() < 0.01 * a.size:
            continue
        ys, xs = np.nonzero(m & a)
        parts.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1, m))
    parts = sorted(sorted(parts, key=lambda p: -(p[2] - p[0]) * (p[3] - p[1]))[:3], key=lambda p: p[0])
    out = []
    arr = np.asarray(im)
    for x0, y0, x1, y1, m in parts:
        sub = arr.copy()
        sub[:, :, 3] = np.where(m, sub[:, :, 3], 0)
        out.append(Image.fromarray(sub).crop((x0, y0, x1, y1)))
    return out


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


def bleed(arr):
    a = arr[:, :, 3]
    hole = a < 16
    if not hole.any() or hole.all():
        return arr
    _, (iy, ix) = ndimage.distance_transform_edt(hole, return_indices=True)
    out = arr.copy()
    out[:, :, :3] = arr[iy, ix, :3]
    return out


def main():
    restore_base(('animals.png', 'animals.json'))
    sheet = Image.open(os.path.join(BASE, 'animals.png')).convert('RGBA')
    meta = json.load(open(os.path.join(BASE, 'animals.json'), encoding='utf-8'))
    W, H0 = meta['size']

    frames = []  # (sheet id, pose name, image)
    for sid, raw in MASCOTS.items():
        parts = split_poses(Image.open(os.path.join(POSE, raw + '.png')).convert('RGBA'))
        if len(parts) != 3:
            raise SystemExit(f'{raw}: expected 3 poses, found {len(parts)}')
        k = FRAME_H / max(p.height for p in parts)  # one scale per character: the body keeps its size in every pose
        for pn, im in zip(POSES, parts):
            frames.append((sid, pn, im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)))

    wild_unit = {}
    for sid, (item, fh, wh) in WILDLIFE.items():
        im = Image.open(os.path.join(ITEMS, item + '.png')).convert('RGBA')
        im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
        frames.append((sid, 'stand', im.resize((max(1, round(im.width * fh / im.height)), fh), Image.LANCZOS)))
        wild_unit[sid] = (round(fh / wh, 2), wh)

    # pack in rows below the original sheet (rows as tall as the tallest frame)
    x, y = GUTTER, H0 + GUTTER
    pos = {}
    for sid, pn, im in frames:
        if x + im.width + GUTTER > W:
            x, y = GUTTER, y + FRAME_H + GUTTER
        pos[(sid, pn)] = (x, y + FRAME_H - im.height)  # bottom-aligned in the row
        x += im.width + GUTTER
    H = y + FRAME_H + GUTTER
    H = (H + 63) // 64 * 64
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.paste(sheet, (0, 0))
    canvas = np.asarray(out).copy()
    unit = FRAME_H / WORLD_H
    for sid, pn, im in frames:
        px, py = pos[(sid, pn)]
        g = GUTTER // 2
        pad = np.zeros((im.height + 2 * g, im.width + 2 * g, 4), np.uint8)
        pad[g:g + im.height, g:g + im.width] = np.asarray(im)
        canvas[py - g:py + im.height + g, px - g:px + im.width + g] = bleed(pad)
        u, wh = wild_unit.get(sid, (round(unit, 2), WORLD_H))
        e = meta['animals'].setdefault(sid, {'height': wh, 'ref': 'stand', 'unit': u, 'poses': {}})
        e['poses'][pn] = {'x': px, 'y': py, 'w': im.width, 'h': im.height, 'footY': im.height, 'ax': round(im.width / 2, 1)}
    meta['size'] = [W, H]
    Image.fromarray(canvas).save(os.path.join(ART, 'animals.png'), optimize=True)
    with open(os.path.join(ART, 'animals.json'), 'w', encoding='utf-8') as fp:
        json.dump(meta, fp, ensure_ascii=False, separators=(',', ':'))
    print('sheet', W, 'x', H, 'bytes', os.path.getsize(os.path.join(ART, 'animals.png')))


if __name__ == '__main__':
    main()

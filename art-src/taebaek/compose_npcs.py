"""Add the class mascots (paper cut-out redraws in art-src/taebaek/npc/raw/) to the living-animal sheet.

public/textures/art/animals.(png|json) is full, so the sheet grows downward: the original 2048 x 2048 sheet (git revision
ORIGINAL_REV, cached in art-src/taebaek/base/) is where every run starts. Each mascot becomes an "animal" npc_<id> with one pose
'stand' (feet at the bottom, anchor in the middle); src/core/config/animals.js gives each its own species.
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
# sheet id -> raw file (the redrawn 돌돌이 / 수달이 replace the first drafts)
MASCOTS = {
    'npc_dog': 'dog', 'npc_cat': 'cat', 'npc_elephant': 'elephant', 'npc_monkey': 'monkey', 'npc_duck': 'duck',
    'npc_bear': 'bear2', 'npc_bunny': 'bunny', 'npc_milk': 'milk', 'npc_otter': 'otter2', 'npc_korea': 'korea',
    'npc_blob': 'blob',
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

    frames = []
    for sid, raw in MASCOTS.items():
        im = Image.open(os.path.join(RAW, raw + '.png')).convert('RGBA')
        im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
        w = max(1, round(im.width * FRAME_H / im.height))
        frames.append((sid, im.resize((w, FRAME_H), Image.LANCZOS)))

    # pack in rows below the original sheet
    x, y = GUTTER, H0 + GUTTER
    pos = {}
    for sid, im in frames:
        if x + im.width + GUTTER > W:
            x, y = GUTTER, y + FRAME_H + GUTTER
        pos[sid] = (x, y)
        x += im.width + GUTTER
    H = y + FRAME_H + GUTTER
    H = (H + 63) // 64 * 64
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.paste(sheet, (0, 0))
    canvas = np.asarray(out).copy()
    unit = FRAME_H / WORLD_H
    for sid, im in frames:
        px, py = pos[sid]
        g = GUTTER // 2
        pad = np.zeros((FRAME_H + 2 * g, im.width + 2 * g, 4), np.uint8)
        pad[g:g + FRAME_H, g:g + im.width] = np.asarray(im)
        canvas[py - g:py + FRAME_H + g, px - g:px + im.width + g] = bleed(pad)
        meta['animals'][sid] = {
            'height': WORLD_H, 'ref': 'stand', 'unit': round(unit, 2),
            'poses': {'stand': {'x': px, 'y': py, 'w': im.width, 'h': FRAME_H, 'footY': FRAME_H, 'ax': round(im.width / 2, 1)}},
        }
    meta['size'] = [W, H]
    Image.fromarray(canvas).save(os.path.join(ART, 'animals.png'), optimize=True)
    with open(os.path.join(ART, 'animals.json'), 'w', encoding='utf-8') as fp:
        json.dump(meta, fp, ensure_ascii=False, separators=(',', ':'))
    print('sheet', W, 'x', H, 'bytes', os.path.getsize(os.path.join(ART, 'animals.png')))


if __name__ == '__main__':
    main()

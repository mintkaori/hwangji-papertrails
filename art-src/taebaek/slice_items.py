"""Cut the generated Taebaek art into single items (art-src/taebaek/items/<name>.png).

Single illustrations are cropped to their alpha bounds; 2x2 sheets are split into their four stickers by
connected components (each component is assigned to the quadrant that holds its centre).
Run: python art-src/taebaek/slice_items.py
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, 'items')

SINGLES = ['school_front', 'daiso_front', 'claw_front', 'library_front', 'kkachibal_front', 'coal_plant',
           'mine_entrance', 'gumunso', 'cheonjedan', 'geomnyongso']
# quadrant order: top-left, top-right, bottom-left, bottom-right
SHEETS = {
    'sheet_trees_a': ['tb_yew', 'tb_yew_rime', 'tb_fir', 'tb_birch'],
    'sheet_trees_b': ['tb_oak', 'tb_magnolia', 'hj_juniper', 'hj_forsythia'],
    'sheet_flowers': ['gd_wildflowers', 'gd_iris', 'mb_cabbage', 'mb_sunflower'],
    'sheet_hub_props': ['gd_azalea', 'hj_claw_machine', 'hj_o2_mobile', 'hj_statue'],
    'sheet_coal_props': ['ch_cart', 'ch_briquettes', 'mb_turbine_pole', 'mb_turbine_blades'],
    'sheet_animals': ['an_jay', 'an_goral', 'an_lenok', 'an_trilobite'],
    'sheet_misc': ['mb_samsu', 'hj_stone', 'hj_slide', 'hj_gatepost'],
    # round 2: legends (four scenes each), festivals, autumn trees, stream fish, birds
    'legend_hwangbuja': ['lg_hb_1', 'lg_hb_2', 'lg_hb_3', 'lg_hb_4'],
    'legend_geomnyong': ['lg_gr_1', 'lg_gr_2', 'lg_gr_3', 'lg_gr_4'],
    'legend_gumunso': ['lg_gm_1', 'lg_gm_2', 'lg_gm_3', 'lg_gm_4'],
    'legend_danjong': ['lg_dj_1', 'lg_dj_2', 'lg_dj_3', 'lg_dj_4'],
    'sheet_festival_a': ['fv_arch_wood', 'fv_arch_snow', 'fv_snow_dragon', 'fv_snow_castle'],
    'sheet_festival_b': ['fv_snowman', 'fv_maple_red', 'fv_ginkgo', 'fv_maple_orange'],
    'sheet_fish': ['fish_kumgang', 'fish_beodeul', 'fish_dukjung', 'fish_miyugi'],
    'sheet_birds': ['bird_dipper', 'bird_mandarin', 'bird_scops', 'bird_woodpecker'],
}


def crop_alpha(im, pad=2):
    a = np.asarray(im)[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + 1 + pad)
    return im.crop((x0, y0, x1, y1)), (x0, y0)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name in SINGLES:
        im = Image.open(os.path.join(RAW, name + '.png')).convert('RGBA')
        c, off = crop_alpha(im)
        c.save(os.path.join(OUT, name + '.png'))
        print(name, c.size, 'offset', off)
    for sheet, names in SHEETS.items():
        im = Image.open(os.path.join(RAW, sheet + '.png')).convert('RGBA')
        arr = np.asarray(im)
        a = arr[:, :, 3] > 8
        lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
        H, W = a.shape
        quads = [np.zeros_like(a) for _ in range(4)]
        for k in range(1, n + 1):
            m = lab == k
            if m.sum() < 400:
                continue
            ys, xs = np.nonzero(m)
            q = (1 if xs.mean() >= W / 2 else 0) + (2 if ys.mean() >= H / 2 else 0)
            quads[q] |= m
        for q, nm in enumerate(names):
            m = quads[q] & a
            if not m.any():
                print('!! empty quadrant', sheet, q)
                continue
            sub = arr.copy()
            sub[:, :, 3] = np.where(quads[q], sub[:, :, 3], 0)
            c, off = crop_alpha(Image.fromarray(sub))
            c.save(os.path.join(OUT, nm + '.png'))
            print(nm, c.size, 'from', sheet, 'offset', off)


if __name__ == '__main__':
    main()

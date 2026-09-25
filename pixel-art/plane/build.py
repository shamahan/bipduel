"""Биплан BipDuel (в духе Sopwith Camel), вид строго сбоку, нос вправо.

Кадр 36x24, ось фюзеляжа — по центру кадра (игра вращает спрайт вокруг центра).
4 кадра пропеллера лентой по горизонтали -> src/render/plane.png.
Красный рисуем здесь, синий P2 игра получает перекраской (sprites.ts: recolorRedToBlue),
поэтому все «красные» цвета должны иметь оттенок 300..11°, а дерево — от 14°.
Запуск: python build.py
"""
import colorsys
import math
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path.home() / ".claude/skills/pixel-art-studio/scripts"))
from pixelstudio import Sprite, hex2rgba, ramp  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parent.parent
MASTER = ROOT / "src/render/plane.png"

W, H = 36, 24
SKY = "#8fc0e8"

DARK = "#2a1420"  # контур, общий самый тёмный
RED = ramp("#c23b3b", 5, hue_shift=8)[:4]  # тёмный -> светлый (верхний пастельный не нужен)
METAL = ["#4a5058", "#7d8a8e", "#b9c2c0"]
WOOD = ["#6b3f2e", "#844f3f", "#a56a4c"]
CREAM = "#efe3c4"
SKIN = "#e6cd96"
TIRE = "#34363d"
BLUR = "#dce2e6"  # диск вращения, рисуется полупрозрачным
BLUR_A = (0xDC, 0xE2, 0xE6, 96)

PALETTE = [DARK] + RED + METAL + WOOD + [CREAM, SKIN, TIRE, BLUR]


def fuselage_rows(x):
    """Верх/низ фюзеляжа по колонке: ровный до x=12, дальше сужение к хвосту."""
    if x >= 12:
        return 9, 14
    t = (12 - x) / 8
    return 9 + int(2 * t + 0.5), 14 - int(2 * t + 0.5)


def draw_body(s, scarf):
    # хвост: киль с рулём и стабилизатор
    for y, (x0, x1) in {5: (3, 4), 6: (2, 5), 7: (2, 6), 8: (2, 7), 9: (2, 8), 10: (2, 9)}.items():
        s.line(x0, y, x1, y, RED[2])
        s.px(x0, y, RED[3])
    s.line(2, 6, 2, 10, CREAM)  # светлая кромка руля — опознавательная полоса
    s.line(1, 12, 8, 12, RED[1])  # стабилизатор

    # фюзеляж
    for x in range(4, 29):
        top, bottom = fuselage_rows(x)
        s.line(x, top, x, bottom, RED[2])
        s.px(x, top, RED[3])
        s.line(x, bottom - 1, x, bottom, RED[1])
    s.line(9, 10, 9, 13, CREAM)  # полоса у хвоста
    s.line(10, 10, 10, 13, CREAM)

    # нижнее крыло под фюзеляжем, отделено тёмным швом
    s.line(15, 14, 25, 14, DARK)
    s.line(15, 15, 25, 15, RED[2])
    s.line(16, 16, 24, 16, RED[1])

    # верхнее крыло над фюзеляжем с просветом неба; толще у передней кромки
    s.line(19, 2, 26, 2, RED[3])
    s.line(16, 3, 27, 3, RED[1])

    # капот ротативного мотора и кок винта
    for x in range(26, 32):
        y0, y1 = (9, 14) if x == 31 else (8, 15)
        s.line(x, y0, x, y1, METAL[1])
        s.px(x, y0, METAL[2])
        s.px(x, y1, METAL[0])
        s.px(x, y1 - 1, METAL[0])
    s.line(26, 8, 26, 15, METAL[0])  # стык с фюзеляжем
    s.line(32, 11, 32, 12, METAL[1])

    # пилот: шлем, очки, лицо, куртка в кабине
    s.line(14, 6, 16, 6, WOOD[1])
    s.line(14, 7, 15, 7, WOOD[1])
    s.px(16, 7, METAL[2])
    s.px(14, 8, WOOD[1])
    s.line(15, 8, 16, 8, SKIN)
    s.line(13, 9, 17, 9, WOOD[0])

    # шарф по ветру (2 положения)
    tail = [(13, 8), (12, 8), (11, 7), (10, 7)] if scarf == 0 else [(13, 8), (12, 8), (11, 8), (10, 9)]
    for x, y in tail:
        s.px(x, y, CREAM)

    # колесо 4x4
    s.line(22, 19, 23, 19, TIRE)
    s.rect(21, 20, 24, 21, TIRE)
    s.line(22, 22, 23, 22, TIRE)
    s.px(22, 20, METAL[2])


def draw_details(s):
    """Тонкие элементы — после контура, иначе обведутся в 3 px."""
    for x in (19, 25):  # межкрыльевые стойки
        s.line(x, 4, x, 13, METAL[0])
    s.line(20, 17, 21, 18, METAL[0])  # шасси
    s.line(25, 17, 24, 18, METAL[0])
    s.line(5, 13, 4, 14, METAL[0])  # хвостовой костыль


# лопасть: (y0, y1, цвет) — длинная, средняя, ребром, средняя другой стороной
PROP = [(3, 20, WOOD[1]), (7, 16, WOOD[0]), (10, 13, DARK), (7, 16, WOOD[2])]
PROP_X = 33


def draw_prop(s, f):
    im = s._img()
    for y in range(3, 21):
        im.putpixel((PROP_X, y), BLUR_A)
    y0, y1, c = PROP[f]
    s.line(PROP_X, y0, PROP_X, y1, c)


s = Sprite(W, H, palette=PALETTE)
for f in range(4):
    if f:
        s.add_frame(copy=False)
    draw_body(s, scarf=f // 2)
    s.outline(DARK, where="outside")
    draw_details(s)
    draw_prop(s, f)
s.set_duration(40, frames="all")
s.tag("spin", 1, 4)

# проверка: красные попадают под перекраску, дерево — нет
for name, cols in (("RED", RED + [DARK]), ("WOOD", WOOD)):
    hues = []
    for c in cols:
        r, g, b = (int(c[i:i + 2], 16) / 255 for i in (1, 3, 5))
        hues.append(round(colorsys.rgb_to_hls(r, g, b)[0] * 360))
    print(name, cols, "hue", hues)

OUT.mkdir(exist_ok=True)
s.stats()
s.preview(str(OUT / "preview.png"), scale=10, bg=SKY)
s.save_silhouette(str(OUT / "silhouette.png"))
s.save_gif(str(OUT / "spin.gif"), scale=8, bg=SKY)
s.save_spritesheet(str(MASTER), layout="horizontal", json_path=str(OUT / "plane.json"))


# ---------------------------------------------------------------------------
# Бочка для штопора: 8 кадров полного оборота вокруг оси фюзеляжа -> src/render/plane-roll.png.
# Кадр 36x48, ось фюзеляжа на y=24 (как y=12 в боковом кадре). Кадры 1 и 5 — боковой вид
# (как есть и отражённый), остальные — проекция простой объёмной модели того же биплана:
# v — вертикаль бокового вида (вниз +), l — размах крыла; крен поворачивает (v, l).

ROLL_MASTER = ROOT / "src/render/plane-roll.png"
RW, RH = W, 48
PAD = (RH - H) // 2  # боковой кадр вставляется со сдвигом вниз
SPAN_TOP, SPAN_LOW = 20, 18  # полуразмах верхнего и нижнего крыла
ROUNDEL_L, ROUNDEL_R = 13, 3  # опознавательные круги на крыльях: где и какого радиуса


def side_image(flip):
    side = Sprite(W, H, palette=PALETTE)
    draw_body(side, scarf=0)
    side.outline(DARK, where="outside")
    draw_details(side)
    im = side._img()
    for y in range(3, 21):  # в бочке винт — только диск вращения
        im.putpixel((PROP_X, y), BLUR_A)
    return im.transpose(Image.FLIP_TOP_BOTTOM) if flip else im


def samples():
    """Точки модели: (x, v, l, деталь, материал, нормаль по v, нормаль по l)."""
    pts = []
    step = 0.5

    def rng(a, b):
        n = int(round((b - a) / step))
        return [a + step * (i + 0.5) for i in range(n)]

    for col in range(4, 29):  # фюзеляж: эллипс в сечении, высота — как в боковом виде
        top, bottom = fuselage_rows(col)
        hv = (bottom + 1 - top) / 2
        cv = (top + bottom + 1) / 2 - 12
        hl = hv * 0.85
        for x in rng(col, col + 1):
            for v in rng(cv - hv, cv + hv):
                for l in rng(-hl, hl):
                    dv, dl = (v - cv) / hv, l / hl
                    if dv * dv + dl * dl <= 1:
                        mat = "cream" if col in (9, 10) else "red"  # опознавательная полоса у хвоста
                        pts.append((x, v, l, "body", mat, dv, dl))
    for x in rng(26, 32):  # капот мотора
        for v in rng(-4, 4):
            for l in rng(-4, 4):
                if v * v + l * l <= 16:
                    pts.append((x, v, l, "body", "metal", v / 4, l / 4))
    for x in rng(32, 33):  # кок винта
        for v in rng(-1, 1):
            for l in rng(-1, 1):
                pts.append((x, v, l, "body", "metal", v, l))
    for x in rng(14, 17):  # шлем пилота над кабиной
        for v in rng(-6, -3):
            for l in rng(-1.5, 1.5):
                dv, dl, dx = (v + 4.5) / 1.5, l / 1.5, (x - 15.5) / 1.5
                if dv * dv + dl * dl + dx * dx <= 1:
                    pts.append((x, v, l, "pilot", "wood", dv, dl))

    def wing(x0, x1, v0, v1, span, name):
        mid = (x0 + x1) / 2
        for x in rng(x0, x1):
            for l in rng(-span, span):
                tip = max(0.0, (abs(l) - (span - 4)) / 4)  # законцовки скруглены: хорда сужается
                if tip > 0 and abs(x - mid) > (x1 - x0) / 2 * math.sqrt(max(0.0, 1 - tip * tip)):
                    continue
                for v in rng(v0, v1):
                    up = v < (v0 + v1) / 2
                    mat = "red"
                    r = math.hypot(abs(l) - ROUNDEL_L, x - mid)
                    if ((name == "top" and up) or (name == "low" and not up)) and r <= ROUNDEL_R:
                        mat = "roundel_c" if r <= 1.2 else "roundel_r"
                    pts.append((x, v, l, name, mat, -1.0 if up else 1.0, 0.0))

    wing(16, 28, -10, -8, SPAN_TOP, "top")
    wing(15, 26, 2, 5, SPAN_LOW, "low")

    for x in rng(1, 9):  # стабилизатор: скруглённый руль высоты, передняя кромка уходит в фюзеляж
        if x < 3:
            span = 6 * math.sqrt(max(0.0, 1 - ((3 - x) / 2) ** 2))
        else:
            span = 6 if x < 7 else 6 - (x - 7) * 2
        for l in rng(-span, span):
            for v in rng(0, 1):
                pts.append((x, v, l, "tail", "red", -1.0 if v < 0.5 else 1.0, 0.0))
    for row, (c0, c1) in {5: (3, 4), 6: (2, 5), 7: (2, 6), 8: (2, 7), 9: (2, 8), 10: (2, 9)}.items():
        for x in rng(c0, c1 + 1):  # киль
            for v in rng(row - 12, row - 11):
                for l in rng(-0.5, 0.5):
                    pts.append((x, v, l, "fin", "red", 0.0, 1.0 if l > 0 else -1.0))

    for sx in (19, 25):  # стойки: у фюзеляжа до верхнего крыла, в размахе — между крыльями
        for l0 in (-12, 12, -1.5, 1.5):
            for v in rng(-8, 2 if abs(l0) > 5 else -3):
                for l in rng(l0 - 0.5, l0 + 0.5):
                    pts.append((sx + 0.5, v, l, "strut", "strut", 0.0, 1.0))
    for side_l in (-3.5, 3.5):  # колёса и стойки шасси
        for x in rng(20.5, 24.5):
            for v in rng(7, 11):
                if (x - 22.5) ** 2 + (v - 9) ** 2 <= 4:
                    for l in rng(side_l - 0.5, side_l + 0.5):
                        pts.append((x, v, l, "wheel", "tire", 0.0, 1.0 if side_l > 0 else -1.0))
        for v in rng(3, 8):
            t = (v - 3) / 5
            for l in rng(side_l * t - 0.5, side_l * t + 0.5):
                pts.append((21.5, v, l, "strut", "strut", 0.0, 1.0))
                pts.append((24.5, v, l, "strut", "strut", 0.0, 1.0))
    return pts


RAMPS = {"red": (RED[1], RED[2], RED[3]), "metal": (METAL[0], METAL[1], METAL[2]),
         "wood": (WOOD[0], WOOD[1], WOOD[2])}
SEAM = {"red": RED[0], "roundel_r": RED[0], "roundel_c": RED[0]}  # шов на дальней поверхности


def shade(mat, lit):
    fixed = {"roundel_r": CREAM, "roundel_c": RED[1], "cream": CREAM, "tire": TIRE, "strut": METAL[0]}
    if mat in fixed:
        return fixed[mat]
    dark, mid, light = RAMPS[mat]
    return light if lit > 0.45 else mid if lit > -0.35 else dark


MODEL = samples()


def roll_image(theta):
    """Проекция модели при крене theta: в каждом пикселе ближайшая к зрителю точка."""
    c, sn = math.cos(theta), math.sin(theta)
    zbuf = {}
    for x, v, l, part, mat, nv, nl in MODEL:
        depth = -v * sn + l * c
        key = (int(math.floor(x)), int(math.floor(v * c + l * sn + RH / 2)))
        if key not in zbuf or depth > zbuf[key][0]:
            lit = -(nv * c + nl * sn) / (math.hypot(nv, nl) or 1.0)  # свет сверху экрана
            zbuf[key] = (depth, part, mat, shade(mat, lit))
    im = Image.new("RGBA", (RW, RH), (0, 0, 0, 0))
    for (px_, py_), (depth, part, mat, col) in zbuf.items():
        # сосед заметно ближе и это другая деталь (не тонкая стойка) — рисуем шов по его краю
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nb = zbuf.get((px_ + dx, py_ + dy))
            if nb and nb[0] - depth > 2.5 and nb[1] not in ("strut", part):
                col = SEAM.get(mat, DARK)
                break
        im.putpixel((px_, py_), hex2rgba(col))
    return im


roll = Sprite(RW, RH, palette=PALETTE)
for k in range(8):
    if k:
        roll.add_frame(copy=False)
    if k in (0, 4):
        roll._img().paste(side_image(flip=k == 4), (0, PAD))
        continue
    roll._img().paste(roll_image(k * math.pi / 4), (0, 0))
    roll.outline(DARK, where="outside")
    for y in range(3 + PAD, 21 + PAD):
        roll._img().putpixel((PROP_X, y), BLUR_A)
roll.set_duration(1000 // 16, frames="all")
roll.tag("roll", 1, 8)

roll.stats()
roll.preview(str(OUT / "roll-preview.png"), scale=10, bg=SKY)
roll.save_silhouette(str(OUT / "roll-silhouette.png"))
roll.save_gif(str(OUT / "roll.gif"), scale=8, bg=SKY)
# так бочка выглядит в игре: носом вниз
sky = Image.new("RGBA", (RH, RW), hex2rgba(SKY))
dive = [Image.alpha_composite(sky, roll.composite(frame=i + 1).transpose(Image.ROTATE_270))
        .resize((RH * 6, RW * 6), Image.NEAREST) for i in range(8)]
dive[0].save(str(OUT / "roll-dive.gif"), save_all=True, append_images=dive[1:], duration=1000 // 16, loop=0)
roll.save_spritesheet(str(ROLL_MASTER), layout="horizontal", json_path=str(OUT / "plane-roll.json"))

print("done")

"""Земля BipDuel: полоса 800x80 по нижнему краю экрана (y=520..599) и дальний план 800x130.

Линия земли — ряд TOP=60 полосы, на экране y=580 (TUNING.world.groundY). Поверх неё
стоят твёрдые объекты: лес через шов экрана, аэродром и ферма. Обычные не выше ~22 px,
высокие (башня КДП, силос, сосны) торчат выше — это ориентиры.

Кроме картинок скрипт пишет src/sim/skyline.ts — высотную карту: для каждой колонки x
верхний твёрдый пиксель. Декор (травинки, колосья, огни ВПП) в неё не входит.
Дальний план столкновений не имеет. Запуск: python build.py
"""
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/pixel-art-studio/scripts"))
from pixelstudio import Sprite  # noqa: E402
from PIL import Image  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parent.parent
MASTER = ROOT / "src/render/ground.png"
FAR_MASTER = ROOT / "src/render/far-hills.png"
SKYLINE_TS = ROOT / "src/sim/skyline.ts"

W, H = 800, 80
SCREEN_H = 600
Y0 = SCREEN_H - H  # рендер кладёт полосу по нижнему краю экрана
TOP = 60  # линия земли: y = 580 на экране
SKY = "#8fc0e8"

# --- палитра ---
GRASS = ["#185d3b", "#2b8049", "#3f9b52", "#6cc871", "#a5eb9e"]
SOIL = ["#452215", "#6d3f29", "#7d5238", "#bd8f6c"]
STONE = ["#4f505c", "#5a686c", "#a9a9a0"]
FLOWER = "#e6cd96"
OUT_M = "#2a1420"  # контур построек — тот же, что у самолёта
OUT_V = "#123a2c"  # контур растений
METAL = ["#34363d", "#4a5058", "#7d8a8e", "#b9c2c0", "#dce2e6"]  # из самолёта
CREAM = ["#c9b48c", "#dccba3", "#efe3c4"]
WOOD = ["#6b3f2e", "#844f3f", "#a56a4c"]  # из пропеллера
GLASS = ["#2f4d5e", "#a8d4f0"]
LEAF = ["#245a24", "#3f7f2e", "#5a9e3c", "#8cc460"]
LEAF_D = ["#1b4622", "#2d6630", "#44853f", "#6aaa58"]  # тёмные дубы для разнообразия
PINE = ["#0f3a2e", "#1f5a45", "#2d7552", "#4f9a68"]
BARN = ["#5e1a1c", "#842a24", "#a33a2f", "#c65f4a"]
HANG = ["#394838", "#52634f", "#6b7d66", "#93a58a"]
HAY = ["#8a5e22", "#b58a3c", "#d9b560", "#f0dc93"]
DARK = "#1e1a24"  # проём ангара
SIGNAL = ["#e6552e", "#fff3a0"]  # как вспышка взрыва

rng = random.Random(1917)


def wave(x, *terms):
    """Сумма синусов с целым числом периодов на ширину — полоса бесшовна при повторе."""
    return sum(a * math.sin(2 * math.pi * k * x / W + ph) for k, a, ph in terms)


# ======================================================================
# объекты: каждый рисуется в свой спрайт (w+2)x(h+2) с полем 1 px под контур.
# Тело: колонки 1..w, ряды 1..h; ряд h (yh=0) стоит на поверхности земли.
# ======================================================================


class Obj:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.s = Sprite(w + 2, h + 2, snap=False)

    def P(self, x, yh, c):  # x от 0 слева, yh от 0 снизу
        self.s.px(1 + x, self.h - yh, c)

    def R(self, x0, yh0, x1, yh1, c, only=None):
        self.s.rect(1 + x0, self.h - yh1, 1 + x1, self.h - yh0, c, only=only)

    def get(self, x, yh):
        return self.s.get(1 + x, self.h - yh)

    def filled(self, x, yh):
        return 0 <= x < self.w and 0 <= yh < self.h and self.get(x, yh) is not None


def row_span(o, yh):
    xs = [x for x in range(o.w) if o.filled(x, yh)]
    return (xs[0], xs[-1]) if xs else None


def pine(h):
    w = max(9, round(h * 0.5)) | 1
    o = Obj(w, h)
    cx = w // 2
    trunk = 3
    for yh in range(trunk + 1):
        o.P(cx - 1, yh, WOOD[1])
        o.P(cx, yh, WOOD[0])
    can = h - trunk  # высота кроны
    tiers = 3 if h < 26 else 4
    step = can / (tiers + 0.6)
    tier_h = step * 1.6
    rows = {}
    for k in range(tiers):
        da = k * step
        db = can - 1 if k == tiers - 1 else da + tier_h
        hwb = 2 + (cx - 2) * (k + 1) / tiers
        for d in range(math.floor(da), math.floor(db) + 1):
            t = (d - da) / max(1, db - da)
            hw = round(0.4 + hwb * t)
            rows[d] = max(rows.get(d, -1), hw)
            rows.setdefault(("tier", d), k)
    for d, hw in rows.items():
        if isinstance(d, tuple):
            continue
        yh = h - 1 - d
        for x in range(cx - hw, cx + hw + 1):
            rel = (x - (cx - hw)) / max(1, 2 * hw)
            c = PINE[2] if rel < 0.45 else PINE[1]
            if rel > 0.8 and hw > 1:
                c = PINE[0]
            o.P(x, yh, c)
    # тень под ярусами и блик по левому скату каждого яруса
    for k in range(1, tiers):
        yh = h - 1 - (math.floor((k - 1) * step + tier_h) + 1)
        span = row_span(o, yh)
        if span:
            for x in range(span[0] + 1, span[1]):
                o.P(x, yh, PINE[1] if x < cx else PINE[0])
    for d, hw in rows.items():
        if isinstance(d, tuple) or hw < 1:
            continue
        yh = h - 1 - d
        prev = rows.get(d - 1, 0)
        if hw > prev:  # ступень наружу — верх ветки на свету
            for x in range(cx - hw, cx - prev):
                o.P(x, yh, PINE[3])
    o.P(cx, h - 1, PINE[3])
    o.s.outline(OUT_V)
    return o


def leafy(h, w=None, trunk=None, seed=0, tone=0):
    """Лиственное дерево: крона из клубов, затенение сдвинутыми копиями."""
    r0 = random.Random(seed)
    L = LEAF_D if tone else LEAF
    w = w or (round(h * 0.95) | 1)
    trunk = trunk if trunk is not None else max(3, round(h * 0.28))
    o = Obj(w, h)
    cx = w // 2
    can_h = h - trunk + 1
    R = can_h / 2
    cyh = trunk - 1 + R  # центр кроны (yh)
    def j(a):
        return r0.uniform(-a, a)

    puffs = [(j(0.8), j(0.6), R * 0.78),
             (-w * 0.27 + j(1), -R * 0.28 + j(1), R * (0.5 + j(0.08))),
             (w * 0.27 + j(1), -R * 0.24 + j(1), R * (0.52 + j(0.08))),
             (-w * 0.12 + j(1.5), R * 0.36 + j(0.8), R * (0.56 + j(0.08))),
             (w * 0.15 + j(1.5), R * 0.3 + j(0.8), R * (0.5 + j(0.08)))]

    def inside(x, yh, dx=0.0, dy=0.0, shrink=0.0):
        for px_, py_, pr in puffs:
            pr -= shrink
            if pr <= 0:
                continue
            if (x + 0.5 - (cx + 0.5 + px_ + dx)) ** 2 + (yh + 0.5 - (cyh + py_ + dy)) ** 2 <= pr * pr:
                return True
        return False

    for x in range(w):
        for yh in range(h):
            if inside(x, yh):
                c = L[0]
                if inside(x, yh, dx=-1.2, dy=1.2):
                    c = L[1]
                if inside(x, yh, dx=-2.2, dy=2.2, shrink=1.4):
                    c = L[2]
                if inside(x, yh, dx=-2.8, dy=3.0, shrink=R * 0.42):
                    c = L[3]
                o.P(x, yh, c)
    # ствол поверх низа кроны
    for yh in range(trunk + 1):
        if o.get(cx, yh) is None or yh < trunk - 1:
            o.P(cx - 1, yh, WOOD[1])
            o.P(cx, yh, WOOD[0])
            o.P(cx + 1, yh, WOOD[0])
    o.P(cx - 2, 0, WOOD[1])
    o.P(cx + 2, 0, WOOD[0])
    o.s.outline(OUT_V)
    return o


def bush(h, w, seed=0, tone=0):
    return leafy(h, w=w, trunk=0, seed=seed, tone=tone)


def hangar(w=64, h=22):
    o = Obj(w, h)
    n = 2.4
    tops = []
    for x in range(w):
        u = (x + 0.5 - w / 2) / (w / 2)
        v = (1 - abs(u) ** n) ** (1 / n)
        rh = max(5, round(h * v))
        tops.append(rh)
        for yh in range(rh):
            c = HANG[2]
            if x % 4 == 1:
                c = HANG[1]  # стыки гофры
            o.P(x, yh, c)
        # обшивка арки: светлая слева, тёмная справа
        for k in range(2):
            yh = rh - 1 - k
            o.P(x, yh, (HANG[3] if k == 0 else HANG[2]) if x < w * 0.45 else (HANG[1] if k == 0 else HANG[1]))
    # проём и откатные створки
    dw, dh = 36, 15
    d0 = (w - dw) // 2
    o.R(d0, 0, d0 + dw - 1, dh - 1, DARK)
    o.R(d0 - 1, dh, d0 + dw, dh, HANG[0])  # притолока
    for sx in (d0 - 6, d0 + dw):
        o.R(sx, 0, sx + 5, dh - 1, HANG[3])
        o.R(sx + 5, 0, sx + 5, dh - 1, HANG[1])
        o.R(sx + 2, 0, sx + 2, dh - 1, HANG[2])
    # внутри: светлый пол и силуэт стоящего самолёта-пропеллера
    o.R(d0, 0, d0 + dw - 1, 0, HANG[0])
    g = METAL[0]  # биплан в тени: только силуэт
    o.R(d0 + 8, 3, d0 + 25, 5, g)  # фюзеляж
    o.R(d0 + 7, 5, d0 + 9, 8, g)  # киль
    o.R(d0 + 13, 10, d0 + 24, 10, g)  # верхнее крыло
    o.R(d0 + 15, 6, d0 + 15, 9, g)
    o.R(d0 + 22, 6, d0 + 22, 9, g)
    o.R(d0 + 20, 1, d0 + 21, 2, g)  # колесо
    o.R(d0 + 27, 1, d0 + 27, 8, g)  # пропеллер
    o.R(d0 + 26, 4, d0 + 26, 5, g)
    # номер ангара — круглое окно над проёмом
    o.R(w // 2 - 2, dh + 2, w // 2 + 1, dh + 3, GLASS[0])
    o.P(w // 2 - 2, dh + 3, GLASS[1])
    o.s.outline(OUT_M)
    return o


def tower(h=42):
    w = 20
    o = Obj(w, h)
    # основание
    o.R(2, 0, 17, 7, CREAM[2])
    o.R(15, 0, 17, 7, CREAM[0])
    o.R(4, 0, 6, 4, WOOD[1])
    o.R(6, 0, 6, 4, WOOD[0])
    o.R(10, 3, 13, 5, GLASS[0])
    o.P(10, 5, GLASS[1])
    o.R(1, 8, 18, 8, METAL[2])
    o.R(1, 8, 4, 8, METAL[3])
    # ствол
    o.R(6, 9, 13, 28, CREAM[2])
    o.R(12, 9, 13, 28, CREAM[0])
    o.R(6, 9, 6, 28, CREAM[1])
    for wy in (13, 20):
        o.R(8, wy, 10, wy + 1, GLASS[0])
        o.P(8, wy + 1, GLASS[1])
    # застеклённая кабина
    o.R(2, 29, 17, 29, METAL[1])
    o.R(1, 30, 18, 34, GLASS[0])
    for mx in (1, 6, 11, 16):
        o.R(mx, 30, mx, 34, METAL[1])
    for gx in (3, 8, 13):  # блики на стёклах
        o.P(gx, 32, GLASS[1])
        o.P(gx + 1, 33, GLASS[1])
    o.R(0, 35, 19, 36, METAL[0])
    o.R(0, 36, 19, 36, METAL[2])
    o.R(0, 36, 6, 36, METAL[3])
    # антенна с огнём
    o.R(9, 37, 9, 40, METAL[3])
    o.P(9, 41, SIGNAL[0])
    o.s.outline(OUT_M)
    return o


def fuel_tank(w=14, h=9):
    o = Obj(w, h)
    for lx in (2, w - 4):
        o.R(lx, 0, lx + 1, 1, METAL[1])
    body_h = h - 2
    for yh in range(2, h):
        k = yh - 2
        inset = 1 if k in (0, body_h - 1) else 0
        for x in range(inset, w - inset):
            c = METAL[2] if k < 2 else METAL[3]
            if k >= body_h - 2:
                c = METAL[4]
            o.P(x, yh, c)
    o.R(1, 4, w - 2, 4, SIGNAL[0])  # красная полоса «огнеопасно»
    o.R(w - 2, 3, w - 1, h - 2, METAL[2], only="opaque")
    o.s.outline(OUT_M)
    return o


def windsock(h=18):
    w = 11
    o = Obj(w, h)
    o.R(0, 0, 0, h - 1, METAL[2])
    o.P(0, h - 1, METAL[4])
    stripes = [SIGNAL[0], SIGNAL[0], CREAM[2], CREAM[2], SIGNAL[0], SIGNAL[0], CREAM[2], CREAM[2], SIGNAL[0], SIGNAL[0]]
    for i, c in enumerate(stripes):
        x = 1 + i
        top = h - 2 - (1 if i >= 6 else 0)
        depth = 4 if i < 3 else 3 if i < 7 else 2
        for k in range(depth):
            o.P(x, top - k, c)
        o.P(x, top - depth + 1, c)
    o.s.outline(OUT_M)
    return o


def farmhouse(w=34, h=22):
    o = Obj(w, h)
    # стены с горизонтальной обшивкой
    o.R(2, 0, w - 3, 11, CREAM[2])
    for yh in (2, 5, 8):
        o.R(2, yh, w - 3, yh, CREAM[1])
    o.R(2, 11, w - 3, 11, CREAM[0])  # тень под свесом
    for wx in (5, w - 10):
        o.R(wx, 4, wx + 4, 8, GLASS[0])
        o.P(wx, 8, GLASS[1])
        o.P(wx + 1, 8, GLASS[1])
        o.R(wx - 1, 4, wx - 1, 8, WOOD[1])
        o.R(wx + 5, 4, wx + 5, 8, WOOD[1])
    dx = w // 2 - 2
    o.R(dx, 0, dx + 3, 7, WOOD[1])
    o.R(dx + 3, 0, dx + 3, 7, WOOD[0])
    o.P(dx + 2, 3, FLOWER)
    # труба
    o.R(w - 9, 17, w - 7, 21, BARN[1])
    o.R(w - 9, 21, w - 7, 21, METAL[1])
    # крыша-трапеция из рядов черепицы
    for i, yh in enumerate(range(12, 20)):
        inset = round(i * 0.72)
        c = WOOD[1] if i % 2 == 0 else WOOD[0]
        if i == 7:
            c = WOOD[2]
        o.R(inset, yh, w - 1 - inset, yh, c)
        o.R(inset, yh, inset + 1, yh, WOOD[2])
    o.s.outline(OUT_M)
    return o


def barn(w=46, h=26):
    o = Obj(w, h)
    half = w / 2

    def hw(yh):
        if yh <= 12:
            return half
        if yh <= 20:
            return half - (yh - 12) * 0.8
        return half - 6.4 - (yh - 20) * 2.6

    for yh in range(h):
        a = round(half - hw(yh))
        for x in range(a, w - a):
            o.P(x, yh, METAL[1])  # кромка кровли
    for yh in range(h - 1):
        a = round(half - hw(yh))
        a = a if yh <= 12 else a + 1
        for x in range(a, w - a):
            c = BARN[2] if x < w * 0.62 else BARN[1]
            if x % 3 == 0:
                c = BARN[1] if c == BARN[2] else BARN[0]
            o.P(x, yh, c)
        if yh > 12:  # светлая окантовка фронтона
            o.P(a, yh, CREAM[2])
            o.P(w - 1 - a, yh, CREAM[1])
    o.R(0, 12, w - 1, 12, CREAM[2])
    o.R(0, 12, w - 1, 12, CREAM[2])
    # двустворчатые ворота с белыми «иксами»
    d0, d1 = 12, w - 13
    o.R(d0, 0, d1, 10, CREAM[2])
    mid = (d0 + d1) // 2
    for a0, a1 in ((d0 + 1, mid - 1), (mid + 1, d1 - 1)):
        o.R(a0, 0, a1, 9, BARN[1])
        for k in range(a1 - a0 + 1):
            t = k / max(1, a1 - a0)
            yh = round(t * 9)
            o.P(a0 + k, yh, CREAM[1])
            o.P(a1 - k, yh, CREAM[1])
    # сеновал
    o.R(mid - 4, 14, mid + 4, 19, CREAM[2])
    o.R(mid - 3, 14, mid + 3, 18, DARK)
    o.R(mid - 3, 14, mid + 3, 14, HAY[2])
    o.P(mid - 1, 15, HAY[3])
    o.P(mid + 2, 15, HAY[1])
    o.s.outline(OUT_M)
    return o


def silo(h=40):
    w = 14
    o = Obj(w, h)
    body = h - 6
    shade = [METAL[3], METAL[4], METAL[4], METAL[4], METAL[3], METAL[3], METAL[3], METAL[3], METAL[3],
             METAL[2], METAL[2], METAL[2], METAL[1], METAL[1]]
    for x in range(w):
        o.R(x, 0, x, body - 1, shade[x])
    for yh in range(5, body, 7):  # обручи
        for x in range(w):
            o.P(x, yh, METAL[2] if x < 9 else METAL[1])
    o.R(11, 1, 11, body - 2, METAL[0])  # лестница
    for yh in range(2, body - 1, 3):
        o.P(12, yh, METAL[0])
    dome = [7, 7, 6, 5, 4, 2]
    for k, hw in enumerate(dome):
        yh = body + k
        for x in range(7 - hw, 7 + hw):
            c = METAL[3] if x < 7 else METAL[2]
            if x < 7 - hw + 2 and k > 0:
                c = METAL[4]
            o.P(x, yh, c)
    o.P(6, h - 1, METAL[4])
    o.s.outline(OUT_M)
    return o


def hay_bale():
    w, h = 9, 8
    o = Obj(w, h)
    for x in range(w):
        for yh in range(h):
            if (x + 0.5 - 4.5) ** 2 / 4.5 ** 2 + (yh + 0.5 - 4.0) ** 2 / 4.0 ** 2 <= 1:
                c = HAY[1]
                if (x + 0.5 - 3.6) ** 2 / 3.6 ** 2 + (yh + 0.5 - 4.6) ** 2 / 3.4 ** 2 <= 1:
                    c = HAY[2]
                o.P(x, yh, c)
    for x, yh in ((4, 5), (5, 5), (6, 4), (6, 3), (5, 2), (4, 2), (3, 3)):  # спираль рулона
        o.P(x, yh, HAY[0])
    o.P(2, 6, HAY[3])
    o.P(3, 6, HAY[3])
    o.s.outline(OUT_M)
    return o


def scarecrow():
    w, h = 9, 14
    o = Obj(w, h)
    o.R(4, 0, 4, 9, WOOD[1])
    o.R(0, 8, 8, 8, WOOD[2])
    o.R(3, 4, 5, 8, BARN[2])
    o.R(1, 7, 7, 8, BARN[2])
    o.R(5, 4, 5, 8, BARN[1])
    o.P(0, 7, HAY[3])
    o.P(8, 7, HAY[3])
    o.R(3, 3, 5, 3, HAY[2])
    o.R(3, 9, 5, 10, FLOWER)
    o.R(2, 11, 6, 11, HAY[1])
    o.R(3, 12, 5, 13, HAY[0])
    o.s.outline(OUT_M)
    return o


def fence(length):
    o = Obj(length, 6)
    o.s = Sprite(length + 2, 8, snap=False)
    for x in range(length):
        o.P(x, 2, WOOD[1])
        o.P(x, 4, WOOD[2])
    for x in range(0, length, 6):
        o.R(x, 0, x + 1, 5, WOOD[0])
        o.P(x, 5, WOOD[2])
    return o  # без контура: тонкое дерево с контуром выглядит тяжело


# ======================================================================
# сборка полосы
# ======================================================================

ground = Sprite(W, H, snap=False)
solid = Image.new("L", (W, H), 0)  # маска столкновений
objects_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
records = []


def place(o, x, name):
    """Кладёт объект так, что нижний ряд тела стоит на поверхности (ряд TOP).
    Объект у шва экрана кладётся и с другой стороны — полоса бесшовна."""
    im = o.s.frames[0].cels["main"]
    mask = im.split()[3].point(lambda a: 255 if a else 0)
    y = TOP - o.h
    for px in (x - 1 - W, x - 1, x - 1 + W):
        x0, x1 = max(0, px), min(W, px + im.width)
        if x1 <= x0:
            continue
        objects_layer.alpha_composite(im.crop((x0 - px, 0, x1 - px, im.height)), (x0, y))
        solid.paste(255, (x0, y), mask.crop((x0 - px, 0, x1 - px, im.height)))
    records.append({"name": name, "top": Y0 + y})


RUNWAY = (140, 398)
FIELD = (622, 680)


def zone(x):
    x %= W
    if RUNWAY[0] <= x <= RUNWAY[1]:
        return "runway"
    if FIELD[0] <= x <= FIELD[1]:
        return "field"
    return "grass"


# --- почва ---
ground.rect(0, TOP, W - 1, H - 1, SOIL[2])
for x in range(W):
    b1 = round(72 + wave(x, (5, 1.2, 0.3), (13, 0.8, 1.1), (29, 0.4, 2.2)))
    b2 = round(77 + wave(x, (7, 0.9, 2.0), (17, 0.6, 0.4)))
    ground.line(x, b1, x, H - 1, SOIL[1])
    ground.line(x, b2, x, H - 1, SOIL[0])

# --- верхний слой по зонам ---
depth = [round(4 + wave(x, (8, 0.9, 0.0), (21, 0.7, 0.7), (45, 0.4, 1.9))) for x in range(W)]
TEETH = [[1, 2, 1], [1, 2, 2, 1], [1, 1], [2, 1], [1, 2, 1, 1]]
x = 0
while x < W:
    tooth = rng.choice(TEETH)
    for i, d in enumerate(tooth):
        depth[(x + i) % W] += d
    x += len(tooth) + rng.randint(1, 5)

for x in range(W):
    z = zone(x)
    if z == "runway":
        ground.px(x, TOP, STONE[2])
        ground.px(x, TOP + 1, "#c8c8bc" if (x // 8) % 3 else CREAM[2])  # осевая разметка
        ground.px(x, TOP + 2, STONE[2])
        ground.px(x, TOP + 3, STONE[1])
        ground.px(x, TOP + 4, STONE[0])
        ground.px(x, TOP + 5, SOIL[1])
    elif z == "field":
        ground.px(x, TOP, SOIL[1])
        ground.px(x, TOP + 1, SOIL[3] if x % 4 else SOIL[2])
        ground.px(x, TOP + 2, SOIL[2])
        ground.px(x, TOP + 3, SOIL[1] if x % 4 == 0 else SOIL[2])
    else:
        bottom = TOP + depth[x]
        ground.line(x, TOP, x, bottom, GRASS[2])
        ground.line(x, bottom - 1, x, bottom, GRASS[1])
        ground.px(x, bottom + 1, GRASS[0])
        ground.px(x, bottom + 2, SOIL[1])
        ground.px(x, TOP, GRASS[0])
        ground.px(x, TOP + 1, GRASS[3])
        if depth[x] > 3:
            ground.px(x, TOP + 2, GRASS[3])

# края ВПП: скос бетона в траву
for ex in (RUNWAY[0], RUNWAY[1]):
    ground.px(ex, TOP, GRASS[0])

# блики травы
x = 0
while x < W:
    run = rng.randint(2, 5)
    if rng.random() < 0.45:
        for i in range(run):
            if zone(x + i) == "grass":
                ground.px((x + i) % W, TOP + 1, GRASS[4])
    x += run + rng.randint(2, 7)

# комочки и камешки в почве
for _ in range(140):
    x = rng.randrange(W)
    y = rng.randint(TOP + 8, 75)
    c = SOIL[3] if rng.random() < 0.2 else SOIL[1]
    ground.line(x, y, x + 1, y, c, only=SOIL[2])
PEBBLES = [[".hm.", "hmmd", ".dd."], ["hm", "md"], [".hmm.", "hmmmd", ".mdd."], ["hmd"]]
PC = {"h": STONE[2], "m": STONE[1], "d": STONE[0]}
placed = []
tries = 0
while len(placed) < 22 and tries < 2000:
    tries += 1
    pat = rng.choice(PEBBLES)
    x = rng.randrange(W)
    y = rng.randint(TOP + 9, H - 4)
    if any(abs(x - a) < 16 and abs(y - b) < 5 for a, b in placed):
        continue
    placed.append((x, y))
    for dy, row in enumerate(pat):
        for dx, ch in enumerate(row):
            if ch != ".":
                ground.px((x + dx) % W, y + dy, PC[ch])

# --- объекты (от дальних к ближним) ---
# лес через шов: 684..890 (по модулю 800)
BACK = [(693, 21), (709, 27), (733, 24), (752, 31), (769, 25), (791, 29), (813, 22),
        (827, 28), (851, 25), (872, 30), (887, 20)]
FRONT = [(686, 14, 13, 0), (702, 18, 17, 1), (723, 21, 21, 0), (745, 15, 15, 1), (780, 20, 19, 0),
         (801, 17, 17, 1), (839, 22, 21, 0), (862, 16, 15, 1), (882, 14, 13, 0)]
for cxp, hh in BACK:
    o = pine(hh)
    place(o, cxp - o.w // 2, f"сосна {hh}")
for i, (cxp, hh, ww, tone) in enumerate(FRONT):
    o = leafy(hh, w=ww, seed=i, tone=tone)
    place(o, cxp - o.w // 2, f"дерево {hh}")
for i, (cxp, hh, ww, tone) in enumerate(((676, 7, 13, 0), (760, 6, 11, 1), (820, 7, 12, 0),
                                          (894, 8, 14, 1), (122, 6, 11, 0))):
    o = bush(hh, ww, seed=10 + i, tone=tone)
    place(o, cxp - ww // 2, "куст")

# аэродром
place(windsock(18), 132, "ветроуказатель")
place(hangar(), 156, "ангар")
place(tower(), 234, "башня КДП")
place(fuel_tank(14, 9), 262, "цистерна")
place(fuel_tank(11, 8), 279, "цистерна")

# переход
o = bush(7, 12, seed=21)
place(o, 402, "куст")
place(fence(24), 416, "забор")

# ферма
place(farmhouse(), 442, "дом")
o = leafy(19, seed=33)
place(o, 486 - o.w // 2, "яблоня")
place(barn(), 498, "амбар")
place(silo(), 546, "силос")
place(fence(36), 562, "забор")
place(hay_bale(), 600, "тюк")
place(hay_bale(), 610, "тюк")
place(scarecrow(), 646, "пугало")

# --- декор поверх (не сталкивается) ---
deco = Sprite(W, H, snap=False)
# огни ВПП
for lx in range(304, RUNWAY[1] - 4, 22):
    deco.px(lx, TOP - 1, METAL[1])
    deco.px(lx, TOP - 2, SIGNAL[1])
# колосья
for x in range(FIELD[0] + 1, FIELD[1]):
    h = 2 if x % 4 == 0 else rng.choice([4, 5, 5])  # борозда — короткие стебли
    for k in range(h):
        y = TOP - 1 - k
        c = HAY[0] if k == 0 else HAY[1]
        if k >= h - 2:
            c = HAY[3] if (x + k) % 2 else HAY[2]
        deco.px(x, y, c)
# травинки над линией — только в зонах травы
x = rng.randint(0, 6)
while x < W:
    for i in range(rng.randint(2, 3)):
        bx = (x + i * rng.choice([1, 2])) % W
        if zone(bx) != "grass":
            continue
        h = rng.choice([1, 2, 2, 3])
        deco.line(bx, TOP - h, bx, TOP - 1, GRASS[1] if h > 1 else GRASS[0])
    if rng.random() < 0.12 and zone(x + 1) == "grass":
        deco.px((x + 1) % W, TOP - 3, FLOWER)
        deco.px((x + 1) % W, TOP - 2, GRASS[2])
    x += rng.randint(6, 18)

ground_im = ground.frames[0].cels["main"]
deco_im = deco.frames[0].cels["main"]
deco_im.paste((0, 0, 0, 0), (0, 0), objects_layer.split()[3].point(lambda a: 255 if a else 0))
strip = Image.new("RGBA", (W, H), (0, 0, 0, 0))
strip.alpha_composite(ground_im)
strip.alpha_composite(objects_layer)
strip.alpha_composite(deco_im)

# --- высотная карта и маска столкновений ---
for y in range(TOP, H):
    for x in range(W):
        solid.putpixel((x, y), 255)
sp = solid.load()
skyline = []
for x in range(W):
    y = next(y for y in range(H) if sp[x, y])
    skyline.append(Y0 + y)

hit = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hp = hit.load()
for x in range(W):
    for y in range(H):
        if sp[x, y]:
            hp[x, y] = (232, 48, 48, 110)
    hp[x, skyline[x] - Y0] = (232, 48, 48, 255)

# --- дальний план (вариант Б): холмы без контура, бледнее и холоднее ---
FAR_H = 130
far = Image.new("RGBA", (W, FAR_H), (0, 0, 0, 0))
fp = far.load()
FAR1 = (133, 187, 222, 255)  # #85bbde — горы у горизонта, почти небо
FAR2 = (118, 173, 196, 255)  # #76adc4 — холмы
FAR3 = (104, 160, 164, 255)  # #68a0a4 — дальний лес
FAR3L = (120, 176, 172, 255)  # #78b0ac — освещённые кроны
for x in range(W):
    h1 = round(44 + wave(x, (2, 9, 0.4), (5, 4, 1.3), (11, 1.5, 2.0)))
    h2 = round(68 + wave(x, (3, 6, 2.2), (7, 2.5, 0.1), (19, 1, 1.1)))
    k = (x + 3) % 7
    bump = [0, 1, 2, 2, 2, 1, 0][k] + (1 if (x // 7) % 3 == 0 and 1 <= k <= 5 else 0)
    h3 = round(92 + wave(x, (4, 3, 0.9), (13, 1.2, 0.3))) - bump
    for y in range(h1, FAR_H):
        fp[x, y] = FAR1
    for y in range(h2, FAR_H):
        fp[x, y] = FAR2
    for y in range(h3, FAR_H):
        fp[x, y] = FAR3
    if bump >= 1 and k <= 3:
        fp[x, h3] = FAR3L

# --- экспорт ---
OUT.mkdir(exist_ok=True)
strip.save(MASTER)
far.save(FAR_MASTER)
rows = [", ".join(str(v) for v in skyline[i:i + 20]) for i in range(0, W, 20)]
SKYLINE_TS.write_text(
    "// Сгенерировано pixel-art/ground/build.py вместе с src/render/ground.png — не править руками.\n"
    "// Для каждой колонки экрана x — y верхнего твёрдого пикселя земли и объектов на ней.\n"
    "export const SKYLINE: readonly number[] = [\n" + "".join(f"  {r},\n" for r in rows) + "];\n",
    encoding="utf-8", newline="\n")

# --- превью для проверки глазами ---
plane = Image.open(ROOT / "src/render/plane.png").convert("RGBA")
plane = plane.crop((0, 0, plane.width // 4, plane.height))
scene = Image.new("RGBA", (W, SCREEN_H), SKY)
scene.alpha_composite(far, (0, SCREEN_H - FAR_H))
scene.alpha_composite(plane, (187, 510))
scene.alpha_composite(strip, (0, Y0))
scene.save(OUT / "scene.png")
for name, box in (("zoom-airfield", (110, 480, 410, 600)), ("zoom-farm", (400, 480, 700, 600))):
    crop = scene.crop(box)
    crop.resize((crop.width * 4, crop.height * 4), Image.NEAREST).save(OUT / f"{name}.png")
hits = scene.copy()
hits.alpha_composite(hit, (0, Y0))
hits.crop((0, 500, W, SCREEN_H)).resize((W * 2, 200), Image.NEAREST).save(OUT / "hits.png")

# шов: правый край полосы вплотную к левому — лес должен идти без разрыва
seam = Image.new("RGBA", (400, 120), SKY)
seam.alpha_composite(scene.crop((W - 200, 480, W, SCREEN_H)), (0, 0))
seam.alpha_composite(scene.crop((0, 480, 200, SCREEN_H)), (200, 0))
seam.resize((1200, 360), Image.NEAREST).save(OUT / "seam.png")

tall = sorted({(r["name"], r["top"]) for r in records if r["top"] < 560}, key=lambda t: t[1])
print("groundY", Y0 + TOP, "| выше всего", min(skyline), "| выше 560:", tall)

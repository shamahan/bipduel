"""Иконки «поделиться» для меню BipDuel: лента 6 кадров 16x16 -> src/render/share-icons.png.

Порядок кадров совпадает с SHARE_NETWORKS в src/app/share.ts, последний кадр — «скопировать ссылку».
Каждая иконка — бейдж цвета сети с контуром цвета текста меню и белым знаком сети.
Запуск: python build.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/pixel-art-studio/scripts"))
from pixelstudio import Sprite  # noqa: E402
from PIL import Image  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parent.parent
MASTER = ROOT / "src/render/share-icons.png"

N = 16
SKY = "#8fc0e8"
OUTLINE = "#1c2733"  # COLORS.text
WHITE = "#ffffff"

CIRCLE = [
    ".....oooooo.....",
    "...oobbbbbboo...",
    "..obbbbbbbbbbo..",
    ".obbbbbbbbbbbbo.",
    ".obbbbbbbbbbbbo.",
    "obbbbbbbbbbbbbbo",
    "obbbbbbbbbbbbbbo",
    "obbbbbbbbbbbbbbo",
    "obbbbbbbbbbbbbbo",
    "obbbbbbbbbbbbbbo",
    "obbbbbbbbbbbbbbo",
    ".obbbbbbbbbbbbo.",
    ".obbbbbbbbbbbbo.",
    "..obbbbbbbbbbo..",
    "...oobbbbbboo...",
    ".....oooooo.....",
]
SQUARE = ["..oooooooooooo..", ".obbbbbbbbbbbbo."] + ["obbbbbbbbbbbbbbo"] * 12 + [".obbbbbbbbbbbbo.", "..oooooooooooo.."]

# Знаки: '.' — не трогать бейдж, остальные буквы — цвета из палитры иконки.
TELEGRAM = [
    "................",
    "................",
    "................",
    "............ww..",
    "..........wwww..",
    "........wwwwww..",
    "......wwwwwwww..",
    "...wwwwwwwwwww..",
    "....wwwwwswwww..",
    "......wwsswww...",
    "......wssswww...",
    ".......sss.ww...",
    ".......ss.......",
    "................",
    "................",
    "................",
]
WHATSAPP = [
    "................",
    "................",
    ".....wwwwww.....",
    "....w......w....",
    "...w........w...",
    "...w..ww....w...",
    "..w...w......w..",
    "..w...w......w..",
    "..w....w.....w..",
    "..w.....ww...w..",
    "...w.....ww.w...",
    "...w........w...",
    "..ww.......w....",
    ".www..wwwwww....",
    "................",
    "................",
]
X = [
    "................",
    "................",
    "................",
    "...ww......w....",
    "....ww....w.....",
    ".....ww..w......",
    "......www.......",
    "......www.......",
    ".....w..ww......",
    "....w....ww.....",
    "...w......ww....",
    "..w........ww...",
    "................",
    "................",
    "................",
    "................",
]
FACEBOOK = [
    "................",
    "................",
    "................",
    ".........www....",
    "........ww......",
    "........ww......",
    "......wwwwww....",
    "........ww......",
    "........ww......",
    "........ww......",
    "........ww......",
    "........ww......",
    "........ww......",
    "........ww......",
    "........ww......",
    "................",
]
REDDIT = [
    "................",
    "................",
    "..........ww....",
    "..........ww....",
    ".........w......",
    "........w.......",
    "..ww..wwww..ww..",
    "..wwwwwwwwwwww..",
    "..wwwwwwwwwwww..",
    "..wwweewweewww..",
    "..wwwwwwwwwwww..",
    "...wwewwwwewww..",
    "....wweeeeww....",
    ".....wwwwww.....",
    "................",
    "................",
]
COPY = [
    "................",
    "................",
    "................",
    "......dddddd....",
    "......d....d....",
    "......d....d....",
    "....dddddd.d....",
    "....dccccd.d....",
    "....dccccdddd...",
    "....dccccd......",
    "....dccccd......",
    "....dccccd......",
    "....dddddd......",
    "................",
    "................",
    "................",
]

ICONS = [  # (бейдж, цвет сети, знак, палитра знака)
    (CIRCLE, "#29a9eb", TELEGRAM, {"w": WHITE, "s": "#c4e3f6"}),
    (CIRCLE, "#25d366", WHATSAPP, {"w": WHITE}),
    (SQUARE, "#14171a", X, {"w": WHITE}),
    (CIRCLE, "#1877f2", FACEBOOK, {"w": WHITE}),
    (CIRCLE, "#ff4500", REDDIT, {"w": WHITE, "e": "#ff4500"}),
    (SQUARE, "#efe3c4", COPY, {"d": OUTLINE, "c": "#efe3c4"}),
]

s = Sprite(N * len(ICONS), N, snap=False)
for k, (badge, brand, glyph, colors) in enumerate(ICONS):
    x0 = k * N
    for y in range(N):
        for x in range(N):
            b = badge[y][x]
            if b == "o":
                s.px(x0 + x, y, OUTLINE)
            elif b == "b":
                s.px(x0 + x, y, brand)
            g = glyph[y][x]
            if g != "." and b == "b":  # знак не заходит на контур
                s.px(x0 + x, y, colors[g])

OUT.mkdir(exist_ok=True)
s.save_png(str(MASTER))
s.stats()
s.preview(str(OUT / "preview.png"), scale=10, bg=SKY)
# как в меню: ×2 на небе, с зазорами
row = Image.new("RGBA", (len(ICONS) * 44 + 12, 56), SKY)
strip = Image.open(MASTER).convert("RGBA")
for k in range(len(ICONS)):
    cell = strip.crop((k * N, 0, (k + 1) * N, N)).resize((32, 32), Image.NEAREST)
    row.alpha_composite(cell, (12 + k * 44, 12))
row.save(OUT / "menu-row.png")
row.resize((row.width * 2, row.height * 2), Image.NEAREST).save(OUT / "menu-row-2x.png")
print("done")

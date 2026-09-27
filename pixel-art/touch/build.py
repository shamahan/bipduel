"""Иконки сенсорных кнопок BipDuel: лента 4 кадров 16x16 -> src/render/touch-buttons.png.

Порядок кадров совпадает с TOUCH_FRAMES в src/app/touch-pads.ts: ⟲ (поворот против часовой,
как A и ←), огонь (прицел), ⟳ (по часовой, как D и →), ⏸. Знак — светлый цвет текста оверлеев,
фон даёт сама кнопка (тёмная, с рамкой цвета игрока), поэтому кадры прозрачные.
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
MASTER = ROOT / "src/render/touch-buttons.png"

N = 16
LIGHT = "#f0f4fa"  # COLORS.overlayText
BUTTON = "#222a38"  # фон кнопок, как у кнопки звука
PLAYERS = ["#d14b4b", "#3b6fd1"]  # PLAYER_COLORS, рамка кнопок в превью

# Дуга идёт против часовой от «9 часов» через низ, правый бок и верх; наконечник на «12 часах»
# смотрит влево — туда, куда крутится нос самолёта при A/←.
CCW = [
    "................",
    "......w.........",
    ".....wwwww......",
    "....wwwwwwww....",
    ".....wwwwwwww...",
    "......w...www...",
    "...........www..",
    "............ww..",
    "..ww........ww..",
    "..ww........ww..",
    "..www......www..",
    "...www....www...",
    "...wwwwwwwwww...",
    "....wwwwwwww....",
    "......wwww......",
    "................",
]
CW = [row[::-1] for row in CCW]  # зеркало: наконечник смотрит вправо
FIRE = [
    "................",
    ".......ww.......",
    "......wwww......",
    "....wwwwwwww....",
    "...www.ww.www...",
    "...ww..ww..ww...",
    "..ww........ww..",
    ".wwwww....wwwww.",
    ".wwwww....wwwww.",
    "..ww........ww..",
    "...ww..ww..ww...",
    "...www.ww.www...",
    "....wwwwwwww....",
    "......wwww......",
    ".......ww.......",
    "................",
]
PAUSE = ["................"] * 3 + ["....www..www...."] * 10 + ["................"] * 3

ICONS = [CCW, FIRE, CW, PAUSE]

s = Sprite(N * len(ICONS), N, snap=False)
for k, glyph in enumerate(ICONS):
    for y in range(N):
        for x in range(N):
            if glyph[y][x] == "w":
                s.px(k * N + x, y, LIGHT)

OUT.mkdir(exist_ok=True)
s.save_png(str(MASTER))
s.stats()
s.preview(str(OUT / "preview.png"), scale=10, bg=BUTTON)
# как в полосах P1 и P2 на телефоне: кнопки с рамкой цвета игрока, знак ×3
strip = Image.open(MASTER).convert("RGBA")
pads = Image.new("RGBA", (2 * 96 + 24, 4 * 76 + 8), "#10141c")
for p, color in enumerate(PLAYERS):
    for k in range(len(ICONS)):
        x0, y0 = 8 + p * 104, 8 + k * 76
        pads.paste(color, (x0, y0, x0 + 96, y0 + 68))
        pads.paste(BUTTON, (x0 + 3, y0 + 3, x0 + 93, y0 + 65))
        cell = strip.crop((k * N, 0, (k + 1) * N, N)).resize((48, 48), Image.NEAREST)
        pads.alpha_composite(cell, (x0 + 24, y0 + 10))
pads.save(OUT / "pads.png")
print("done")

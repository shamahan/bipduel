"""Фавиконка BipDuel из спрайта самолёта -> public/favicon.ico (16, 32, 48) и public/apple-touch-icon.png.

Пиксель-арт не масштабируют: каждый размер — свой точный битмап.
  16x16  — упрощённый самолёт, нарисован здесь (GRID16) в цветах спрайта;
  32x32  — кадр спрайта без двух колонок, повторяющих соседние (капот и колесо чуть уже);
  48x48  — кадр спрайта 1:1;
  180x180 (apple-touch-icon) — кадр ×4 на небе игры: iOS требует непрозрачный фон.
Запуск: python build.py
"""
import io
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/pixel-art-studio/scripts"))
from PIL import Image  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parent.parent
PUBLIC = ROOT / "public"
SKY = "#8fc0e8"

plane = Image.open(ROOT / "src/render/plane.png").convert("RGBA")
FRAME = plane.crop((0, 0, plane.width // 4, plane.height))  # 36x24, нос вправо

# буквы — цвета спрайта самолёта
PAL = {
    "A": "#2a1420",  # контур
    "B": "#d36961",  # блик на красном
    "C": "#942028",  # тень на красном
    "F": "#c23b3b",  # красный
    "G": "#efe3c4",  # кремовая полоса хвоста
    "D": "#844f3f",  # пропеллер
    "E": "#4a5058",  # стойки
    "K": "#7d8a8e",  # капот
    "H": "#b9c2c0",  # блик капота
    "L": "#34363d",  # шина
    "J": "#6b3f2e",  # шлем пилота
    "I": "#e6cd96",  # лицо пилота
}
GRID16 = [
    "................",
    "................",
    "................",
    ".......AAAAAAA..",
    "......ABBBBBBBAD",
    ".AA....AAEAAEA.D",
    "AGFA..AJIE..E..D",
    "AGFFAAAAAEAAEAAD",
    "AGFFFBBBBEBBEKHD",
    "ACCCFFFFFEFFEKKD",
    ".AAACCCCCECCEKAD",
    "....AAAFFFFFFAAD",
    ".......AAEAEAA..",
    "........ALLA....",
    ".........AA.....",
    "................",
]


def from_grid(grid):
    im = Image.new("RGBA", (len(grid[0]), len(grid)), (0, 0, 0, 0))
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch != ".":
                im.putpixel((x, y), Image.new("RGBA", (1, 1), PAL[ch]).getpixel((0, 0)))
    return im


def centered(sprite, size, bg=None):
    box = sprite.getbbox()
    art = sprite.crop(box)
    im = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    im.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return im


def drop_columns(im, cols):
    keep = [x for x in range(im.width) if x not in cols]
    out = Image.new("RGBA", (len(keep), im.height), (0, 0, 0, 0))
    for nx, x in enumerate(keep):
        out.paste(im.crop((x, 0, x + 1, im.height)), (nx, 0))
    return out


icon16 = from_grid(GRID16)
icon32 = centered(drop_columns(FRAME, {23, 30}), 32)  # 23 — лишняя колонка колеса, 30 — капота
icon48 = centered(FRAME, 48)
touch = centered(FRAME, 45, bg=SKY).resize((180, 180), Image.NEAREST)
assert icon32.size == (32, 32) and icon32.getbbox()[2] - icon32.getbbox()[0] <= 32


def write_ico(path, images):
    """ICO с PNG внутри: каждый размер хранится как есть, без пересчёта."""
    blobs = []
    for im in images:
        buf = io.BytesIO()
        im.save(buf, "PNG")
        blobs.append(buf.getvalue())
    head = struct.pack("<HHH", 0, 1, len(images))
    offset = 6 + 16 * len(images)
    entries = b""
    for im, blob in zip(images, blobs):
        w, h = im.size
        entries += struct.pack("<BBBBHHII", w % 256, h % 256, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
    path.write_bytes(head + entries + b"".join(blobs))


PUBLIC.mkdir(exist_ok=True)
write_ico(PUBLIC / "favicon.ico", [icon16, icon32, icon48])
touch.convert("RGB").save(PUBLIC / "apple-touch-icon.png")

# --- превью: крупно и «во вкладке» на светлой и тёмной панели ---
OUT.mkdir(exist_ok=True)
sheet = Image.new("RGBA", (16 * 8 + 32 * 4 + 48 * 3 + 40, 48 * 3), "#e8e8e8")
x = 0
for im, k in ((icon16, 8), (icon32, 4), (icon48, 3)):
    sheet.alpha_composite(im.resize((im.width * k, im.height * k), Image.NEAREST), (x, 0))
    x += im.width * k + 20
sheet.save(OUT / "zoom.png")

tabs = Image.new("RGBA", (260, 120), "#dee1e6")
dark = Image.new("RGBA", (260, 60), "#202124")
tabs.alpha_composite(dark, (0, 60))
for row, y in ((0, 22), (1, 82)):
    tabs.alpha_composite(icon16, (20, y))  # вкладка 1x
    tabs.alpha_composite(icon32, (60, y - 8))  # вкладка 2x (HiDPI) — 32 px
    tabs.alpha_composite(icon48, (120, y - 16))
tabs.resize((520, 240), Image.NEAREST).save(OUT / "tabs.png")
touch.save(OUT / "apple-touch-icon.png")
print("done", icon16.size, icon32.size, icon48.size, touch.size)

"""Взрыв BipDuel: вспышка -> огненный шар из клубов -> огонь гаснет в дым -> дым редеет.

10 кадров 64x64 лентой по горизонтали -> src/render/explosion.png, по 100 мс (игра берёт кадр
по возрасту взрыва, TUNING.explosionTime = 1 с). Точка взрыва в кадре — (CX, CY), она же
EXPLOSION_ANCHOR в src/render/render.ts: ниже центра, потому что дым поднимается.
Запуск: python build.py
"""
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/pixel-art-studio/scripts"))
from pixelstudio import Sprite  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parent.parent
MASTER = ROOT / "src/render/explosion.png"

W = H = 64
CX, CY = 32, 35
FRAMES = 10
SKY = "#8fc0e8"

FIRE = ["#fffbe6", "#ffe45c", "#ffab2e", "#ef5a24", "#a8261f"]  # от белого жара к тёмно-красному
SMOKE = ["#b3b6c0", "#8b8d99", "#5d6573", "#3b3f4c"]  # от светлого к тёмному; #5d6573 — как дым штопора
PALETTE = FIRE + SMOKE

# по кадрам: разлёт центров клубов, радиус клуба, подъём дыма, доля жара
SPREAD = [0, 7, 11, 14, 16, 17, 18, 18, 18, 18]
PUFF_R = [0, 6, 8, 9, 9.5, 9.5, 9.5, 9.5, 9, 8]  # дым под конец не сжимается, а расплывается
RISE = [0, 0, 0, 1, 2, 3, 5, 6, 7, 8]
HEAT = [1, 1, 0.9, 0.75, 0.5, 0.25, 0.1, 0, 0, 0]
FIRE_STEPS = [0.75, 0.6, 0.45, 0.3, 0.2]  # порог жара для каждого цвета FIRE


def make_puffs():
    rnd = random.Random(3)
    puffs = [{"dx": 0.0, "dy": 0.0, "size": 1.15, "life": 1.0, "warm": 0.0}]
    for j in range(12):
        a = j * 2.39996 + rnd.uniform(-0.3, 0.3)  # золотой угол: клубы расходятся равномерно
        d = rnd.uniform(0.55, 1.0)
        puffs.append({"dx": math.cos(a) * d, "dy": math.sin(a) * d * 0.85,
                      "size": rnd.uniform(0.6, 1.0), "life": rnd.uniform(0.0, 1.0),
                      "warm": rnd.uniform(-0.06, 0.06)})
    # нижние клубы рисуются поверх верхних: освещённая макушка ложится на тёмный низ соседа
    return sorted(puffs, key=lambda p: p["dy"])


PUFFS = make_puffs()
SPARKS = [(k * 2 * math.pi / 7 + 0.4, 1.0 + 0.15 * (k % 3)) for k in range(7)]


def draw_flash(s):
    """Рваная звезда: неровные клинья вокруг раскалённого ядра."""
    rnd = random.Random(11)
    spikes = []
    for k in range(8):
        a = k * 2 * math.pi / 8 + rnd.uniform(-0.2, 0.2)
        tip = rnd.uniform(10, 15)
        spikes.append((CX + math.cos(a) * tip, CY + math.sin(a) * tip))
        b = a + math.pi / 8
        spikes.append((CX + math.cos(b) * 7, CY + math.sin(b) * 7))  # широкое основание: без рваных кончиков
    s.polygon([(round(x), round(y)) for x, y in spikes], FIRE[1])
    s.circle(CX, CY, 5, FIRE[0], fill=True)


def draw_ball(s, f):
    spread, base_r, rise, heat = SPREAD[f], PUFF_R[f], RISE[f], HEAT[f]
    alive = [p for p in PUFFS if f <= 7 + p["life"] * 2.5]
    reach = spread + base_r
    for y in range(H):
        for x in range(W):
            top = None  # последний (передний) клуб, накрывающий пиксель
            for p in alive:
                r = base_r * p["size"]
                px_, py_ = CX + p["dx"] * spread, CY + p["dy"] * spread - rise
                d = math.hypot(x + 0.5 - px_, y + 0.5 - py_)
                if d <= r:
                    top = (p, r, px_, py_, d)
            if top is None:
                continue
            p, r, px_, py_, d = top
            # жар в основном от центра взрыва: кольца внутри каждого клуба дали бы «пузыри»
            core = 1 - d / r
            centre = 1 - math.hypot(x + 0.5 - CX, y + 0.5 - (CY - rise)) / reach
            h = heat * (0.25 * core + 0.75 * max(0.0, centre) + p["warm"])
            color = next((c for c, step in zip(FIRE, FIRE_STEPS) if h > step), None)
            if color is None:
                color = smoke_shade(x + 0.5 - px_, y + 0.5 - py_, r, f)
            s.px(x, y, color)


def smoke_shade(dx, dy, r, f):
    """Смещённые к свету круги (свет сверху-слева): полумесяц тени внизу, блик сверху."""
    lit = math.hypot(dx + 0.35 * r, dy + 0.45 * r) < 0.55 * r
    mid = math.hypot(dx + 0.15 * r, dy + 0.25 * r) < 0.85 * r
    level = 0 if lit else 1 if mid else 2
    fade = 0 if f < 7 else 1  # рассеивающийся дым светлеет
    return SMOKE[min(len(SMOKE) - 1, level + 1 - fade)]


def draw_sparks(s, f):
    if not 1 <= f <= 4:
        return
    color = FIRE[1] if f <= 2 else FIRE[f - 1]
    for a, speed in SPARKS:
        dist = (SPREAD[f] + PUFF_R[f] + 2 + 3 * (f - 1)) * speed
        x = CX + math.cos(a) * dist
        y = CY + math.sin(a) * dist + 0.8 * (f - 1) ** 2  # искры падают
        for sx, sy in ((round(x), round(y)), (round(x - math.cos(a)), round(y - math.sin(a)))):
            if 1 <= sx < W - 1 and 1 <= sy < H - 1:  # улетевшая к краю искра гаснет, а не обрезается рамкой
                s.px(sx, sy, color)


s = Sprite(W, H, palette=PALETTE)
for f in range(FRAMES):
    if f:
        s.add_frame(copy=False)
    if f == 0:
        draw_flash(s)
    else:
        draw_ball(s, f)
        draw_sparks(s, f)
    if f == FRAMES - 1:  # последний кадр: дым растворяется шахматкой
        for y in range(H):
            for x in range(W):
                if (x + y) % 2 == 0:
                    s.px(x, y, None)
s.set_duration(100, frames="all")
s.tag("boom", 1, FRAMES)

OUT.mkdir(exist_ok=True)
s.stats()
s.preview(str(OUT / "preview.png"), scale=6, bg=SKY, cols=10)
s.save_silhouette(str(OUT / "silhouette.png"))
s.save_gif(str(OUT / "explosion.gif"), scale=6, bg=SKY)
s.save_spritesheet(str(MASTER), layout="horizontal", json_path=str(OUT / "explosion.json"))
print("done")

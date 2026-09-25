"""Картинка для превью ссылок (og:image): кусок неба BipDuel с дуэлью над аэродромом.

Собирается из настоящих спрайтов игры в её собственном масштабе (кадр 400x210) и
увеличивается ровно в 3 раза -> public/og-image.png 1200x630. Облака берутся из самой
игры (cloud.mjs вызывает src/render/clouds.ts через Vite), шрифт — Press Start 2P из
node_modules. Нужны Pillow и Node.
Запуск: python build.py
"""
import colorsys
import json
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parent.parent
RENDER = ROOT / "src/render"
MASTER = ROOT / "public/og-image.png"
FONT = ROOT / "node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff"

W, H, SCALE = 400, 210, 3
SKY = "#8fc0e8"  # COLORS.sky
TEXT = "#1c2733"  # COLORS.text
TEXT_SHADOW = "#f0f5fb"  # светлый тон облаков: тёмный заголовок на небе с подсветкой снизу
BULLET = "#26262b"  # COLORS.bullet
CTA = "#efe3c4"  # кремовый с самолёта: читается на коричневой земле
CTA_SHADOW = "#2a1420"  # общий тёмный контур спрайтов
CTA_Y = 198  # полоса земли в кадре — строки 195..209: 8-пиксельная надпись по её середине
GROUND_X = 96  # с какого x полосы земли 800 px брать кадр: ветроуказатель, ангар, башня, край фермы

PLANE_FRAMES = 4
RED_HUE = (300, 11)  # как recolorRedToBlue в src/render/sprites.ts
MIN_SATURATION = 0.2
HUE_SHIFT = 220


def rgba(hex_):
    h = hex_.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def recolor_red_to_blue(im):
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            hue = h * 360
            if s < MIN_SATURATION or RED_HUE[1] < hue < RED_HUE[0]:
                continue
            nr, ng, nb = colorsys.hls_to_rgb(((hue + HUE_SHIFT) % 360) / 360, l, s)
            px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    return out


def plane(frame, blue=False, facing_left=False, tilt=0.0):
    sheet = Image.open(RENDER / "plane.png").convert("RGBA")
    fw = sheet.width // PLANE_FRAMES
    sprite = sheet.crop((frame * fw, 0, (frame + 1) * fw, sheet.height))
    if blue:
        sprite = recolor_red_to_blue(sprite)
    if facing_left:
        sprite = sprite.transpose(Image.FLIP_LEFT_RIGHT)
    # как в игре: спрайт поворачивается целиком, без сглаживания
    return sprite.rotate(tilt, resample=Image.NEAREST, expand=True)


def cloud(rx, ry, seed):
    res = subprocess.run(["node", str(HERE / "cloud.mjs"), str(rx), str(ry), str(seed)],
                         cwd=ROOT, capture_output=True, check=True)
    head, _, body = res.stdout.partition(b"\n")
    size = json.loads(head)
    return Image.frombytes("RGBA", (size["width"], size["height"]), body)


def paste_center(canvas, im, cx, cy):
    canvas.alpha_composite(im, (round(cx - im.width / 2), round(cy - im.height / 2)))


def text(draw, xy, s, size, fill, shadow):
    font = ImageFont.truetype(str(FONT), size)
    w = draw.textlength(s, font=font)
    x, y = round(xy[0] - w / 2), xy[1]
    draw.text((x + 1, y + 1), s, font=font, fill=shadow)
    draw.text((x, y), s, font=font, fill=fill)


img = Image.new("RGBA", (W, H), rgba(SKY))
hills = Image.open(RENDER / "far-hills.png").convert("RGBA")
img.alpha_composite(hills.crop((GROUND_X, 0, GROUND_X + W, hills.height)), (0, H - hills.height))

paste_center(img, cloud(62, 22, 7), 58, 62)
paste_center(img, cloud(34, 13, 3), 338, 42)
paste_center(img, cloud(48, 17, 11), 300, 118)

ground = Image.open(RENDER / "ground.png").convert("RGBA")
img.alpha_composite(ground.crop((GROUND_X, 0, GROUND_X + W, ground.height)), (0, H - ground.height))

# красный заходит снизу-слева и стреляет, синий идёт навстречу
red_nose = (132, 104)
tilt = 14  # градусов, нос вверх
paste_center(img, plane(1, tilt=tilt), 114, 109)
paste_center(img, plane(2, blue=True, facing_left=True, tilt=-8), 292, 78)
d = ImageDraw.Draw(img)
dx, dy = math.cos(math.radians(tilt)), -math.sin(math.radians(tilt))
for k, dist in enumerate((16, 42, 70, 100)):
    bx, by = red_nose[0] + dx * dist, red_nose[1] + dy * dist
    d.rectangle((round(bx) - 2, round(by) - 2, round(bx) + 1, round(by) + 1), fill=BULLET)

d.fontmode = "1"  # без сглаживания: шрифт пиксельный, кегль кратен 8
text(d, (W / 2, 14), "BIPDUEL", 32, TEXT, TEXT_SHADOW)
text(d, (W / 2, 52), "HOTSEAT DOGFIGHT FOR TWO", 8, TEXT, TEXT_SHADOW)
text(d, (W / 2, CTA_Y), "PLAY FREE AT BIPDUEL.SHAMAHAN.COM", 8, CTA, CTA_SHADOW)

OUT.mkdir(exist_ok=True)
img.save(OUT / "og-1x.png")
MASTER.parent.mkdir(exist_ok=True)
img.convert("RGB").resize((W * SCALE, H * SCALE), Image.NEAREST).save(MASTER, optimize=True)
print("og ->", MASTER, (W * SCALE, H * SCALE))

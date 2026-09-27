# BipDuel

A two-player hotseat biplane dogfight for the browser, after the 1996 Amiga
game *Dogfight*. Two planes, one keyboard, one screen: shoot the other pilot
down, do not fly into the ground, and do not climb into the top of the sky.

No backend. The game runs entirely in the page, and the only thing it keeps
is your settings, in your browser.

It runs at <https://bipduel.shamahan.com/>.

## Playing it

| | Turn | Fire |
|---|---|---|
| Player 1 | A / D | W or S |
| Player 2 | ← / → | ↑ or ↓ |

- **The menu** holds Play and, right under it, the settings: interface
  language (English, Deutsch, Français, Español, Italiano, Português, Polski,
  Nederlands, Русский, Українська), points to win (5 to 50 in steps of 5, or
  no limit) and rounds in the magazine (5 to 20 in steps of 5). ↑/↓ or W/S
  pick a line, ←/→ or A/D change its value, Space or Enter start the match.
  Settings are saved in `localStorage` the moment they change; on the first
  visit the language comes from the browser's own preferences.
- **Pause** with Esc or P, resume with Space, Esc or P, and Q goes back to
  the menu. On the game-over screen Space or Enter is a rematch and Esc is
  the menu. M toggles the sound. The game pauses itself when the window loses
  focus, and forgets every held key, so nobody comes back to a plane that
  kept firing on its own.
- **On a phone or tablet** hold it sideways: Player 1's buttons are down
  the left edge and Player 2's down the right — pause on top, then turn
  anticlockwise, fire and turn clockwise. A finger can slide from one
  button to the next without lifting. Tap a menu line to pick it; on a
  setting, the left half steps back and the right half forward. The pause
  and game-over screens get Resume, Rematch and Menu buttons. In portrait
  the game asks you to turn the phone and pauses a running match. Pressing
  a game key on a keyboard switches the buttons off again.
- **The rules.** Planes fly at a constant speed; you only steer. One hit and
  you are down. The ground is deadly and so is everything standing on it —
  the forest, the hangar and the tower, the farm — and bullets stop on it too;
  the far hills are only scenery. The screen wraps left to right. Inside a
  cloud a plane is invisible, to its own pilot as well. Touching the top of
  the sky throws the plane into a spin: for a second it drops nose down,
  rolling, trailing smoke, and neither turns nor fires — and it comes out
  still pointing at the ground. A magazine reloads by itself in about 2.7
  seconds. After a respawn a plane blinks for two seconds, cannot be hit and
  cannot fire.

Fire is on W/S and ↑/↓ rather than on the two Shift keys, which would have
been the natural pair: Windows does not tell the two Shifts apart while both
are held, so the second press never arrives and one release goes missing,
and a player's guns stay on. That was seen in play before it was understood.

## Developing

```bash
npm install
npm run dev       # local server
npm test          # unit tests
npm run build     # production build
npm run preview   # serve dist/ locally
```

`npm run build` type-checks and writes the whole site to `dist/`, which is
exactly what the deploy publishes: Vite bundles the game and copies `public/`
over the top -- the favicon, the social card and the font licence. The
workflow in `.github/workflows/deploy.yml` runs `npm ci`, the tests and that
same build on every push to `master`, and hands `dist/` to GitHub Pages, so
CI and a laptop build the same way.

There is no `CNAME` file. A Pages site deployed from an Actions workflow
ignores one; the custom domain lives in the repository's Pages settings.

The simulation in `src/sim/` is plain functions over plain data and never
touches the DOM: `step(state, inputs, dt)` advances the world one fixed
60 Hz tick, and everything the rules depend on — speeds, the spin, reload
time, spawn points — is in `src/sim/tuning.ts`. Drawing (`src/render/`),
the screens and settings (`src/app/`) and sound (`src/audio/`, synthesised
with Web Audio, no audio files) only read that state. That split is what
lets most of the game be tested without a browser.

Every piece of text on screen comes from a typed dictionary per language in
`src/i18n/`, so a phrase missing from one language is a compile error rather
than a blank on screen. The tests measure each phrase at the size it is
drawn and fail if it would not fit its place in any language.

## The artwork

Nothing is drawn by hand in an editor. Each sprite has a script that draws
it pixel by pixel and writes the PNG the game loads:

```bash
python pixel-art/plane/build.py      # plane, and the 8-frame roll for the spin
python pixel-art/explosion/build.py  # explosion strip
python pixel-art/ground/build.py     # terrain, far hills, and src/sim/skyline.ts
python pixel-art/share/build.py      # share buttons
python pixel-art/touch/build.py      # on-screen touch buttons
python pixel-art/favicon/build.py    # favicon.ico and the touch icon
```

The PNGs are committed and are what the game uses; the scripts are how to
change them, and previews land in each script's `out/`, which is not
committed. The ground script also writes `src/sim/skyline.ts`, the top solid
pixel of every column, which is what planes crash into — so the collision
line cannot drift from the picture. The clouds are the exception: they are
generated at runtime by `src/render/clouds.ts`, a different shape for every
match.

The scripts need Pillow. Most of them also import `pixelstudio`, a small
Pillow helper from the pixel-art-studio Claude Code skill, from
`~/.claude/skills/pixel-art-studio/scripts`. It is not vendored here, so on
a machine without it those scripts will not run; the committed PNGs still
build and play.

## The social card

`public/og-image.png` is what a link to the game unfurls into in a chat app
or a timeline. It is generated too:

```bash
python pixel-art/og/build.py    # -> public/og-image.png
```

It is composed from the game's own sprites at the game's own scale, 400x210,
and scaled exactly 3x to 1200x630, so the pixels stay square. The clouds on
it come from the game's cloud code: `pixel-art/og/cloud.mjs` loads
`src/render/clouds.ts` through Vite and hands the pixels back, so the card
cannot drift into a different style of cloud. It needs Node and an
`npm install` for that and for the Press Start 2P font.

It is deliberately not part of `npm run build`. A build that rewrote a
committed binary on every run would be worse than rerunning this when the
artwork or the wording changes.

Two things it is easy to get wrong:

- `og:image:width` and `og:image:height` must be the file's real pixel size,
  1200x630 here.
- Every url in the tags is absolute. A crawler fetching the card is not
  browsing the site and has no base to resolve a relative path against.

## Counting visits

The page carries a [GoatCounter](https://www.goatcounter.com/) tag and
nothing else counts anyone. It sets no cookie and stores nothing on the
device, so it needs no consent banner. Its script skips `localhost` and
private networks by itself, so `npm run dev` does not count.

There is nothing personal in the url for it to report: settings live in
`localStorage`, not in the address, and the share buttons send the bare page
address with the query and fragment stripped.

The endpoint in the tag is public by design: it names the site being
counted and is readable in the markup of every page that uses it.

## Typefaces

The only typeface is Press Start 2P, and it is served from this domain: the
`@fontsource/press-start-2p` package is bundled by Vite into `dist/assets`,
so no visitor's browser asks Google for anything. The browser fetches only
the subsets the page actually uses — latin, latin-ext and cyrillic cover
every language in the menu.

The font has no ◀ ▶ ∞ ← →. A glyph it lacks would silently fall back to a
different font, so the tests forbid those characters in every translation,
with one exception: the ←/→ in the menu hints, which are drawn as a turned
↑ — a glyph the font does have.

## Licence and attribution

Code and artwork in this repository are © 2026 Oleksandr Kalinkin, all
rights reserved — see `LICENSE`. No licence to reuse them is granted.

Press Start 2P is not ours and `LICENSE` does not cover it. It is © 2012 The
Press Start 2P Project Authors under the SIL Open Font License 1.1, whose
text ships beside the font files on the site as the licence requires —
`public/assets/PressStart2P-OFL.txt`, copyright intact.

BipDuel is an independent tribute and is not affiliated with, endorsed by or
sponsored by the makers of *Dogfight*; the name is used descriptively, to say
what inspired it. Nothing from the original game is included: every sprite
is generated by the scripts in `pixel-art/`, and every sound is synthesised
while the game runs.

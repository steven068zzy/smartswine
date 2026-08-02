# SMART SWINE — SPM-01 company site

Single-page marketing site for the SPM-01 Smart Piglet Monitor, built from
`SPM-01_Product_Brochure.pdf` (13 pages). Pure static — no build step.

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8734
# → http://localhost:8734/
```

A local server is required for the hero turntable sequence (file:// blocks
canvas image loading in some browsers); everything else works from disk.

## Deploy

Push to GitHub and enable Pages on the repo root. No build, no dependencies —
GSAP + ScrollTrigger are vendored in `vendor/`.

## Structure

```
index.html            12 sections mirroring the brochure narrative
css/style.css         design tokens: charcoal / coral #f2545f / teal #35d0b0 /
                      seal blue #2a5fb4 (the product's gasket color)
js/main.js            turntable scrub, scroll reveals, count-ups, parallax,
                      card tilt, seal-line progress — all progressive
                      enhancement; page is fully readable with JS off
assets/img/           brochure renders resized to WebP
assets/seq/           96-frame product turntable (scroll-scrubbed hero)
assets/logos/         partner logo wall
vendor/               GSAP 3.12.5 + ScrollTrigger (cdnjs copies)
```

## Regenerating the turntable

```bash
cd ../v2_双光轴/源码
/Applications/Blender.app/Contents/MacOS/Blender -b -P ss_turntable.py -- \
    --frames 96 --samples 48 --res 1440
python3 <scratch>/seq_to_webp.py   # PNG → assets/seq/*.webp
```

The camera orbits the device (the device never rotates — `box()` parts pivot
at the world origin; see the render handoff doc, pit #13).

## Content compliance

All imagery is concept industrial design; captions and the footer keep the
brochure's fact-check language: prototype validated in a 10-sow IACUC trial,
IP69K is a design target, ~$1M is non-dilutive NSF/USDA-NIFA support, sow
model "Some Pig" by Austin Beaulier CC BY 4.0. Do not loosen these when
editing copy.

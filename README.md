# SMART SWINE — company site

Four-page company site for SMART SWINE, LLC. Pure static — no build step.

| Page | File | What it carries |
|---|---|---|
| About | `index.html` | vision, mission, current status, timeline, team, advisors, partners |
| Product | `product.html` | the full SPM-01 story from `SPM-01_Product_Brochure.pdf` (13 pages), turntable hero |
| Resources | `resources.html` | press, peer-reviewed foundations, downloads, industry and grant programs |
| Contact | `contact.html` | book a pilot, get in touch |

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
index.html            About (the company's front door)
product.html          the SPM-01 product story, 12 sections
resources.html        links, press and downloads
contact.html          pilot + contact
css/style.css         design tokens: near-black stack + pink brand
                      (--pink #f6538f, --rose #f9a8c7, --seal #cf3d78).
                      --coral / --teal / --seal are historical aliases kept so
                      the product page's markup did not have to be rewritten —
                      every one of them now resolves to a pink.
js/main.js            shared across all four pages. Turntable scrub, scroll
                      reveals, count-ups, parallax, card tilt, seal-line
                      progress. Product-page-only effects are guarded by
                      has(); nav highlighting only applies to #anchor links.
                      All progressive enhancement — pages read fine with JS off
assets/img/           brochure renders resized to WebP
assets/team/          founder + advisor headshots, 640px square WebP
assets/team_raw/      originals (keep: the sources were temp files)
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

Every page's footer keeps the brochure's fact-check language. Do not loosen
any of these when editing copy:

- All imagery is **concept industrial design**, never a photo of shipped hardware.
- Hardware is a **prototype validated** in one 10-sow IACUC trial. Never "deployed";
  multi-farm validation is planned, not done.
- **IP69K is a design target**, never "rated" or "certified".
- **~$1M is non-dilutive NSF / USDA-NIFA grant support**, never "raised", no investors.
- Competition wording: **"semifinalist, 27 of 531 teams"** — the Top 12 finals are
  September 2026 and have not happened. The $100k is the prize on offer, not won.
- Pork-industry organizations gave **letters of support and survey distribution**.
  They are not investors, customers or commercial partners.
- Survey is a **concept test**, n ≈ 16–19, not orders or letters of intent.
- Accuracy labels are exact: 99.15% = sow-posture classification on an unseen sow;
  98.4% = breathing-signal classification; 96% / 86% are **precision** figures.
- Public location is **College Station, TX**. Keep the registered Missouri address,
  federal identifiers and any producer lead contacts off the site entirely.
- Attribution: sow and piglet geometry "Some Pig" by Austin Beaulier, CC BY 4.0.

## Not yet on the site (waiting on the user)

- The 3-minute founder video is **unlisted** on YouTube and no URL exists in any
  local file. Ask for the link and confirm it should be public before adding it.
- Three of the four Log-1 source papers were only reconstructed from PDF filenames,
  so Resources links just the one verified USPLF 2025 paper.

# SMART SWINE — company site

**Live: https://steven068zzy.github.io/smartswine/**

Six-page company site for SMART SWINE, LLC. Pure static — no build step.
The nav groups both product pages under one **Products** dropdown
(CSS-only, hover + focus-within; the top link still goes to product.html).

| Page | File | What it carries |
|---|---|---|
| About | `index.html` | vision, mission, current status, team, advisors, partners |
| Products · SPM-01 | `product.html` | the full SPM-01 story from `SPM-01_Product_Brochure.pdf` (13 pages), turntable hero |
| Products · SPC-01 | `spc01.html` | the SPC-01 curtain story: travel hero, filmed control loop, five-state rule gallery |
| Evidence | `evidence.html` | **real trial footage** with the models' own overlays: birth detection, stillborn vs live pair, posture classifier gallery, respiration fit |
| Resources | `resources.html` | video and podcasts, press, industry and grant programs |
| Contact | `contact.html` | book a pilot, get in touch |

## The Evidence page (added 2026-08-05)

**This is the only page on the site whose media is real.** Everything else is
concept industrial design or AI-generated concept film; `evidence.html` is
unretouched recording from the Apr 26 – May 20 2026 ten-sow IACUC trial, with
the overlays burned in by the inference scripts themselves. The whole page is
built on that contrast, so **do not blur the line**:

- Media lives in `assets/trial/`, deliberately **not** `assets/film/` (which is
  the AI concept footage). Keep them apart.
- Real clips carry the green `.evi-real` badge ("REAL FARM FOOTAGE · MODEL
  OUTPUT"). AI clips carry the pink `AI CONCEPT FILM` caption. **Never give a
  clip the wrong badge, and never move a clip between the two folders.**
- Every number in an `.evi-read` readout is transcribed off the frame itself
  (path/displacement/std/confidence/timestamps). If a clip is re-exported,
  re-read the numbers off the new frames; do not carry the old ones over.
- The page states plainly that no producer has run the system and that this is
  the prototype rig, not the sealed product. That section (`#limits`) is not
  optional and must not be softened.
- Sources: `~/Downloads/Data/` (posture 6 classes × 20 frames, respiration) and
  `~/Downloads/{NEWBORN_DETECTION,Stillborn _Detection}/`, mirrored from the
  Drive folder "SmartSwine AI Model". Clips are transcoded to H.264 only: no
  upscaling, no grading, no cuts.

The posture gallery reuses the SPC-01 `.pgal` component. Captions now come from
each `.prow`'s `data-cap` attribute, and rows without one fall back to the
hardcoded curtain-rule list in `main.js`, which is how spc01.html still works
unchanged. `.pstack--wide` overrides the 4:3 cover crop to 16:9 contain, because
the classifier prints its label in the frame's top-left corner and the crop
was cutting it off.

SPC-01 control law shown on the site (client 2026-08-04): **standing =
both curtains down**; sternal names the roll flank — that side's curtain
holds while the safe side lifts; lateral lifts both. Posture labels use
FLANK naming (the label names the flank the sow rolls onto; the closed
curtain is the strip her body lands on). The loop sequence also shows
SPM-01 mounted at the crate rear with a stylized wireless-signal
visualization (detection → the acting curtain) — the fine print labels
it as such. The render-side recipe lives in the render handoff doc §0 —
regenerate imagery only through `v2_双光轴/源码/site_export.py`.

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8734
# → http://localhost:8734/
```

A local server is required for the hero turntable sequence (file:// blocks
canvas image loading in some browsers); everything else works from disk.

## Deploy

GitHub Pages serves `main` from the repo root, so a push is a deploy:

```bash
git push
```

No build step and no external requests at runtime — GSAP + ScrollTrigger are
vendored in `vendor/` and Roboto is self-hosted in `assets/fonts/`. The only
third-party requests the site makes are the YouTube thumbnails on the
Resources page.

To point a custom domain at it, add a `CNAME` file containing the domain and
set the DNS record, then re-enable HTTPS in the repo's Pages settings.

## Structure

```
index.html            About (the company's front door)
product.html          the SPM-01 product story, 12 sections
spc01.html            the SPC-01 curtain story
evidence.html         real trial footage + model outputs (the only real media)
resources.html        video, podcasts, press and industry links
contact.html          pilot + contact
css/style.css         design tokens: plum-charcoal stack + pink brand
                      (--pink #f6538f, --rose #f9a8c7, --seal #cf3d78).
                      --coral / --teal / --seal are historical aliases kept so
                      the product page's markup did not have to be rewritten —
                      every one of them now resolves to a pink.
css/fonts.css         self-hosted Roboto + Roboto Mono @font-face rules
js/main.js            shared across all four pages. Turntable scrub, scroll
                      reveals, count-ups, parallax, card tilt, seal-line
                      progress. Product-page-only effects are guarded by
                      has(); nav highlighting only applies to #anchor links.
                      All progressive enhancement — pages read fine with JS off
assets/img/           brochure renders resized to WebP
assets/team/          founder + advisor headshots, 640px square WebP
assets/team_raw/      originals (keep: the sources were temp files)
assets/seq/           96-frame product turntable (scroll-scrubbed hero)
assets/explode/       48-frame assembled-to-exploded scrub
assets/film/          AI-GENERATED concept film (Seedance 2 via Dreamina)
assets/trial/         REAL trial footage, classifier frames, respiration fit.
                      Evidence page only. Never mix these two folders, and
                      never let a clip carry the other one's label
assets/fonts/         Roboto + Roboto Mono woff2, latin subset
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
  The single exception is `evidence.html` / `assets/trial/`, which is real
  recorded trial footage and is labelled as such. That exception does not
  travel: no trial frame may be reused on a product page as if it were the
  product, and no render may appear on the Evidence page.
- **Never claim users or customers.** Nobody has bought or run the system. The
  trial is our own, on one farm. "A working farrowing room with the swine
  center's own staff running it" is true; "our users" and "customer results"
  are not.
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

## Regenerating the exploded view

```bash
cd ../v2_双光轴/源码
/Applications/Blender.app/Contents/MacOS/Blender -b -P ss_explode_seq.py -- \
    --frames 48 --samples 64 --resx 1600 --resy 900
```

Label anchors come out of the same run as `explode_anchors.json` — camera-space
percentages for every part. Paste changed values into `XANCHORS` in
`js/main.js`; never hand-tune them against a screenshot.

## Notes on the Resources page

- The two podcast episodes are third-party interviews with advisor Dr. Ziteng “Tim” Xu,
  not coverage of Smart Swine. They are labelled that way on purpose.
- Only one peer-reviewed paper is linked because it is the only one whose URL was
  verified; three others exist but their links were reconstructed from local PDF
  filenames and were never confirmed.

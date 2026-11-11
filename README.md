# Smart Swine: company site

**Live: https://steven068zzy.github.io/smartswine/**

Nine-page company site for SMART SWINE, LLC. Pure static: no build step, no
dependencies, no external requests at runtime except the YouTube thumbnails
on the Resources page.

| Page | File | What it carries |
|---|---|---|
| Home | `index.html` | the pitch: problem, the three product lines, evidence, free trial |
| Products · SPM-01 Monitor | `product.html` | Detect. The full SPM-01 story from `SPM-01_Product_Brochure.pdf`, turntable hero |
| Products · SPC-01 Curtain | `spc01.html` | Act. Travel hero, filmed control loop, five-state rule gallery |
| Products · Software | `software.html` | Decide and manage. The Smart Swine app and Software Pro, both as design previews |
| Case study | `barn.html` | **real trial footage** with the models' own overlays |
| About | `about.html` | vision, mission, where the company stands, team, advisors |
| Resources | `resources.html` | press, farm bill policy, video and podcasts, brochures, industry links |
| Careers | `careers.html` | two open roles on the producer side |
| Contact | `contact.html` | free trial, referral, everything else |

## How the site is put together (redesigned 2026-11)

The site is a light, type-led system: ink on white, one brand accent
(`--pink #f6538f`) and one semantic green that is reserved for real farm
footage and "safe" states. Everything lives in two files.

- `css/site.css`: tokens at the top, then components in page order. The type
  scale is written in the file header; anything new picks the nearest step.
- `js/site.js`: vanilla JS, progressive enhancement only. Every page reads in
  full with JS off, and under reduced motion the scroll-scrubbed stages fall
  back to still images.
- `assets/fonts/inter-var-latin.woff2`: Inter, variable, latin subset,
  self-hosted (SIL Open Font License). Arrows, chevrons and other symbols
  outside that subset are inline SVG, never text glyphs.

The header, top bar and footer are repeated by hand in every page. When one of
them changes, change all nine. `aria-current="page"` marks the current page in
the nav and the mobile menu.

Layout rules worth keeping:

- Section heads are left aligned (`.shead`: eyebrow, h2, lede). Only the home
  hero, inner page heroes and the closing dark panel are centered.
- Sections alternate `.section` (white) and `.section--alt`. A closing dark
  panel that follows a white section uses `.section--flush`; after an alt
  section it uses a plain `.section`, or the panel sits on the color change.
- The scroll-scrubbed stages (`.phero`, `.xstage`, `.loop`) are sticky. Never
  put `overflow: hidden` on one of their ancestors: it kills the pin.
- Give every `<video>` and below-the-fold `<img>` its `width` and `height`, or
  the page jumps as media loads.
- Do not add decoration back: no glows, particles, card tilts, gradient
  headings or eyebrow marks. The single flourish is the soft pink halo behind
  page heroes and the corner glow on dark panels.

## Standing content rules

These came from the client and apply to every edit.

- **Three product lines, equal weight.** SPM-01 (Detect), SPC-01 (Act) and the
  software (Decide and manage) each get a card on the home page, a page of
  their own and a place in the nav. Do not let the sensor take the story over.
- **Team order.** Ziyuan "Steven" Zhao first (Co-founder & CEO), Dr. Ziteng
  "Tim" Xu second (Co-founder, Sensing & AI), then Yu "Andy" Wang and Emmanuel
  Otchere, then the advisors (Diasio, Flint, Zhou).
- **No repeated content across pages.** The problem lives on Home, the logo
  band lives on Home, the survey and pricing live on the SPM-01 page. Other
  pages link there instead of restating it.
- **Use "1 in 6"** (16.4% preweaning mortality in 2024, National Pork Board
  and MetaFarms production analysis), never "1 in 7".
- **No em dashes in copy.** Use a colon, a comma or two sentences.
- **No "number, number" headlines** ("Two axes, one enclosure"). Write a plain
  statement instead.
- **No specific dates on the case study page** apart from what is burned into
  the footage itself.
- **Concept films autoplay, muted and looping, with no controls**, under
  reduced motion too. JS only pauses them offscreen.
- **The partner logo band never stops**: no hover pause, no reduced-motion
  fallback.

## The case study page, `barn.html`

**This is the only page on the site whose media is real.** Everything else is
concept industrial design or AI-generated concept film; `barn.html` is
unretouched recording from the ten-sow IACUC trial, with the overlays burned
in by the inference scripts themselves. The whole page is built on that
contrast, so **do not blur the line**:

- Media lives in `assets/trial/`, deliberately **not** `assets/film/` (which is
  the AI concept footage). Keep them apart.
- Real clips carry the green `.tag--real` chip ("Real farm footage · model
  output"). AI clips carry the pink `.tag--ai` chip ("AI concept film").
  **Never give a clip the wrong chip, and never move a clip between the two
  folders.**
- Every number in a `.readout` is transcribed off the frame itself
  (path/displacement/std/confidence/timestamps). If a clip is re-exported,
  re-read the numbers off the new frames; do not carry the old ones over.
- The `#limits` section (what the footage proves, and that this is the
  prototype rig rather than the sealed product) is not optional and must not
  be softened.
- Sources: `~/Downloads/Data/` (posture 6 classes × 20 frames, respiration) and
  `~/Downloads/{NEWBORN_DETECTION,Stillborn _Detection}/`, mirrored from the
  Drive folder "SmartSwine AI Model". Clips are transcoded to H.264 only: no
  upscaling, no grading, no cuts.
- The respiration comparison table comes from Emmanuel Otchere's lab meeting
  deck of 2026-07-30: 18 channels of sensor × tracker × axis × region, n = 100
  clips each, scored against a manual breath re-count. Depth on the back wins
  at MAE 2.43 / RMSE 3.33 bpm, and its RMSE-to-MAE ratio of 1.37 is the lowest
  of the 18. **Two caveats from the deck's own next-steps slide must stay on
  the page**: the Bland-Altman agreement analysis is unfinished and recounts on
  13 flagged clips are unconfirmed. That table is a sensor selection result,
  not a clinical validation, and the site must not upgrade it into one.
- The respiration fit is a matplotlib figure straight out of the pipeline. It
  sits in a white `.evi-plot` card as the printout it is. Do not redraw it in
  brand colors.

The posture gallery reuses the SPC-01 `.pgal` component. Captions come from
each `.prow`'s `data-cap` attribute, and rows without one fall back to the
curtain-rule list in `site.js`. `.pstack--wide` keeps the barn frames at 16:9
uncropped, because the classifier prints its label in the frame's top-left
corner.

## SPC-01 control law shown on the site

**Standing = both curtains down**; sternal names the roll flank, and that
side's curtain holds while the safe side lifts; lateral lifts both. Posture
labels use FLANK naming (the label names the flank the sow rolls onto). The
loop sequence also shows SPM-01 mounted at the crate rear with a stylized
wireless-signal visualization, and the fine print says so. The frame
boundaries in `site.js` mirror `ss02_loop.py`'s frame plan exactly; if the
sequence is re-rendered, update both together. The render-side recipe lives in
the render handoff doc §0; regenerate imagery only through
`v2_双光轴/源码/site_export.py`.

## Run

```bash
python3 -m http.server 8734
# → http://localhost:8734/
```

A local server is needed for the scroll sequences (file:// blocks canvas image
loading in some browsers); everything else works from disk.

## Deploy

GitHub Pages serves `main` from the repo root, so a push is a deploy:

```bash
git pull --rebase   # the site is edited from more than one machine
git push
```

To point a custom domain at it, add a `CNAME` file containing the domain, set
the DNS record, re-enable HTTPS in the repo's Pages settings, and update the
`og:image` URL in every page head.

## Structure

```
index.html            Home
product.html          SPM-01 Monitor
spc01.html            SPC-01 Curtain
software.html         Software (app + Software Pro)
barn.html             Case study: real trial footage (the only real media)
about.html            About: vision, mission, status, team, advisors
resources.html        press, policy, video, brochures, industry links
careers.html          open roles
contact.html          trial, referral, contact. The forms have no backend:
                      they compose an email in the visitor's own mail app and
                      leave a copyable version on the page
css/site.css          the whole design system
js/site.js            nav, reveals, count-ups, films, posture gallery, the
                      email-composing forms and the four scroll sequences
assets/img/           brochure renders as WebP, logo, og.jpg (link preview)
assets/team/          headshots, 640px square WebP
assets/team_raw/      originals (keep: the sources were temp files)
assets/seq/           96-frame product turntable (SPM-01 hero)
assets/explode/       48-frame assembled-to-exploded scrub
assets/travel/        48-frame curtain travel (SPC-01 hero)
assets/loop/          72-frame filmed control loop
assets/film/          AI-GENERATED concept film (Seedance 2 via Dreamina)
assets/trial/         REAL trial footage, classifier frames, respiration fit.
                      Case study page only
assets/logos/         partner logos: .webp is what the page loads, .png is
                      the original
assets/fonts/         Inter variable, latin subset
```

## Regenerating the turntable

```bash
cd ../v2_双光轴/源码
/Applications/Blender.app/Contents/MacOS/Blender -b -P ss_turntable.py -- \
    --frames 96 --samples 48 --res 1440
python3 <scratch>/seq_to_webp.py   # PNG → assets/seq/*.webp
```

The camera orbits the device (the device never rotates; see the render handoff
doc, pit #13). Frames are transparent WebP, which is what lets them sit on the
light page.

## Regenerating the exploded view

```bash
cd ../v2_双光轴/源码
/Applications/Blender.app/Contents/MacOS/Blender -b -P ss_explode_seq.py -- \
    --frames 48 --samples 64 --resx 1600 --resy 900
```

Label anchors come out of the same run as `explode_anchors.json`: camera-space
percentages for every part. Paste changed values into `XANCHORS` in
`js/site.js`; never hand-tune them against a screenshot.

## Content compliance

Every page's footer keeps the brochure's fact-check language. Do not loosen
any of these when editing copy:

- All imagery is **concept industrial design**, never a photo of shipped
  hardware. The single exception is `barn.html` / `assets/trial/`, which is
  real recorded trial footage and is labelled as such. That exception does not
  travel: no trial frame may be reused on another page as if it were the
  product, and no render may appear on the case study page.
- **Never claim users or customers.** The trial is our own, on one farm. "A
  working farrowing room with the swine center's own staff running it" is
  true; "our users" and "customer results" are not.
- Hardware is a **prototype validated** in one 10-sow IACUC trial. Never
  "deployed"; multi-farm validation is planned, not done.
- Status wording per line: SPM-01 **prototype validated on farm**; SPC-01
  **concept in development**, with no field performance claimed for the
  curtain; the app **in design**; Software Pro **planned**. The app and
  dashboard on the site are **design previews with illustrative values**.
- **IP69K is a design target**, never "rated" or "certified".
- **~$1M is non-dilutive NSF / USDA-NIFA grant support**, never "raised", no
  investors.
- Competition wording: **"finalist, 12 of 531 teams"** (531 → 27 semifinalists
  → 12 finalists). Do not state an outcome of the finals that has not been
  confirmed.
- Pork-industry organizations gave **letters of support and survey
  distribution**. They are not investors, customers or commercial partners.
  The disclaimer sits directly under the logo band on Home and must stay
  wherever the logos are.
- Survey is a **concept test**, n ≈ 16–19, not orders or letters of intent.
- Accuracy labels are exact: 99.15% = sow-posture classification on an unseen
  sow; 98.4% = breathing-signal classification; 96% / 86% are **precision**
  figures.
- Public location is **College Station, TX**. Keep the registered Missouri
  address, federal identifiers and any producer lead contacts off the site
  entirely.
- Attribution: sow and piglet geometry "Some Pig" by Austin Beaulier, CC BY 4.0.

## Notes on the Resources page

- The two podcast episodes are third-party interviews with co-founder Dr.
  Ziteng "Tim" Xu, not coverage of Smart Swine. They are labelled that way on
  purpose.
- Only one peer-reviewed paper is linked because it is the only one whose URL
  was verified; three others exist but their links were reconstructed from
  local PDF filenames and were never confirmed.
- The farm bill status note is dated by what it says ("as we write"). Check it
  against the current state of the bill before leaving it up for long.

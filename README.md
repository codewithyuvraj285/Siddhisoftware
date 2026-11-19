# Siddhi Softwares: FRONTEND (static HTML / CSS / JS)
No build step. Pages: index.html, list.html?t=service, detail.html?t=post&s=slug, contact.html.
- Backend address: config.js (API_BASE). Empty = demo content from assets/demo-data.js.
- Look and colours: assets/style.css (variables at the top). Layout/sections: assets/app.js.
- Preview: `node server.js` (http://localhost:4000) or upload the folder to any static hosting.
- Chatbot: assets/chatbot.js (answers from site content; every chat is saved to the backend and shown in Admin > Chat sheets).
- Images used by demo content are in assets/ (clients, img, tech). Uploaded images from admin come from the backend.
- demo-data.js is generated from ../backend/seed.js:
  node -e "const d=require('../backend/seed');require('fs').writeFileSync('assets/demo-data.js','window.DEMO='+JSON.stringify({settings:d.settings,items:d.items})+';')"

## v3 additions (all editable from Admin)
- Products section (Admin > Products): title, short text, icon key (code, web, app, truck, billing, school, iot, chat) or upload your own image.
- Hero slider (Admin > Hero slider): add 1 to 3 or more slides. Each slide = image, or a video (MP4/WebM upload up to 50 MB, or paste a link). Auto-plays, muted, loops.
- Moving technology strip (Admin > Technologies): logo + name. Add Java, Node.js, CSS, HTML, OS etc.
- Moving client logos and "Work delivered for companies" (Admin > Clients): logo + name + what you built. Logos show without any white box.
- Floating buttons: WhatsApp, Email and the Siddhi logo (chatbot). Email = Admin > Settings > Brand and contact. Icons can be replaced in Settings > Homepage sections and floating buttons.
- Tip: upload client / technology logos as PNG with transparent background (or WebP) so no white box shows.

## v6
- Menu is capital letters; only one dropdown stays open at a time (click or hover); click outside / Esc closes it.
- Hero (v7): large slider panel (about 1480x730 on desktop). Only the headline and one button sit on the panel; the badge, coloured line, paragraph and 'See plans & pricing' button were removed. The hero title (Admin > Settings > Hero headline) is centred on the panel. Slides: Admin > Hero slider (image only needed; title/text of a slide are no longer shown).
- Products now show a cover image on the card. Add/edit in Admin > Products (Main image + content + FAQs).

## v9
- SEO fields from Admin are now applied on the pages: meta description, keywords, canonical, noindex, Open Graph / Twitter tags, Search Console / Bing codes, Organization JSON-LD, Google Analytics and custom head code (GA and custom code are skipped on localhost).
- The site always fetches fresh data from the backend (no 15 s cache). If the backend is not running on localhost, a red bar tells you instead of silently showing demo content.

## v10
- New hero: "Choose your business" solution picker (assets/app.js, `HX` list at the top of the hero code). Edit business names, sample numbers and benefit lines there. It auto-plays every 5 s, pauses on hover, and links to the matching product. The old image slider is no longer shown on the home page.
- Lighter type (300/400 weights) and Deloitte-style white cards: short title, 3-line description, tag line, image at the bottom. Long descriptions are auto-trimmed in app.js (`cut`).

## v16
- 22 new blog posts in demo-data.js (one per product and case study), each with an FAQ, SEO fields and a related product/case-study link. With the backend running, these come from /api/public; demo-data.js is the no-backend fallback.

## v17
- Creative Infosys-style SVG images in `assets/img/creative/`: 19 product images, 3 case-study images and a stylized `Siddhi` hero wordmark. The hero shows the wordmark image when `heroWordImage` is set in Admin > Settings; clear it to fall back to text.

## v18
- 15 supplied tech PNGs in `assets/img/user-tech/` are used as product cover images. The hero now uses `assets/img/creative/glossy-orange-siddhi-wordmark.png`. Asset URLs use `?v=18` for cache busting.

## v19
- Long, point-wise descriptions for every product and all 7 Industries, matching the Mobile App Development format. The hero "Siddhi" wordmark is now smaller and sits beside the Siddhi Softwares logo. Asset URLs use `?v=19` for cache busting.

## v20
- Labels, list headings, contact forms, section visibility and the chatbot are all driven by admin settings. See backend README for the full key list. The frontend keeps safe defaults in code so static/demo mode still looks complete.
- The chatbot reads `chatText`, `chatKB` and `chatShow` from `window.SITE_DB.settings` and refreshes on the `sitedata` event; no code edit is needed to change its name, answers or quick replies.
- Hidden homepage sections use the `hidden` attribute plus `[hidden]{display:none!important}` in `style.css`.
- All script/style tags use `?v=20` so browsers pick up the new files.

## v21
- The hero wordmark now uses the single-colour orange logo at `assets/img/siddhi-orange-wordmark.png` instead of the older two-colour `glossy-orange-siddhi-wordmark.png`. Both the backend seed and the server migration set `heroWordImage` to the new file; Admin > Settings can still override it.
- The Ready solutions section has its own `showSolutions` checkbox in Admin > Settings, unchecked by default.

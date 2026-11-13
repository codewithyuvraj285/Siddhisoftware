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

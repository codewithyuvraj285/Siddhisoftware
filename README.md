# Siddhi Softwares: FRONTEND (website)

Run:   API_BASE=http://localhost:3000 node server.js     (Node 18+, no npm install)
Site:  http://localhost:4000

Set the backend address in config.js (API_BASE) or with the API_BASE environment variable.
The site fetches content from the backend every 20 seconds, so admin changes go live automatically.
Pages are rendered on the server (good for Google and AI search). It also serves
/sitemap.xml, /robots.txt and /llms.txt from the content in the backend.
The contact form is forwarded to the backend, leads appear in Admin > Leads.

Design: edit public/style.css. Page layout: edit server.js (home, detail, contact functions).
Logo: replace public/logo.png.

Deploy order: 1) start backend, 2) set API_BASE, 3) start frontend, 4) point your domain to the frontend.

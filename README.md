# Cash Report Generator
Daily Cash Report Generator — a mobile-first, offline-ready web app.

## Features
- WhatsApp-ready report generation
- 2-page slide UI (form → report)
- Cash With name dropdown (Joshua Tree, Libin, Sebin, Bipin, Toss, Shalu)
- Dynamic Extras section
- Variance +/− toggle
- Dojo field
- Local Storage persistence
- No backend, no dependencies

## Run locally
```
python -m http.server 8765 --bind 0.0.0.0
```
Then open `http://localhost:8765` or `http://YOUR_WIFI_IP:8765` on any device.

## Deploy
Deployed automatically via [Vercel](https://vercel.com) on push to `main`.

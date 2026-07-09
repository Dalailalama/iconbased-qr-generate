# Icon QR Generator

Generate QR codes with your own logo embedded — entirely client-side.

Upload an image (optional) and enter any text or URL, and the app renders a
scannable QR code with your image overlaid as a centered logo. Nothing is
uploaded anywhere — the image is read locally in your browser with the
`FileReader` API and the QR code is rendered directly on the page.

## How it works

- The QR code itself is generated with the [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling)
  library, loaded from a CDN (`unpkg`) — no build step, no dependencies to install.
- When a logo image is provided, the QR code's error correction level is set
  to `'H'` (the highest level), so the code stays reliably scannable even
  with part of it covered by the logo.
- The logo is capped at roughly 35–40% of the QR code's width so it never
  overwhelms the scannable pattern.
- Clicking the generated QR code downloads it as a PNG, using the library's
  built-in `download()` method.
- The whole app is static HTML/CSS/JS — open `index.html` directly in a
  browser or host it on any static file server (e.g. GitHub Pages).

## Customization

The **Customize** panel exposes everything the library supports:

- **General** — size (200–1000 px), quiet-zone margin, square or circle shape,
  error correction level (L/M/Q/H or auto), download format (PNG/JPEG/WEBP/SVG)
- **Dots** — 6 styles (square, dots, rounded, extra-rounded, classy,
  classy-rounded), solid color or two-color linear/radial gradient with angle
- **Corner squares & corner dots** — independent style (or "match dots") and color
- **Background** — color, transparency, corner rounding
- **Logo** — size (15–50 % of the code), margin around the logo, hide dots
  behind the logo

Changes re-render the QR code live once one has been generated.

## Files

- `index.html` — page structure and markup
- `style.css` — styling (responsive, centered card UI)
- `script.js` — form handling, image upload/drag-and-drop, QR generation
- `README.md` — this file

## Live Demo

**https://dalailalama.github.io/iconbased-qr-generate/**

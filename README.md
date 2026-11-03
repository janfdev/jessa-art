# Jessa Wolfe · Creative Design Studio (Next.js 15 App Router)

Full-fidelity Next.js 15 App Router port and mirror of [jessa.art](https://jessa.art), the interactive creative studio and design portfolio of Jessa Wolfe.

## Features

- **Next.js 15 App Router Architecture**: Clean React 19 client wrapper integrating the host studio and sub-application routing graph.
- **Persistent Spotify Audio Player**: Floating pill music controller in the bottom-right corner featuring animated CSS equalizer bars, Spotify Iframe API embed, marquee song display, and night-mode synchronization.
- **Dynamic Glitch-Decoding Tab Title**: Custom title loop decoding ASCII pixel glyphs into rotating artist titles (*Pixel Pusher*, *Dreamer*, *Creator*, *Tired*, *Builder*).
- **Interactive Figma-Style Studio Canvas**: Wobbly SVG distortion filters (`#wobs`), toolbar blob, custom cursor, draggable sticker notes, and canvas particle interactions.
- **54 Interactive Sub-Pages & Micro-Apps**: Complete case studies including *Mochiboard, Luminance, Harbor (live/flows), Snoot, Somnar, Indent, Fisher-Price, Dipple, Vanta, Ukiniwa, Tandem, Descent, Rime, Wordpit*, and *Resume*.
- **Self-Contained Local Assets**: 130+ MP4 videos, 400+ WebP/PNG/SVG/JPG images, custom webfonts (*Caveat, DM Sans, DynaPuff, Nunito, Dipple*), and downloadable PDFs.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/janfdev/jessa-art.git
cd jessa-art

# Install dependencies
bun install
# or
npm install

# Run the development server
bun run dev
# or
npm run dev
```

Open [http://localhost:3055](http://localhost:3055) with your browser.

## Build for Production

```bash
bun run build
bun run start
```

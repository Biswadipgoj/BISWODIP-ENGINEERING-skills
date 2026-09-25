# Biswodip Goj — Portfolio Site

A fully-animated personal portfolio and platform showcase, deployable to Vercel.

## Stack

- **Next.js 14** (App Router, static export)
- **Framer Motion** for layout animations, scroll-linked motion and staggered reveals
- **Tailwind-style utility classes** via global CSS (no build-time Tailwind dependency)
- **CSS keyframes** for ambient effects (float, pulse, glitch, scan)

## Motion inventory

Every section animates — nothing renders statically:

| Section | Motion |
|---|---|
| Hero | scroll-linked parallax, rotating orbit rings, glitch title, staggered stats, floating gradient orbs |
| About | staggered card reveals, hover lift |
| Skills | animated proficiency bars, per-bar easing |
| Workflow | staggered timeline nodes with pulsing dots |
| Capabilities | staggered grid, category filter, hover glow per repository |
| Projects | 3D card entrance (rotateX), hover lift |
| Footer | fade-in, hover color transitions |
| Navbar | scroll-reactive background, staggered links |

Reduced motion is respected at the OS level through Framer Motion defaults; ambient CSS effects are decorative only.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → out/
```

## Deploy to Vercel

`vercel.json` is included. Either:

```bash
npx vercel        # from this directory
```

or import the repository in the Vercel dashboard and set **Root Directory** to `site`.

The build produces a fully static `out/` directory — no server runtime required.

## Licence

Apache-2.0. Copyright (c) 2026 Biswodip Goj.

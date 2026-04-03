# Technical Requirements & Skills Implemented

## 1. The "Architectural" Interactive Title
**Skill:** Split-text manipulation.
**Execution:** Implemented using Vanilla JS to parse DOM text into `span` elements, combined with GSAP and window mouse events. On mouse move, we calculate the coordinate delta from center and map it to `skewX` and `scaleX` properties, creating a fluid, reactive typographic feel.

## 2. The "Soul" Gradient (Background)
**Skill:** WebGL Fragment Shaders via Pure Three.js.
**Execution:** Engineered a raw Three.js renderer inside `main.js`. It leverages a 2D Simplex Noise function inside a fragment shader, blending Midnight Obsidian, Raw Terracotta, and Oxidized Teal. The noise offsets shift smoothly over `uTime` and warp based on Lenis scroll velocity (`uScroll`).

## 3. Translucent UI & Tactile Elevation
**Skill:** Advanced CSS Compositing & Micro-interactions.
**Execution:** Defined Tailwind 4 tokens and global utility classes in `app/globals.css`.
- **Glass Layer:** `rgba(44, 49, 54, 0.4)` background, `blur(24px)` backdrop filter, strictly `8px` rounded corners, and a micro border.
- **Hover State:** Fluid transition transforming the items (`translateY(-4px)`), decreasing background opacity momentarily, and diffusing `box-shadow: 0 12px 40px rgba(0,0,0,0.3)` to physically lift elements from the canvas.

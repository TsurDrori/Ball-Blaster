---
name: frontend-design
description: This skill MUST be invoked when implementing or refining frontend UI within the existing design system: tokens, components, visual hierarchy, and polish. DO NOT invoke for UX flow decisions (flows, modal-vs-page, navigation); use ux-planner first.
metadata:
  argument-hint: "component or page to implement/tweak within the existing visual system"
---

# Frontend Design Skill

## ANTI-EMOJI POLICY [CRITICAL — ABSOLUTE RULE]
**NEVER use emojis anywhere: HTML, CSS content strings, JavaScript strings, canvas text, or any user-visible output.**
This applies to ALL contexts including:
- HTML text content and attribute values
- CSS `content:` property strings
- JavaScript `innerHTML`, `textContent`, or canvas `fillText` calls
- Any string that ends up rendered in the browser or canvas

**Replace emoji with:**
- Clean Unicode symbols that are NOT emoji (◆ ● ♥ ✓ ✂ × ÷ » ↑ ← →)
- CSS-rendered shapes (coin circle, diamond shape via CSS transforms)
- Inline SVG elements for icons in HTML buttons/controls
- Drawn shapes in canvas using `ctx.arc`, `ctx.fillRect`, etc.
- Short Hebrew/text abbreviations (2-3 letters) for in-game canvas icons

**Why:** This project targets Hebrew-speaking families including children. Emoji render inconsistently across devices, and the design system uses a premium dark aesthetic where emoji look cheap and out of place.

---

## Active Baseline Configuration

These baseline values drive all design decisions. Override dynamically if the user requests something specific.

- **DESIGN_VARIANCE: 8** — Offset/asymmetric layouts where possible
- **MOTION_INTENSITY: 6** — CSS transitions only (no JS animation libraries in this vanilla project)
- **VISUAL_DENSITY: 4** — Standard daily-app spacing

---

## Project Stack Constraints

This project is **vanilla HTML/CSS/JS** — no React, no Tailwind, no build step.

- Use CSS custom properties (variables) for the design token system
- Use Google Fonts CDN for typography (link in `<head>`)
- **Hebrew font requirement:** Font MUST support Hebrew glyphs. Use `Assistant` or `Heebo` from Google Fonts
- Use inline SVG for button icons (no icon libraries)
- Canvas rendering (`ctx`) uses its own font stack — keep `Arial` as canvas fallback but add `Assistant` first
- Animation: CSS `transition` and `@keyframes` only — no GSAP, no Framer Motion

---

## Phase 1: Read the Existing System First (required)

Before editing, inspect:
- `game/style.css` — design tokens (`:root` variables), typography, component styles
- `game/index.html` — HTML structure, font links, script loading order
- `game/ui.js` and `game/ui-overlays.js` — canvas-rendered UI
- `game/home.js` — dynamic HTML generation for shop/upgrade buttons

Classify the task:
1. **Use as-is:** existing token + class already fits
2. **Extend safely:** add a variant/state to an existing class
3. **Expand system:** add a new token/class because reuse is real (2+ use cases)

Default to 1 or 2.

---

## Phase 2: Design Engineering Rules

### Color Calibration
- **Max 1 accent color.** Saturation < 80%.
- **THE LILA BAN:** No purple glows, no neon gradients, no AI-purple/blue aesthetic.
- **Use the existing token palette:** `--accent`, `--gold`, `--cyan`, `--green`, `--red`, `--orange` from `:root`. Do NOT add new colors unless a genuine gap exists.
- **Off-black only:** Never use `#000000`. Use `--bg` (`#08080d`) or `--surface` (`#0e0e1a`).
- **Consistent grays:** Stick to the zinc/slate-based palette in `:root`. Don't mix warm and cool grays.

### Typography
- **Font:** `Assistant` (Google Fonts, Hebrew-compatible) for all HTML text. Canvas text uses `'Assistant', Arial, sans-serif`.
- **NO Arial/Helvetica as primary font for HTML.** Arial is canvas fallback only.
- **Display/Headlines:** `font-size: clamp(28px, 8vw, 42px); font-weight: 800; letter-spacing: -1px; line-height: 1`
- **Body:** `font-size: 13-14px; font-weight: 400-600; line-height: 1.5`
- **Muted labels:** use `--text-muted` color, `font-size: 11px`, `letter-spacing: 1.5px`, `text-transform: uppercase`

### Layout Rules
- **Grid over flex-math:** Use `grid grid-template-columns: 1fr 1fr` for 2-column layouts, NOT `width: 50%; float: left`.
- **Viewport stability:** Full-height sections use `min-height: 100dvh`, never `height: 100vh` (iOS Safari bug).
- **Max width container:** `width: min(480px, 100%)` for the game's mobile-first layout.

### Hierarchy and Emphasis
- Improve hierarchy: stronger title/section contrast, tighter grouping, clearer primary action
- Use ONE focal accent per surface (not everywhere)
- Use depth intentionally: subtle layered backgrounds, borders, and elevation contrast
- Motion for meaning: state transitions, reveal order, feedback — not decoration

### Anti-Dull Checks
- If every button has equal visual weight → hierarchy is missing
- If all secondary text uses one muted tone → information tiers are flattened
- If loading/error looks unstyled → the screen feels unfinished
- If no element has focal emphasis → the interface reads as generic

---

## Phase 3: Interaction States (required)

Always implement all states:
- **Default/idle**: baseline styling
- **Hover**: subtle lift (`translateY(-1px)`) or brightness increase
- **Active/press**: `scale(0.97)` or `translateY(0)` — tactile feedback
- **Affordable/enabled**: green tint (`--green-dim` background, green border)
- **Disabled/max-level**: dimmed, no hover transform, `cursor: default`
- **Prestige/special**: animated border pulse (not neon glows)

---

## Phase 4: Canvas UI Rules

For canvas-rendered UI (`game/ui.js`, `game/ui-overlays.js`):

- **No emoji in `ctx.fillText()`.** Replace with drawn shapes or Unicode non-emoji characters.
- **Safe Unicode alternatives for common symbols:**
  - Hearts: `♥` (U+2665, set `ctx.fillStyle` explicitly)
  - Diamond: `◆` (U+25C6) or draw with `ctx.moveTo/lineTo`
  - Coin: draw circle with radial gradient + `$` text
  - Stars: `★` (U+2605)
  - Arrows: `→ ← ↑ ↓` (U+2192 etc.)
- **For upgrade/powerup icons in canvas:** Use 2-3 letter Hebrew abbreviations rendered in a colored circle badge
- **Font in canvas:** `ctx.font = 'bold 20px "Assistant", Arial, sans-serif'`

---

## Phase 5: Extension Rules

When extending the design system:
- Prefer adding a class variant to an existing rule over creating a new component
- Add new CSS variables to `:root` only when existing tokens cannot express a repeated need
- Keep HTML/JS separation: style decisions belong in CSS, behavior in JS

When generating dynamic HTML in JS (e.g. `refreshHomeScreen`, `_renderSkinGrid`):
- Use `◆` for diamond symbols (U+25C6, never `💎`)
- Use `✓` for checkmarks (U+2713, never `✅`)
- Use `×` for close/cancel (U+00D7, never `❌`)
- No emoji characters in any template literals

---

## AI Tells — Forbidden Patterns

**Visual:**
- NO neon outer glows: `box-shadow: 0 0 30px rgba(50,120,240,0.4)` style is BANNED. Use subtle inner borders.
- NO pure black `#000000` — use `--bg` (`#08080d`) or `--surface`.
- NO oversaturated accent colors (desaturate to < 80% saturation).
- NO excessive `text-shadow` on headings — max one subtle shadow if any.

**Typography:**
- NO Arial as primary font in HTML (only canvas fallback).
- NO oversized H1s that scream — control hierarchy with weight and color.

**Layout:**
- Align and space mathematically. Avoid floating elements with awkward gaps.
- NO mixed warm/cool grays in the same component.

**Emoji (see ANTI-EMOJI POLICY above):**
- NO emoji in any user-visible output — HTML, CSS content, JS canvas text.

---

## Engineering Rules

Implement in this order:
1. Token/variable selection or extension
2. HTML structure and component styling
3. JS dynamic HTML (ensure no emoji in template literals)
4. Canvas UI updates (replace emoji with drawn shapes or safe Unicode)
5. Final polish for hierarchy, motion, and contrast

Required checks before finishing:
- Mobile layout works (width: min(480px, 100%))
- `min-height: 100dvh` used (not `height: 100vh`)
- All interactive states implemented (hover, active, disabled)
- Zero emoji in all output (HTML, CSS content:, JS strings, canvas)
- Canvas font set to include Assistant

---

## Output Expectations

After implementing, report:
- What was reused vs extended in the existing system
- Any new or changed tokens/variants
- What specifically was done to increase visual impact
- Emoji that were removed and what replaced them
- Any residual UI risks or follow-up polish items

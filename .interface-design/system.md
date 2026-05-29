# FNA Design System

## Direction & Intent

**Purpose:** Refined fintech for serious wealth management. Interface for financial advisors to review client needs and present findings to mature clients (30-60). Must feel premium and trustworthy without being corporate or dated.

**Audience:** Financial professionals and high-net-worth individuals. Context: office meetings, client presentations, home reviews. Task: Assess financial foundation, identify gaps, build wealth roadmap.

**Feel:** Clean and modern like contemporary fintech, but mature and serious. Warm, accessible premium—not cold banking, not crypto trendy.

---

## Color Palette

**Foundation:**
- Navy (primary): `#1e3a5f` — Trust, stability, heritage
- Off-white (base): `#f9f7f5` — Clarity, breathing room
- Warm taupe (secondary): `#8b8680` — Sophistication, timelessness

**Semantic & Accent:**
- Forest green (growth): `#2d5016` — Positive metrics, wealth building
- Warm gold (aspiration): `#d4af37` — Achievement, premium, phase progress
- Soft red (caution): `#c85c5c` — Risk, gaps, attention needed
- Warm gray (neutral): `#9a9a8f` — Supporting text, muted emphasis

**Why this palette:**
Colors come from the world of established wealth—financial offices with warm wood, brass accents, green plants, serious navy walls. Not borrowed from fintech startups. Every color carries meaning: green = growth, gold = achieved wealth, navy = trust foundation.

---

## Typography

**Headline (serif):** Georgia or serif system font
- Weight: 700
- Use for: Page titles, phase titles, key metrics labels
- Purpose: Confidence, established, premium feel

**Body (sans-serif):** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- Weight: 400 (regular text), 600 (secondary headings)
- Use for: Descriptions, recommendations, data
- Purpose: Contemporary, accessible, clean

**Data (monospace):** "SF Mono", Monaco, or monospace fallback
- Use for: Currency amounts, percentages, precise values
- Purpose: Alignment, precision, clarity

---

## Spacing System

**Base unit:** 8px

- Micro: 4px (icon gaps, tight spacing)
- Small: 8px (component padding, button spacing)
- Medium: 16px (card padding, section spacing)
- Large: 24px (major sections, header spacing)
- XL: 40px (page padding, major breaks)

**Rule:** All spacing multiples of 8. Never random values.

---

## Elevation & Depth

**Strategy:** Subtle layering with quiet borders. NO heavy shadows. Surfaces stack invisibly.

**Surface Elevation Scale:**
- Base (canvas): `#f9f7f5`
- Level 1 (cards): `#faf9f8` (1% lighter)
- Level 2 (dropdowns): `#fbfaf9` (2% lighter)
- Focus/hover lift: Use navy border on base, not background shift

**Border Progression:**
- Subtle (standard): `rgba(30, 58, 95, 0.08)` — Light navy, 1px
- Standard (separation): `rgba(30, 58, 95, 0.12)` — Slightly stronger, 1px
- Emphasis (focus): `rgba(212, 175, 55, 0.3)` — Gold accent, 2px
- Maximum (error state): `#c85c5c`, 2px

**Why borders over shadows:** Professional, clean, works for both light and future dark modes. Shadows feel soft but can read as "floating"—borders feel grounded.

---

## Text Hierarchy

- **Primary text:** Navy `#1e3a5f`, 16px body
- **Secondary text:** Warm gray `#9a9a8f`, 14px body
- **Tertiary text:** Warm gray `#b5b5aa`, 13px body
- **Muted (disabled/placeholder):** Warm gray `#d4d4ca`, 13px body

---

## Component Patterns

### Metric Box
- Padding: 16px (medium spacing)
- Background: Level 1 surface
- Border: Subtle navy
- Corner radius: 8px
- Label: Secondary text (14px)
- Value: 24px, 700 weight, color by context (navy default, green for positive, red for risk)
- Subtext: Tertiary text (11px)

### Card/Section
- Padding: 24px (medium-large)
- Background: Level 1 surface
- Border: Subtle navy
- Corner radius: 12px
- Title: Serif, 18px, 700, navy
- Content: Body text, secondary hierarchy

### Button (Primary)
- Background: Navy `#1e3a5f`
- Text: Off-white
- Padding: 12px 24px
- Border radius: 8px
- Hover: Navy darker `#162d47`
- No shadow—border focus ring with gold `rgba(212, 175, 55, 0.5)`

### Button (Secondary)
- Background: Off-white with navy border
- Text: Navy
- Padding: 12px 24px
- Border: Standard navy (1px)
- Hover: Level 1 background
- Border focus ring: Gold

### Phase Badge
- Background: Phase-specific (Accumulation: warm gray, Transition: gold, Work Optional: forest green)
- Text: White
- Padding: 20px center
- Border radius: 12px
- Typography: Serif title, secondary descriptive text
- **Signature element:** Indicates progress through wealth journey

---

## Interaction & Motion

- Hover: Subtle color shift (opacity or 5% lightness change)
- Transition: 200ms ease
- Focus rings: Gold accent, 2px, rounded
- No bouncing, no spring. Easing: ease-in-out for smooth, professional feel

---

## Dark Mode (Future)

Inverse logic:
- Navy background
- Off-white text
- Borders: Light navy
- Shadows: Subtle, visible on dark (use subtle rgba white)
- Accent colors: Same hues, desaturated slightly

---

## Signature: Phase Journey

The financial life phase framework appears throughout:
- **Phase badge** on summary showing current position
- **Phase chart** visualizing the progression
- **Gold accent** used to highlight phase advancement, targets, and goals
- **Four-factor cards** aligned to phase-specific needs

Every instance of phase progression uses the same visual language—consistent but not repetitive.

---

## Consistency Checks (before shipping)

- [ ] All spacing multiples of 8
- [ ] All colors from palette (no random hex)
- [ ] Text hierarchy used consistently (4 levels, not 2)
- [ ] Borders quiet (not harsh)
- [ ] Surface elevation barely perceptible (squint test)
- [ ] Phase journey visible in 3+ places
- [ ] No decorative gradients
- [ ] Every interactive element has hover + focus + disabled states
- [ ] Typography: headers serif, body sans, data monospace
- [ ] Corner radius scale: 8px (inputs/small), 12px (cards), 16px (modals)

# FNA Design System

**Status:** Active (Updated May 2026)  
**Foundation:** Clean fintech aesthetic from `project_instructions.md`  
**Application:** FNA module (upload, summary, 4-factor planning)

---

## Design Intent

**Audience:** Financial advisors reviewing client data, high-net-worth individuals understanding their financial position

**Context:** Office meetings, client presentations, wealth planning sessions

**Feel:** Clean, modern fintech (Stripe/Linear/Vercel style) — approachable premium without corporate heaviness. Purposeful, intentional, never generic. Every choice has meaning.

---

## Color Palette

All colors from `project_instructions.md`. Every semantic role is defined.

### Foundation (Achromatic)
- **Background:** `#f6f8fa` — Off-white, breathing room, clarity
- **Surface:** `#ffffff` — Default card/panel background
- **Surface 2:** `#f9fafb` — Hover state, subtle elevation
- **Border (standard):** `#e5e7eb` — Quiet separation
- **Border (soft):** `#f0f2f4` — Very subtle emphasis
- **Muted text:** `#cbd5e1` — Disabled, placeholder

### Text Hierarchy (Ink)
- **Primary (headlines, labels):** `#0f172a` — Navy-black, full contrast
- **Secondary (body text):** `#475569` — Medium contrast, readable
- **Tertiary (supporting):** `#94a3b8` — Lighter emphasis
- **Muted (disabled):** `#cbd5e1` — Very light, minimal contrast

### Semantic (Action + Status)
- **Brand (primary action):** `#635bff` — Purple, growth, forward motion
- **Brand light:** `#ede9fe` — Background tint for hover/focus
- **Positive (growth, success):** `#10b981` — Green, upward, good news
- **Warning (caution, attention):** `#f59e0b` — Amber, needs thought
- **Negative (error, risk):** `#ef4444` — Red, critical, stop

### Secondary Accent (Factor planning)
- **Passive Income:** `#10b981` — Green (growth-oriented)
- **Growth Investing:** `#f59e0b` — Amber (active choice required)
- **Legacy:** `#8b5cf6` — Purple (future-focused)

---

## Typography

**Font Family:** Inter (from rsms.me/inter/inter.css)  
**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

### Scale (Consistent across pages)

| Level | Size | Weight | Letter-spacing | Line-height | Use |
|-------|------|--------|---|---|---|
| **Display** | 26px | 700 | -0.02em | 1.2 | Page titles, hero metrics |
| **Label** | 11px | 600 | 0.07em | 1.0 | Section labels, uppercase emphasis |
| **Body** | 13px | 400 | normal | 1.65 | Paragraph text, descriptions |
| **Value** | 19–28px | 700 | -0.02em | 1.0 | Metric values, `font-variant-numeric: tabular-nums` |

### Color Usage
- Titles: `#0f172a` (primary ink)
- Body: `#475569` (secondary ink)
- Labels: `#94a3b8` (tertiary ink)
- Disabled: `#cbd5e1` (muted ink)

---

## Spacing System

**Base unit:** 4px  
**Scale:** 4, 8, 12, 16, 20, 24, 32, 48, 64

### Contexts
- **Micro:** 4px (gap between icons, tight clusters)
- **Small:** 8px (button padding, checkbox label gaps)
- **Medium:** 16px (card padding, component spacing)
- **Large:** 24px (section padding, footer spacing)
- **XL:** 32–48px (page margins, major breaks)
- **XXL:** 48–64px (page container padding)

---

## Depth & Elevation

### Strategy: Borders-only (clean, grounded)

Clean fintech uses **hairline borders** for structure, not shadows. Subtle, professional, works in light and dark modes.

### Surfaces
- **Base (page background):** `#f6f8fa`
- **Level 1 (cards, panels):** `#ffffff` with `1px solid #e5e7eb` border
- **Level 2 (hover, active):** `#f9fafb` with `1px solid #f0f2f4` border

### Shadow Strategy
- **No decorative shadows** — structure comes from borders
- **Optional subtle shadow on cards:** `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- **Hover lift (buttons):** Light shadow only on interaction, then remove

### Border Progression
- **Standard (default):** `1px solid #e5e7eb` — Quiet separation
- **Soft (gentle emphasis):** `1px solid #f0f2f4` — Barely perceptible
- **Accent (focus/active):** `1px solid {brand}` — Colored to show state
- **Critical (error):** `1px solid #ef4444` — Red for urgent attention

### Radius Scale
- **Inputs/tight buttons:** 6px
- **Cards/panels:** 12px
- **Large modals:** 16px
- **Consistent rule:** Never mix sharp (0px) with round (16px) on same level

---

## Component Patterns

### Metric Card
```
Label: 11px, 600 weight, uppercase, tertiary ink
Value: 19–28px, 700 weight, tabular-nums, semantic color (brand/positive/warning/negative)
Padding: 16–24px (medium spacing)
Background: #ffffff
Border: 1px solid #e5e7eb
Radius: 12px
Shadow: subtle (optional)
```

### Section/Card Container
```
Title: 26px or 15px, 700 weight, -0.02em, primary ink
Content: 13px, 400 weight, secondary ink, 1.65 line-height
Padding: 24–32px
Background: #ffffff
Border: 1px solid #e5e7eb
Radius: 12px
Shadow: subtle
```

### Button (Primary)
```
Background: #635bff (brand)
Text: white, 13px, 600 weight
Padding: 10–12px vertical, 16–24px horizontal
Border: none
Radius: 8px
Hover: backgroundColor #5348dd, transform translateY(-1px), subtle shadow
Focus: Outline ring with brand color
Disabled: Background #f0f2f4, text #cbd5e1, cursor not-allowed
Transition: all 0.15s ease-out
```

### Button (Secondary)
```
Background: #ffffff
Text: #475569, 13px, 500 weight
Border: 1px solid #e5e7eb
Padding: 10px 16px
Radius: 8px
Hover: Background #f9fafb, border #f0f2f4
Focus: Outline ring
Transition: all 0.15s ease-out
```

### Label Row (Key-value pair)
```
Key (label): 13px, 500, secondary ink
Value: 15px, 600, tabular-nums, semantic color or brand
Separator: 1px solid #f0f2f4 (under each row except last)
Padding: 12px vertical, 0 horizontal
```

### Factor Navigation (Sidebar)
```
Label: 11px, 600, uppercase, tertiary ink
Button inactive: white bg, #e5e7eb border, #475569 text
Button active: semantic-color bg, white text, same border-color
Padding: 12px 16px
Radius: 8px
Gap between items: 8px
Transition: all 0.15s
```

### Factor Content Card
```
Title bar: 4px vertical line (semantic color) + title text
Title: 19px, 700, -0.02em, primary ink
Recommendation: 13px, 400, 1.65 line-height, secondary ink
Action items: Unordered list, colored bullets (semantic), 13px, secondary ink
Border-top separator: 1px solid #f0f2f4 before action items
Padding: 32px
Background: #ffffff
Border: 1px solid #e5e7eb
Radius: 12px
Shadow: subtle
```

### Upload Area
```
Border: 2px dashed #e5e7eb
Background: #f9fafb or #ffffff
Padding: 48px
Radius: 12px
Label: 13px, 500, primary ink
Instructions: 13px, 400, secondary ink, 1.65 line-height
Hover: Border color becomes brand (#635bff), background brightens slightly
Drag-over: Border 2px dashed brand, background tint
Transition: all 0.15s
```

### Error State
```
Background: rgba(239, 68, 68, 0.05) — very light red tint
Border: 1px solid #ef4444
Text: #ef4444, 13px, 400
Icon/indicator: ⚠ symbol, red color
Padding: 16px
Radius: 8px
```

---

## Interaction & Motion

### Transitions
- **All interactive elements:** `transition: all 0.15s ease-out`
- **Page load:** Subtle fade-in, no bounce
- **State changes:** Smooth, no jarring shifts

### Hover
- Buttons: Darken bg slightly + lift with subtle shadow
- Cards: No change to background, optional border color shift
- Links: Color shift only, no underline unless already present

### Focus
- Outline ring: 2px solid {brand}, inset (only on keyboard nav)
- Buttons: Ring visible on focus, smooth removal on blur

### Disabled
- Opacity: 0.6 or background shifts to border color
- Cursor: not-allowed
- No hover state

### Loading
- Pulse animation (opacity 0.5 → 1.0 over 2s, ease-in-out, infinite)
- Subtle, not aggressive

### Completion
- Slide-in-up: 0.4s ease-out, opacity 0 → 1 + transform translateY(20px) → 0

---

## Navigation Context

### Page Layout
- **Header:** Back button + page title + subtitle (optional)
- **Main content:** max-width 1200px, centered with 32px padding
- **Sidebar navigation:** Same background as page, border separation (not different color)
- **Footer:** Optional guidance card or spacing (48px margin-top)

### Back Button
```
Text: ← Back to [previous page]
Style: Secondary button
Padding: 10px 16px
Font: 13px, 500 weight
Color: secondary ink (#475569)
Border: 1px solid #e5e7eb
Hover: Background #f9fafb, border #f0f2f4
Transition: all 0.15s
```

---

## Accessibility & Contrast

- **Text contrast:** Minimum 4.5:1 (WCAG AA)
- **Primary ink on white:** #0f172a on #ffffff ✓ 16:1 (AAA)
- **Secondary ink on white:** #475569 on #ffffff ✓ 7:1 (AAA)
- **Tertiary ink on white:** #94a3b8 on #ffffff ✓ 4.5:1 (AA)
- **Brand on white:** #635bff on #ffffff ✓ 4.5:1 (AA)
- **Focus rings:** Always visible, color + contrast minimum
- **Form labels:** Always associated, never placeholder-only

---

## Signature Elements (FNA-Specific)

### Work Optional Index Arc
- **SVG visualization** of 3-phase wealth journey (Accumulation → Transition → Work Optional)
- **Filled arc** in brand color (#635bff) showing client position
- **Phase labels** in tertiary ink below arc
- **Score display** (e.g., "$12,345 per year of age") in large bold value style
- **Purpose:** Hero element showing at-a-glance financial health trajectory

### Phase-Specific Metrics
- Every metric colored by context: brand for position, positive for growth, warning for attention, negative for risk
- **Tabular numbers** throughout for precise alignment
- **Absolute dollar formatting:** "S$1,234,567" not "0.1M"

### 4-Factor Planning Sidebar
- **Factor buttons** with semantic colors (Brand, Positive, Amber, Purple)
- **Active state:** Colored background + white text
- **Inactive state:** White background, colored border on hover
- **Content appears** in main area with color-coded accent bar
- **Purpose:** Organized exploration of phase-specific planning recommendations

---

## Consistency Checks (Before Shipping)

- [ ] All spacing uses 4px base unit (4, 8, 12, 16, 20, 24, 32, 48, 64)
- [ ] All colors from palette (no random hex)
- [ ] Text hierarchy: 4 levels consistently applied (heading, body, label, value)
- [ ] Borders quiet (1px, subtle gray, no harsh edges)
- [ ] Surface elevation barely perceptible (borders, not shadows)
- [ ] Typography: Inter font, proper weights and tracking applied
- [ ] Work Optional Index visible and prominent
- [ ] Phase-specific recommendations clear and actionable
- [ ] No decorative gradients or unnecessary motion
- [ ] Every interactive element has hover + focus + disabled states
- [ ] No pure shadows — structure from borders + subtle depth
- [ ] Border radius consistent (6px small, 8px buttons, 12px cards, 16px modals)
- [ ] Error states use #ef4444, success uses #10b981, warnings use #f59e0b
- [ ] Absolute dollar values (S$) formatted with thousands separator

---

## Version History

**v2 (May 2026):** Rebuild to clean fintech aesthetic from project_instructions.md  
- Removed: Navy/gold/green premium palette → Adopted: Off-white + purple + semantic greens
- Removed: Serif typography → Adopted: Inter sans-serif throughout
- Removed: Multiple shadow strategies → Adopted: Borders-only + subtle
- Removed: Heavy spacing (8px base) → Adopted: 4px base with 4px multiples
- Changed: Spacing system from 8px to 4px for tighter, more intentional control
- Added: Semantic color meanings (brand, positive, warning, negative)
- Added: Clear text hierarchy (4 levels: display, body, label, value)
- Focus: Intentionality over defaults, meaningful color, craft-first approach

---

## Files Using This System

- `components/FNASummaryDashboard.jsx` — Main dashboard with hero arc + metrics
- `components/FNA4FactorPlanning.jsx` — Sidebar navigation + phase-specific recommendations
- `components/FNAUploadView.jsx` — Upload interface + loading/completion states
- `components/FNAUploadArea.jsx` — Drag-drop upload component

---

## Resources

**Design System Skill:** `/var/folders/.../skills/interface-design/SKILL.md`  
**Project Instructions:** `project_instructions.md` (authoritative design guide)


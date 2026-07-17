# SkillVerse — UI/UX Design System

> **Version**: 1.0 — MVP  
> **Last Updated**: 2026-07-17  

---

## 1. Design Philosophy

SkillVerse is designed to feel like an **AI-native, premium SaaS product** — not a generic learning management system. The visual language communicates intelligence, focus, and depth. Users should feel the product is working *for* them, not just displaying data.

**Design Pillars**:
1. **Dark & Focused** — Reduces cognitive load, keeps attention on content
2. **Glassmorphism** — Frosted glass cards that feel layered and premium
3. **Alive & Responsive** — Micro-animations on every interaction
4. **Clear Hierarchy** — Information organized so the next action is always obvious

---

## 2. Color System

### Base Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0a0a0f` | Main background (near-black) |
| `--bg-secondary` | `#111118` | Sidebar, cards |
| `--bg-glass` | `rgba(255,255,255,0.05)` | Glass card backgrounds |
| `--border-glass` | `rgba(255,255,255,0.08)` | Glass card borders |
| `--border-subtle` | `rgba(255,255,255,0.04)` | Dividers |

### Brand / Accent Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#7c3aff` | Primary CTA, active states |
| `--accent-secondary` | `#4f7fff` | Secondary accents, links |
| `--accent-glow` | `rgba(124,58,255,0.3)` | Box-shadow glow effects |
| `--accent-gradient` | `linear-gradient(135deg, #7c3aff, #4f7fff)` | Buttons, highlights |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#22c55e` | Completed tasks, passed quizzes |
| `--warning` | `#f59e0b` | In-progress, streak warnings |
| `--error` | `#ef4444` | Errors, wrong answers |
| `--info` | `#38bdf8` | Info toasts, tips |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#f0f0f8` | Body text, headings |
| `--text-secondary` | `#9090a8` | Subtitles, labels |
| `--text-muted` | `#5a5a72` | Placeholders, disabled |

---

## 3. Typography

### Font Stack

```css
/* Google Fonts — import in globals.css */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
```

| Use Case | Font | Weight | Size |
|----------|------|--------|------|
| Display / Hero | Outfit | 800 | 56–72px |
| H1 — Page Title | Outfit | 700 | 36–48px |
| H2 — Section | Outfit | 600 | 24–32px |
| H3 — Card Title | Outfit | 600 | 18–20px |
| Body | Inter | 400 | 14–16px |
| Label / Caption | Inter | 500 | 12px |
| Code | `JetBrains Mono` | 400 | 13px |

### Type Scale

```css
:root {
  --text-xs:   0.75rem;  /* 12px */
  --text-sm:   0.875rem; /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg:   1.125rem; /* 18px */
  --text-xl:   1.25rem;  /* 20px */
  --text-2xl:  1.5rem;   /* 24px */
  --text-3xl:  1.875rem; /* 30px */
  --text-4xl:  2.25rem;  /* 36px */
}
```

---

## 4. Spacing System

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

---

## 5. Glass Card Component

The foundational UI element — used for all content cards, modals, and panels.

```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(124, 58, 255, 0.3);
  box-shadow: 0 0 24px rgba(124, 58, 255, 0.1);
  transition: all 0.2s ease;
}
```

**Variants**:
- `.glass-card--sm` → `border-radius: 12px; padding: 16px;`
- `.glass-card--lg` → `border-radius: 24px; padding: 32px;`
- `.glass-card--active` → `border-color: var(--accent-primary); box-shadow: 0 0 32px var(--accent-glow);`

---

## 6. Button System

### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #7c3aff, #4f7fff);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(124, 58, 255, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

### Secondary Button
```css
.btn-secondary {
  background: rgba(255,255,255,0.05);
  color: var(--text-primary);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 12px 24px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
}
```

### Ghost Button (Text Link)
```css
.btn-ghost {
  background: none;
  border: none;
  color: var(--accent-secondary);
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
}

.btn-ghost:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}
```

---

## 7. Status Badges

| Status | Style |
|--------|-------|
| `not_started` | Gray: `#3a3a52` bg, `#9090a8` text |
| `in_progress` | Blue glow: `rgba(79,127,255,0.15)` bg, `#4f7fff` text, blue border |
| `completed` | Green: `rgba(34,197,94,0.15)` bg, `#22c55e` text, green border |
| `failed` | Red: `rgba(239,68,68,0.15)` bg, `#ef4444` text, red border |

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
}
```

---

## 8. Sidebar Navigation

```
Width: 240px (desktop), hidden (mobile — hamburger menu)
Background: rgba(255,255,255,0.02) with border-right: 1px solid rgba(255,255,255,0.05)

Nav Item (inactive):
  - Color: var(--text-secondary)
  - Padding: 12px 16px
  - Border-radius: 10px

Nav Item (active):
  - Background: rgba(124,58,255,0.15)
  - Color: var(--accent-primary)
  - Border-left: 3px solid var(--accent-primary)

Nav Item (hover):
  - Background: rgba(255,255,255,0.04)
  - Color: var(--text-primary)
```

---

## 9. Animation Guidelines

All animations should be **subtle and purposeful** — not distracting.

| Effect | Duration | Easing | Usage |
|--------|----------|--------|-------|
| Hover transitions | 200ms | `ease` | Buttons, cards |
| Page transitions | 300ms | `ease-out` | Route changes (fade + slide up) |
| Card appear | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Cards loading in |
| Modal open/close | 250ms | `ease-out` | Modals, overlays |
| Streak celebration | 600ms | `spring` | Streak milestone |
| Skeleton pulse | 1.5s, infinite | `ease-in-out` | Loading skeletons |
| Agent appear (onboarding) | 500ms per agent | `ease-out` | Team formation screen |

### Keyframe Examples

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(124,58,255,0.2); }
  50%       { box-shadow: 0 0 32px rgba(124,58,255,0.5); }
}
```

---

## 10. Component Library Inventory

| Component | Location | Description |
|-----------|----------|-------------|
| `<GlassCard>` | `components/ui/GlassCard` | Foundation card with glass effect |
| `<Button>` | `components/ui/Button` | Primary, secondary, ghost variants |
| `<Badge>` | `components/ui/Badge` | Status and type badges |
| `<ProgressBar>` | `components/ui/ProgressBar` | Animated fill progress bar |
| `<ProgressRing>` | `components/ui/ProgressRing` | SVG circular progress |
| `<Skeleton>` | `components/ui/Skeleton` | Loading placeholder |
| `<Toast>` | `components/ui/Toast` | Success/error/info notifications |
| `<Modal>` | `components/ui/Modal` | Centered overlay dialog |
| `<Tooltip>` | `components/ui/Tooltip` | Hover tooltip |
| `<AgentCard>` | `components/agents/AgentCard` | AI agent display card |
| `<MilestoneCard>` | `components/roadmap/MilestoneCard` | Roadmap milestone |
| `<TaskCard>` | `components/planner/TaskCard` | Daily task with checkbox |
| `<ResourceCard>` | `components/resources/ResourceCard` | Learning resource |
| `<ProjectCard>` | `components/projects/ProjectCard` | Capstone project |
| `<QuizQuestion>` | `components/quiz/QuizQuestion` | Interactive quiz question |
| `<StatCard>` | `components/progress/StatCard` | Progress stat display |
| `<Heatmap>` | `components/progress/Heatmap` | 52-week activity heatmap |

---

## 11. Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm:  640px;   /* Small tablet */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Desktop (sidebar appears) */
--breakpoint-xl:  1280px;  /* Wide desktop */
--breakpoint-2xl: 1536px;  /* Ultra wide */
```

### Layout Behavior

| Viewport | Sidebar | Card Columns | Font Scale |
|----------|---------|--------------|-----------|
| < 768px | Hidden (hamburger) | 1 column | 90% |
| 768–1023px | Hidden (hamburger) | 2 columns | 95% |
| 1024px+ | Fixed 240px | 2–3 columns | 100% |

---

## 12. Accessibility Standards

| Standard | Implementation |
|----------|---------------|
| Color contrast | All text meets WCAG AA (4.5:1 minimum) |
| Focus rings | Visible purple focus outline on all interactive elements |
| ARIA labels | All icon-only buttons have `aria-label` |
| Keyboard nav | All UI navigable via Tab + Enter/Space |
| Screen reader | Semantic HTML (`<nav>`, `<main>`, `<article>`, etc.) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` removes animations |

# Remotion vs Manim for ReAct Animation

Decision: **Use Remotion for ReAct reasoning visualization.** This document captures the comparison that led to this decision, so future sessions don't re-litigate it.

## The Core Insight

ReAct animations are UI-element orchestration, not mathematical formula rendering:

```
Agent Box                    Environment Box
┌──────────────┐           ┌──────────────────┐
│ 💭 Thought:  │           │                  │
│  需要搜索     │──Action──▶│  search("ReAct") │
│              │           │                  │
│              │◀─Observe──│  Found 5 papers  │
└──────────────┘           └──────────────────┘
```

These are cards, bubbles, arrows, and code blocks — all React/CSS primitives. Manim is built for LaTeX equations, 3D geometry, and particle simulations.

## Comparison

| Dimension | Manim CE | Remotion |
|-----------|----------|----------|
| **Dev experience** | Python script, render-then-view | React components, browser live preview |
| **Iteration speed** | `manim -ql` → wait 30s → view → edit | Save → browser hot-reload, sub-second |
| **Text bubbles/cards** | Rectangle + Text, manual assembly | `<div>` + CSS, native rounded corners/shadows |
| **Code blocks** | Code() limited formatting | Any JS highlighter (Shiki, Prism) |
| **Arrows/connectors** | Arrow/Line, manual coordinate math | SVG `<path>` + CSS animations |
| **Timeline control** | self.wait() + manual tuning | `<Sequence>` component, drag-and-drop timeline |
| **Voiceover + BGM + subs** | ❌ Not its job — needs ffmpeg stitching | ✅ `<Audio>`, `<Series>`, subtitle overlay — one project |
| **State management** | Manual Python state tracking | React `useState` + `useCurrentFrame` + `interpolate` |
| **Ecosystem** | Academic niche | Full React ecosystem (Framer Motion, D3, react-spring) |
| **Production maturity** | Teaching/research tool | Production-grade (Apple, Spotify, Fireship use it) |

## When Manim is Still Better

- Complex mathematical derivations with dynamic LaTeX
- 3D geometric rotations and camera movements
- Precise particle/physics simulations
- Academic paper figures (non-video use)

## When Remotion Wins

- ReAct loops (state machines — React's wheelhouse)
- UI/UX demos with interactive elements
- Anything with significant text/code overlay
- Videos needing voiceover + BGM + subtitle sync
- Multi-platform output (one project, multiple resolutions)
- Fast iteration cycles (browser hot-reload)

## The Pipeline Impact

Choosing Remotion collapses two stages into one:

```
Manim path:  Animation (Manim) → Export MP4 → Post-production (ffmpeg stitch voiceover + BGM + subs)
Remotion path: Remotion project (animation + voiceover + BGM + subs in one step)
```

This eliminates a failure point (export-then-stitch) and makes subtitle sync trivial (frame-level control in the same timeline as the animation).

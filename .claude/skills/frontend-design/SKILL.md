---
name: frontend-design
description: This skill MUST be invoked when implementing or refining frontend UI within the existing design system: tokens, components, visual hierarchy, and polish. DO NOT invoke for UX flow decisions (flows, modal-vs-page, navigation); use ux-planner first.
metadata:
  argument-hint: "component or page to implement/tweak within the existing visual system"
---

# Frontend Design Skill
## Production Codebase Baseline (Mandatory)

Before applying this skill, load and follow `../_shared/SOTA_ENGINEERING_BASELINE.md`. If any instruction here conflicts with the baseline, keep the stricter production-grade rule unless the user explicitly asks for a temporary/POC tradeoff. Also load `../_shared/DISCIPLINE_SOTA_CHECKLISTS.md` and apply the section matching this skill's `name:` when present.


This skill is for product UI work in a mature visual system.
It is not a greenfield art-direction exercise.

Core rule: preserve visual consistency first, then add controlled emphasis so the UI feels alive, clear, and non-dull.

## Scope

Use this skill for:
- Implementing new UI using existing tokens and primitives
- Extending the system with new variants/tokens when needed
- Targeted visual improvements that increase clarity and energy

Do not use this skill for:
- Backend/service architecture decisions
- Runtime debugging outside UI behavior
- Diff review tasks with no design/UX objective
- UX planning choices (user flow, modal-vs-page, navigation patterns)

## Phase 1: Read the Existing System First (required)

Before editing, inspect:
- `src/client/index.css` (tokens, theme variables, motion utilities)
- `src/client/components/ui/` (primitives and variants)
- Relevant pages/components already solving similar UX

Then classify the task:
1. Use as-is: existing primitive + variant already fits
2. Extend safely: add a variant/size/state to an existing primitive
3. Expand system: add a new primitive/token because reuse is real (2+ use cases)

Default to 1 or 2. Use 3 only with a concrete reuse case.

If UX flow decisions are unclear, stop and use `ux-planner` first.

## Phase 2: Build Within the Existing Visual Language

Priorities:
1. Keep consistency with existing tokens, spacing, radius, typography, and motion
2. Raise visual impact through hierarchy and emphasis, not random restyling
3. Keep accessibility and responsiveness intact

### Practical "Make It Pop" Playbook (without breaking system)

- Improve hierarchy: stronger title/section contrast, tighter grouping, clearer primary action
- Add one focal accent per surface (not everywhere)
- Use depth intentionally: subtle layered backgrounds, borders, and elevation contrast
- Use motion for meaning: state transitions, reveal order, and feedback, not decoration
- Make important process states tangible: show progress details, not generic "Loading..."
- Design empty/error/success states with the same care as default state

Anti-dull checks:
- If every card/button has equal visual weight, hierarchy is missing
- If all secondary text uses one muted tone, information tiers are flattened
- If loading/error looks unstyled, the screen feels unfinished
- If no element has focal emphasis, the interface reads as generic

## Phase 3: Extension Rules

When extending the design system:
- Prefer adding a `variant` to an existing primitive over creating a new component
- Add new tokens only when existing tokens cannot express a repeated need
- Keep primitive APIs minimal and composable (`variant`, `size`, `className`)
- Keep business logic out of `src/client/components/ui/`

When adding a new primitive:
- Confirm at least 2 real call sites
- Match existing naming and composition patterns
- Document usage with a concise in-file note if behavior is non-obvious

## Engineering Rules

Implement in this order:
1. Primitive/variant selection or extension
2. Feature composition in page/component
3. Final polish for hierarchy, motion, and contrast

Required checks before finishing:
- Desktop and mobile layouts work
- Keyboard focus states are visible
- Primary vs secondary vs destructive actions are clearly separated
- Empty/loading/error/success states are implemented

## Output Expectations

After implementing, report:
- What was reused vs extended in the existing system
- Any new or changed tokens/variants
- What specifically was done to increase visual impact
- Any residual UI risks or follow-up polish items

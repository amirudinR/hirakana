# AGENTS.md

## Project Overview

Hirakana is a small React/Vite browser game for memorizing Japanese hiragana and katakana. The experience should feel like a warm paper study desk: calm, tactile, playful, and useful for short daily practice.

The app is intentionally client-only. There is no backend, account system, or remote database. Learning progress is stored in the browser with `localStorage`.

## Tech Stack

- React with Vite
- JavaScript modules, not TypeScript
- CSS in `src/styles.css`
- Browser `localStorage` for persistence
- No UI framework or component library currently installed

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

The development server normally runs on Vite's default port. If another local app already owns that port, use another port:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

## Source Layout

- `src/main.jsx`: React entry point and global stylesheet import.
- `src/App.jsx`: Main dashboard, quiz flow, theme state, scoring, streaks, and persistence.
- `src/data/kana.js`: Hiragana and katakana card data. Each card has `id`, `kana`, `romaji`, and `script`.
- `src/styles.css`: Complete visual system, responsive layout, paper texture, light/dark themes, and animations.
- `index.html`: Document shell and Indonesian page title.
- `docs/superpowers/plans/`: Original implementation plan and project notes.

## Existing Behavior

- Three practice modes exist: `mixed`, `hiragana`, and `katakana`.
- A round presents one kana, four romaji choices, and a romaji text input.
- Correct answers increase score, streak, and the card's mastery up to level 5.
- Incorrect answers reset the streak, lower mastery, and put the card into a review queue.
- Mastery is persisted under `hirakana-mastery-v1`.
- Light/dark theme preference is persisted under `hirakana-theme-v1`.
- Dark mode is toggled from the header and must continue to work on both dashboard and quiz screens.

## Design Direction

Keep the visual language intentional and consistent:

- Paper-like warm light background, ink-like dark text, vermilion accent, and muted green success color.
- Dark mode should feel like dark paper or an evening study desk, not a generic black dashboard.
- Use the existing typography roles: Fraunces for expressive headings, Plus Jakarta Sans for body copy, and DM Mono for labels/data.
- Preserve the paper cards, tape detail, kana sheet, ruled lines, stamps, and restrained motion.
- Avoid purple gradients, generic SaaS cards, excessive rounded containers, and unrelated visual decoration.
- Keep text in Indonesian unless the feature specifically needs Japanese labels.
- Keep the first screen immediately usable as the practice dashboard.

## Implementation Rules

- Prefer small, focused changes that preserve the current single-page architecture.
- Reuse existing CSS variables and patterns before adding new colors or abstractions.
- Keep kana data in `src/data/kana.js`; do not duplicate character lists inside UI components.
- Preserve keyboard focus styles and responsive behavior.
- Respect `prefers-reduced-motion` for new animations.
- Use functional React state updates when a state change depends on previous state.
- Use defensive parsing for any new `localStorage` value.
- Do not add a backend or authentication flow unless the product requirements explicitly change.
- Do not remove user progress when changing UI or adding modes.

## Validation Expectations

After changes:

1. Run `npm run build`.
2. Check the changed interaction in the browser.
3. Check both light and dark themes if styles or layout changed.
4. Check a narrow mobile viewport when changing responsive CSS.
5. Confirm that existing quiz scoring, streak, mastery, and persistence still work.

Do not claim a change is complete without fresh validation output.

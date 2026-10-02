# Hirakana Memory Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute the tasks inline in this session with focused validation after each edit.

**Goal:** Build a playful React app for memorizing hiragana and katakana through short quiz rounds, visible mastery, and local progress.

**Architecture:** A single-page React app owns session state and persists mastery in localStorage. Kana data is a small local module. The UI is split into a dashboard, quiz card, and progress strip, with a paper-study visual language and responsive layout.

**Tech Stack:** React, Vite, JavaScript, CSS, browser localStorage.

## Global Constraints

- The app must work without a backend or account.
- The first screen must be usable as the game dashboard.
- Exercises must cover hiragana, katakana, and mixed modes.
- Progress and streak must update immediately and survive refresh.
- The visual system uses a warm paper surface, ink-like dark text, vermilion accent, and restrained motion.
- The layout must remain usable on mobile widths and keyboard focus must remain visible.

---

### Task 1: Scaffold React App

**Files:**
- Create: `package.json`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`

- [ ] Create a Vite React project with a start and build script.
- [ ] Add the root render entry and global CSS reset/tokens.
- [ ] Run `npm install` and `npm run build` to verify the scaffold.

### Task 2: Add Kana Data and Game State

**Files:**
- Create: `src/data/kana.js`
- Modify: `src/App.jsx`

- [ ] Add hiragana and katakana rows with kana, romaji, and row labels.
- [ ] Implement mode filtering, question selection, answer checking, streak, score, and localStorage mastery persistence.
- [ ] Keep missed cards in a review queue so repeated errors reappear.

### Task 3: Build Dashboard and Quiz UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

- [ ] Render a responsive paper desk dashboard with mode controls, mastery summary, and a start/restart action.
- [ ] Render quiz questions with answer choices, a romaji input fallback, immediate feedback, and next-question flow.
- [ ] Add progress bars, micro labels, and empty/error states without introducing backend dependencies.

### Task 4: Verify Behavior and Production Build

**Files:**
- Modify: `src/App.jsx`, `src/styles.css` only if verification finds defects.

- [ ] Run `npm run build`.
- [ ] Start the Vite dev server and inspect the page in a browser at desktop and mobile widths.
- [ ] Verify mode switching, correct/incorrect feedback, streak updates, and refresh persistence.

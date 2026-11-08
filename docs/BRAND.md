# Dicey! — brand and design direction

Status: **Arcade Night selected by the owner**, November 2026. Working name: **Dicey!**

Visual reference: [Arcade Night concept](../design/dicey-arcade-v1.png).
The retro neon energy and mischievous avatars are the chosen direction.
Production artwork and individual interface details still need refinement.

## Personality

A lively tabletop party game in your pocket. Cheeky, sociable, colourful, and
satisfying to touch. The players and dice are the stars. Use short, friendly
language: “Your turn!”, “Keep these?”, “Nice roll!”, “Pass to Mia”. Avoid making
ordinary play feel like account management or a spreadsheet.

## Visual direction: Arcade Night

A simple dice game with big arcade energy. Use a chunky tilted wordmark,
bold sticker-like creature portraits, electric colour accents, crisp ivory
dice, and tactile buttons with purple offset depth. Small lightning bolts,
stars, and halftone details give it a retro character without obscuring play.

Dark surfaces are the default. Use bright colour to guide the next action,
show held dice, and celebrate a good roll. Keep scorecard surfaces quieter
so the active dice and primary button remain the focal points. Glow is a
small accent for selection, not a treatment for every edge. No flashing effects.

Implementation palette (starting values; validate contrast in real controls):

| Token | Value | Role |
| --- | --- | --- |
| Night | `#101522` | Main background and dark text on neon fills |
| Surface | `#1B2340` | Scorecards, panels, inactive controls |
| Electric mint | `#96F85A` | Primary action, selected/held states |
| Hot pink | `#FF64B5` | Secondary challenge actions and turn accents |
| Electric blue | `#536BFF` | Dice tray frame and decorative accents |
| Arcade purple | `#8129E8` | Offset button depth and wordmark extrusion |
| Ivory | `#FFF5DE` | Main text, dice faces, portrait borders |
| Muted lavender | `#BFC5DE` | Supporting text on dark surfaces |

Use Night text on mint and pink buttons; ivory text on dark surfaces.
Keep electric blue and purple primarily decorative until contrast is checked.
Colour always has a companion label, icon, outline, or shape. These hex values
are implementation proposals, not exact colour samples extracted from the art.

Typography proposal: a rounded heavy display face for the logo/headings and a
highly readable rounded sans for controls and scores. Candidate pairing:
Lilita One with Nunito Sans; verify available font files/licensing before
shipping. Use tabular digits where available. The final wordmark should be
editable vector artwork; concept lettering is exploratory.

## Avatar cast

Start with six original creatures: coral fox, aqua frog, grape cyclops,
sunshine bird, blue bear, pink cat. Strong silhouettes, bold expressions,
minimal detail, circular portrait framing, ivory sticker borders, and cheeky
expressions with strong eyebrows. Keep each creature’s own colour; the whole
cast does not need to become green and pink. Distinct shapes matter as much as
colour. No uploaded photo or account required for local players.

Each player picks a name and avatar. Show the active player with a name and
“Your turn” badge as well as an outline. Later, add happy, thinking, and
celebrating expressions. Avatars are identity, not purchasable stats.

## Screens and interactions

1. **Home:** oversized Dicey! mark, playful dice/character scene, “Play together”,
   “Challenge friends”, and a visible “Resume game” when applicable. Keep online
   functionality out of the playable build until implemented.
2. **Local setup:** 2–4 players as the first UI proposal (engine also supports
   solo), editable names and avatar picker, one prominent start button.
3. **Turn:** player badges and scores, round and rolls remaining, spacious dice
   tray, held labels, roll button, then the scorecard. On small phones use a
   scrolling scorecard rather than squeezing every category above the fold.
4. **Scoring:** tap a category to preview, then “Score 25 points”. A zero needs
   explicit “Score 0 points” wording. Committed values and live previews have
   different visual treatments; never rely on colour alone.
5. **Handoff:** “Pass to Mia” with Mia’s big avatar, followed by “I'm ready”.
6. **Results:** winning avatar(s), final scorecard, modest confetti, “Play again”.
   Celebrate tied winners equally.

Buttons should feel like chunky physical pieces with a brief press movement.
Held dice get a backing, outline, and “Held” label without changing their order.
Use native accessible controls, at least 48 logical-pixel touch areas, labelled
dice and hold state, reduced-motion alternatives, and optional sound/haptics.
Never hide essential information in animation or audio.

## Production direction and next steps

- Approved visual direction: `design/dicey-arcade-v1.png`; generation prompt:
  `design/ARCADE-PROMPT.txt`. The board is a visual reference, not a screen asset.
- Create separate production wordmark and avatar artwork in this style.
- Build the Expo theme and screens with real text, accessible controls, and the
  tested engine. Use the neon palette consistently across setup, turns, handoff,
  and results; reserve the strongest effects for meaningful moments.
- Retain the light and Midnight Party boards as exploration history. A light
  theme is not part of the selected direction at this stage.

Keep rules unchanged during visual work. Brand name changes do not rename the
Yahtzee scoring category. Display font choice, asset details, animation, and
sound remain implementation decisions; the Arcade Night direction is settled.

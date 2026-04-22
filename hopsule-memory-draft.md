# Hopsule Memory Draft

## Product direction
- Roleo is a React Native / Expo language-learning app focused on realistic speaking practice, short game loops, and scenario-driven learning.
- Product direction evolved from generic language practice into a more game-like, scene-based experience with cream/beige UI, stronger visual identity, and more focused learning tools.
- Quick Play positioning shifted toward advanced / arcade-style modes rather than beginner-first learning.

## UX and visual decisions
- Theme moved away from a dark / AI-looking visual style toward a cream / beige palette with warmer, more human presentation.
- Sticky back buttons were added/fixed on key screens such as scenarios/progress flows.
- Branding refined so the Roleo wordmark and capital R styling stay visually consistent.
- Onboarding and intro flows were judged too empty; direction changed toward richer, more cinematic scene-based visuals.
- Home screen now includes stronger information architecture with sections like Advanced Modes and Learning Tools.
- A revisit-intro action was added to the bottom of the home screen so onboarding/intro can be re-opened later.

## Pronunciation feature decisions
- New Pronunciation tool was added as a dedicated learning tool.
- Pronunciation includes three top-level tabs: letters, words, numbers.
- Audio playback uses expo-speech.
- Letter speech avoids the "capital" artifact by using normalized `speakText` values.
- Word learning was expanded far beyond a tiny MVP list into categorized vocabulary sets.
- Horizontal sub-navigation was added for word topics.
- Horizontal range navigation was added for numbers.
- Search works across visible pronunciation content.
- Dictionary definitions were added for words using `https://api.dictionaryapi.dev/api/v2/entries/en/<word>` and shown as small helper text on cards.
- Topic/range sub-navigation also received icons for faster scanning.

## Pronunciation content structure
- Word topics include: basics, animals, fruits, nature, aviation, conversation, travel, food.
- Numbers use explicit ranges like 0-100, 101-200, 201-300, 301-400.
- Pronunciation data was refactored into a reusable structured source file.

## Onboarding / intro decisions
- Onboarding now uses local bundled background assets instead of relying only on remote image URLs.
- Large visible hero visual blocks were added so users clearly see scene imagery instead of only subtle background treatment.
- Typography on onboarding was aligned with in-game typography using Playfair Display for headings.
- Scene inspiration for onboarding visuals includes crowded conversation, cafe ordering, and meeting/confidence contexts.

## Engineering and workflow notes
- Repo remote was updated to `https://github.com/batuizmirli/Roleo.git`.
- Latest work was committed and pushed with commit `2e0caed` and message `Update onboarding visuals and pronunciation flow`.
- Existing telemetry type errors in `App.tsx` were pre-existing and not caused by the recent onboarding/pronunciation changes.

## Suggested Hopsule memories to create
1. We are intentionally moving Roleo toward a more cinematic, human, scene-based learning experience rather than a generic AI-looking study app.
2. Pronunciation is a first-class learning tool with structured categories, TTS, searchable content, and lightweight dictionary support.
3. Onboarding should feel emotionally concrete and visually grounded in real-life speaking scenes.
4. Home must provide a path back to the intro/onboarding story so users can revisit the product framing.

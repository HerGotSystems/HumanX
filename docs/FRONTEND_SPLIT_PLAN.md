# HumanX Frontend Split Plan

HumanX has outgrown a single-file frontend.

Current problem:

- `public/index.html` is a huge single-line document.
- GitHub tool responses truncate it.
- Safe live patching becomes difficult.
- UI growth (votes, tests, media evidence, clustering) is now blocked by file structure.

Target structure:

```text
public/
  index.html
  styles.css
  app.js
  api.js
  render.js
  votes.js
```

Planned capability additions after split:

- Believe / Reject / Unsure voting
- Home tests rendering
- Source/media evidence rendering
- Evidence usefulness voting
- Duplicate claim grouping
- Pressure cluster rendering
- Claim belief vs evidence separation
- Better moderation controls
- Richer mobile layout

Design principle:

Consensus is not truth.

HumanX should visually separate:

- emotional certainty
- popularity
- repetition
- evidence quality
- repeatability
- survivability under pressure

This distinction is the core value of the system.


## TODO: Fix chromatic aberration colors on logo

The ghost layer colors are slightly off (not pure CMYK) because the CSS filter chains
interact with `mix-blend-mode: difference` on the parent element in unpredictable ways.

**What we want:** pure magenta (#ff00ff), yellow (#ffff00), cyan (#00ffff)
**What we get:** close but shifted — dark blue, purple-ish tones

**Context:** The ghosts live inside the same `<a>` as the main logo which has
`mixBlendMode: "difference"`. The filters need to produce colors that, after
the difference blend, land on exact CMYK values.

**Possible approaches:**
- Calculate exact pre-inverted filter chains (what color X, after difference on white, = #ff00ff?)
- Use a canvas-based approach to render the logo in exact colors
- Find a way to isolate ghosts from the difference blend context entirely

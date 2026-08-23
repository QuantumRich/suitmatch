# SuitMatch — MVP Technical Specification

## 1. Product Overview

SuitMatch is a mobile-first web application that lets a group determine whether their suits/outfits are sufficiently close in color for a coordinated event.

The initial use case is **groomsmen checking whether their navy suits actually match**.

The primary experience is:

```text
Discord
  ↓
Open SuitMatch URL on phone
  ↓
Create / join shared room
  ↓
Take photo of suit jacket
  ↓
Select / confirm jacket region
  ↓
Analyze color locally on phone
  ↓
Receive perceptual match score
  ↓
See everyone's results in real time
```

The application must work without:

* a native app
* an account
* a Discord integration
* uploading photos to a server
* an AI/vision API
* a paid API

The MVP should be deployable to Vercel and usable directly from iPhone Safari and Android Chrome.

---

# 2. Core Product Question

The most important question this MVP must answer is:

> Can the application reliably determine whether two real-world navy suits look close enough to be considered coordinated?

The primary technical risk is **not multiplayer**.

The primary technical risk is:

> Camera processing + lighting + fabric texture can make similar suits appear different, or different suits appear similar.

Therefore, most engineering effort should go toward the color-analysis pipeline and validation with real clothing.

---

# 3. Product Philosophy

The app is answering:

> "Will these outfits look sufficiently coordinated together?"

It is **not** claiming to prove that two fabrics are physically identical.

The system should distinguish between:

* match quality
* measurement confidence

A high match score with poor confidence should not be presented as a definitive result.

The system should prefer:

> "Low confidence — lighting is poor."

over confidently reporting a misleading color match.

---

# 4. Architecture

## Frontend

Use:

* Next.js
* App Router
* TypeScript
* Tailwind CSS
* deployed to Vercel

The application should be a single Next.js project.

Room routes:

```text
/[room]
```

Example:

```text
https://suitmatch.vercel.app/7K4P
```

---

## Realtime

Use:

* Cloudflare Workers
* SQLite-backed Durable Objects
* WebSockets

Use **one Durable Object instance per SuitMatch room**.

Do not use Supabase for the MVP.

The realtime layer should be isolated behind:

```text
lib/realtime/
```

The rest of the frontend must not directly depend on Cloudflare-specific APIs or implementation details.

This allows the realtime transport to be replaced later without rewriting the UI or color engine.

---

## Image processing

All photo processing is **100% client-side**.

The raw photo must never be uploaded to the server as part of the MVP.

The client performs:

```text
Photo
  ↓
Jacket region
  ↓
Pixel sampling
  ↓
Color conversion
  ↓
Lighting analysis
  ↓
Representative Lab color
  ↓
CIEDE2000 comparison
  ↓
Match score / confidence
```

Only a small measurement payload should be transmitted to the realtime room.

---

# 5. Mobile-First Requirement

Primary targets:

* iPhone Safari
* Android Chrome

Design for approximately 375px wide as a baseline.

Desktop support is desirable but secondary.

The app should be comfortable to use with one hand.

Use:

* large tap targets
* bottom-anchored primary actions
* concise instructions
* minimal navigation
* mobile-first responsive styling

Minimum tap target size:

**44px**

Avoid desktop layouts that are merely scaled down for mobile.

---

# 6. Photo Capture

The MVP should be **photo-based**, not continuous live-camera analysis.

Preferred initial mechanism:

```html
<input
  type="file"
  accept="image/*"
  capture="environment"
/>
```

The implementation should verify current iOS Safari and Android Chrome behavior and use the simplest reliable capture approach.

Avoid `getUserMedia()` for the MVP unless there is a concrete reason to switch.

The user should be able to:

* take a new photo
* review it
* retake it
* confirm it
* select/adjust the jacket region
* analyze it

---

# 7. Scan Instructions

Before capture, show concise guidance:

```text
Get a good suit reading

• Show your full jacket
• Use normal or neutral lighting
• Avoid colored LED lights
• Don't use photo filters
• Keep the jacket reasonably flat
• Avoid strong shadows

[ TAKE PHOTO ]
```

Do not overwhelm users with technical color-science details.

---

# 8. Photo Review

After capture, show the photo before analysis.

Provide a rectangular jacket-selection overlay.

Example:

```text
        YOUR PHOTO

    ┌─────────────────┐
    │                 │
    │      HEAD       │
    │                 │
    │  ┌───────────┐  │
    │  │  JACKET   │  │
    │  │   AREA    │  │
    │  └───────────┘  │
    │                 │
    └─────────────────┘

[ RETAKE ]     [ ANALYZE ]
```

The user should be able to drag and resize the rectangle on touch devices.

---

# 9. Jacket Detection

## MVP

Do **not** require sophisticated automatic jacket segmentation.

Use a manually selected rectangular region.

This is intentional.

The purpose of the first MVP is to validate:

> jacket sampling → lighting analysis → Lab → CIEDE2000 → match score

before introducing the additional uncertainty of ML segmentation.

---

## Future

Automatic jacket/torso segmentation can be added after the color engine is validated.

Potential future libraries:

* MediaPipe
* TensorFlow.js
* OpenCV.js
* other currently maintained browser-compatible vision libraries

Do not add them to the MVP unless the manual approach proves unusable.

---

# 10. Repository Layout

Recommended structure:

```text
matchy/
├── TECH_SPEC.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── [room]/
│       └── page.tsx
│
├── components/
│   ├── CaptureButton.tsx
│   ├── PhotoReview.tsx
│   ├── JacketRegion.tsx
│   ├── LightingBadge.tsx
│   ├── ResultCard.tsx
│   ├── GroupResults.tsx
│   └── NameGate.tsx
│
├── lib/
│   ├── color/
│   │   ├── extract.ts
│   │   ├── sample.ts
│   │   ├── stats.ts
│   │   ├── space.ts
│   │   ├── distance.ts
│   │   ├── lighting.ts
│   │   ├── score.ts
│   │   └── pipeline.ts
│   │
│   ├── realtime/
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── url.ts
│   │
│   └── util/
│       ├── roomCode.ts
│       └── storage.ts
│
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   └── SuitMatchRoom.ts
│   ├── wrangler.toml
│   └── package.json
│
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

This structure is a recommendation, not a rigid requirement. Keep the separation of responsibilities intact even if filenames change.

---

# 11. Color Library

Use **culori** for color calculations.

Reasons:

* browser-friendly
* tree-shakeable
* maintained
* provides Lab conversion
* provides CIEDE2000/difference functionality

Do not copy an old `chroma.js`/random color-math implementation from a tutorial.

Verify the currently supported culori APIs before implementation.

---

# 12. Color Analysis API

The core module should expose something conceptually equivalent to:

```ts
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Measurement = {
  lab: [number, number, number];
  confidence: number;
  lightingQuality: number;
  jacketVisibility: number;
  colorConsistency: number;
  swatchHex: string;
};

function analyze(
  image: ImageBitmap,
  region: Rect
): Measurement;
```

The exact types may evolve as implementation details become clearer.

The important requirement is that the analysis engine remains:

* deterministic
* isolated
* browser/client-side
* unit-testable
* independent of React/UI
* independent of Cloudflare/realtime code

---

# 13. Image Processing

Inside `analyze()`:

1. Draw the selected region to an offscreen canvas.
2. Bound the image resolution to avoid unnecessary phone computation, e.g. no more than ~512px on the long side unless testing shows otherwise.
3. Split the region into multiple sub-regions.
4. Sample many pixels.
5. Filter extreme highlights and shadows.
6. Filter obvious contamination.
7. Convert remaining pixels to Lab.
8. Calculate robust per-region statistics.
9. Aggregate regions.
10. Calculate lighting and confidence metrics.
11. Return the final `Measurement`.

The exact implementation should be tuned through testing rather than treated as mathematically final.

---

# 14. Multi-Region Sampling

Instead of relying on one average color, divide the jacket region into approximately five sampling areas:

* left chest
* right chest
* left shoulder
* right shoulder
* lower jacket

The implementation may adjust these regions if that produces better results.

The goal is to prevent one local artifact from dominating the result.

Potential contaminants include:

* shirt
* tie
* buttons
* skin
* background
* reflections
* deep folds
* highlights

---

# 15. Pixel Filtering

Discard obvious extreme highlights:

```text
L* > 85
```

Discard extreme shadows:

```text
L* < 8
```

These thresholds are starting points, not sacred constants.

The implementation should keep filtering logic modular and tunable.

Avoid letting highlights and shadows dominate the representative color.

Obvious skin contamination may be filtered with a heuristic in Lab or another suitable space, but do not over-engineer this in the MVP.

---

# 16. Representative Color

For each sub-region:

1. collect surviving pixels
2. convert to Lab
3. calculate the median Lab value

Then aggregate the sub-region medians using another robust statistic such as the median.

The representative color should not simply be the arithmetic RGB average of the entire image.

---

# 17. Lighting Quality

Lighting quality must be treated as a separate measurement.

Potential inputs:

* mean lightness
* percentage of clipped highlights
* percentage of severely underexposed pixels
* overall image color cast
* usable jacket area
* other obvious lighting problems

The first implementation may estimate color cast using image-level or selected-region statistics, but this logic must remain modular because the whole-image average is potentially contaminated by the background.

Do not claim that this is full color-constancy correction.

For the MVP, the system primarily:

* detects bad conditions
* estimates measurement quality
* lowers confidence when conditions are poor

It does **not** solve lighting normalization perfectly.

---

# 18. Lighting Quality Score

Return:

```text
lightingQuality: 0..1
```

Example UI:

```text
🟢 High confidence
Good lighting
```

```text
🟡 Medium confidence
Lighting is somewhat warm
```

```text
🔴 Low confidence
Too dark to reliably compare
```

If:

```text
lightingQuality < 0.30
```

the application should normally request another photo rather than pretending the result is trustworthy.

---

# 19. Jacket Visibility

Return:

```text
jacketVisibility: 0..1
```

This represents how much usable jacket-region data remains after filtering.

Low visibility should trigger a retake or reduced confidence.

Potential message:

```text
We can't see enough usable jacket color.

Try stepping back and showing more of the jacket.
```

---

# 20. Color Consistency

Return:

```text
colorConsistency: 0..1
```

This should measure agreement between the multiple sampled jacket regions.

Conceptually:

```text
1 = sub-regions agree strongly
0 = sub-regions are highly inconsistent
```

The initial implementation can use normalized variation among the Lab values.

Keep this calculation modular and tunable.

---

# 21. Confidence

Return:

```text
confidence: 0..1
```

Confidence should represent how trustworthy the measurement is.

It should be derived from independent factors such as:

* lighting quality
* jacket visibility
* color consistency

A weighted geometric mean is acceptable as a starting point because it prevents one terrible factor from being completely hidden by two good factors.

However, the exact formula is tunable.

Confidence should not be a decorative number.

---

# 22. Lab Color

Use CIELAB for the representative color.

Conceptually:

```text
sRGB
 ↓
Lab
 ↓
representative Lab
 ↓
CIEDE2000
```

Do not perform the primary comparison using raw RGB distance.

Keep `space.ts` focused on color-space conversion.

---

# 23. Perceptual Color Distance

Use **CIEDE2000** through culori or another verified implementation.

The purpose is to measure perceptual difference between two representative Lab colors.

Do not hand-roll the CIEDE2000 algorithm unless there is a compelling reason.

Test the implementation against published/known reference values.

---

# 24. Match Score

The user should see a simple match percentage instead of raw Delta E.

Initial placeholder mapping:

```text
ΔE ≤ 2    → 95–100
ΔE ≤ 4    → 85–94
ΔE ≤ 7    → 70–84
ΔE > 10   → <60
```

There is intentionally a gap between some ranges.

This mapping is a **placeholder**, not validated science.

Keep the scoring thresholds in one dedicated, easily tunable module/configuration.

The eventual goal is to tune the mapping based on real human judgments of actual suits.

---

# 25. Match Categories

Initial categories:

```text
90–100    Excellent match
80–89     Good match
65–79     Borderline
<65       Poor match
```

These thresholds are provisional.

Do not describe them as scientifically established.

---

# 26. Match vs Confidence

These are separate concepts.

Example:

```text
MATCH
94%

CONFIDENCE
91%
```

Possible case:

```text
MATCH
97%

CONFIDENCE
42%
```

Interpretation:

> The measured colors appear close, but environmental conditions make the measurement unreliable.

The UI should communicate this distinction clearly.

---

# 27. Swatch

Expose:

```text
swatchHex: string
```

for UI display.

This allows the application to show a representative color swatch next to the result.

The swatch is informational and should not be treated as a perfect reproduction of fabric color.

---

# 28. Realtime Rooms

Each room gets a temporary Cloudflare Durable Object.

Conceptual structure:

```text
Room "7K4P"
    ↓
Durable Object
    ├── Rich
    ├── Mike
    ├── James
    └── Chris
```

Use one DO instance per room.

---

# 29. WebSocket Connection

Conceptually:

```text
wss://<worker>/rooms/:code?name=Rich&uid=<localId>
```

The exact deployment URL should be environment-configurable.

The frontend should never hard-code the Worker URL.

---

# 30. Realtime Message Contract

Client → server:

```json
{
  "type": "measurement",
  "measurement": {
    "lab": [24.2, 3.1, -10.4],
    "confidence": 0.91,
    "lightingQuality": 0.87,
    "jacketVisibility": 0.96,
    "colorConsistency": 0.94,
    "swatchHex": "#1d2738"
  }
}
```

Reference update:

```json
{
  "type": "setReference",
  "uid": "abc123"
}
```

Server → client:

```json
{
  "type": "state",
  "room": {
    "code": "7K4P",
    "referenceUid": "abc123",
    "participants": []
  }
}
```

Sending the full room snapshot on changes is acceptable for MVP simplicity because rooms are expected to be small.

---

# 31. Room State

Conceptually:

```ts
type RoomState = {
  code: string;
  referenceUid: string | null;
  participants: Array<{
    uid: string;
    name: string;
    measurement?: Measurement;
    updatedAt: number;
  }>;
};
```

The exact implementation may add internal metadata as needed.

---

# 32. Participant Identity

No formal authentication is required.

Generate a random local user ID and persist it in `localStorage`.

Store display name locally as well.

The user should be prompted for a display name on first use.

---

# 33. Reference User

For the MVP:

* first participant becomes the reference automatically
* any participant may choose "Make me reference"

Last-write-wins is acceptable.

Changing the reference should immediately update everyone's displayed comparison.

---

# 34. Room Lifecycle

Rooms are ephemeral.

Store room state in the Durable Object's SQLite storage.

Support:

* participant state
* latest measurement
* reference user
* created-at / updated-at

Remove stale participants after approximately 10 minutes without activity.

Allow room expiration after approximately 24 hours of inactivity.

Exact cleanup implementation may differ based on Cloudflare Durable Object behavior.

---

# 35. Privacy

Do not persist raw photos.

Do not upload raw photos to Vercel.

Do not upload raw photos to Cloudflare.

Do not send raw photos through WebSockets.

Only send measurement data needed for room comparison.

This is a core MVP privacy requirement.

---

# 36. Landing Screen

The landing page should provide:

```text
SuitMatch

Are your suits actually the same color?

[ CREATE ROOM ]

Join a room
[ CODE ]

[ JOIN ]
```

Creating a room should generate a short room code and navigate to:

```text
/[room]
```

---

# 37. Room Screen Flow

1. Join room
2. Name gate if needed
3. Show scan instructions
4. Capture photo
5. Review photo
6. Position/adjust jacket rectangle
7. Analyze locally
8. Show result
9. Publish measurement
10. Show live group results

The Group Results area should remain available on the room screen and update whenever another participant submits a measurement.

---

# 38. Personal Result Screen

Example:

```text
YOUR SUIT

NAVY

94%
EXCELLENT MATCH

Compared with Rich

Confidence    92%
Lighting      Good
```

The interface should make clear whether the reference has changed.

If there is no reference:

```text
Waiting for a reference outfit.
```

---

# 39. Group Results

Example:

```text
WEDDING SUIT CHECK

Rich
REFERENCE

Mike       94%   🟢
James      88%   🟢
Chris      67%   🟡
Dave       42%   🔴
```

If the reference changes, all scores update.

Optionally identify the largest outlier:

```text
Chris is currently the furthest from the reference.
```

Keep this simple for MVP.

---

# 40. Error States

Handle:

### Camera/photo unavailable

Offer normal file-photo selection if appropriate.

### Photo too dark

```text
This photo is too dark to compare reliably.
Try taking another photo in brighter, neutral lighting.
```

### Jacket visibility too low

```text
We can't see enough of the jacket.
Step back and show more of your torso.
```

### Strong lighting cast

```text
Your lighting looks strongly warm/cool.
Try moving closer to a window or neutral light.
```

### Low confidence

Show the result but clearly flag low confidence, or request a retake if confidence is below an agreed threshold.

---

# 41. Testing

## Unit tests

Use Vitest or an equivalent lightweight test runner.

Test:

### Color space

* RGB → Lab known swatches
* Lab → RGB round trips where appropriate

### CIEDE2000

* known Lab pairs
* compare against published/reference values

### Statistics

* median
* trimmed mean
* percentiles
* filtering

### Scoring

* ΔE = 0 produces 100%
* larger ΔE never produces a higher score
* ΔE = 15 produces a poor score

### Lighting

Test synthetic edge cases for:

* extreme darkness
* extreme brightness
* heavy color cast

---

# 42. Fixture Pipeline Test

Create at least six hand-labeled JPEG fixtures covering:

* identical navy
* near-identical navy
* navy vs black
* navy vs charcoal
* navy vs royal blue
* warm lighting
* cool lighting

The exact fixture count can increase.

The initial success criterion:

```text
same/near-same suit pairs → generally ≥85
obvious mismatches → generally ≤60
```

These numbers are test targets, not scientific claims.

Failures should be investigated rather than simply forcing the algorithm to pass.

---

# 43. Real-World Validation

The most important test is a real group test.

Target:

* 3–5 people
* actual suits
* multiple phones
* one Discord call

Process:

1. Everyone joins the same room.
2. Everyone follows the same lighting guidance.
3. Everyone photographs their suit.
4. Everyone submits a measurement.
5. Record match scores.
6. Have participants independently judge the suit pairs.
7. Compare algorithm results to human judgments.

Use a simple classification:

```text
A = essentially identical
B = close enough
C = noticeably different
D = obviously different
```

The resulting data should be used to tune the score mapping and possibly the confidence model.

---

# 44. Important Validation Principle

Do not optimize only against synthetic swatches.

Real fabric introduces:

* texture
* sheen
* folds
* shadows
* camera processing
* white-balance changes
* HDR/tone mapping
* compression
* background contamination

The actual product value depends on real-world performance.

---

# 45. Future Calibration

A future version may support a neutral white/gray reference card.

Potential flow:

```text
Hold neutral reference next to suit
        ↓
Estimate camera/scene color cast
        ↓
Correct jacket measurement
        ↓
Compare
```

Do not make this mandatory for the first MVP.

Keep the color pipeline modular enough to add it later.

---

# 46. Future Automatic Jacket Detection

After validating the manual region approach, consider:

* MediaPipe
* TensorFlow.js
* OpenCV.js
* another maintained browser-compatible CV model

Goal:

```text
Photo
 ↓
Person/torso detection
 ↓
Jacket region
 ↓
Color analysis
```

Do not introduce this complexity before the basic color engine is proven.

---

# 47. Future Live Camera Mode

After the photo MVP works, add a continuous camera mode.

Potential flow:

```text
Live camera
 ↓
Continuous jacket region
 ↓
Continuous sampling
 ↓
Live match score
```

Reuse the existing color-analysis engine.

Do not rewrite the color engine for live mode.

---

# 48. Future Discord Integration

Possible later features:

* `/suitcheck`
* Discord bot
* Discord Activity
* automatic room creation from Discord

None of these are part of the MVP.

The standalone web URL is sufficient for use while everyone is in a Discord call.

---

# 49. Future Reference Photo

Allow a reference user to upload an existing suit photo.

Example:

```text
Reference suit photo
        ↓
Extract representative Lab color
        ↓
Other participants compare against it
```

This could eventually allow people to check matching suits before an event.

---

# 50. Future Broader Use Cases

The underlying product concept is:

> **Do our outfits actually match?**

Potential use cases beyond weddings:

* group photos
* corporate events
* graduations
* dance teams
* performance groups
* sports/uniform coordination
* themed parties
* couples coordinating outfits
* content creators
* corporate headshots

The wedding/groomsmen use case is the initial wedge.

---

# 51. Non-Goals for MVP

Explicitly out of scope:

* Discord bot
* Discord OAuth
* Discord embed/activity
* native iOS app
* native Android app
* user accounts
* authentication
* payments
* permanent photo storage
* AI/LLM vision APIs
* ML jacket segmentation
* full outfit/style analysis
* shopping recommendations
* calibration card
* live camera analysis
* sophisticated fashion classification

---

# 52. Implementation Order

## Phase 1 — Project scaffold + color engine

Build:

* Next.js app
* Tailwind
* color modules
* culori integration
* analysis pipeline
* unit tests

Do not build multiplayer first.

---

## Phase 2 — Mobile capture and review

Build:

* photo capture
* preview
* jacket rectangle
* touch drag/resize
* analysis state
* lighting feedback
* error handling

---

## Phase 3 — Results

Build:

* match score
* confidence
* color swatch
* reference comparison
* result card

---

## Phase 4 — Realtime rooms

Build:

* Cloudflare Worker
* SQLite-backed Durable Object
* WebSocket room
* participant state
* measurements
* reference user
* group results

---

## Phase 5 — Phone testing

Test:

* iPhone Safari
* Android Chrome
* two or more phones
* public HTTPS URL
* shared room
* simultaneous scanning

Vercel provides HTTPS for the frontend.

---

## Phase 6 — Real-world validation and tuning

Run the actual group test.

Do not substantially optimize score thresholds before real-world data exists.

Use the test to improve:

* sampling
* filtering
* lighting quality
* confidence
* score mapping

---

# 53. Deployment

## Frontend

Deploy the Next.js application to Vercel.

Environment variables should be used for:

* realtime Worker URL
* any environment-specific configuration

Do not hard-code deployment URLs.

---

## Cloudflare Worker

Deploy the realtime Worker and Durable Object using Wrangler.

Keep Cloudflare-specific configuration inside the `worker/` project.

The frontend should communicate with the Worker only through `lib/realtime/`.

---

# 54. Local Development

Expected development flow:

```bash
pnpm install
pnpm dev
```

Run the Cloudflare Worker separately with Wrangler:

```bash
pnpm wrangler dev
```

The exact scripts may be defined in package.json as convenient.

For phone testing on a local network, expose the Next.js dev server to the LAN as needed.

Remember that some browser camera functionality requires a secure context; public Vercel deployment is the authoritative phone smoke test.

---

# 55. Development Standards

Before implementing:

1. Inspect the repository.
2. Verify current APIs and package versions.
3. Verify current Cloudflare Durable Object APIs.
4. Verify current browser behavior where compatibility matters.
5. Identify concrete problems in the spec.
6. Make the smallest pragmatic changes necessary.
7. Document meaningful architectural deviations.

Do not expand scope unnecessarily.

Prefer boring, reliable code over clever abstractions.

---

# 56. Architecture Boundaries

The following boundaries are important:

### Color engine

Must NOT import:

* React
* Next.js
* Cloudflare
* WebSocket code
* browser UI components

It should be independently testable.

### UI

Should communicate with color analysis through a simple API.

### Realtime

Should be accessed only through:

```text
lib/realtime/
```

### Raw photos

Should remain client-side.

### Room state

Should contain only the small measurement data required for coordination.

---

# 57. Success Criteria

The MVP is successful if:

1. A user can open the Vercel URL on a phone.
2. A user can create or join a room without an account.
3. The user can photograph their suit using the phone.
4. The user can position the jacket selection rectangle.
5. The phone analyzes the image locally.
6. No raw photo is uploaded.
7. The app produces a representative color and confidence values.
8. Two real similar navy suits generally produce a high match score.
9. Clearly different colors generally produce a substantially lower score.
10. Poor lighting reduces confidence or triggers a retake.
11. Multiple phones can join the same room.
12. Measurements update for everyone in realtime.
13. A reference user can be selected.
14. The experience is usable while participants remain on a Discord call.

---

# 58. Guiding Principle

Do not spend the MVP polishing infrastructure before proving the core idea.

The priority is:

```text
REAL PHOTOS
    ↓
REAL SUITS
    ↓
REAL LIGHTING
    ↓
REAL COLOR ANALYSIS
    ↓
REAL HUMAN JUDGMENT
```

The most valuable output from the first group test is not the UI.

It is evidence about whether the color-analysis pipeline can actually answer:

> **"Are these suits close enough that we can wear them together?"**

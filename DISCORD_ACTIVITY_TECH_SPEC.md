# SuitMatch Discord Activity — Product & Technical Brief

## 1. Purpose

Build a Discord Activity version of SuitMatch that allows people already together in a Discord voice call to launch SuitMatch **inside Discord** and participate in the same shared suit-color comparison session.

The existing standalone SuitMatch web app is already deployed and working.

Current architecture:

```text
Next.js / Vercel
     +
Cloudflare Worker / Durable Objects
     +
Client-side photo/color analysis
```

The Discord Activity should **reuse as much of the existing SuitMatch product and color-analysis code as possible**.

This work should be developed on a **separate git branch** and must not destabilize the current production web app.

---

# 2. Product Vision

Today:

```text
Discord call
    ↓
Someone sends SuitMatch URL
    ↓
Everyone opens browser
    ↓
Everyone manually joins room
```

Discord Activity version:

```text
Discord voice channel
        ↓
Launch SuitMatch
        ↓
Activity opens inside Discord
        ↓
People in the Activity are automatically grouped together
        ↓
Everyone scans their suit
        ↓
Shared results appear
```

The desired experience should feel similar to Discord Activities such as shared games and collaborative apps.

The user should think:

> "We're in Discord, let's launch SuitMatch."

rather than:

> "Everybody copy this website URL."

---

# 3. Important Product Constraint

The Discord Activity is a **new entry point into SuitMatch**, not a rewrite of the SuitMatch application.

The existing standalone web experience must continue to work.

Do not replace the current room architecture unless there is a concrete reason.

Do not merge Discord-specific logic throughout the color engine or UI.

---

# 4. Primary Goal

Determine whether the existing SuitMatch application can be embedded and launched as a Discord Activity while preserving:

* mobile photo capture
* client-side image analysis
* CIEDE2000 comparison
* real-time group results
* reference user
* privacy model

The primary technical question is:

> Can participants take/select a suit photo and run the existing client-side color analysis successfully from inside the Discord Activity, particularly on mobile?

This needs to be verified rather than assumed.

---

# 5. Secondary Goal

Automatically associate Discord Activity participants with the same SuitMatch session.

Instead of requiring:

```text
Room code: 7K4P
```

the Activity should derive session membership from the Discord Activity instance/session where practical.

Conceptually:

```text
Discord Voice Channel
       ↓
SuitMatch Activity instance
       ↓
Activity/session identifier
       ↓
SuitMatch room
```

The exact mapping should follow Discord's current Activity APIs and recommended multiplayer architecture.

Do not invent a custom session mechanism if Discord already provides an appropriate instance/session identifier.

---

# 6. Existing SuitMatch Functionality to Reuse

The following should remain unchanged unless necessary:

### Color engine

```text
lib/color/
```

Reuse:

* image decoding
* pixel sampling
* Lab conversion
* CIEDE2000
* lighting analysis
* confidence
* score mapping

### Realtime abstraction

```text
lib/realtime/
```

Reuse the abstraction wherever practical.

The Activity should not directly import Cloudflare-specific implementation details throughout the UI.

### Existing results

Reuse:

* match score
* confidence
* lighting quality
* color swatch
* reference comparison
* group results

---

# 7. Discord-Specific Responsibilities

Create a clearly isolated Discord integration layer.

Potential structure:

```text id="nx6e5v"
lib/
├── discord/
│   ├── client.ts
│   ├── identity.ts
│   ├── activity.ts
│   └── types.ts
```

The exact structure may differ.

The goal is:

```text
Discord SDK
     ↓
Discord adapter
     ↓
SuitMatch application
```

rather than:

```text
React components
     ↓
Discord SDK everywhere
```

---

# 8. Discord Embedded App SDK

Use Discord's current official Embedded App SDK / Activities APIs.

Before implementation:

1. Verify the currently documented Activity architecture.
2. Verify supported client environments.
3. Verify the current initialization/auth/identity APIs.
4. Verify how Activity instances are identified.
5. Verify supported camera/photo behavior in Activities.
6. Verify current developer portal configuration requirements.

Do not rely on outdated tutorials or old Discord Activity examples without checking the current documentation.

---

# 9. Discord Developer Application

The branch should include whatever configuration is necessary for a Discord developer application.

Document:

* application ID
* Activity configuration
* URL/domain configuration
* required SDK setup
* local development requirements
* public deployment requirements
* testing workflow

Do not commit secrets.

Secrets and environment-specific values must be handled through environment variables.

---

# 10. Activity Launch Experience

Target experience:

```text
User is in Discord voice channel
        ↓
Opens App Launcher / Activity
        ↓
Selects SuitMatch
        ↓
SuitMatch opens inside Discord
```

The Activity should immediately identify the current Discord user when supported by the SDK.

The user should not have to manually type their Discord username.

---

# 11. Participant Identity

The existing app currently generates a local anonymous user ID.

For the Discord Activity:

Prefer using the Discord-provided participant identity when the SDK allows it.

Conceptually:

```text id="5s2m4q"
Discord user identity
        ↓
SuitMatch participant
```

Keep a fallback local identifier if necessary.

Do not build full SuitMatch accounts as part of this feature.

---

# 12. Room / Session Mapping

Current web app:

```text
/7K4P
```

Discord Activity:

```text
Discord Activity instance
        ↓
shared SuitMatch session
```

The exact mapping should be designed after inspecting Discord's current Activity instance model.

Potentially:

```text
Discord instanceId
        ↓
SuitMatch room key
```

The implementation should avoid collisions and should not expose sensitive Discord information unnecessarily.

---

# 13. Existing Cloudflare Backend

The existing Cloudflare Worker + Durable Object architecture should remain the realtime backend unless there is a compelling reason to change it.

Desired model:

```text
Discord Activity clients
        ↓
lib/realtime
        ↓
Cloudflare Worker
        ↓
Durable Object
        ↓
shared SuitMatch state
```

This avoids creating two different realtime systems.

---

# 14. Privacy Requirement

Maintain the existing privacy guarantee.

Raw suit photos must remain on the user's device.

Do not send raw photos to:

* Discord
* Vercel
* Cloudflare
* an AI API
* any external image-processing service

The Activity should continue to process photos locally.

Only the small measurement payload should enter the realtime layer.

---

# 15. Camera / Photo Capture

This is the highest-risk area.

The current standalone app uses mobile photo capture.

The Activity must determine whether this works correctly when the app is embedded in Discord.

Test:

* iPhone
* iOS Safari / Discord mobile environment
* Android
* desktop Discord

Specifically verify whether the Activity can:

* open the camera
* invoke the photo picker
* access a selected image
* decode the image
* run Canvas/OffscreenCanvas processing
* complete the existing analysis pipeline

Do not assume browser behavior inside Discord is identical to Safari/Chrome.

---

# 16. Mobile Activity Support

Discord Activities support multiple platforms, but actual behavior must be verified for the SuitMatch use case.

Create a compatibility matrix:

| Environment     | Activity loads | Photo capture | Photo library | Color analysis | Realtime |
| --------------- | -------------- | ------------- | ------------- | -------------- | -------- |
| Desktop Discord | ?              | ?             | ?             | ?              | ?        |
| Discord Web     | ?              | ?             | ?             | ?              | ?        |
| iPhone Discord  | ?              | ?             | ?             | ?              | ?        |
| Android Discord | ?              | ?             | ?             | ?              | ?        |

Do not mark an environment supported merely because Discord theoretically supports Activities there.

SuitMatch requires working image capture/selection.

---

# 17. Activity UI

The Activity should feel like the existing SuitMatch application, but optimized for the embedded Discord viewport.

Target initial screen:

```text id="m2q3p7"
┌─────────────────────────────┐
│        SUITMATCH             │
│                             │
│  Discord group: 5 people   │
│                             │
│  Rich          REFERENCE   │
│  Mike          Waiting     │
│  James         Waiting     │
│  Chris         Waiting     │
│                             │
│     [ SCAN YOUR SUIT ]      │
└─────────────────────────────┘
```

Do not redesign the entire product solely for Discord.

Reuse existing components where practical.

---

# 18. Discord-Specific Lobby

When the Activity launches, show:

* current participants
* who is connected
* who has scanned
* who is the reference
* scan status

Potential:

```text id="e5r35v"
WEDDING SUIT CHECK

Rich       👔 Reference
Mike       ✓ Scanned
James      📷 Ready
Chris      ⏳ Waiting
```

The lobby should update in real time.

---

# 19. Reference User

Preserve current behavior.

Possible behavior:

* first participant becomes reference
* current reference is displayed
* participant can choose "Make me reference"

Discord identity should make this easier to understand because real Discord display names can be shown.

Do not require a separate SuitMatch display name unless the user wants to customize it.

---

# 20. Activity-Specific Deep Link / Fallback

Users may still access the standalone web version.

The application should distinguish:

```text
Standalone web
```

from:

```text
Discord Activity
```

Potential architecture:

```text
Same core SuitMatch application
        |
        +── normal web entry
        |
        +── Discord Activity entry
```

If someone accesses an Activity-specific URL outside Discord, show a useful fallback rather than a broken application.

For example:

> Open SuitMatch from Discord to join this Activity.

Do not make the standalone website dependent on Discord.

---

# 21. Existing Web App Must Remain Working

After merging the Discord branch, all existing behavior must remain intact:

* `/`
* `/[room]`
* normal room codes
* mobile photo capture
* manual jacket selection
* local analysis
* Vercel deployment
* Cloudflare realtime
* non-Discord usage

The Discord feature must be additive.

---

# 22. Branching Strategy

Implement this work on a dedicated branch.

Suggested:

```bash
git checkout -b feature/discord-activity
```

Do not directly modify `main` during initial development.

Commit changes in coherent stages.

Potential commit structure:

```text
feat: add discord activity bootstrap
feat: add discord identity adapter
feat: map activity sessions to suitmatch rooms
feat: integrate activity lobby
feat: verify activity photo capture
test: add discord activity integration coverage
```

Exact commits are up to the developer.

---

# 23. Development Strategy

Do not start by rewriting the existing application.

First create a minimal proof of concept:

```text
Discord
  ↓
SuitMatch Activity
  ↓
"Hello, Rich"
```

Then:

```text
Discord Activity
  ↓
identify participant
  ↓
join shared session
```

Then:

```text
Activity
  ↓
take/select photo
  ↓
existing color engine
```

Then:

```text
Activity
  ↓
publish Measurement
  ↓
Cloudflare room
  ↓
group results
```

This isolates the largest unknowns.

---

# 24. Testing Priorities

Test in this order:

## Test 1 — Activity launch

Can the Activity launch in a Discord voice channel?

## Test 2 — Identity

Can the Activity reliably identify the participant?

## Test 3 — Shared session

Can two Discord users launch the same Activity instance and see one another?

## Test 4 — Photo

Can a participant take or select a photo?

## Test 5 — Local analysis

Can the existing SuitMatch color engine analyze that photo inside the Activity?

## Test 6 — Realtime

Can a measurement reach the existing Cloudflare room?

## Test 7 — Full experience

Can 3–5 people complete a suit check entirely inside Discord?

---

# 25. Failure Strategy

If Discord's embedded environment prevents reliable camera/photo functionality, **do not redesign the core SuitMatch product around a workaround immediately**.

Instead, investigate a graceful fallback.

Possible fallback:

```text
Discord Activity
      ↓
"Scan on your phone"
      ↓
Open secure SuitMatch web URL
      ↓
Return to Activity
```

However, this should only be implemented if necessary.

The ideal experience remains an Activity that can perform the scan directly.

---

# 26. Performance

The existing color engine is intentionally client-side.

Maintain that architecture in the Activity.

The Activity should:

* avoid uploading images
* bound image processing resolution
* avoid unnecessary model dependencies
* avoid large SDK bundles where possible
* keep photo analysis responsive on phones

Do not add ML models merely to make the Activity feel more sophisticated.

---

# 27. Security

Do not trust client-provided Discord identity blindly for authorization.

Use the official Discord SDK/API mechanisms appropriate to the current Activity architecture.

Do not expose:

* client secrets
* bot tokens
* OAuth secrets
* Cloudflare secrets

to client-side JavaScript.

The measurement payload is non-sensitive application data, but validate it server-side before accepting it into room state.

---

# 28. Analytics

Do not add a third-party analytics platform for the MVP unless necessary.

It is enough to log development/debugging information locally.

Potential future metrics:

* Activity launch count
* scan completion rate
* photo failure rate
* average confidence
* room size

These should be considered only after the core Activity works.

---

# 29. Scope — In

This branch should include:

* Discord Activity bootstrap
* Discord SDK integration
* participant identity
* Activity/session mapping
* reuse of existing SuitMatch UI
* reuse of existing color engine
* reuse of existing Cloudflare realtime system
* Activity-specific lobby where necessary
* documentation
* compatibility testing

---

# 30. Scope — Out

Do not add:

* Discord bot commands unless required for Activity launch
* Discord OAuth account system
* permanent Discord-linked SuitMatch accounts
* payments
* social profiles
* photo storage
* AI APIs
* ML segmentation
* live camera streaming
* video processing
* full outfit/style classification
* new scoring science

Those remain separate future work.

---

# 31. Acceptance Criteria

The Discord Activity branch is successful if:

1. SuitMatch can be launched as a Discord Activity.
2. At least two Discord users can join the same Activity session.
3. Their identities can be displayed meaningfully.
4. The Activity can connect participants to the same SuitMatch realtime room.
5. At least one supported mobile/desktop environment can successfully select or capture a suit photo.
6. The existing color analysis runs entirely client-side.
7. No raw image is sent to Discord, Vercel, or Cloudflare.
8. Measurement data reaches the shared room.
9. Participants can see one another's results.
10. Reference-user behavior works.
11. The existing standalone SuitMatch website continues to work.
12. The implementation remains isolated enough that Discord-specific code can be removed without rewriting the core color engine.

---

# 32. Deliverables

At the end of the branch, provide:

### Code

Working Discord Activity implementation.

### Documentation

Update the README with:

* Discord Developer Portal setup
* local development
* Activity configuration
* environment variables
* deployment
* testing instructions

### Compatibility report

Document actual test results for:

* Discord desktop
* Discord web
* iPhone
* Android

For each, explicitly state:

* Activity launch
* identity
* photo capture
* photo selection
* image processing
* realtime
* known issues

### Deployment information

Document:

* Activity URL
* Vercel URL
* Cloudflare Worker URL
* required environment variables

Do not commit secrets.

---

# 33. Claude Code Instructions

Implement this as a **separate branch** from the currently working SuitMatch application.

Before coding:

1. Inspect the current repository and existing architecture.
2. Read `TECH_SPEC.md`.
3. Inspect how the current realtime abstraction works.
4. Research the current official Discord Embedded App SDK and Activities documentation.
5. Verify the current Discord Activity development/deployment requirements.
6. Specifically investigate camera/photo-picker behavior inside Discord Activities on mobile.
7. Identify concrete blockers or compatibility issues.
8. Make the smallest architectural changes necessary.

Do not rewrite working SuitMatch functionality.

Prioritize a thin integration layer.

The existing color engine is proven application code and should be reused rather than duplicated.

The existing Cloudflare room system should remain the shared realtime backend unless a concrete Discord constraint requires otherwise.

---

# 34. Recommended Implementation Order

### Phase 1

Discord developer application + minimal Activity boot.

### Phase 2

Discord participant identity.

### Phase 3

Shared Activity/session mapping.

### Phase 4

Integrate existing SuitMatch lobby/results.

### Phase 5

Test camera/photo selection inside Activity.

### Phase 6

Connect existing color analysis.

### Phase 7

Connect existing Cloudflare realtime room.

### Phase 8

Full 2–5 person test.

### Phase 9

Polish and documentation.

---

# 35. Guiding Principle

Do not build a separate SuitMatch product for Discord.

Build:

> **SuitMatch, with Discord as a first-class launch environment.**

The core intellectual property and product logic remains:

```text
Photo
 ↓
Jacket region
 ↓
Color extraction
 ↓
Lab
 ↓
CIEDE2000
 ↓
Confidence
 ↓
Match
```

Discord should primarily provide:

```text
Launch context
+
Participant identity
+
Shared Activity session
```

The ideal final experience is:

> **You're already on a Discord call with your friends. Someone launches SuitMatch. Everyone joins automatically, takes a photo, and within seconds the call knows whose navy suit actually matches the group.**

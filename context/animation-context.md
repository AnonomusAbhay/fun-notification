# Animation Engine & Themes Context

This document captures the design details, configurations, animations, and verification workflows for the realtime animated notification engine.

## Overview
The animation engine utilizes **GreenSock Animation Platform (GSAP)** to render highly interactive, performant, and fluid notification visuals inside a transparent full-screen Electron overlay window. It supports two execution environments:
1. **Electron Mode**: Fetches notification payloads from the Electron main process via bridged IPC, plays the visual theme, and tells the main process to close the overlay window on complete.
2. **Standalone Browser Mode**: Reads URL query parameters (`?theme=airplane&msg=Hello`) for fast, local UI/UX testing and tweaking.

## Completed Themes
- **`airplane`**: A blue-sky gradient jet flying from left to right across the screen with a waving text banner.
  - *Micro-animations*: Propeller spinning via high-frequency scale yoyo; fuselage bobbing up and down.
  - *Sound Feedback*: Propeller engine hum sweep (sawtooth osc 45Hz -> 180Hz) followed by two arpeggiated bells (C5/E5).
  - *Aesthetic*: Blue-sky gradient, tail fin, wings, and drop shadow.
- **`cat`**: An orange-gradient cat running from right to left across the bottom of the screen with a pulsing dialog balloon.
  - *Micro-animations*: Rapid body bobbing; wiggling legs (four independent rotation timelines); tail wagging.
  - *Sound Feedback*: Synthesized kitty "mew" sound using triangle frequency pitch-sweep (580Hz -> 850Hz -> 620Hz).
  - *Aesthetic*: Dark glassmorphism speech bubble with rounded corners and glowing border.
- **`meme`**: A center-positioned premium card that scale-bounces in, holds, and slides up while fading out.
  - *Micro-animations*: Overshoot bounce effect using `back.out` ease; random sender emoji mapped from hash; float-away fade.
  - *Sound Feedback*: Premium arpeggiated glass chime (sine osc major 7th chord E4-G4-C5-E5) with reverb decay.
  - *Aesthetic*: Glassmorphism panel (blur 24px, 80% dark background, subtle white border, Outfit/Playfair typography).

## Core Architecture & Files
- **HTML Container**: [overlay.html](file:///e:/worksspaces/fun-notofication/apps/electron/overlay.html)
- **Javascript Controller**: [overlay.js](file:///e:/worksspaces/fun-notofication/apps/electron/overlay.js)
- **Config package**: `@fun-notification/theme-engine` ([index.ts](file:///e:/worksspaces/fun-notofication/packages/theme-engine/src/index.ts))

## Verification Workflows
You can test the visual behavior instantly inside a browser:
- **Airplane theme**: `overlay.html?theme=airplane&msg=Welcome+to+the+system!`
- **Cat theme**: `overlay.html?theme=cat&msg=Meow!+Everything+looks+great.&sender=NekoChan`
- **Meme theme**: `overlay.html?theme=meme&msg=This+is+a+premium+glassmorphism+alert.&sender=Antigravity`

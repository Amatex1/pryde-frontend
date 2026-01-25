This is the contract. Once this exists, Messages stops being “a thing we tweak”.

PRYDE — Messages UI Lock (v1)

Status: LOCKED
Effective Phase: Post Phase 1.4
Scope: Direct Messages (1-on-1)

🎯 Design Intent

Messages must feel:

calm

private

focused

emotionally safe

structurally predictable

No novelty UI. No feed-like experimentation. No nested scroll chaos.

🧱 Structural Invariants (Must Never Change)
✅ Three-Column Desktop Model
| Chat List | Conversation | Person Info |


Column 1: Conversation discovery

Column 2: Emotional focus (messages)

Column 3: Context, safety, control

❌ Never collapse to 2 columns on desktop
❌ Never center messages in a floating card
❌ Never reintroduce app-shell scroll traps

✅ ONE SCROLL LAW (Critical)

Only the browser scrolls

No nested overflow-y: auto inside the conversation

No independent scroll containers for messages

Allowed internal scroll:

Chat list (Column 1)

Person info panel (Column 3, only if needed)

✅ Composer Visibility Guarantee

Message composer is always visible

Uses position: sticky; bottom: 0

Never requires scrolling to reach

Grows vertically with text input

Never hidden behind overlays

🎨 Visual Rules
Color

No purple backgrounds in Messages body

Neutral surfaces only

Purple limited to:

buttons

accents

focus states

Layout

Conversation column max-width: ~720px

Messages centered horizontally

Natural vertical flow

📱 Responsive Behavior (Locked)
Desktop (≥1200px)

All 3 columns visible

Tablet (768–1199px)

Column 3 hidden

Accessible via ℹ️ button (slide-over panel)

Mobile (≤767px)

Single column (conversation)

Chat list behind back button

Person info behind ℹ️ button

Composer fixed at bottom

🛡️ Safety & Control Guarantees

Person Info Panel must always include:

Block user

Report conversation

Shared media access

Chat search

These actions must never be buried or removed.

🚫 Explicitly Forbidden Changes

❌ Nested message scroll containers

❌ Floating message cards

❌ Auto-hiding composer

❌ Infinite UI tweaks “just to try”

❌ Reintroducing app-shell behavior

This document freezes Messages UI v1.
Future changes require a new versioned document.
---
id: choice_paperboy_fate
type: vn_choice
phase: onboarding
status: active
tags:
  - type/vn_choice
  - case/case01
---

# Choice: Paperboy Fate

## Narrative

Fritz waits for your ruling while the boy twists in your grip.

## Choices

1. Show mercy and let him run.
   - Sets `flag_paperboy_mercy` = true
   - Next: [[choice_set_priority]]
2. Hand him over to Fritz.
   - Sets `flag_paperboy_reported` = true
   - Next: [[choice_set_priority]]

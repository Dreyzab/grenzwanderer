---
id: scene_case01_post_route_exit
type: vn_scene
status: active
---

# A Route, Not A Mastermind

## Script

The carriage is guilty of being useful. Weber is guilty of obeying a document
that made fear look like duty. The useful part is the shape of the order:
someone knew civilian routes, old military seals, and how to make a private
contractor move without asking whether the cargo had a soul.

```vn-logic
terminal: true
on_enter:
  - set_flag(false_trail_post_route_complete,true)
  - grant_xp(15)
choices: []
```

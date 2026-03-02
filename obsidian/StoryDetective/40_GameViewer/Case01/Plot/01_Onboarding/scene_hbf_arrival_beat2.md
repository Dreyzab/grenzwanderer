---
id: scene_hbf_arrival_beat2
parent: scene_hbf_arrival
type: vn_beat
order: 2
tags:
  - type/vn_beat
  - case/case01
---

# Beat 2: Spotting Contact

## VN Script

**Passive Perception (DC 7)**

- Success: You identify Fritz early in the moving crowd.
- Failure: You only see crowd noise and must locate him through action.

After the check, the station pressure remains high and the player must decide how to proceed.

## Branching Choice

- [[scene_hbf_arrival_ch1|Walk to him directly]] -> direct bridge to Fritz intro.
- [[scene_hbf_arrival_ch2|Look around the station first]] -> station investigation branch.

## Branch Notes

- Direct branch flows to [[scene_meet_fritz_direct]] and then to [[choice_set_priority]].
- Investigate branch flows to [[action_investigate_station]].
  `Glance headline` inside that node goes to [[scene_paperboy_theft]] -> [[choice_paperboy_fate]] -> [[choice_set_priority]].

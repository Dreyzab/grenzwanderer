---
id: scene_{id}
aliases: []
tags:
  - type/scene
  - status/draft
---

# 🎬 [[Scene Title]]

## ⚙️ Config

- **Parent Scenario**: [[scn_01_case_intro]]
- **Location**: [[loc_bank_interior]]
- **Visual Clues**:
  - _Опиши то, что игрок видит ДО текста (кровь на ковре, разбитое стекло)._
- **Mood / Atmosphere**:
  - _Запахи, звуки, ощущение тревоги. (Место для поэтики)._

## 🎭 Characters

- [[char_detective]]
- [[char_npc_name]] (Mood: _Anxious_)

## 🧶 The Knot (Investigation)

### 🧠 Logic Leads (Information)

- **Truth**: Улика X противоречит показаниям Y.
- **Red Herring**: Ложная улика Z, которая ведет в тупик.

### 📜 Script Flow

#### Beat 1: The Hook

_Описание того, что происходит в начале._

#### Beat 2: Interactive Choices

> [!question] Choice: "Как надавить на свидетеля?"
>
> - **Authority (Hard)**: "Я здесь закон!" → [[#Branch A: Authority]]
> - **Empathy (Medium)**: "Вам, должно быть, страшно..." → [[#Branch B: Empathy]]

#### Branch A: Authority

_Игрок давит авторитетом. Голос [[Voice_Authority]] одобряет._

## 🔓 Changes State

- Add Flag: `flag_witness_cooperated`
- Unlock Note: [[note_bank_ledger]]

---
id: node_hub_agency_bathtub
aliases:
  - Node: Hub Agency Bathtub
  - Scene: Prologue Awakening
tags:
  - type/node
  - status/active
  - layer/vn
  - phase/hub
  - loop/recovery
---

# Node: Hub Agency Bathtub

## Trigger Source

- Route: `/vn/hub_agency_bathtub`
- Source node: 
  - Начало игры (New Game Trigger).
  - Возврат после критических провалов дел (Death / Soft Fail reset).
  - Добровольный запуск через хаб агентства.
- Scenario anchors:
  - `apps/web/src/entities/visual-novel/scenarios/detective/hub/bathtub/hub_bathtub.logic.ts`

## Preconditions

- Required flags: none (этот хаб всегда доступен, но меняет контент в зависимости от флагов).
- Required quest stage: none.
- Влияющие факторы:
  - `stress_level` > 70 активирует особые (мрачные) диалоги Парламента.
  - `mafia_debt_incurred` == true открывает ветку "Кровавая вода".

## Named Cast

- [[30_World_Intel/Characters/char_inspector|char_inspector]] - физически в ванне, ментально на грани.
- Внутренний Парламент - здесь они предстают не просто голосами, а физическими ощущениями (холод по коже, тяжесть в груди).
- Оккультная Тень (Опционально) - проявляется только при высоких значениях восприятия/мистики.

## Designer View

- Player intent: Отдохнуть, сбросить стресс, осмыслить улики или столкнуться с последствиями своих грехов (лудомания/долги).
- Dramatic function: **Разрыв вуали (Veil Tear)**. Игрок должен понять, что с Инспектором что-то фундаментально не так. Ванна символизирует очищение, но вода всегда грязная (нарративно или буквально).
- Emotional tone: Калаустрофобия, транс, паранойя, интроспекция.
- Stakes: Восстановление ментального здоровья в обмен на уступки Внутреннему Парламенту (например, пообещать снова сыграть в кости/рискнуть в следующем деле).

## Mechanics View

- Node type: Repeating Hub / Recovery Point.
- Core branches:
  - `wash_face` (смыть стресс, базовая проверка выдержки).
  - `listen_to_water` (погрузиться в транс для связи с Оккультным слоем).
  - `check_wounds` (оценить последствия прошлого дела).
- Skill checks:
  - Check id: `chk_bathtub_volition_grip`
    - Voice id: `volition`
    - Difficulty: 8 (растет с каждым долгом мафии).
    - On pass: Сброс 30% стресса, получение 1 Fate Token.
    - On fail: Инспектору не удается собраться. Усиление голоса зависимости (`recklessness` / `addiction`).
  - Check id: `chk_bathtub_occult_vision`
    - Voice id: `occultism`
    - Difficulty: 10
    - On pass: Получение скрытого тизера к текущему делу (`ev_occult_whisper`).
- Resources (Gambling mechanic):
  - Игрок может "поставить на кон" очки стресса в надежде получить Fate Token у своего внутреннего демона.

## State Delta

- Flags set:
  - `prologue_bathtub_seen` (при первом посещении).
  - `stress_reduced`
  - `occult_vision_granted` (при успешном броске).
- Resources:
  - Сброс `stress` (зависит от проверок).
  - Получение +1 Fate Token (если прокнул Volition).
- Relationship deltas:
  - Влияние на баланс Внутреннего Парламента (какие голоса доминируют после выхода из хаба).

## Transitions

- Exit: Возврат в основную директорию агентства -> [[10_Narrative/Scenes/node_hub_agency_office|Node: Hub Agency Office]].
- Fast Travel: Если дело запущено, прыжок к активному маркеру на карте.

## Validation

- Confirm: Уровень стресса всегда должен падать, но цена этого падения может быть социальной (рост лудомании).
- Confirm: Ванна должна корректно отрабатывать как стартовая точка для новой игры (пролог), так и как перевалочный пункт.

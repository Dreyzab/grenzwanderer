# Структура `spacetimedb/src/reducers/helpers/`

Редьюсеры подключают публичный API через [`../reducers/helpers.ts`](../spacetimedb/src/reducers/helpers.ts). Типы VN/карты/социума — из [`src/shared/vn-contract`](../../src/shared/vn-contract) и [`helpers/types.ts`](../spacetimedb/src/reducers/helpers/types.ts); рантайм в `auth.ts`, `idempotency.ts`, `content_migration.ts`, `mind_*.ts`, `mindpalace.ts`, `player_progression.ts`, `effects.ts`.

| Модуль | Назначение |

|--------|------------|

| `types.ts` | Локальные типы редьюсеров (`CommandPhase`, `HypothesisReadiness`, алиасы карты из `vn-contract`) |

| `payload_json.ts` | JSON-хелперы (`asRecord`, `isVnEffect`, парсинг required facts/vars/rewards) |

| `entity_keys.ts` / `keys.ts` | Стабильные ключи сущностей и флагов |

| `player_progression.ts` | Прогрессия игрока, флаги, отношения, карьера агентства, слухи |

| `vn_rules.ts` | Условия/кубики VN (`rollD20`, `isChoice*`, …) |

| `map_runtime.ts` | События карты, TTL, `spawnMapEventInternal` |

| `command_runtime.ts` | Сессии командного режима |

| `command_resolve.ts` | `resolveCommandInternal` (разрыв цикла `command_runtime` ↔ `effects`; `discover_fact` — через `mind_discover`) |

| `battle_runtime.ts` | Бой: сессия, карты, исход (`applyEffects` для outcome — из `effects.ts`) |

| `effects.ts` | `applyEffects` и связанные побочные эффекты VN |

**Импорты «вниз»:** `effects` импортирует `discoverFactInternal` из `mind_discover.ts`; `command_resolve` импортирует `command_runtime`, `command_scenarios`, `effects`, `telemetry`.

Валидация полезной нагрузки снапшота для публикации контента делается на стороне shared-контракта/пайплайна; отдельного дубля `snapshot_payload_validate` в репозитории нет.

Тесты: `npx vitest run spacetimedb/src/reducers/helpers/`.

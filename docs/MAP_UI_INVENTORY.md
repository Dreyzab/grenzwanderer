# Map UI Inventory & Extraction Plan

> Status: **черновик / inventory snapshot**, дата заметки — 2026-05-14. Документ описывает текущее состояние UI карты (Mapbox-уровень и React-overlay), отдельно от глобальной системы (см. [DESIGN_SYSTEM_INVENTORY.md](./DESIGN_SYSTEM_INVENTORY.md)). Никаких прод-изменений эта запись не вносит.
> Зона охвата: `src/features/map/` (UI/CSS/hooks, насколько хуки определяют визуальный контракт); связанные ассеты — `public/images/ui/markers/*`. Backend, content-pipeline, генераторы — вне зоны.

## 0. Краткий итог

Карта — **самодостаточная под-система** с собственной палитрой, своим CSS-словарём (`gw-map-*` + `gw-compass-*`) и своим набором UI-примитивов. С глобальной системой пересекается **только через шрифтовые токены** (`--font-mono`, `--font-serif`) и Lucide-иконки. Цветовая палитра `--color-primary` глобальной системы здесь **не используется** ни разу — карта говорит на своём «амбер на тёмно-сером» (`#d3b27a / #d9a743 / #f2d088 / #f5e9ca`).

Главные проблемы:

1. **Два независимых компаса** в коде. `CompassOverlay.tsx` использует `gw-compass-*` ([CompassOverlay.css](../src/features/map/ui/CompassOverlay.css)); параллельно в [mapExperience.css:286-424](../src/features/map/ui/mapExperience.css#L286) лежит **138 строк мёртвого CSS** под `gw-map-compass*` — этот словарь не используется ни одним компонентом.
2. **Гибридная стилизация в крупных компонентах**: [CaseCard.tsx](../src/features/map/ui/CaseCard.tsx) и [DetectiveHub.tsx](../src/features/map/ui/DetectiveHub.tsx) — по **58 inline `style={{…}}` блоков каждый**, при этом «внешний скелет» подтягивается через классы (`gw-map-modal`, `gw-map-panel`, `gw-map-panel__frame`). [DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx) — то же самое: 4 root-класса + полностью inline-стиль каждого слоя marker'а.
3. **Параллельная модальная система**: `gw-map-modal` + `gw-map-panel` живёт независимо от `ConfirmationModal` ([src/shared/ui/ConfirmationModal.tsx](../src/shared/ui/ConfirmationModal.tsx)). Z-index `60` против `70`, отдельный backdrop-blur, отдельный animation.
4. **PinVisualState палитра** — пятая независимая color-vocabulary (`locked / discovered / visited / completed`), не связанная ни с tone-палитрами `MetricBox`, ни со `STANCE_PALETTE`, ни с `.status-line.*`.

---

## 1. Слои оформления карты — инвентарь

### 1.1 [mapExperience.css](../src/features/map/ui/mapExperience.css) — основной CSS-словарь

875 строк, 80+ class-роутов под префиксом `gw-map-*`. BEM-подобная структура (`__element` / `--modifier` / `[data-…]` атрибуты). Импортируется из [MapView.tsx](../src/features/map/ui/MapView.tsx#L19).

Палитра (вытащено из тел селекторов):

| Назначение                     | Значение                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Background base                | `#07090c`, `rgba(20, 16, 12, 0.68)` / `rgba(20, 16, 12, 0.82)` (chrome-обёртки)                   |
| Background tinted              | radial-gradients `rgba(184, 139, 70, 0.18)` (тёплый), `rgba(60, 129, 152, 0.16)` (холодный)       |
| Foreground / text              | `#f5e9ca`, `#f8eed7`, `#fff4d9` (3 оттенка кремового), `rgba(248, 238, 215, 0.62-0.86)` для muted |
| Accent (амбер)                 | `#d3b27a`, `#d9a743`, `#f2d088`, `rgba(242, 208, 136, 0.42)`                                      |
| Search/positive (зелёный)      | `#69c1a3` + `rgba(105, 193, 163, ...)`                                                            |
| Border outline                 | `rgba(255, 245, 214, 0.10-0.22)`, `rgba(229, 210, 170, 0.16-0.42)`                                |
| Pin completed stamp (бордовый) | `rgba(158, 32, 32, 0.88)`                                                                         |

Внутренние CSS-переменные на pin-уровне (объявляются в TSX через `style={{ '--gw-map-pin-…' }}`):

| Переменная            | Откуда                                                                     | Назначение                                                                                                      |
| --------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--gw-map-pin-accent` | [DetectiveMapPin.tsx:117](../src/features/map/ui/DetectiveMapPin.tsx#L117) | accent цвет marker'а в текущем state                                                                            |
| `--gw-map-pin-glow`   | то же                                                                      | glow filter для zoomed-out drop-shadow ([mapExperience.css:556](../src/features/map/ui/mapExperience.css#L556)) |
| `--gw-map-pin-focus`  | то же                                                                      | focus-ring цвет                                                                                                 |
| `--gw-map-pin-center` | то же                                                                      | offset auras/rings по вертикали (2rem для photo, 1.7rem для svg)                                                |

### 1.2 [CompassOverlay.css](../src/features/map/ui/CompassOverlay.css) — отдельный compass-словарь

107 строк, префикс `gw-compass-*`. Импортируется только из [CompassOverlay.tsx:2](../src/features/map/ui/CompassOverlay.tsx#L2).

Геометрия: круглый компас 120×120px (vs прямоугольная dial-card 5.3rem×Xrem в мёртвом `gw-map-compass`). Стрелка — `border-left / border-right / border-bottom` CSS-треугольник, не SVG. Поведение `gw-compass-pulse` — keyframe `compass-pulse` 2s infinite cubic-bezier для search-zone.

**Тут другая палитра** — амбер ближе к насыщенному (`#d3b27a`, `#d9a743`, `#e55c5c` для North-mark), причём оттенки **не совпадают** с теми, что в `mapExperience.css`. Это второй амбер в карте.

### 1.3 Inline-styles в TSX (тёмная половина системы)

Три файла стилизуют почти весь свой контент через `style={{...}}`:

| Файл                                                              |                                 Inline blocks | Что покрывает inline                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------ |
| [CaseCard.tsx](../src/features/map/ui/CaseCard.tsx)               |                                            58 | Внутренности modal: cabinet-tabs, action-buttons, list-items, status-pills, дата/время, dossier-fields. Полностью обходит CSS. |
| [DetectiveHub.tsx](../src/features/map/ui/DetectiveHub.tsx)       |                                            58 | Внутренности hub-modal: 3 tab-панели (briefing / inventory / partners), inventory-cards, trust-bands, agency-standing          |
| [DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx) | ~10 крупных + объявляет `--gw-map-pin-*` vars | Aura/focus-ring/objective-ring/marker/stamp/tooltip — каждый слой inline-style                                                 |

Скелет (`gw-map-modal / gw-map-panel / gw-map-panel__frame`) и буквально 1-2 utility-класса (`gw-map-button-row`, `gw-map-tabs`) — это **весь** CSS-вклад в эти модалки. Остальное — в TSX.

### 1.4 PinVisualState палитра (в TSX)

Из [DetectiveMapPin.tsx:19-46](../src/features/map/ui/DetectiveMapPin.tsx#L19):

```ts
const stateStyles = {
  locked: {
    accent: "#8a97aa",
    glow: "rgba(92, 104, 120, 0.42)",
    focus: "rgba(100, 116, 139, 0.22)",
    label: "Locked",
  },
  discovered: {
    accent: "#d9a743",
    glow: "rgba(217, 167, 67, 0.42)",
    focus: "rgba(190, 135, 42, 0.18)",
    label: "Discovered",
  },
  visited: {
    accent: "#6cc36b",
    glow: "rgba(108, 195, 107, 0.4)",
    focus: "rgba(53, 123, 58, 0.18)",
    label: "Visited",
  },
  completed: {
    accent: "#59b4de",
    glow: "rgba(89, 180, 222, 0.42)",
    focus: "rgba(33, 108, 151, 0.18)",
    label: "Completed",
  },
};
```

Четыре tone-семейства (slate / amber / green / blue) **локальные**, не вытащены из глобальной системы, не пересекаются ни с tone-палитрой `MetricBox`, ни со `STANCE_PALETTE`, ни с `.status-line.*` (см. `DESIGN_SYSTEM_INVENTORY.md` §3.3).

### 1.5 Mapbox CSS (внешний)

```ts
import "mapbox-gl/dist/mapbox-gl.css"; // MapView.tsx:18
```

Стиль карты задан через `MAPBOX_STYLE` ([config.ts](../src/config.ts)) — это URL на Mapbox style spec, **никаких локальных overrides** к нему в проекте нет. Layer-визуализация дорог/зданий — на стороне Mapbox tileset, не в нашем CSS.

### 1.6 Ассеты карты

Графика pin'ов: [public/images/ui/markers/marker\_\*.webp](../public/images/ui/markers/) (`marker_gargoyle`, `marker_mosaic_anvil`, `marker_wax_seal`, `marker_inkblot`). Резолвинг — `resolveMarkerVisual` в [DetectiveMapPin.tsx:55-84](../src/features/map/ui/DetectiveMapPin.tsx#L55).

SVG-иконки для zoomed-out режима — в [MapPinIcons.tsx](../src/features/map/ui/MapPinIcons.tsx): `HubIcon` / `QuestIcon` / `OccultIcon` / `LandmarkIcon` / `GenericIcon`. Полностью inline SVG, без обёрток.

---

## 2. Компонентная архитектура

```
MapView (1499 строк, orchestrator)
├── MapGL (react-map-gl/mapbox wrapper)
│   ├── Source + Layer (route lines, region polygons)
│   ├── NavigationControl (Mapbox-нативный zoom)
│   └── Marker
│       ├── DetectiveMapPin (per-point, 4 layered spans)
│       └── PlayerAvatarPin (pulse+body+core)
├── Header overlays (.gw-map-header)
│   ├── Compact card (.gw-map-compact-card)
│   │   └── Toggle pill + summary-pills row + state-pills row
│   ├── Ledger drawer (.gw-map-ledger-drawer)
│   │   └── Toggle + frame + ledger-grid + status-pill
│   └── Selection note / inline note / legend
├── Compass overlay (CompassOverlay → .gw-compass-container)
├── Journey controls (.gw-map-journey-controls)
│   └── Кнопки start/stop/pause/report + status pill
├── CaseCard modal (.gw-map-modal + .gw-map-panel)
│   └── 58 inline-style блоков (dossier / actions / tabs)
├── DetectiveHub modal (.gw-map-modal + .gw-map-panel)
│   └── .gw-map-tabs (3 кнопки) + 58 inline-style блоков
└── JourneyReportModal (.gw-map-modal + .gw-map-journey-report)
    └── stats grid + discoveries list
```

[MapView.tsx](../src/features/map/ui/MapView.tsx) сам по себе содержит:

- состояние drawer'а / compact-card collapsed
- журнал-журнал journey (`useMapJourney`)
- runtime points / regions (`useMapRuntimeState`)
- composite/ephemeral state (`useMapCompositeState`, `useMapEphemeralState`)
- player location (`usePlayerLocation`)
- режим (mobile/desktop) — отдельный layout `.gw-map-header--compact / --desktop`

---

## 3. Классификация UI-паттернов (8 бакетов)

### 3.1 Map shell + frame

| Класс                                           | Где                                                                    | Поведение                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `.gw-map-shell`, `.gw-map-shell--fallback`      | [mapExperience.css:1](../src/features/map/ui/mapExperience.css#L1)     | Top-level контейнер. Радиальные градиенты + `#07090c` фон, `min-height: calc(100dvh - safe-area-inset-bottom - 4rem)` |
| `.gw-map-frame`                                 | [mapExperience.css:190](../src/features/map/ui/mapExperience.css#L190) | Прямоугольник под Mapbox-канвас, `position: relative` + `overflow: hidden`                                            |
| `.gw-map-empty-state` (`--loading` модификатор) | [mapExperience.css:181](../src/features/map/ui/mapExperience.css#L181) | Fallback при отсутствии данных карты, fade-up + pulse                                                                 |

### 3.2 Overlays (compass, legend, notes, journey controls)

| Слой                                             | Position                                        | Z-index | Назначение                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------- | ------: | ----------------------------------------------------------------------------------------------------------------- |
| `.gw-map-header`                                 | `absolute top: 1rem; left: 1rem`                |       5 | Compact-card + ledger-drawer контейнер                                                                            |
| `.gw-map-inline-note`, `.gw-map-selection-note`  | `absolute bottom`, `left: 1rem`                 |       5 | Информационные подсказки игроку (текущая локация, выбор pin'а)                                                    |
| `.gw-map-legend`                                 | `absolute bottom-right`                         |       5 | Легенда state-кружочков                                                                                           |
| `.gw-map-journey-controls`                       | `absolute bottom-left` (mobile: `bottom-right`) |       6 | Кнопки управления journey                                                                                         |
| `.gw-map-compass` _(мёртвый)_                    | `absolute top right`                            |       6 | **Не рендерится никем** — только CSS в [mapExperience.css:286-424](../src/features/map/ui/mapExperience.css#L286) |
| `.gw-compass-container` (через `CompassOverlay`) | `absolute top: 2rem; right: 2rem`               |      50 | Реально используемый компас, отдельный CSS                                                                        |
| `.gw-map-modal` (CaseCard / Hub / JourneyReport) | `fixed inset-0`                                 |      60 | Map-specific modal stack                                                                                          |

Z-index ladder карты: `5` (notes/legend) → `6` (journey controls) → `50` (compass overlay) → `60` (modal). Глобальный ladder начинается с `30` (navbar), `40` (VN screen), `70` (ConfirmationModal). Между map-modal (60) и глобальным ConfirmationModal (70) есть осмысленный gap, но он недокументирован.

### 3.3 Pin система

| Компонент                    | Что собой представляет                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DetectiveMapPin`            | Кнопка-marker. Слои (через `<span>`): `__aura` (blurred glow), `__focus-ring`, `__objective-ring` (если point.isObjectiveActive — пунктирный круг + glyph, animation `spin-slow 18s`), `__marker` (фото-портрет 4rem или SVG-icon 3.45rem), `__stamp` («Closed» для completed), `__tooltip` (rounded-full pill снизу). Behaviour `[data-zoomed-out]`: схлопывается в 1.1rem SVG-точку с drop-shadow glow. |
| `PlayerAvatarPin`            | 2.5×2.5rem, три слоя: `__pulse` (animated при `data-moving="true"`), `__body` (тёмно-сине-зелёный disc), `__core` (`#69c1a3` крошечный disc с glow).                                                                                                                                                                                                                                                      |
| `MapPinIcons` (5 SVG inline) | Используются только в zoomed-out mode `DetectiveMapPin` через `resolveSvgIcon`.                                                                                                                                                                                                                                                                                                                           |

`DetectiveMapPin` — наиболее сложный компонент карты по слойности: 7 различных вёрстко-слоёв ради достижения «мерцает / focus / objective / hover / completed / zoomed-out» состояний.

### 3.4 Modals & Panel

| Компонент            | Modal-skeleton                                                                         | Контент                                                                          |
| -------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `CaseCard`           | `.gw-map-modal` + `.gw-map-modal__backdrop` + `.gw-map-panel` + `.gw-map-panel__frame` | Inline-styled. Tabs `briefing`/`actions`/`notes`, dossier blocks, action buttons |
| `DetectiveHub`       | то же                                                                                  | `.gw-map-tabs` (3 кнопки сетки 3-col) + 3 tab-панели inline                      |
| `JourneyReportModal` | то же + `.gw-map-journey-report*` детализация                                          | `__stats` 3-col grid + `__discoveries` list                                      |

Один и тот же modal-чехол, **полностью разная** начинка. `gw-map-panel` сам по себе пуст — это `position: relative; max-height; overflow: hidden`. Реальный контейнер с фоном/border'ом — _.gw-map-journey-report_ (или inline в CaseCard/Hub).

### 3.5 Header card (compact + desktop)

| Класс                                                           | Назначение                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `.gw-map-header--desktop`                                       | Grid `minmax(0, 1fr) minmax(18rem, 23rem)` — карта слева, dossier-каркас справа |
| `.gw-map-header--compact`                                       | Flex column `width: min(31rem, calc(100% - 2rem))` — мобильная компоновка       |
| `.gw-map-compact-card__top`                                     | row с заголовком + toggle pill                                                  |
| `.gw-map-compact-card__toggle`, `.gw-map-ledger-drawer__toggle` | Pill-toggle, **общий стилевой селектор** (две root-классы → один блок правил)   |
| `.gw-map-compact-card__summary` / `__states`                    | `flex-wrap` row с pill'ами                                                      |
| `.gw-map-compact-card__summary-pill` / `__state-pill`           | `radius 999px, border, bg rgba(7,7,7,0.2)` — общий стилевой селектор            |

### 3.6 Ledger drawer

| Класс                           | Назначение                                                               |
| ------------------------------- | ------------------------------------------------------------------------ |
| `.gw-map-ledger-drawer`         | `max-height: min(40dvh, 24rem)` — раскрывающаяся под compact-card панель |
| `.gw-map-ledger-drawer__frame`  | scrollable inner container, `gap: 0.85rem`                               |
| `.gw-map-ledger-drawer__header` | row toggle / title                                                       |
| `.gw-map-ledger-grid`           | 2-col grid (на мобиле — 1-col)                                           |
| `.gw-map-ledger-grid__item`     | `radius 0.85rem`, border `rgba(255,239,206,0.08)`, bg `rgba(8,8,8,0.16)` |
| `.gw-map-ledger-grid__label`    | `font-mono`, uppercase, `letter-spacing: 0.15em`                         |
| `.gw-map-ledger-status`         | inline-flex pill (radius 999px), статусная плашка                        |

### 3.7 Tabs / buttons (map-local)

| Класс                              | Назначение                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `.gw-map-tabs`                     | `grid grid-template-columns: repeat(3, minmax(0, 1fr))` — используется только в `DetectiveHub`            |
| `.gw-map-button-row`               | `grid grid-template-columns: repeat(2, minmax(0, 1fr))` — используется в `CaseCard` для row action-кнопок |
| `.gw-map-journey-controls__button` | mock-tabular кнопка с `data-active="true"` модификатором, `transform: translateY(-1px)` на hover          |
| `.gw-map-icon-button`              | 2.15×2.15rem, `radius 0.55rem`, той же mono-typography что journey buttons                                |

### 3.8 Animations

В [mapExperience.css:743-822](../src/features/map/ui/mapExperience.css#L743) — 6 keyframes:

| Keyframe                          | Где                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `gw-map-fade-in`                  | `.gw-map-modal` появление                                                               |
| `gw-map-fade-up`                  | `.gw-map-empty-state`, `.gw-map-panel` (subtle slide-up)                                |
| `gw-map-pulse`                    | `.gw-map-empty-state--loading h3` (opacity wobble 1.6s)                                 |
| `gw-map-search-pulse`             | `.gw-map-compass[data-search-zone="true"]` (МЁРТВЫЙ — потребитель класса не существует) |
| `gw-map-player-pulse`             | `.gw-map-player-pin[data-moving="true"] .__pulse`                                       |
| `gw-map-spin`, `gw-map-spin-slow` | `__loading svg` / pin `__objective-ring`                                                |

В [CompassOverlay.css:25](../src/features/map/ui/CompassOverlay.css#L25) — отдельный `compass-pulse` keyframe (используется реально, на `.gw-compass-pulse`). **Конфликта имён нет** — `gw-map-search-pulse` ≠ `compass-pulse`.

---

## 4. Duplication Hotspots — карта

### 4.1 Двойной compass (один мёртв)

- **Живой:** `CompassOverlay.tsx` → `gw-compass-*` (107 строк, [CompassOverlay.css](../src/features/map/ui/CompassOverlay.css)). Круг 120px, CSS-треугольник-стрелка, `transform: rotate(${bearing}deg)`.
- **Мёртвый:** `gw-map-compass` блок в [mapExperience.css:286-424](../src/features/map/ui/mapExperience.css#L286) — 138 строк. Геометрия dial-card (rectangular: dial 5.3rem + readout) с `__north / __east / __south / __west` метками, `__arrow` SVG-вращающаяся стрелка, `__search` индикатор. Grep по проекту — **ни одного потребителя** в TSX.

Скорее всего — задумка следующего поколения компаса, которая не доехала до integration. Кандидат №1 на удаление (либо завершить миграцию).

### 4.2 Inline-styling в CaseCard / DetectiveHub / DetectiveMapPin

Три компонента с десятками inline-style:

- [CaseCard.tsx](../src/features/map/ui/CaseCard.tsx): 951 строка, 58 `style={{...}}` блоков.
- [DetectiveHub.tsx](../src/features/map/ui/DetectiveHub.tsx): 901 строка, 58 `style={{...}}` блоков.
- [DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx): 291 строка, ~12 `style={{...}}` блоков (на каждый layer слоя marker'а).

Это значит, что любая правка цвета / spacing'а / radius'а в этих компонентах сейчас идёт через TSX, а не CSS. Минусы:

- невозможно overrid'ить через темизацию;
- не работает Tailwind purge / linter правила;
- ад при сравнении вариантов между card'ами.

### 4.3 Modal-stack изолирован от глобального

`.gw-map-modal` ([mapExperience.css:583](../src/features/map/ui/mapExperience.css#L583)):

```css
position: fixed;
inset: 0;
z-index: 60;
.__backdrop {
  background: rgba(7, 7, 7, 0.5);
  backdrop-filter: blur(8px);
}
```

vs `ConfirmationModal` ([src/shared/ui/ConfirmationModal.tsx](../src/shared/ui/ConfirmationModal.tsx)):

```jsx
className =
  "fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm";
```

Семантически — одно и то же (полноэкранный modal с backdrop-blur), но реализовано через **разные слои стилизации** (CSS vs Tailwind) и **разные z-index** (60 vs 70). При совместной отрисовке map-modal будет под ConfirmationModal — это, возможно, intentional (confirm важнее), но недокументировано.

### 4.4 PinVisualState — пятая tone-vocabulary

См. §1.4. Семантически `locked → muted / disabled`, `discovered → warning / amber`, `visited → success / green`, `completed → info / blue` — то же, что в `MetricBox`'е (success/danger/warning/neutral) и в `STANCE_PALETTE`. Но эти 4 цвета описаны независимо и для других нужд (карта рисует фоновые свечения 40% + filter, а MetricBox — текст + 18% bg + 28% border).

### 4.5 Map-amber ≠ глобальный amber

Глобальный `--color-primary: #f59f0a`. Локальные амберы карты:

| Где                                 | Цвет                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| `mapExperience.css` accent          | `#d3b27a`, `#d9a743`, `#f2d088`, `rgba(242, 208, 136, ...)` |
| `CompassOverlay.css` accent         | `#d3b27a` (mark), `#d9a743` (search-dot)                    |
| `DetectiveMapPin.discovered.accent` | `#d9a743`                                                   |
| `JourneyReport eyebrow`             | `#d3b27a`                                                   |

Все «амбры» — другого тона, чем `#f59f0a`. Они **гармонируют** между собой (внутри карты), но **не выводятся** из единого token'а. При перетеме карты (например, переход на сезон/event) их пришлось бы переписывать руками в 4+ местах.

### 4.6 Дублирующие селекторы внутри `mapExperience.css`

В этом же файле есть случаи, когда правила объединены по запятой ради DRY:

```css
.gw-map-compact-card__toggle,
.gw-map-ledger-drawer__toggle { … }

.gw-map-compact-card__summary-pill,
.gw-map-compact-card__state-pill { … }

.gw-map-journey-controls__button,
.gw-map-journey-controls__status,
.gw-map-icon-button { … }
```

Это уже частичная экстракция мини-примитивов на CSS-уровне. На React-уровне таких обёрток нет — два рядом стоящих pill'а собираются вручную в JSX.

---

## 5. Пересечения с глобальной системой

### 5.1 Что карта берёт от глобальной системы

| Token                                                                                          | Где                                                                                                                                    |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--font-mono` (IBM Plex Mono)                                                                  | повсеместно в pills, ledger-labels, journey-controls, compass-marks                                                                    |
| `--font-serif` (Playfair Display)                                                              | заголовки `JourneyReport h3`, compass-marks (overlay), readout titles                                                                  |
| `--font-display` (Work Sans)                                                                   | **нигде** на карте напрямую не упоминается — карта в основном пишет mono+serif                                                         |
| Lucide-icons (`MapPinPlus`, `Pause`, `Play`, `Route`, `Square`, `Trash2`, `LoaderCircle`, `X`) | [MapView.tsx:17](../src/features/map/ui/MapView.tsx#L17), [JourneyReportModal.tsx:1](../src/features/map/ui/JourneyReportModal.tsx#L1) |

### 5.2 Что карта НЕ использует

- `--color-primary`, `--color-background-dark` — **0 потребителей в map-CSS** (карта определяет всё сама).
- Tailwind utility-классы (`bg-stone-*`, `text-amber-*`, `rounded-*`) — почти **0**. Только нативные классы из `gw-map-*` + inline стиль.
- Shared UI components (`NoirButton`, `GlassBox`, `ConfirmationModal`, `Toaster`) — **0** импортов из `shared/ui` в `src/features/map/`. Карта изолирована.

### 5.3 Что не пересекается, но могло бы

| Карта                                 | Глобальная альтернатива                                   | Что мешает                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `.gw-map-modal`                       | `ConfirmationModal` / будущий `Surface variant="overlay"` | Разные стили модальности, разные z-index                                                      |
| `.gw-map-icon-button`                 | `NoirButton` (по семантике — да, по стилю — нет)          | `NoirButton` всегда показывает text + accent. Map хочет только icon.                          |
| pin `__tooltip`                       | будущий `shared/ui/Popover`                               | Tooltip pin'а виден только на hover/selected — типовой кейс для Popover. Сейчас inline-стиль. |
| `.gw-map-compact-card__toggle` (pill) | `.tab-row button` (legacy) или `DossierTabButton`         | Map умеет state pill с амбер-glow на hover; tab-row делает почти то же, но в холодной палитре |

---

## 6. Prioritized Extraction & Cleanup Plan для карты

> Порядок от безопасных к контентно-затратным.

### 6.1 [P1] Удалить мёртвый `.gw-map-compass*` блок

**Объём:** 138 строк CSS в [mapExperience.css:286-424](../src/features/map/ui/mapExperience.css#L286) + соответствующий `gw-map-search-pulse` keyframe. Удалить.

**Риск:** 0. Grep подтверждает 0 потребителей.

**Test plan:** Запустить `bun run lint`/`tsc`/`vitest` после правки — карта рендерит `CompassOverlay`, который использует другой словарь. Опционально: визуальная проверка `/map`.

### 6.2 [P1] Извлечь pin-tooltip в `shared/ui/Popover`

**Зачем:** `gw-map-pin__tooltip` (inline-style блок в [DetectiveMapPin.tsx:269-288](../src/features/map/ui/DetectiveMapPin.tsx#L269)) — типовой hover/selected tooltip. Сейчас он живёт inline-стилем, появляется через `opacity` + `transform`, реагирует на `:hover` / `[data-selected="true"]`.

Если `shared/ui/Popover` уже извлечён (P1 из [DESIGN_SYSTEM_INVENTORY.md §4.1](./DESIGN_SYSTEM_INVENTORY.md)) — заменить inline-стиль на `<Popover trigger="hover" placement="bottom">` обёртку. Pin становится примитивом без локального tooltip-кода.

**Зависимость:** требует выполнения P1 из глобального плана.

### 6.3 [P2] Promote map-modal в общий `Surface variant="overlay"` + единый `<Modal>` примитив

**Объём:** объединить `.gw-map-modal` + `.gw-map-modal__backdrop` с `ConfirmationModal`-структурой в один shared-примитив `<Modal>` (или `<Sheet>` с вариантами `overlay-fullscreen` / `confirm`).

API эскиз:

```tsx
<Modal open={true} onClose={fn} variant="overlay-fullscreen" z="modal" backdropBlur="md">
  <Surface variant="overlay" tone={...}>
    …
  </Surface>
</Modal>
```

**Затрагивает:** `CaseCard`, `DetectiveHub`, `JourneyReportModal`, `ConfirmationModal` (последний остаётся специфическим композитом «destructive action confirm», но рендерится через общий `<Modal>`).

**Не делать сейчас:** только спецификация. Реальный refactor — отдельным PR на каждый из четырёх consumer'ов.

### 6.4 [P2] Извлечь `MapPinTile` как специализацию `AvatarTile`

**Зачем:** marker pin'а — это аватарный тайл (фото или icon) с tone-coloured aura/border/glow. Если `AvatarTile` извлечён (P2 в глобальном плане), pin-marker section ([DetectiveMapPin.tsx:202-244](../src/features/map/ui/DetectiveMapPin.tsx#L202)) переходит на тот же примитив + специфические map-only слои (objective-ring, completed-stamp) остаются обёртками.

**Не делать сейчас:** требует, чтобы `AvatarTile` поддерживал tone-привязку, что в свою очередь требует §6.5.

### 6.5 [P2] PinVisualState → tone-token mapping

Сопоставление map-state'ов с tone-палитрой:

| PinVisualState | Tone (предлагаемый) |
| -------------- | ------------------- |
| `locked`       | `neutral` / `muted` |
| `discovered`   | `warning`           |
| `visited`      | `success`           |
| `completed`    | `info`              |

После: `stateStyles` в [DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx#L19) выводится из `TONE[…]` (см. [DESIGN_SYSTEM_INVENTORY.md §4.2](./DESIGN_SYSTEM_INVENTORY.md)). Сохраняется map-specific нюанс — `glow: 40%, focus: 18%` интенсивности, что регулируется параметрами или вторичными токенами.

**Затрагивает:** только [DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx); CSS-словарь карты не трогаем (вторичный glow уровень).

### 6.6 [P3] Перенести inline-styles из CaseCard / DetectiveHub в CSS-классы или Tailwind utility

**Объём:** 116 inline `style={{...}}` блоков суммарно. Это **не один PR**, это серия мини-PR'ов по 5-10 блоков за раз.

**Подход:**

1. Сгруппировать одинаковые inline-блоки по визуальной семантике (action-button / stat-pill / label / dossier-field / list-row).
2. На каждую группу — новый класс `.gw-map-<feature>-<el>` ИЛИ Tailwind-композиция (для тех, где tone-token достаточно).
3. Постепенно мигрировать.

**Не делать сейчас:** только зафиксировать в roadmap. Это работа на 1-2 недели чистого рефакторинга.

### 6.7 [P3] Унификация двух map-амберов

Свести `mapExperience.css` амбры (`#d3b27a / #d9a743 / #f2d088 / f5e9ca / fff4d9`) и `CompassOverlay.css` амбры (`#d3b27a / #d9a743 / #e55c5c`) в **один map-палитра-токен**:

```css
@theme {
  --color-map-amber-100: #fff4d9;
  --color-map-amber-200: #f5e9ca;
  --color-map-amber-300: #f8eed7;
  --color-map-amber-400: #f2d088;
  --color-map-amber-500: #d9a743;
  --color-map-amber-600: #d3b27a;
}
```

Не глобализируется в `--color-primary` — у карты другой характер амбра (более «бумажный»). Это «локальная семья токенов» под map-сабсистему. Альтернатива — расширить глобальный @theme до полной amber-шкалы, но это **политическое** решение, см. [DESIGN_SYSTEM_INVENTORY.md §4.7](./DESIGN_SYSTEM_INVENTORY.md).

### 6.8 [P4] Зашить z-index карты в общий ladder

После P1 из глобального плана (создание `shared/ui/zIndex.ts`) — заменить `z-index: 5/6/50/60` в `mapExperience.css` на `var(--z-map-overlay-low / overlay-high / compass / modal)`. Карта получает свой sub-band в общем ladder'е.

---

## 7. Что НЕ входит в скоуп этой записи

- Mapbox styling (`MAPBOX_STYLE` URL) — внешняя tile-вёрстка дорог/зданий, не редактируется в коде проекта.
- `src/features/map/hooks/` — рантайм-логика (journey, ephemeral state), не визуальный layer.
- `src/features/map/model/` — geo-математика и derivePointState, не UI.
- `src/features/map/data/` — статические данные точек, не UI.
- Generated points ([generated-static-points.ts](../src/features/map/data/generated-static-points.ts), [karlsruhe-event-static-points.ts](../src/features/map/data/karlsruhe-event-static-points.ts)) — авто-генерируемые, см. `bun run content:extract`.
- Тесты карты ([MapView.test.tsx](../src/features/map/ui/MapView.test.tsx), [CaseCard.test.tsx](../src/features/map/ui/CaseCard.test.tsx), [DetectiveHub.test.tsx](../src/features/map/ui/DetectiveHub.test.tsx), [DetectiveMapPin.test.tsx](../src/features/map/ui/DetectiveMapPin.test.tsx)) — не правим в этом проходе, но они станут ground truth при будущих миграциях.

## 8. Public API impact

**Документ ничего не экспортирует.** §6.1–6.8 — это предложения к будущим PR'ам, каждый со своим test-планом. Никаких изменений в `src/features/map/` в рамках этой записи.

## 9. Test Plan (для этого PR)

- Документационная запись, runtime-тесты не нужны.
- Проверка: все пути в формате `[link text](../...)` указывают на существующие файлы. Ключевые ссылки:
  - [src/features/map/ui/mapExperience.css](../src/features/map/ui/mapExperience.css)
  - [src/features/map/ui/CompassOverlay.css](../src/features/map/ui/CompassOverlay.css)
  - [src/features/map/ui/CompassOverlay.tsx](../src/features/map/ui/CompassOverlay.tsx)
  - [src/features/map/ui/MapView.tsx](../src/features/map/ui/MapView.tsx)
  - [src/features/map/ui/DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx)
  - [src/features/map/ui/CaseCard.tsx](../src/features/map/ui/CaseCard.tsx)
  - [src/features/map/ui/DetectiveHub.tsx](../src/features/map/ui/DetectiveHub.tsx)
  - [src/features/map/ui/JourneyReportModal.tsx](../src/features/map/ui/JourneyReportModal.tsx)
  - [src/features/map/ui/PlayerAvatarPin.tsx](../src/features/map/ui/PlayerAvatarPin.tsx)
  - [src/features/map/ui/MapPinIcons.tsx](../src/features/map/ui/MapPinIcons.tsx)
  - [src/features/map/types.ts](../src/features/map/types.ts)
  - [src/shared/ui/ConfirmationModal.tsx](../src/shared/ui/ConfirmationModal.tsx)
  - [docs/DESIGN_SYSTEM_INVENTORY.md](./DESIGN_SYSTEM_INVENTORY.md)
- `bun run format:check` — должен пройти.

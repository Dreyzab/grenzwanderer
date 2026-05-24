# Design System Inventory & Extraction Plan

> Status: **черновик / inventory snapshot**, дата заметки — 2026-05-14. Документ описывает текущее состояние UI-стилей и компонентов на момент аудита. Никаких прод-изменений эта запись не вносит.
> Зона охвата: `src/` за исключением `src/module_bindings/`, генерируемых схем, тестов и backend-кода (трогаем только в тех тестах, что фиксируют ожидаемое UI-поведение).

## 0. Краткий итог

Дизайн-система существует, но **фрагментарно** и в **трёх параллельных слоях** одновременно:

1. **Tailwind 4 + `@theme` токены** в [src/index.css](../src/index.css) — два цветовых токена (`primary`, `background-dark`), три семейства шрифтов, `radius`-шкала. Это «официальный» слой.
2. **Vanilla-CSS глобальные классы** в [src/app/AppShell.css](../src/app/AppShell.css) — 372 строки legacy: `.card`, `.panel-section`, `.tab-row`, `.button-row`, `.choice-grid`, статусы, mind-grid. Использует **холодную сине-сланцевую палитру** (`#1a2742`, `#60a5fa`, `#9fb2d3`, `#86efac`, `#fca5a5`), которая **не пересекается** с амберными Tailwind-токенами.
3. **Локальные feature-палитры и feature-CSS** — каждый крупный экран (карта, VN, character, origin, release) ведёт свою собственную палитру и/или CSS-файл (`gw-map-*`, `vn-typed-text`, `vn-passive-card`, `vn-skill-toast`, `vn-check-resolve`, `origin-card`).

Документированной точки входа в UI нет. Storybook отсутствует. Из «дизайн-документации» — два планировочных файла в корне проекта ([vn-ui-plan.md.resolved](../../vn-ui-plan.md.resolved), [vn-ui-figma-board.html](../../vn-ui-figma-board.html)), оба относятся только к VN-фазе.

---

## 1. Слои оформления — инвентарь

### 1.1 Theme-токены: [src/index.css](../src/index.css)

```css
@theme {
  --color-primary: #f59f0a; /* амбер/шафран */
  --color-background-dark: #181511; /* тёплый тёмно-серый */
  --font-display: "Work Sans", "IBM Plex Sans", sans-serif;
  --font-serif: "Playfair Display", "Crimson Pro", serif;
  --font-mono: "IBM Plex Mono", monospace;
  --radius-DEFAULT: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
}
:root {
  color-scheme: dark;
}
body {
  background: var(--color-background-dark);
  font-family: var(--font-display);
}
```

**Всё**, что лежит в зарегистрированных токенах. Семантических токенов нет — нет `--color-success / --color-danger / --color-warning`, нет шкалы `surface-1/2/3`, нет `text-primary/secondary/muted`, нет токенов под stance (supports/opposes) и под inner-voice палитру.

### 1.2 Legacy глобальные классы: [src/app/AppShell.css](../src/app/AppShell.css)

372 строки. Сине-сланцевая палитра (`#1a2742`, `#3a4a6f`, `#60a5fa`, `#86efac`, `#fca5a5`, `#9fb2d3`, `#cbd5e1`). Категории классов:

| Категория         | Классы                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell-каркас      | `.app-shell`, `.app-shell--map`, `.app-main`, `.app-main--map`, `.app-shell-loading`, `.app-page-loading`, `.app-header`, `.subtitle`, `.meta-block`                    |
| Tabs / навигация  | `.tab-row`, `.tab-row button`, `.tab-row button.active` (pill-табы с амбер-градиентом активного состояния)                                                              |
| Surface / cards   | `.card`, `.card.compact`, `.card.warning`, `.card-grid`, `.card-grid.two-col`, `.two-col-grid`, `.panel-section`, `.panel-header`, `.placeholder-card`, `.vn-mode-card` |
| Buttons           | `.card button`, `.button-row button` (общий стиль через композицию селекторов; вариативность через состояние)                                                           |
| Lists / rows      | `.unstyled-list`, `.list-row`, `.dot`, `.secret-row`, `.icon-row`, `.stat-number`                                                                                       |
| Status / feedback | `.status-line.success`, `.status-line.error`, `.status-line.muted` (зелёный/красный/серый — это **второй** color-vocabulary параллельно с `Toaster`)                    |
| Forms             | `.field`, `.field select`, `.code-box`                                                                                                                                  |
| Mind palace       | `.mind-grid`, `.mind-list`, `.mind-item`, `.mind-item p`, `.mind-item-header`                                                                                           |
| Choices           | `.choice-grid`, `.choice-grid button`, `.choice-grid code`                                                                                                              |

Потребители (`className` содержит legacy-класс): [src/pages/AdminPage.tsx](../src/pages/AdminPage.tsx), [src/pages/BattlePage.tsx](../src/pages/BattlePage.tsx), [src/pages/CommandPage.tsx](../src/pages/CommandPage.tsx), [src/pages/DevPage.tsx](../src/pages/DevPage.tsx), [src/pages/VnPage.tsx](../src/pages/VnPage.tsx), [src/features/ai/ui/AiThoughtsPanel.tsx](../src/features/ai/ui/AiThoughtsPanel.tsx), [src/features/character/CharacterPanel.tsx](../src/features/character/CharacterPanel.tsx), [src/features/mindpalace/MindPalacePanel.tsx](../src/features/mindpalace/MindPalacePanel.tsx), [src/features/placeholders/PlaceholderPanel.tsx](../src/features/placeholders/PlaceholderPanel.tsx), [src/features/vn/VnPilotPanel.tsx](../src/features/vn/VnPilotPanel.tsx), [src/features/vn/ui/VnScreen.tsx](../src/features/vn/ui/VnScreen.tsx), [src/features/vn/ui/VnScreenHeader.tsx](../src/features/vn/ui/VnScreenHeader.tsx).

### 1.3 Древний chat-grid: [src/App.css](../src/App.css)

136 строк. Это **архаичный** grid-layout оригинального SpacetimeDB-template'а (profile/messages/online/new-message). Видимо не используется текущими страницами — но файл импортирован в [src/App.tsx](../src/App.tsx). Свой набор CSS-переменных: `--theme-color`, `--textbox-color`, `--theme-color-contrast`. **Кандидат на удаление**.

### 1.4 Feature CSS-файлы

| Файл                                                                                              | Строк | Префикс                                            | Назначение                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------- | ----: | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/features/map/ui/mapExperience.css](../src/features/map/ui/mapExperience.css)                 |   875 | `gw-map-*`                                         | Всё, что касается карты: shell, header, compass, journey controls, modal+panel+icon-button, ledger drawer, empty/loading states, journey report. 30+ root-классов с BEM-подобной структурой `__element` / `--modifier`. |
| [src/features/vn/ui/VnSkillCheckFeedback.css](../src/features/vn/ui/VnSkillCheckFeedback.css)     |   587 | `vn-check-*`, `vn-passive-*`, `vn-skill-toast*`    | Skill check resolve overlay, passive check banner, skill toast (success/fail). Локальные CSS-vars `--vn-check-accent`, `--vn-check-accent-soft`, `--vn-check-glow`.                                                     |
| [src/features/vn/ui/TypedText.css](../src/features/vn/ui/TypedText.css)                           |   123 | `vn-typed-text*`, `vn-letter-sheet*`               | Шрифт/стиль типографа VN, drop-cap `::first-letter:float-left`. Локальные CSS-vars `--vn-text-primary`, `--vn-accent`.                                                                                                  |
| [src/features/vn/ui/VnTokenFeedbackOverlay.css](../src/features/vn/ui/VnTokenFeedbackOverlay.css) |   117 | `vn-token-feedback*`                               | Подсветка кликабельных токенов в TypedText.                                                                                                                                                                             |
| [src/features/map/ui/CompassOverlay.css](../src/features/map/ui/CompassOverlay.css)               |   106 | `gw-map-compass*` (фактически только compass-блок) | Компас на карте, частично перекрывается с `mapExperience.css`.                                                                                                                                                          |
| [src/features/vn/ui/OriginChoiceCards.css](../src/features/vn/ui/OriginChoiceCards.css)           |    51 | `origin-card*`                                     | Карточки выбора происхождения. **Стиль конкурирует** с Tailwind-вариантом в [OriginSelectionScreen.tsx](../src/features/origin/ui/OriginSelectionScreen.tsx).                                                           |

### 1.5 Inline feature-палитры (TypeScript-константы)

| Файл                                                                                                            | Палитра                                                                                                      | Назначение                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| [src/features/character/panel/characterPanel.theme.ts](../src/features/character/panel/characterPanel.theme.ts) | `C = { coal, ink, bone, crimson, brass, amber, slate }` + `CLIP_CARD`, `CLIP_PANEL` (clip-path polygons)     | Character panel «noir»-стиль                                     |
| [src/features/origin/ui/OriginSelectionScreen.tsx:36](../src/features/origin/ui/OriginSelectionScreen.tsx#L36)  | `const C = { coal, ink, bone, crimson, brass, ... }`                                                         | **Точный дубликат** `characterPanel.theme.ts`, локально объявлен |
| [data/innerVoiceContract.ts](../../data/innerVoiceContract.ts)                                                  | per-voice: `palette = { accent, accentSoft, accentBorder, glow, glowStrong, text }`                          | Палитра под каждый внутренний голос                              |
| [src/features/vn/skillCheckPalette.ts](../src/features/vn/skillCheckPalette.ts)                                 | `SkillCheckVoicePalette` per-voice-id                                                                        | Палитра под skill-check голоса                                   |
| [src/features/vn/ui/VnChoiceButton.tsx:30](../src/features/vn/ui/VnChoiceButton.tsx#L30) (введён 2026-05-14)    | `STANCE_PALETTE = { supports: { border: '#34d399', glow: ... }, opposes: { border: '#f87171', glow: ... } }` | supports/opposes цветовой токен **локально**, ad-hoc             |

### 1.6 Shared UI примитивы: [src/shared/ui/](../src/shared/ui/)

| Файл                                                            | Что внутри                                                                                                                                                    | Замечания                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [NoirButton.tsx](../src/shared/ui/NoirButton.tsx)               | `<button>` с `variant: default \| highlighted`, props `label / actionText / icon`. Material-Symbols шрифт-икона.                                              | Жёстко прибит к `primary` цвету. Не имеет состояний `disabled / loading / sizes`. |
| [NoirTypography.tsx](../src/shared/ui/NoirTypography.tsx)       | `<div>` с `first-letter:float-left first-letter:text-primary` буквицей, font-serif italic.                                                                    | Только для декоративного «дамского лиричного» текста.                             |
| [NoirNameplate.tsx](../src/shared/ui/NoirNameplate.tsx)         | Косой left-bar nameplate с `transform: -skew-x-12`. Абсолютно позиционирован.                                                                                 | Использует `primary` цвет; конкретный визуальный стиль (noir cinema).             |
| [GlassBox.tsx](../src/shared/ui/GlassBox.tsx)                   | `<div>` с `backdrop-blur-md`, тенью, `border-t border-white/5`, `bg-background-dark/90`.                                                                      | Контейнер-обёртка под «всплывающую панель снизу».                                 |
| [ConfirmationModal.tsx](../src/shared/ui/ConfirmationModal.tsx) | Полноэкранная модалка с `fixed inset-0 z-[70]`, paper-texture overlay, амбер-кнопка confirm.                                                                  | **Единственный** modal-примитив. Уровень доверия высокий.                         |
| [Toaster.tsx](../src/shared/ui/Toaster.tsx)                     | Тоасты `top-right` с типами `fact/reward/info` → амбер/изумруд/стон. `animate-[slideIn_0.3s_ease-out]` (keyframe в [src/index.css:45](../src/index.css#L45)). | Параллельная color-vocabulary относительно `.status-line.*`.                      |
| [icons/](../src/shared/ui/icons)                                | Кастомные SVG (`GameIcon`).                                                                                                                                   | Не входит в фокус инвентаря.                                                      |

---

## 2. Классификация повторяющихся паттернов

> Цель: для каждого паттерна — где он сейчас живёт, какие есть варианты, есть ли единый примитив.

### 2.1 Tokens (design tokens)

| Уровень                                       | Расположение                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Полнота                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Color base                                    | `@theme` в [index.css](../src/index.css)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 2 цвета (`primary`, `background-dark`) — критически мало   |
| Color seman­tic (success/warning/danger/info) | **Не определены централизованно**. Дублируются в [AppShell.css](../src/app/AppShell.css) (`.status-line.success/error/muted`), в [Toaster.tsx](../src/shared/ui/Toaster.tsx) (`fact/reward/info`), в [characterPanelPrimitives.tsx:`MetricBox`](../src/features/character/panel/characterPanelPrimitives.tsx) (`success/danger/neutral/warning`), в ad-hoc Tailwind утилитах (`text-emerald-400`, `text-rose-400` в [checkChance.ts](../src/features/vn/checkChance.ts) → [VnChoiceButton.tsx](../src/features/vn/ui/VnChoiceButton.tsx)). | 4 несвязанных словаря                                      |
| Color stance (supports/opposes)               | ad-hoc в [VnChoiceButton.tsx:STANCE_PALETTE](../src/features/vn/ui/VnChoiceButton.tsx)                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Один локальный объект                                      |
| Color voice (inner voice / skill check)       | [data/innerVoiceContract.ts](../../data/innerVoiceContract.ts) + [src/features/vn/skillCheckPalette.ts](../src/features/vn/skillCheckPalette.ts)                                                                                                                                                                                                                                                                                                                                                                                           | Полноценно типизировано, но без интеграции в общую систему |
| Typography                                    | 3 семейства (`display/serif/mono`). Размеры шрифтов — **не зарегистрированы**, используются Tailwind defaults + arbitrary `text-[1.3rem]` / `text-[22px]` / `text-[0.66rem]` / `text-[10px]`                                                                                                                                                                                                                                                                                                                                               | Размерная шкала отсутствует                                |
| Radius                                        | 5 уровней в `@theme`. Реально в коде живут параллельные значения: `rounded-[1.2rem]`, `rounded-[0.95rem]`, `rounded-[1rem]`, `rounded-[4px]`, `rounded-[5px]`, `rounded-[3px]` — большинство **минуя токены**.                                                                                                                                                                                                                                                                                                                             | Расхождение                                                |
| Shadow / glow                                 | Используются inline `shadow-[0_18px_42px_rgba(0,0,0,0.62)]`, `boxShadow: 0 0 14px ${color}`. **Не токенизировано**.                                                                                                                                                                                                                                                                                                                                                                                                                        | —                                                          |
| Spacing                                       | Tailwind defaults; semantic-обёрток (`space-card-inner`, `gap-list-row`) нет.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | —                                                          |

### 2.2 Layout shells

| Шелл                             | Расположение                                                                                        | Что включает                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `.app-shell` / `.app-shell--map` | [AppShell.css](../src/app/AppShell.css)                                                             | Топ-левел, радиальные градиенты, safe-area-inset, шрифт IBM Plex Sans |
| VN fullscreen                    | [src/features/vn/ui/VnScreen.tsx](../src/features/vn/ui/VnScreen.tsx)                               | `fixed inset-0 z-40 flex flex-col bg-black`                           |
| VN bottom-sheet                  | [src/features/vn/log/VnLogBottomSheet.tsx](../src/features/vn/log/VnLogBottomSheet.tsx)             | `absolute inset-x-0 bottom-0 z-150` + framer-motion + drag            |
| Map shell                        | [src/features/map/ui/mapExperience.css](../src/features/map/ui/mapExperience.css) (`.gw-map-shell`) | Свой dark-background, абсолютные header/compass overlays              |
| Card-grid                        | `.card-grid` / `.two-col-grid`                                                                      | Auto-fit grid, разные min-track (150px / 260px)                       |

### 2.3 Surfaces / cards

Шесть **разных** способов нарисовать «карточку»:

| Источник                                                                                                                   | Стиль                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.card` в [AppShell.css:150](../src/app/AppShell.css#L150)                                                                 | `border #2a3a5c`, gradient `#0c1528 → #131b2c`, `radius 0.85rem`, inset белый shadow                             |
| `SectionCard` в [characterPanelPrimitives.tsx:16](../src/features/character/panel/characterPanelPrimitives.tsx#L16)        | `rounded-[1.2rem]`, `bg-[rgba(16,14,12,0.68)]`, `backdrop-blur-sm`, `clipPath: CLIP_CARD` (cut corners)          |
| `.gw-map-panel` в [mapExperience.css](../src/features/map/ui/mapExperience.css)                                            | Свой `.__frame` + `.__header`, амбер-акценты, аутлайн                                                            |
| `.origin-card` в [OriginChoiceCards.css](../src/features/vn/ui/OriginChoiceCards.css)                                      | `radius 12px`, `bg rgba(18, 22, 34, 0.72)`, inline-pill stats                                                    |
| Inner-voice thought card в [LogSegmentRenderer.tsx:181](../src/features/vn/log/LogSegmentRenderer.tsx#L181)                | `max-w-2xl border bg-stone-950/72 backdrop-blur-md` + цветной sidebar, glow по voice accent                      |
| Reaction/thought StatusCard в [VnChoicesRenderer.tsx](../src/features/vn/ui/VnChoicesRenderer.tsx) (близко к началу файла) | Inline conditional: `border-sky-200/20 bg-slate-950/55` vs `border-amber-200/20 bg-black/40`, `rounded-[1.4rem]` |
| `.vn-passive-card` в [VnSkillCheckFeedback.css](../src/features/vn/ui/VnSkillCheckFeedback.css)                            | Свой набор: `is-success / is-fail` модификаторы                                                                  |

### 2.4 Buttons / actions

| Кнопка                                                     | Расположение                                                                                        | Стилизация                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `NoirButton`                                               | [shared/ui/NoirButton.tsx](../src/shared/ui/NoirButton.tsx)                                         | `variant: default \| highlighted`, амбер                                                          |
| `.card button`, `.button-row button`                       | [AppShell.css:129](../src/app/AppShell.css#L129)                                                    | сине-сланцевая, без variants                                                                      |
| `.gw-map-icon-button`                                      | [mapExperience.css](../src/features/map/ui/mapExperience.css)                                       | Круглая иконочная кнопка карты                                                                    |
| `.gw-map-compact-card__toggle` / `__ledger-drawer__toggle` | [mapExperience.css:64](../src/features/map/ui/mapExperience.css#L64)                                | Pill-toggle, амбер-light на dark                                                                  |
| `VnChoiceButton`                                           | [vn/ui/VnChoiceButton.tsx](../src/features/vn/ui/VnChoiceButton.tsx)                                | `motion.button` с float-wrap layout, primary voice avatar + popover, опциональный skill-check ряд |
| `DossierTabButton`                                         | [characterPanelPrimitives.tsx:43](../src/features/character/panel/characterPanelPrimitives.tsx#L43) | Tab-button с layoutId glow, clip-path corners                                                     |
| Tab pill в `.tab-row`                                      | [AppShell.css:65](../src/app/AppShell.css#L65)                                                      | `rounded-full` pill, активное состояние — амбер gradient                                          |
| ConfirmationModal confirm/cancel                           | [shared/ui/ConfirmationModal.tsx](../src/shared/ui/ConfirmationModal.tsx)                           | Прямоугольные `h-11`, амбер confirm vs `stone-900/70` cancel                                      |
| Toast dismiss `x`                                          | [shared/ui/Toaster.tsx](../src/shared/ui/Toaster.tsx)                                               | Inline minimal button                                                                             |

### 2.5 Tabs / segmented controls

| Реализация         | Где                                                                                                 | Поведение                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `.tab-row`         | [AppShell.css:58](../src/app/AppShell.css#L58)                                                      | Top-level page tabs (admin/dev/command). Pill-кнопки, active=амбер                |
| `DossierTabButton` | [characterPanelPrimitives.tsx:43](../src/features/character/panel/characterPanelPrimitives.tsx#L43) | Character dossier (3 таба). `clipPath` cut-corners, framer-motion `layoutId` glow |
| Navbar             | [src/widgets/navbar/Navbar.tsx](../src/widgets/navbar/Navbar.tsx)                                   | Bottom-nav с drag controls, framer-motion                                         |

### 2.6 Badges / chips / pills

| Назначение                               | Где                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Stat-pill (origin-card)                  | [OriginChoiceCards.css:41](../src/features/vn/ui/OriginChoiceCards.css#L41) (`border 1px, radius 999px, padding 2px 8px`) |
| State-pill на карте                      | `.gw-map-compact-card__state-pill`, `.__summary-pill`                                                                     |
| Toast как pill                           | [Toaster.tsx](../src/shared/ui/Toaster.tsx) (radius `lg`, type-coloured border)                                           |
| Stance/fact chips (legacy)               | удалены 2026-05-14 из [VnChoiceButton.tsx](../src/features/vn/ui/VnChoiceButton.tsx); раньше это была отдельная палитра   |
| `Status-line` (`.success/.error/.muted`) | [AppShell.css:282](../src/app/AppShell.css#L282)                                                                          |
| MetricBox tone-pill                      | [characterPanelPrimitives.tsx:141](../src/features/character/panel/characterPanelPrimitives.tsx#L141)                     |
| Difficulty/chance pill в choice          | inline в [VnChoiceButton.tsx:hasSkillCheck](../src/features/vn/ui/VnChoiceButton.tsx)                                     |

### 2.7 Avatars / speaker badges

Шесть параллельных аватарных компонентов:

| Компонент                                 | Где                                                                                                           | Размеры                                        | Что внутри                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `VnInlineSpeakerBadge`                    | [vn/ui/VnInlineSpeakerBadge.tsx](../src/features/vn/ui/VnInlineSpeakerBadge.tsx)                              | `sm` (28px) / `md` (36px) / `lg` (40px) пилюли | image + 3-letter label, glow, accent border. Используется в `OriginSelectionScreen`, `MapPinIcons`, тестах |
| `SpeakerHeader` (внутр.)                  | [vn/log/LogSegmentRenderer.tsx:60](../src/features/vn/log/LogSegmentRenderer.tsx#L60)                         | `size-12` (48px) квадрат                       | image + полное имя над текстом, float-left                                                                 |
| `ChoicePrimaryAvatar` (введён 2026-05-14) | [vn/ui/VnChoiceButton.tsx:53](../src/features/vn/ui/VnChoiceButton.tsx#L53)                                   | `size-10` (40px) квадрат                       | image + stance-coloured border 2px                                                                         |
| Player pin avatar                         | [features/map/ui/PlayerAvatarPin.tsx](../src/features/map/ui/PlayerAvatarPin.tsx)                             | (карточный, на карте)                          | image overlay поверх pin                                                                                   |
| Map pin icons                             | [features/map/ui/MapPinIcons.tsx](../src/features/map/ui/MapPinIcons.tsx)                                     | per-pin размер                                 | SVG/icon, не портретный                                                                                    |
| Сектор «dossier» tab icon                 | [characterPanelPrimitives.tsx:DossierTabButton](../src/features/character/panel/characterPanelPrimitives.tsx) | `h-10 w-10 rounded-[0.8rem]`                   | Lucide icon в обводке                                                                                      |

«Лицо» голоса резолвится через [resolveVoiceAvatarUrl](../src/features/vn/ui/VnInlineSpeakerBadge.tsx) / `resolveSpeakerPortrait` ([speakerRegistry.ts](../src/features/vn/log/speakerRegistry.ts)) — это работает корректно, но **визуальная обёртка** каждый раз пишется заново.

### 2.8 Popovers / tooltips

Единственная реализация popover'а на проекте — ad-hoc внутри [VnChoiceButton.tsx:PrimaryVoiceFloat](../src/features/vn/ui/VnChoiceButton.tsx). Содержит:

- `useState(isOpen)`
- click-outside listener (mousedown + touchstart)
- close on scroll/resize (capture-phase)
- close on Escape
- hover open + delayed close (cancellable timer, mouseEnter на popover тоже отменяет close)
- `useLayoutEffect` пересчёт координат через `getBoundingClientRect`
- `position: fixed` через `createPortal(..., document.body)` (single место в кодовой базе, где есть `createPortal`)
- `role="dialog"` + `aria-haspopup` + `aria-expanded`

Никакой `<Tooltip>` или `<Popover>` примитив **отдельно не существует**. Все остальные «всплывашки»:

- `title` HTML-атрибут (native browser tooltip) — повсеместно в [VnInlineSpeakerBadge.tsx](../src/features/vn/ui/VnInlineSpeakerBadge.tsx), [SpeakerHeader](../src/features/vn/log/LogSegmentRenderer.tsx)
- `aria-label` без визуального tooltip — большая часть кнопок

### 2.9 Modals / sheets

| Компонент                                                                    | Где                                                                                       | Тип                                                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ConfirmationModal`                                                          | [shared/ui/ConfirmationModal.tsx](../src/shared/ui/ConfirmationModal.tsx)                 | `fixed inset-0 z-[70]` + backdrop-blur + paper texture                                    |
| `JourneyReportModal`                                                         | [features/map/ui/JourneyReportModal.tsx](../src/features/map/ui/JourneyReportModal.tsx)   | `.gw-map-modal` (CSS-классы) + `.gw-map-panel`                                            |
| `VnLogBottomSheet`                                                           | [features/vn/log/VnLogBottomSheet.tsx](../src/features/vn/log/VnLogBottomSheet.tsx)       | Drag-snap bottom sheet (3 точки), pointer events, localStorage persistence, framer-motion |
| `KarlsruheQrGate` (Release wall)                                             | [features/release/ui/KarlsruheQrGate.tsx](../src/features/release/ui/KarlsruheQrGate.tsx) | Inline tailwind-полноэкранная панель                                                      |
| `VnFilmSoundPromptOverlay`, `VnSkillCheckResolveOverlay`, `VnNarrativePanel` | [widgets/vn-overlay/](../src/widgets/vn-overlay/)                                         | VN-ный inset-0 layer                                                                      |

Общего «Modal» / «Sheet» примитива нет. Z-index'ы рассыпаны: `z-[70]`, `z-[100]`, `z-[200]` (popover), `z-150` (bottom sheet), `z-40` (VN screen) — без централизованной шкалы.

### 2.10 Feedback / toasts / banners

| Сценарий                                  | Реализация                                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Глобальные toast'ы (fact / reward / info) | [shared/ui/Toaster.tsx](../src/shared/ui/Toaster.tsx) + [shared/hooks/useToast.tsx](../src/shared/hooks/useToast.tsx)                                                                          |
| VN skill check toast (success / fail)     | [features/vn/ui/VnSkillCheckToast.tsx](../src/features/vn/ui/VnSkillCheckToast.tsx) + CSS-классы `vn-skill-toast` в [VnSkillCheckFeedback.css](../src/features/vn/ui/VnSkillCheckFeedback.css) |
| VN passive check banner                   | [features/vn/ui/VnPassiveCheckBanner.tsx](../src/features/vn/ui/VnPassiveCheckBanner.tsx) + `.vn-passive-card` CSS                                                                             |
| Status-line (success/error/muted)         | [AppShell.css:282](../src/app/AppShell.css#L282) inline в legacy-страницах                                                                                                                     |

### 2.11 Map-specific controls

В одном файле [mapExperience.css](../src/features/map/ui/mapExperience.css) и нескольких компонентах ([MapView.tsx](../src/features/map/ui/MapView.tsx), [CompassOverlay.tsx](../src/features/map/ui/CompassOverlay.tsx), [DetectiveMapPin.tsx](../src/features/map/ui/DetectiveMapPin.tsx), [CaseCard.tsx](../src/features/map/ui/CaseCard.tsx), [DetectiveHub.tsx](../src/features/map/ui/DetectiveHub.tsx)):

- Compass с диалом, стрелкой, четырьмя сторонами света
- Ledger drawer с тоггл-pill
- Journey controls (старт/стоп/пауза/доклад)
- Compact-card (state-pills + summary-pills, expandable)
- Map pin icons + player avatar pin

Замкнутая под-система, использует собственную палитру (амбер на тёмно-сером с `f5e9ca` highlights) — пересечения с общими токенами почти нет.

### 2.12 VN-specific overlays

В [widgets/vn-overlay/](../src/widgets/vn-overlay/) и [features/vn/ui/](../src/features/vn/ui/):

- `VnOverlay` (главный wrapper)
- `VnNarrativePanel` / `VnSplitNarrativeDock` (split-layout сюжет/диалог)
- `VnLetterNarrativeLayer` (письмо-сцена с буквицей)
- `VnNarrativeBackgroundVisuals` (фон + параллакс)
- `VnFilmSoundPromptOverlay` (промпт по аудио)
- `VnSkillCheckResolveOverlay` + `VnSkillCheckDiceScene` (3D-кубики)
- `VnTokenFeedbackOverlay` (подсветка clickable-токенов)
- `VnHeader` / `VnLocationHeader` / `VnScreenHeader` (3 разных header'а 🙃)

Внутри `vn-typed-text` живёт собственная типографика (см. [TypedText.css](../src/features/vn/ui/TypedText.css)) — `Crimson Pro` сериф, `clamp(1.4rem, 3.2vw, 1.85rem)` размер, `line-height: 1.5`. Локальный override `[&_.vn-typed-text]:leading-[1.2]` в [LogSegmentRenderer.tsx](../src/features/vn/log/LogSegmentRenderer.tsx) — единственный известный потребитель этого пути.

---

## 3. Duplication Hotspots — что переписывается несколько раз

### 3.1 Аватары / speaker-tiles

Шесть реализаций «портрет в обводке» (см. §2.7). Между `VnInlineSpeakerBadge` (lg-вариант), `SpeakerHeader.avatar` и `ChoicePrimaryAvatar` — почти идентичная вёрстка: `flex size-X overflow-hidden rounded-[~4px] border bg-black/X`, fallback Lucide-icon, `data-testid` вокруг img. **Кандидат №1 на экстракцию**.

### 3.2 Popover / tooltip поведение

Реализован один раз в [VnChoiceButton.tsx:PrimaryVoiceFloat](../src/features/vn/ui/VnChoiceButton.tsx), но логически просится в `shared/ui/Popover`. На него уже косвенно намекают:

- `title`-fallback'ы во всех `*SpeakerBadge` (хочется заменить на нормальный hover-tooltip)
- inner_voice thought card в логе (всегда видимый — но в будущем может стать «по hover на иконку», как обсуждали раньше)
- skill check chance pill (хочется hover-объяснение)
- difficulty pill (DC + chance) тоже kандидат

### 3.3 Stance / tone colors

Сейчас четыре несвязанных словаря:

| Источник                                                                          | Success/positive                            | Failure/negative        | Neutral                 | Warning                  |
| --------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------- | ----------------------- | ------------------------ |
| `Toaster`                                                                         | `emerald-500/60 bg-emerald-950/90` (reward) | —                       | `stone-500/60` (info)   | `amber-500/60` (fact)    |
| `.status-line`                                                                    | `#86efac`                                   | `#fca5a5`               | `#9fb2d3`               | —                        |
| `MetricBox`                                                                       | `rgba(52,211,153,...)`                      | `rgba(248,113,113,...)` | `rgba(255,255,255,...)` | `rgba(251,191,36,...)`   |
| `STANCE_PALETTE` ([VnChoiceButton.tsx](../src/features/vn/ui/VnChoiceButton.tsx)) | `#34d399` (supports)                        | `#f87171` (opposes)     | —                       | —                        |
| `checkChance.ts` (tone)                                                           | `text-emerald-400` (confident)              | `text-rose-400`         | —                       | `text-amber-400` (risky) |

Все четыре сходятся в `emerald-* + rose-*/red-* + amber-*`, но прописаны независимо. Кандидат №2 на экстракцию — общий `tone.ts` (`success/danger/neutral/warning`) + опциональный stance-alias (`supports → success`, `opposes → danger`).

### 3.4 Card surfaces

Семь способов нарисовать карточку (см. §2.3). Самые системные — `SectionCard` ([characterPanelPrimitives.tsx](../src/features/character/panel/characterPanelPrimitives.tsx)) и `.card` ([AppShell.css](../src/app/AppShell.css)). Но они расходятся в палитре (тёмно-теплый vs тёмно-холодный) и в форме (clip-path corners vs `border-radius`). Кандидат №4 на консолидацию — единый `Surface` с вариантами `noir | shell | flat`.

### 3.5 Pill buttons / tabs

Дублирование между `.tab-row button` ([AppShell.css](../src/app/AppShell.css)) и `DossierTabButton` ([characterPanelPrimitives.tsx](../src/features/character/panel/characterPanelPrimitives.tsx)) — обе делают «pill-таб с активным glow», но в разных стилях. Map-specific `.gw-map-compact-card__toggle` — третий вариант. Кандидат на единый `<TabButton variant="pill | dossier">`.

### 3.6 Modal / sheet z-index ladder

`z-[70]` (ConfirmationModal) / `z-[100]` (Toaster) / `z-150` (bottom sheet wrapper) / `z-[200]` (popover, введён 2026-05-14) / `z-40` (VN screen) / `z-30` (popover локально) — нет центральной шкалы. Кандидат на простой `Z_INDEX` константный файл (или extending Tailwind `@theme`).

### 3.7 Mixed color systems

Самая фундаментальная проблема: **три параллельные палитры одновременно**:

| Слой                                | Дух                                                                |
| ----------------------------------- | ------------------------------------------------------------------ |
| Tailwind `@theme` + Noir-components | Тёплая амбер/шафран (`#f59f0a`) на угле (`#181511`)                |
| `AppShell.css` legacy               | Холодный slate/sky (`#1a2742`, `#60a5fa`, `#9fb2d3`)               |
| `characterPanel.theme.ts` palette   | Глубокий noir (`coal #0E0D0B`, `crimson #A61C2F`, `brass #B5852B`) |

Они **не выводятся** друг из друга и пересекаются на одном экране (например, `AdminPage` использует legacy slate, плюс Toaster — амбер/изумруд поверх). Это **не баг конкретного компонента**, это структурное расхождение, которое нужно решить на уровне дизайн-направления.

### 3.8 Палитра «C» дубликат

`OriginSelectionScreen.tsx` объявляет `const C = { coal, ink, bone, crimson, brass, ... }` **точно тот же**, что в `characterPanel.theme.ts`. Простой merge → один импорт. Кандидат на быстрый рефакторинг (5 минут).

### 3.9 `App.css` мёртвый код

[src/App.css](../src/App.css) — 136 строк grid-chat layout, который не используется текущими страницами. Импортируется в [src/App.tsx](../src/App.tsx), но классы (`.profile`, `.message-panel`, `.online`, `.new-message`) в коде не встречаются. Кандидат на удаление (предварительно убедиться, что нигде нет потребителей).

---

## 4. Prioritized Extraction Plan

> Порядок выбран по принципу «максимум блокировок снимается за минимум disruptive-изменений».

### 4.1 [P1] `shared/ui/Popover` — выделить из `PrimaryVoiceFloat`

**Зачем сейчас:** прямо сейчас в кодовой базе ровно одна работающая реализация (hover + tap + portal + click-outside + Escape + scroll-close + смещение по `getBoundingClientRect`). Сразу можно будет использовать для:

- inner-voice icons (если вернёмся к hover-открытию мысли)
- DC/chance pill в `VnChoiceButton`
- difficulty/cost hints в map ledger drawer
- replacing `title`-fallback'ов на читаемый popover

**Объём:** ~150 строк, копия логики из [VnChoiceButton.tsx:PrimaryVoiceFloat](../src/features/vn/ui/VnChoiceButton.tsx). API:

```ts
<Popover content={<…>} placement="top" trigger="hover" /* | 'click' | 'both' */>
  {triggerNode}
</Popover>
```

Внутренние состояния hover/tap/closing, портал — спрятаны.

**Тест-план:** один компонентный тест (`render → fireEvent.click → role="dialog" появляется`), копируется из существующего теста в [vn-ui.test.tsx](../src/features/vn/ui/vn-ui.test.tsx).

**Дальше:** VnChoiceButton переключается на `<Popover>` (минус ~120 строк); inner-voice hover wrapper можно нарастить позже.

### 4.2 [P1] `shared/tone/palette.ts` — единый tone/stance словарь

**Зачем сейчас:** дублирование в 4 точках (см. §3.3), и оно растёт каждый раз, когда добавляется новый «оттенок».

**API:**

```ts
export const TONE = {
  success: {
    fg: "#86efac",
    bg: "rgba(6,78,59,0.18)",
    border: "rgba(52,211,153,0.45)",
    glow: "rgba(52,211,153,0.32)",
  },
  danger: {
    fg: "#fca5a5",
    bg: "rgba(127,29,29,0.18)",
    border: "rgba(248,113,113,0.45)",
    glow: "rgba(248,113,113,0.32)",
  },
  warning: {
    fg: "#fcd34d",
    bg: "rgba(120,53,15,0.18)",
    border: "rgba(251,191,36,0.45)",
    glow: "rgba(251,191,36,0.32)",
  },
  neutral: {
    fg: "#e2e8f0",
    bg: "rgba(0,0,0,0.18)",
    border: "rgba(255,255,255,0.10)",
    glow: "rgba(255,255,255,0.06)",
  },
  info: {
    fg: "#bae6fd",
    bg: "rgba(12,74,110,0.18)",
    border: "rgba(56,189,248,0.45)",
    glow: "rgba(56,189,248,0.32)",
  },
} as const;

export const STANCE_TO_TONE = {
  supports: "success",
  opposes: "danger",
} as const;
```

**Затрагивает:** `Toaster`, `MetricBox`, `STANCE_PALETTE` в [VnChoiceButton.tsx](../src/features/vn/ui/VnChoiceButton.tsx), `.status-line.*` (последнее можно оставить как legacy и постепенно мигрировать).

**Объём:** новый файл `src/shared/ui/tone.ts` + точечные правки 3 потребителей. Не должен трогать `innerVoiceContract.palette` — там другая семантика (voice identity, не tone).

### 4.3 [P2] `shared/ui/AvatarTile` — единый speaker-avatar primitive

**Зачем сейчас:** три почти идентичные реализации квадратного аватара (см. §3.1). После выноса станет легко поддерживать единый размерный словарь (`sm | md | lg`) и единое поведение fallback'ов.

**API:**

```ts
<AvatarTile
  src={avatarUrl}
  alt={voiceLabel}
  size="md"           // 36px | 40px | 48px (привязано к будущим semantic-tokens)
  border={tone?.border ?? voicePalette.accent}
  glow={tone?.glow}
  fallback={FallbackIcon}
  disabled={isLocked}
/>
```

**Затрагивает:** `SpeakerHeader` (в `LogSegmentRenderer`), `ChoicePrimaryAvatar` (в `VnChoiceButton`), большая `VnInlineSpeakerBadge` size=`lg` (как ниже-уровневая обёртка). Оставляет 3-letter pill-вариант `VnInlineSpeakerBadge` как **отдельный** примитив для специфичных кейсов (тесты `OriginSelectionScreen` и др.), но текстовая часть пилюли становится опциональной.

**Не делать сейчас:** не схлопывать `VnInlineSpeakerBadge` целиком — у него отдельный test surface и широкое использование. Только перевести overlap.

### 4.4 [P2] `shared/ui/Surface` — единый card primitive

**Зачем сейчас:** семь стилей карточек (§2.3) сходятся к трём типажам:

| Variant             | Соответствие                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `surface="shell"`   | `.card` (AppShell legacy), сине-сланцевый, для admin/dev/command-пейджей                                       |
| `surface="noir"`    | `SectionCard` + `LogSegmentRenderer` inner-voice card, тёплый dark + amber/voice accent, clip-corners optional |
| `surface="overlay"` | `GlassBox` + `ConfirmationModal`-style, чёрный с `backdrop-blur`                                               |

**API:**

```ts
<Surface
  variant="noir | shell | overlay"
  tone?={Tone}                    // опционально окрашивает рамку/glow
  clipCorners?={boolean}          // только для noir
  className?={string}
>
  …
</Surface>
```

**Не делать сейчас:** мигрировать ВСЕ карточки. Сначала ввести примитив, затем мигрировать на нём 2-3 новых места, потом постепенно переносить старые в отдельных PR'ах.

### 4.5 [P3] Стратегия очистки legacy `.card` / `.panel-section`

**Подход:** не сносить разом. План:

1. Скопировать визуал `.card` (вариант `shell`) в `<Surface variant="shell">`.
2. Скопировать визуал `.panel-section` в `<PanelSection>` (фактически `<div className="grid gap-[0.9rem]">` — это короткий хелпер, можно не делать отдельный примитив).
3. По каждой странице из списка §1.2 — заменить `<div className="card">` → `<Surface variant="shell">`. Один PR на страницу, тесты обновляются по месту.
4. Когда последний потребитель ушёл — удалить блок из [AppShell.css](../src/app/AppShell.css) одним PR (включая `.choice-grid`, `.button-row`, `.tab-row`, `.status-line.*`, mind-grid и др.).
5. Параллельно: удалить мёртвый [src/App.css](../src/App.css) (см. §3.9) — это **независимая** уборка, можно делать отдельно от miграции.

### 4.6 [P3] Z-index централизация

**Объём:** один новый файл `src/shared/ui/zIndex.ts`:

```ts
export const Z = {
  vnScreen: 40,
  modal: 70,
  bottomSheet: 150,
  toaster: 100,
  popover: 200,
  navbar: 30,
  // …
} as const;
```

Параллельно — добавить `--z-modal`, `--z-popover` в `@theme` блок [index.css](../src/index.css), чтобы можно было использовать `z-modal` Tailwind-утилитой.

### 4.7 [P4] Дизайн-направление: единый цветовой курс

**Это политическое решение, не техническое.** Три параллельные палитры (§3.7) — это симптом того, что не было одного дизайнерского источника. Прежде чем переписывать что-либо большое:

- Зафиксировать, какая палитра — каноническая (амбер-noir, как у [characterPanel.theme.ts](../src/features/character/panel/characterPanel.theme.ts) и большинства новых VN-компонентов, выглядит наиболее последовательно).
- Решить, что делать со слой-сланцевой палитрой `AppShell.css` — мигрировать поверх каноники или оставить как «admin/dev tools»-исключение.

До этого шага рефакторинги 4.1–4.6 — безопасны (они не закрепляют ни одну из палитр), но любые большие визуальные правки могут пойти в стол.

---

## 5. Что НЕ входит в скоуп этой записи

- `src/module_bindings/` — генерируемый SpacetimeDB binding-код.
- `src/generated/` — генерируемые типы.
- `*.test.{ts,tsx}` — тесты не правим в этом проходе, кроме тех, что упомянуты в `Test Plan` будущих PR'ов.
- Backend, SpacetimeDB схемы, content-pipeline.
- Локализация (`src/features/i18n/`) — это отдельный аспект; токены/i18n развязаны.

## 6. Public API impact

**Документ ничего не экспортирует.** Все упомянутые `shared/ui/Popover`, `shared/ui/tone`, `shared/ui/AvatarTile`, `shared/ui/Surface`, `shared/ui/zIndex` — **предложения**, не введённые в кодовую базу. Каждая позиция плана 4.1–4.7 описана как отдельный будущий PR с собственным test-планом.

## 7. Test Plan (для этого PR)

- Документационная запись, runtime-тесты не нужны.
- Проверка: все пути в формате `[link text](../...)` указывают на существующие файлы. Список ключевых ссылок:
  - [src/index.css](../src/index.css)
  - [src/app/AppShell.css](../src/app/AppShell.css)
  - [src/App.css](../src/App.css)
  - [src/features/map/ui/mapExperience.css](../src/features/map/ui/mapExperience.css)
  - [src/features/vn/ui/VnSkillCheckFeedback.css](../src/features/vn/ui/VnSkillCheckFeedback.css)
  - [src/features/vn/ui/TypedText.css](../src/features/vn/ui/TypedText.css)
  - [src/features/character/panel/characterPanel.theme.ts](../src/features/character/panel/characterPanel.theme.ts)
  - [src/features/character/panel/characterPanelPrimitives.tsx](../src/features/character/panel/characterPanelPrimitives.tsx)
  - [src/features/origin/ui/OriginSelectionScreen.tsx](../src/features/origin/ui/OriginSelectionScreen.tsx)
  - [src/features/vn/ui/VnChoiceButton.tsx](../src/features/vn/ui/VnChoiceButton.tsx)
  - [src/features/vn/ui/VnInlineSpeakerBadge.tsx](../src/features/vn/ui/VnInlineSpeakerBadge.tsx)
  - [src/features/vn/log/LogSegmentRenderer.tsx](../src/features/vn/log/LogSegmentRenderer.tsx)
  - [src/shared/ui/](../src/shared/ui/) и его файлы
- `bun run format:check` — должен пройти, если markdown укладывается в prettier-конвенции репо.

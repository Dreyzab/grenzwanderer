# Текстовая вёрстка и Pretext

Обёртка над библиотекой [@chenglou/pretext](https://github.com/chenglou/pretext): измерение многострочного текста и переносов **без** `getBoundingClientRect` / лишних reflow в DOM. Полезно для предсказания высоты блоков, обрезки по числу визуальных строк и будущей виртуализации списков.

## Зависимость

- Пакет: `@chenglou/pretext` (см. `package.json`).

## Модуль `pretext.ts`

| Экспорт                                                                                       | Назначение                                                                                                                  |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `getPreparedText` / `getPreparedTextWithSegments`                                             | Однократный `prepare` с кешированием (см. ниже).                                                                            |
| `measureParagraphHeight(text, font, maxWidth, lineHeight, whiteSpace?)`                       | Высота и число строк для заданной ширины.                                                                                   |
| `measureSingleLineWidth(text, font, whiteSpace?)`                                             | Ширина одной строки (для эллипсиса и однострочных проверок).                                                                |
| `truncateTextToLines({ text, font, maxWidth, lineHeight, maxLines, ellipsis?, whiteSpace? })` | Обрезка с многоточием по **визуальным** строкам (графемы + бинарный поиск для последней строки).                            |
| `resetPretextCaches()`                                                                        | Очистка локальных LRU-кешей и внутреннего `clearCache()` Pretext (вызывается из `usePretextFontVersion` при смене шрифтов). |

### Кеш

- Два отдельных LRU-`Map` (до **512** записей каждый): для `PreparedText` и для `PreparedTextWithSegments`.
- При промахе вызывается `prepare` / `prepareWithSegments`; горячий путь — повторный `layout` / `layoutWithLines` без повторного `prepare` для того же текста и шрифта.

### Согласование с CSS

Строка `font` должна совпадать с тем, что реально рисует браузер (как для `CanvasRenderingContext2D.font`): размер, начертание, семейство. В [README Pretext](https://github.com/chenglou/pretext) указано избегать `system-ui` в цепочке семейств для точности на macOS — для измерений используйте **именованное** семейство (например `"IBM Plex Mono"`, `"Space Grotesk"`).

`lineHeight` в пикселях должен совпадать с `line-height` блока в UI.

## Связанные хуки (`@/shared/hooks`)

| Хук                            | Роль                                                                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `usePretextFontVersion(fonts)` | После `document.fonts.ready` / `loadingdone` и при явной `load()` сбрасывает кеши Pretext и увеличивает версию для пересчёта `useMemo`. Зависимость эффекта: `fonts.join("\0")`, чтобы не циклить при новой ссылке на массив с теми же строками. |
| `useElementContentWidth()`     | `ref` + `contentWidth` (внутренняя ширина с учётом padding) через `ResizeObserver`.                                                                                                                                                              |
| `useMediaQuery(query)`         | Совпадение медиазапроса; до монтирования в DOM возвращает `false` (безопасно для SSR).                                                                                                                                                           |

## Потребители в приложении

- **`DialogueBox`** / **`NarrationBox`**: предсказание высоты текста через `measureParagraphHeight`, анимация `height` у Framer Motion, загрузка шрифтов через `usePretextFontVersion`.
- **`InnerVoicesScroll`**, **`InnerVoicesColumn`**: превью через `truncateTextToLines` вместо грубой обрезки по числу символов.

## Дальнейшие идеи

- Виртуализация журнала VN с предрасчётом высот строк через `measureParagraphHeight`.
- «Сбалансированная» ширина блока диалога через `walkLineRanges` и бинарный поиск (см. документацию Pretext).
- Рендер строк в Canvas при необходимости кастомных эффектов (`layoutWithLines` + `fillText`).

---
id: ai_obsidian_operating_manual
tags:
  - type/policy
  - status/stable
  - audience/ai
aliases:
  - AI Obsidian Guide
  - Codex Obsidian SOP
---

# Инструкция для ИИ: устройство и пользование Obsidian

## Зачем нужен этот документ

Человек видит vault через Graph View и визуальные связи.  
ИИ работает как файловый агент: читает/пишет markdown-файлы по путям и ссылкам.  
Из-за этого одна и та же база может выглядеть "чистой" для человека и "двусмысленной" для ИИ.

## Как ИИ видит Obsidian

1. ИИ не "смотрит" граф как человек. Он анализирует:
   `имя файла`, `полный путь`, `вики-ссылки [[...]]`, `frontmatter`.
2. Два файла с одинаковым basename (например, `MOC_Parliament.md` в разных папках) для графа создают дубли узлов и неоднозначность.
3. Короткая ссылка `[[MOC_Parliament]]` небезопасна при дублях имен.
4. Надежная ссылка для ИИ: `[[20_Game_Design/Voices/MOC_Parliament|MOC_Parliament]]`.

## Канонические правила

1. Одна сущность = один canonical файл `.md`.
2. Для ключевых MOC и систем запрещены дубли basename.
3. Для критичных узлов использовать path-based wikilinks, не только basename.
4. Старые/временные копии не держать как `.md`; переносить в `.legacy.txt` или удалять.
5. Legacy-названия хранить в `aliases`, а не в дублирующих заметках.
6. `id` в frontmatter должен быть уникален внутри vault.

## Рабочий протокол ИИ при любом изменении

1. Найти дубли basename среди `.md`.
2. Проверить все входящие ссылки на изменяемую заметку.
3. Изменить заметку и обновить ссылки на path-based там, где узел критичен.
4. Перепроверить, что дублей basename больше нет.
5. Обновить индексный MOC или `00_Start_Here`, если добавлен новый системный документ.

## Минимальная валидация (PowerShell)

```powershell
# 1) Поиск дублей basename среди markdown
$files = Get-ChildItem -Path obsidian/Detectiv -Recurse -File -Filter *.md
$files | Group-Object Name | Where-Object { $_.Count -gt 1 } | ForEach-Object {
  "## $($_.Name)"
  $_.Group.FullName
  ""
}

# 2) Где используется конкретная ссылка
rg -n "\[\[MOC_Parliament" obsidian/Detectiv

# 3) Поиск ссылок вида [[READ_ME]] (обычно нежелательны)
rg -n "\[\[READ_ME(\||\]\])" obsidian/Detectiv
```

## Структура vault (рабочая модель для ИИ)

1. `00_Map_Room` - навигация, MOC, дашборды.
2. `10_Narrative` - сюжет, сцены, персонажи.
3. `20_Game_Design` - механики и системный дизайн.
4. `30_World_Intel` - лор и энциклопедия.
5. `99_System` - правила, шаблоны, operational docs.

## Правило Graph Hygiene

1. Если в графе появился дубликат узла, сначала искать совпадения basename.
2. Если есть пустой/устаревший дубль, убрать его из `.md` пространства.
3. После rename/move обязательно проверить ссылки через `rg`, потому что ИИ делает rename вне UI Obsidian.

## Source of Truth

1. Нарратив и контент: canonical в Obsidian.
2. Формулы и runtime-поведение: canonical в коде.
3. При изменении поведения в коде обновлять intent-note в Obsidian в том же цикле.

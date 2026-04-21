# OpenViking: Гайд для агентов и разработчиков

## Что это такое

OpenViking — локальный MCP-сервер, который хранит проиндексированный контекст проекта (архитектура, правила, справочные документы) и выдаёт его агенту по запросу. Работает на `http://127.0.0.1:1933`.

Главная идея: **не заставлять агента каждый раз перечитывать всю кодовую базу**, а давать ему структурированную «память проекта», доступную через URI-схему `viking://`.

---

## Доступные инструменты (4 штуки)

### 1. `get_viking_status`

Проверка здоровья сервера. Без параметров.

**Когда использовать:** В начале сессии, чтобы убедиться что OpenViking жив и инициализирован.

```
→ get_viking_status()
← { health: "ok", initialized: true, user: "default" }
```

---

### 2. `grep_context` — текстовый/regex поиск

Ищет по содержимому всех проиндексированных документов. Аналог `grep`/`rg`, но внутри Viking-хранилища.

| Параметр           | Тип         | Описание                                           |
| ------------------ | ----------- | -------------------------------------------------- |
| `pattern`          | string      | **Обязательный.** Текст или регулярное выражение   |
| `uri`              | string      | Область поиска. По умолчанию `viking://resources/` |
| `case_insensitive` | bool        | Игнорировать регистр (default: false)              |
| `node_limit`       | int (1-200) | Максимум результатов                               |

**Примеры:**

```
// Найти все упоминания reducers
grep_context(pattern: "reducer", case_insensitive: true, node_limit: 20)

// Искать только внутри архитектурных документов
grep_context(pattern: "SpacetimeDB", uri: "viking://resources/ARCHITECTURE/")

// Regex: найти все имена файлов *.ts в документации
grep_context(pattern: "\\.ts[`)]", node_limit: 50)
```

**Что возвращает:** Массив `matches`, каждый элемент содержит `uri`, `line`, `content`.

**Трюк для обнаружения структуры:** `grep_context(pattern: ".*", uri: "viking://resources/", node_limit: 50)` — покажет все проиндексированные документы и их первые строки. Полезно, чтобы понять, что вообще лежит в хранилище.

---

### 3. `query_context` — семантический поиск

Ищет по смыслу, а не по тексту. Использует embeddings.

| Параметр          | Тип         | Описание                                       |
| ----------------- | ----------- | ---------------------------------------------- |
| `query`           | string      | **Обязательный.** Запрос на естественном языке |
| `limit`           | int (1-50)  | Максимум результатов (default: 10)             |
| `target_uri`      | string      | URI-префикс для сужения области поиска         |
| `score_threshold` | float (0-1) | Минимальный порог релевантности                |
| `filter`          | object      | Дополнительные фильтры по метаданным           |

**Примеры:**

```
// Как устроена система контента?
query_context(query: "content release lifecycle and versioning")

// Какие таблицы публичные?
query_context(query: "public tables visibility", limit: 5)

// Только внутри архитектуры
query_context(query: "acceptance tests", target_uri: "viking://resources/ARCHITECTURE/")
```

> **Текущий статус:** Семантический поиск может быть недоступен из-за проблем с embedding-моделью (Google API). Если `query_context` возвращает ошибку — используй `grep_context` как fallback.

---

### 4. `read_context` — чтение конкретного документа

Читает содержимое по точному URI. Три режима просмотра.

| Параметр | Тип    | Описание                                                                            |
| -------- | ------ | ----------------------------------------------------------------------------------- |
| `uri`    | string | **Обязательный.** Точный `viking://` URI                                            |
| `view`   | enum   | `read` (полный текст), `overview` (обзор директории), `abstract` (краткое описание) |
| `offset` | int    | Начать с N-й строки                                                                 |
| `limit`  | int    | Сколько строк прочитать (-1 = все)                                                  |

**Примеры:**

```
// Прочитать весь документ архитектуры
read_context(uri: "viking://resources/ARCHITECTURE/Grenzwanderer_Architecture/Scope_5more.md")

// Получить обзор раздела
read_context(uri: "viking://resources/ARCHITECTURE/", view: "overview")

// Краткое описание (abstract) — одна строка
read_context(uri: "viking://resources/ARCHITECTURE/Grenzwanderer_Architecture/.abstract.md", view: "abstract")
```

---

## URI-схема

```
viking://resources/                              — корень хранилища
viking://resources/ARCHITECTURE/                 — архитектурные документы
viking://resources/ARCHITECTURE/Grenzwanderer_Architecture/
                                                 — документы архитектуры Grenzwanderer
viking://skills/                                 — навыки (пока не настроены)
viking://memories/                               — воспоминания (пока не настроены)
```

Каждая директория может содержать:

- `.overview.md` — описание раздела
- `.abstract.md` — однострочное описание
- Обычные `.md` файлы — содержимое

---

## Алгоритм работы агента с OpenViking

### Шаг 1: Проверка доступности

```
get_viking_status()
```

Если `status: "ok"` — продолжаем.

### Шаг 2: Разведка структуры

```
grep_context(pattern: ".*", uri: "viking://resources/", node_limit: 50)
```

Это даёт карту всего, что проиндексировано.

### Шаг 3: Поиск релевантного контекста

**Знаешь ключевое слово** → `grep_context`:

```
grep_context(pattern: "visibility", case_insensitive: true)
```

**Знаешь только тему** → `query_context` (если работает):

```
query_context(query: "how does content publishing work")
```

### Шаг 4: Чтение найденного документа

```
read_context(uri: "viking://resources/ARCHITECTURE/Grenzwanderer_Architecture/Scope_5more.md")
```

### Шаг 5: Использование контекста в работе

Полученная информация из OpenViking — это **проектные решения и архитектурные ограничения**. Агент должен:

- Учитывать их при написании кода
- Не противоречить задокументированным контрактам
- Ссылаться на конкретные документы при обосновании решений

---

## Что сейчас проиндексировано (Grenzwanderer)

| URI                                                                         | Содержимое                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `viking://resources/ARCHITECTURE/Grenzwanderer_Architecture/Scope_5more.md` | Runtime layers, acceptance contract, visibility contract, content release lifecycle |

Документ покрывает:

- **4 runtime-слоя** (client, backend reducers, schema, content authoring)
- **Acceptance contract** — какие user flows поддерживаются, как проверяются
- **Visibility contract** — какие таблицы публичные и почему
- **Content release lifecycle** — от авторинга в Obsidian до публикации через CLI

---

## Когда НЕ нужен OpenViking

- Для чтения конкретных файлов проекта — используй `Read` / `Glob` / `Grep` напрямую
- Для git-истории — используй `git log` / `git blame`
- Для запуска команд — используй `Bash`

OpenViking хранит **концептуальный контекст**, а не код.

---

## Типичные ошибки

1. **Использовать `query_context` без fallback.** Семантический поиск зависит от внешнего API — всегда имей план Б с `grep_context`.
2. **Забыть про `node_limit`.** Без лимита можно получить огромный ответ. Ставь 10-50 для начала.
3. **Искать в несуществующих scope.** `viking://skills/` и `viking://memories/` пока не настроены — не трать запросы.
4. **Путать Viking-контекст с кодом.** Документы в Viking могут устареть — при сомнениях проверяй актуальность по реальным файлам в репо.

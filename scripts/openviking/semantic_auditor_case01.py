#!/usr/bin/env python3
"""
Семантический аудит сцен Case 01 (Narrative) через OpenViking.

Индексация (вариант A из плана): лор Obsidian входит в профиль `data`.
Перед прогоном убедитесь, что сервер OpenViking запущен и индекс обновлён:

  bun run openviking:start
  bun run openviking:index:data

Поиск выполняется через HTTP API (`SyncHTTPClient.find`), чтобы запросы могли
содержать пробелы (в отличие от некоторых сборок CLI `ov find` на Windows).

LLM-шаг (сравнение сцены с найденным контекстом): задаётся переменной
OPENAI_API_KEY. Модель — OPENAI_AUDIT_MODEL (по умолчанию gpt-4o-mini).
С флагом --find-only отчёт содержит только результаты find без вызова OpenAI.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def _repo_root_from_script() -> Path:
    # .../Grenzwanderer/scripts/openviking/thisfile.py -> repo root (parent of Grenzwanderer)
    return Path(__file__).resolve().parent.parent.parent.parent


def _project_dir() -> Path:
    return _repo_root_from_script() / "Grenzwanderer"


def _strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4 :].lstrip("\n")
    return text


def _scene_excerpt_for_query(body: str, max_len: int = 600) -> str:
    body = _strip_frontmatter(body)
    body = re.sub(r"^#+\s+.*$", " ", body, flags=re.MULTILINE)
    body = re.sub(r"\s+", " ", body).strip()
    return body[:max_len] if body else "Case 01 narrative scene"


def _normalize_rel_path(p: Path, project: Path) -> str:
    try:
        return str(p.resolve().relative_to(project.resolve()))
    except ValueError:
        return str(p)


def collect_scene_files(
    project: Path,
    *,
    storydetective_plot_only: bool,
) -> list[Path]:
    detectiv = sorted(
        (project / "obsidian" / "Detectiv" / "10_Narrative" / "Scenes").glob(
            "node_case1_*.md"
        )
    )
    sd_root = project / "obsidian" / "StoryDetective" / "40_GameViewer" / "Case01"
    if storydetective_plot_only:
        sd = sorted((sd_root / "Plot").rglob("*.md"))
    else:
        sd = sorted(sd_root.rglob("*.md"))
    seen: set[Path] = set()
    out: list[Path] = []
    for p in detectiv + sd:
        rp = p.resolve()
        if rp in seen:
            continue
        seen.add(rp)
        if p.is_file():
            out.append(p)
    return out


def contexts_to_payload(result: Any) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for ctx in result:
        rows.append(
            {
                "uri": getattr(ctx, "uri", "") or "",
                "score": getattr(ctx, "score", 0.0),
                "abstract": getattr(ctx, "abstract", "") or "",
                "overview": getattr(ctx, "overview", None) or "",
            }
        )
    return rows


def filter_out_self(sources: list[dict[str, Any]], scene_rel: str) -> list[dict[str, Any]]:
    """Исключить чанки, явно относящиеся к тому же файлу (по суффиксу пути)."""
    key = scene_rel.replace("\\", "/").lower()
    out: list[dict[str, Any]] = []
    for s in sources:
        uri = (s.get("uri") or "").lower()
        if key and uri.endswith(key.lower()):
            continue
        if key and key in uri.replace("\\", "/"):
            continue
        out.append(s)
    return out if out else sources


def openai_chat(
    messages: list[dict[str, str]],
    *,
    api_key: str,
    model: str,
    timeout_s: float = 120.0,
) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI HTTP {e.code}: {body}") from e
    choices = raw.get("choices") or []
    if not choices:
        raise RuntimeError(f"OpenAI: пустой ответ: {raw!r}")
    msg = choices[0].get("message") or {}
    return (msg.get("content") or "").strip()


@dataclass
class AuditConfig:
    project_dir: Path
    node_limit: int
    find_only: bool
    dry_run: bool
    max_files: int | None
    storydetective_plot_only: bool
    out_path: Path
    openai_model: str
    http_timeout_s: float


def run_audit(cfg: AuditConfig) -> int:
    scenes = collect_scene_files(
        cfg.project_dir, storydetective_plot_only=cfg.storydetective_plot_only
    )
    if cfg.max_files is not None:
        scenes = scenes[: cfg.max_files]

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not cfg.dry_run and not cfg.find_only and not api_key:
        print(
            "OPENAI_API_KEY не задан — включён режим только find (как --find-only).",
            file=sys.stderr,
        )
        cfg.find_only = True

    client: Any = None
    if not cfg.dry_run:
        try:
            from openviking_cli.client.sync_http import SyncHTTPClient
        except ImportError:
            print(
                "Нужен пакет openviking_cli (запускайте через Python из ov_venv), например:\n"
                "  ..\\..\\..\\ov_venv\\Scripts\\python.exe scripts/openviking/semantic_auditor_case01.py",
                file=sys.stderr,
            )
            return 2
        client = SyncHTTPClient(timeout=cfg.http_timeout_s)
        client.initialize()
    try:
        lines: list[str] = [
            "# Семантический аудит Case 01",
            "",
            f"- Сгенерировано: {datetime.now(timezone.utc).isoformat()}",
            f"- Профиль индексации лора: `data` (`bun run openviking:index:data`).",
            f"- Файлов сцен: {len(scenes)}",
            f"- find node_limit: {cfg.node_limit}",
            f"- LLM: {'нет' if cfg.find_only else cfg.openai_model}",
            "",
        ]

        for path in scenes:
            rel = _normalize_rel_path(path, cfg.project_dir)
            lines.append("---")
            lines.append(f"## `{rel}`")
            lines.append("")
            try:
                text = path.read_text(encoding="utf-8-sig")
            except OSError as e:
                lines.append(f"_Ошибка чтения_: {e}")
                lines.append("")
                continue

            q1 = _scene_excerpt_for_query(text)
            queries = [
                q1,
                "противоречия канона Freiburg детектив улики персонажи",
            ]

            if cfg.dry_run:
                lines.append(f"_dry-run_: запросы find: {queries!r}")
                lines.append("")
                continue

            assert client is not None
            all_sources: list[dict[str, Any]] = []
            for q in queries:
                try:
                    fr = client.find(q, node_limit=max(3, cfg.node_limit // 2))
                    all_sources.extend(contexts_to_payload(fr))
                except Exception as e:
                    lines.append(f"_Ошибка OpenViking find_: `{e}`")
                    lines.append("")

            # дедуп по uri
            by_uri: dict[str, dict[str, Any]] = {}
            for s in all_sources:
                u = s.get("uri") or ""
                if u and u not in by_uri:
                    by_uri[u] = s
                elif not u:
                    by_uri[f"__nouri_{len(by_uri)}"] = s
            merged = list(by_uri.values())
            merged.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)
            merged = merged[: cfg.node_limit]
            merged = filter_out_self(merged, rel)

            lines.append("### Контекст (OpenViking find)")
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(merged, ensure_ascii=False, indent=2))
            lines.append("```")
            lines.append("")

            if cfg.find_only:
                lines.append("_LLM пропущен (--find-only или нет ключа)._")
                lines.append("")
                continue

            prompt_user = (
                "Ты редактор лора детективной игры. Ниже текст ОДНОЙ сцены и фрагменты из векторного "
                "поиска по остальному лору (uri, abstract/overview).\n\n"
                "Задача: есть ли в сцене противоречия с историей мира, фактами, уликами или другими "
                "сценами, судя по приведённому контексту? Явные дыры или несостыковки?\n\n"
                "Ответ структурируй по-русски:\n"
                "1) Краткий вердикт (есть/нет существенных противоречий).\n"
                "2) Список пунктов с указанием URI источника из контекста, если применимо.\n"
                "3) Если данных мало — напиши «недостаточно контекста».\n\n"
                f"### Сцена ({rel})\n\n{text[:12000]}\n\n"
                f"### Контекст find (JSON)\n\n{json.dumps(merged, ensure_ascii=False)}"
            )
            try:
                answer = openai_chat(
                    [
                        {
                            "role": "system",
                            "content": "Ты помощник по согласованности нарратива. Будь конкретен, без выдумывания фактов вне контекста.",
                        },
                        {"role": "user", "content": prompt_user},
                    ],
                    api_key=api_key,
                    model=cfg.openai_model,
                )
                lines.append("### Вывод модели")
                lines.append("")
                lines.append(answer)
                lines.append("")
            except Exception as e:
                lines.append(f"_Ошибка OpenAI_: `{e}`")
                lines.append("")

        cfg.out_path.parent.mkdir(parents=True, exist_ok=True)
        cfg.out_path.write_text("\n".join(lines), encoding="utf-8")
        msg = f"Отчёт записан: {cfg.out_path}"
        try:
            print(msg)
        except UnicodeEncodeError:
            print(f"Report written: {cfg.out_path}")
    finally:
        if client is not None:
            client.close()
    return 0


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Семантический аудит Case 01 через OpenViking + OpenAI.")
    p.add_argument(
        "--project-dir",
        type=Path,
        default=None,
        help="Корень Grenzwanderer (по умолчанию вычисляется из расположения скрипта).",
    )
    p.add_argument("--node-limit", type=int, default=12, help="Лимит чанков find на сцену.")
    p.add_argument("--max-files", type=int, default=None, help="Ограничить число файлов (смоук).")
    p.add_argument(
        "--storydetective-plot-only",
        action="store_true",
        help="Для StoryDetective учитывать только подпапку Plot/.",
    )
    p.add_argument("--find-only", action="store_true", help="Не вызывать OpenAI, только find.")
    p.add_argument("--dry-run", action="store_true", help="Только список файлов и запросы.")
    p.add_argument(
        "--timeout",
        type=float,
        default=45.0,
        help="Таймаут HTTP к OpenViking (сек), по умолчанию 45.",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Путь отчёта Markdown (по умолчанию Grenzwanderer/reports/semantic_audit_case01.md).",
    )
    return p.parse_args(list(argv) if argv is not None else None)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError, ValueError):
            pass
    args = parse_args()
    project = args.project_dir or _project_dir()
    out = args.out or (project / "reports" / "semantic_audit_case01.md")
    model = os.environ.get("OPENAI_AUDIT_MODEL", "gpt-4o-mini").strip()
    cfg = AuditConfig(
        project_dir=project.resolve(),
        node_limit=max(1, args.node_limit),
        find_only=args.find_only,
        dry_run=args.dry_run,
        max_files=args.max_files,
        storydetective_plot_only=args.storydetective_plot_only,
        out_path=out.resolve(),
        openai_model=model,
        http_timeout_s=max(5.0, float(args.timeout)),
    )
    return run_audit(cfg)


if __name__ == "__main__":
    raise SystemExit(main())

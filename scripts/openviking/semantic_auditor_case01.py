#!/usr/bin/env python3
"""
Semantic Case01 narrative audit via OpenViking HTTP API.

Recommended preparation:

  bun run openviking:start
  bun run openviking:index:runtime
  bun run openviking:index:case01
  bun run openviking:index:design
  bun run openviking:index:roadmap

Use --find-only to skip the OpenAI comparison step. OPENAI_API_KEY is required
only when the LLM step is enabled.
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


def _normalize_rel_path(path: Path, project: Path) -> str:
    try:
        return str(path.resolve().relative_to(project.resolve()))
    except ValueError:
        return str(path)


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
    storydetective_root = (
        project / "obsidian" / "StoryDetective" / "40_GameViewer" / "Case01"
    )
    storydetective = (
        sorted((storydetective_root / "Plot").rglob("*.md"))
        if storydetective_plot_only
        else sorted(storydetective_root.rglob("*.md"))
    )
    seen: set[Path] = set()
    out: list[Path] = []
    for entry in detectiv + storydetective:
        resolved = entry.resolve()
        if resolved in seen or not entry.is_file():
            continue
        seen.add(resolved)
        out.append(entry)
    return out


def filter_out_self(sources: list[dict[str, Any]], scene_rel: str) -> list[dict[str, Any]]:
    key = scene_rel.replace("\\", "/").lower()
    filtered: list[dict[str, Any]] = []
    for source in sources:
        uri = str(source.get("uri") or "").replace("\\", "/").lower()
        if key and (uri.endswith(key) or key in uri):
            continue
        filtered.append(source)
    return filtered or sources


def openviking_request(
    base_url: str,
    endpoint: str,
    *,
    payload: dict[str, Any] | None = None,
    timeout_s: float = 45.0,
) -> dict[str, Any]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{endpoint}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_s) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenViking HTTP {error.code}: {body}") from error


def openviking_find(
    base_url: str,
    query: str,
    *,
    limit: int,
    timeout_s: float,
) -> list[dict[str, Any]]:
    response = openviking_request(
        base_url,
        "/api/v1/search/find",
        payload={"query": query, "limit": limit},
        timeout_s=timeout_s,
    )
    result = response.get("result")
    if not isinstance(result, dict):
        return []

    rows: list[dict[str, Any]] = []
    for bucket_name in ("resources", "skills", "memories"):
        bucket = result.get(bucket_name) or []
        if not isinstance(bucket, list):
            continue
        for item in bucket:
            if not isinstance(item, dict):
                continue
            rows.append(
                {
                    "uri": item.get("uri", "") or "",
                    "score": item.get("score", 0.0),
                    "abstract": item.get("abstract", "") or "",
                    "overview": item.get("overview", None) or "",
                }
            )
    return rows


def openai_chat(
    messages: list[dict[str, str]],
    *,
    api_key: str,
    model: str,
    timeout_s: float = 120.0,
) -> str:
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(
            {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
            }
        ).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_s) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI HTTP {error.code}: {body}") from error

    choices = raw.get("choices") or []
    if not choices:
        raise RuntimeError(f"OpenAI returned no choices: {raw!r}")
    message = choices[0].get("message") or {}
    return str(message.get("content") or "").strip()


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
    base_url: str


def run_audit(cfg: AuditConfig) -> int:
    scenes = collect_scene_files(
        cfg.project_dir,
        storydetective_plot_only=cfg.storydetective_plot_only,
    )
    if cfg.max_files is not None:
        scenes = scenes[: cfg.max_files]

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not cfg.dry_run and not cfg.find_only and not api_key:
        print(
            "OPENAI_API_KEY is not set; switching to find-only mode.",
            file=sys.stderr,
        )
        cfg.find_only = True

    if not cfg.dry_run:
        try:
            openviking_request(cfg.base_url, "/health", timeout_s=cfg.http_timeout_s)
        except Exception as error:
            print(
                f"OpenViking health check failed for {cfg.base_url}: {error}",
                file=sys.stderr,
            )
            return 2

    lines: list[str] = [
        "# Semantic Case01 Audit",
        "",
        f"- generated_at: {datetime.now(timezone.utc).isoformat()}",
        f"- openviking_base_url: `{cfg.base_url}`",
        "- recommended_index_profiles: `runtime`, `case01`, `design`, `roadmap`",
        f"- scene_files: {len(scenes)}",
        f"- find_node_limit: {cfg.node_limit}",
        f"- llm: {'disabled' if cfg.find_only else cfg.openai_model}",
        "",
    ]

    for scene_path in scenes:
        rel = _normalize_rel_path(scene_path, cfg.project_dir)
        lines.append("---")
        lines.append(f"## `{rel}`")
        lines.append("")
        try:
            text = scene_path.read_text(encoding="utf-8-sig")
        except OSError as error:
            lines.append(f"_read_error_: {error}")
            lines.append("")
            continue

        excerpt_query = _scene_excerpt_for_query(text)
        queries = [
            excerpt_query,
            "Freiburg Case01 canon contradictions leads bureau finale",
            "Lotte Weber Lotte Fischer Fritz Muller Fritz Mueller",
        ]

        if cfg.dry_run:
            lines.append(f"_dry_run_queries_: {queries!r}")
            lines.append("")
            continue

        merged_sources: list[dict[str, Any]] = []
        for query in queries:
            try:
                merged_sources.extend(
                    openviking_find(
                        cfg.base_url,
                        query,
                        limit=max(3, cfg.node_limit // 2),
                        timeout_s=cfg.http_timeout_s,
                    )
                )
            except Exception as error:
                lines.append(f"_openviking_find_error_: `{error}`")
                lines.append("")

        deduped_by_uri: dict[str, dict[str, Any]] = {}
        for source in merged_sources:
            uri = str(source.get("uri") or "")
            key = uri if uri else f"__nouri_{len(deduped_by_uri)}"
            if key not in deduped_by_uri:
                deduped_by_uri[key] = source

        merged = list(deduped_by_uri.values())
        merged.sort(key=lambda item: float(item.get("score") or 0.0), reverse=True)
        merged = filter_out_self(merged[: cfg.node_limit], rel)

        lines.append("### OpenViking Context")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(merged, ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")

        if cfg.find_only:
            lines.append("_llm_step_skipped_")
            lines.append("")
            continue

        prompt = (
            "You are auditing narrative consistency for a detective game.\n\n"
            "Task:\n"
            "1. Say whether this scene has a meaningful contradiction with the provided canon context.\n"
            "2. List the contradictions or holes with concrete URIs when possible.\n"
            "3. If context is insufficient, say so explicitly.\n\n"
            f"### Scene ({rel})\n\n{text[:12000]}\n\n"
            f"### OpenViking context\n\n{json.dumps(merged, ensure_ascii=False)}"
        )

        try:
            answer = openai_chat(
                [
                    {
                        "role": "system",
                        "content": "Be concrete. Do not invent facts outside the provided context.",
                    },
                    {"role": "user", "content": prompt},
                ],
                api_key=api_key,
                model=cfg.openai_model,
            )
            lines.append("### Model Verdict")
            lines.append("")
            lines.append(answer)
            lines.append("")
        except Exception as error:
            lines.append(f"_openai_error_: `{error}`")
            lines.append("")

    cfg.out_path.parent.mkdir(parents=True, exist_ok=True)
    cfg.out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Report written: {cfg.out_path}")
    return 0


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Semantic Case01 audit via OpenViking HTTP + optional OpenAI review."
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:1933",
        help="Base URL for the OpenViking HTTP API.",
    )
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=None,
        help="Grenzwanderer project directory.",
    )
    parser.add_argument("--node-limit", type=int, default=12)
    parser.add_argument("--max-files", type=int, default=None)
    parser.add_argument("--storydetective-plot-only", action="store_true")
    parser.add_argument("--find-only", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--timeout", type=float, default=45.0)
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output markdown path.",
    )
    return parser.parse_args(list(argv) if argv is not None else None)


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
        base_url=str(args.base_url).strip() or "http://127.0.0.1:1933",
    )
    return run_audit(cfg)


if __name__ == "__main__":
    raise SystemExit(main())

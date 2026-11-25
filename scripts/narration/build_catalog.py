"""Generate both voices and register each lesson after verifying its audio."""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
from pathlib import Path
import subprocess
import sys


SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT = SCRIPTS_DIR.parents[1]
CACHE = ROOT / ".cache/narration"
CATALOG = ROOT / "src/narration/catalog.json"
VOICES = ("santa", "dora")
WEB_LESSONS = (
    "integracao-front-e-api",
    "node-e-express",
    "react-rotas-e-requisicoes",
    "tailwind-na-pratica",
)


def needs_refresh(lesson_id):
    lesson_dir = ROOT / "public/narration" / lesson_id
    script = json.loads((CACHE / "scripts" / f"{lesson_id}.script.json").read_text())
    try:
        manifest = json.loads((lesson_dir / "manifest.json").read_text())
        if not set(VOICES).issubset(manifest["availableVoices"]):
            return True
        if manifest.get("uncoveredBlocks") != script.get("uncoveredBlocks"):
            return True
        expected = {clip["id"]: clip for clip in script["clips"]}
        actual = {clip["id"]: clip for clip in manifest["clips"]}
        if expected.keys() != actual.keys():
            return True
        for clip_id, clip in expected.items():
            existing = actual[clip_id]
            if any(existing.get(field) != clip.get(field) for field in ("textHash", "pauseAfter", "interactiveKind")):
                return True
            for voice in VOICES:
                audio = existing["audio"][voice]
                size = (lesson_dir / audio["src"]).stat().st_size
                if not size or size != audio["bytes"]:
                    return True
    except (OSError, json.JSONDecodeError, KeyError):
        return True
    return False


def build_lesson(lesson_id):
    log_path = CACHE / "batch" / f"{lesson_id}.log"
    with log_path.open("w", encoding="utf-8") as log:
        for script, options in (
            ("generate_narration.py", ["--voices", ",".join(VOICES)]),
            ("verify_narration.py", []),
        ):
            result = subprocess.run(
                [sys.executable, str(SCRIPTS_DIR / script), "--lesson", lesson_id, *options],
                stdout=log,
                stderr=subprocess.STDOUT,
                env={**os.environ, "PYTHONUNBUFFERED": "1"},
            )
            if result.returncode:
                print(f"{script} exited with code {result.returncode}", file=log, flush=True)
                return log_path
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jobs", type=int, default=3)
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument("--lesson", action="append", help="Generate only this lesson (repeatable)")
    selection.add_argument("--remaining", action="store_true", help="Skip lessons already registered in the catalog")
    selection.add_argument("--stale", action="store_true", help="Refresh changed or incomplete lessons already in the catalog")
    selection.add_argument("--check", action="store_true", help="Check the exported scripts and both voices without generating audio")
    args = parser.parse_args()
    if args.jobs < 1:
        parser.error("--jobs must be at least 1")

    audit = json.loads((CACHE / "catalog-audit.json").read_text())
    available_ids = audit["lessonIds"]
    targets = list(dict.fromkeys(args.lesson or [*WEB_LESSONS, *available_ids]))
    if any(lesson_id not in available_ids for lesson_id in targets):
        parser.error("Unknown lesson ID in requested batch")
    (CACHE / "batch").mkdir(parents=True, exist_ok=True)
    published = set(json.loads(CATALOG.read_text()))
    if args.check:
        deferred = set(audit.get("deferredLessonIds", [])) - published
        errors = [
            f"Missing from the narration catalog: {item}"
            for item in sorted(set(available_ids) - published - deferred)
        ]
        errors.extend(f"Unknown lesson in the narration catalog: {item}" for item in sorted(published - set(available_ids)))
        for lesson_id in available_ids:
            if lesson_id in published and needs_refresh(lesson_id):
                errors.append(f"Missing or out-of-date narration: {lesson_id}")
        for error in errors:
            print(error, file=sys.stderr)
        if not errors:
            print(f"Checked {len(available_ids) - len(deferred)} lessons with Santa and Dora.")
            if deferred:
                print(f"Narration pending for {len(deferred)} lessons: {', '.join(sorted(deferred))}.")
        return int(bool(errors))
    if args.remaining:
        targets = [lesson_id for lesson_id in targets if lesson_id not in published]
    if args.stale:
        targets = [lesson_id for lesson_id in targets if lesson_id in published and needs_refresh(lesson_id)]
    if not targets:
        print("No remaining lessons.")
        return 0
    failures = []
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = {pool.submit(build_lesson, lesson_id): lesson_id for lesson_id in targets}
        for index, future in enumerate(as_completed(futures), start=1):
            lesson_id = futures[future]
            error_log = future.result()
            if error_log:
                failures.append(lesson_id)
                print(f"[{index}/{len(targets)}] FAIL {lesson_id}: {error_log}", flush=True)
                continue
            if lesson_id not in published:
                published.add(lesson_id)
                pending = CATALOG.with_suffix(".json.tmp")
                pending.write_text(json.dumps(sorted(published), indent=2) + "\n", encoding="utf-8")
                pending.replace(CATALOG)
            print(f"[{index}/{len(targets)}] OK {lesson_id}", flush=True)
    return int(bool(failures))


if __name__ == "__main__":
    sys.exit(main())

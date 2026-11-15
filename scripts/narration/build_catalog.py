"""Generate both voices and register each lesson after verifying its audio."""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import subprocess
import sys


SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT = SCRIPTS_DIR.parents[1]
CACHE = ROOT / ".cache/narration"
CATALOG = ROOT / "src/narration/catalog.json"
WEB_LESSONS = (
    "integracao-front-e-api",
    "node-e-express",
    "react-rotas-e-requisicoes",
    "tailwind-na-pratica",
)


def build_lesson(lesson_id):
    log_path = CACHE / "batch" / f"{lesson_id}.log"
    with log_path.open("w", encoding="utf-8") as log:
        for script, options in (
            ("generate_narration.py", ["--voices", "santa,dora"]),
            ("verify_narration.py", []),
        ):
            result = subprocess.run(
                [sys.executable, str(SCRIPTS_DIR / script), "--lesson", lesson_id, *options],
                stdout=log,
                stderr=subprocess.STDOUT,
            )
            if result.returncode:
                return log_path
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jobs", type=int, default=3)
    parser.add_argument("--lesson", action="append", help="Generate only this lesson (repeatable)")
    args = parser.parse_args()
    if args.jobs < 1:
        parser.error("--jobs must be at least 1")

    available_ids = json.loads((CACHE / "catalog-audit.json").read_text())["lessonIds"]
    targets = list(dict.fromkeys(args.lesson or [*WEB_LESSONS, *available_ids]))
    if any(lesson_id not in available_ids for lesson_id in targets):
        parser.error("Unknown lesson ID in requested batch")
    (CACHE / "batch").mkdir(parents=True, exist_ok=True)
    published = set(json.loads(CATALOG.read_text()))
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

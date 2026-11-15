#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from pathlib import Path


def build_utf16_map(text: str) -> list[int]:
    acc = [0]
    total = 0
    for ch in text:
        total += 2 if ord(ch) > 0xFFFF else 1
        acc.append(total)
    return acc


def slice_utf16(text: str, u16_from: int, u16_to: int) -> str:
    # Convert UTF-16 code-unit offsets to Python string slice
    u16_cur = 0
    py_start = None
    py_end = None
    for idx, ch in enumerate(text):
        if u16_cur == u16_from and py_start is None:
            py_start = idx
        u16_cur += 2 if ord(ch) > 0xFFFF else 1
        if u16_cur == u16_to and py_end is None:
            py_end = idx + 1
            break
    if u16_from == 0 and py_start is None:
        py_start = 0
    if py_start is None or py_end is None:
        return ""
    return text[py_start:py_end]


def ffprobe_duration_ms(mp3_path: Path) -> int:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(mp3_path),
        ],
        text=True,
    ).strip()
    return round(float(out) * 1000.0)


def main():
    parser = argparse.ArgumentParser(description="Verify narration MP3s, word timings, hashes, and coverage.")
    parser.add_argument("--lesson", default="integracao-front-e-api")
    parser.add_argument("--out-dir", default="")
    parser.add_argument("--script", default="")
    parser.add_argument("--report", default="")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    script_path = Path(args.script) if args.script else repo_root / ".cache" / "narration" / "scripts" / f"{args.lesson}.script.json"
    out_dir = Path(args.out_dir) if args.out_dir else repo_root / "public" / "narration" / args.lesson
    manifest_path = out_dir / "manifest.json"
    pron_path = repo_root / ".cache" / "narration" / "review" / f"{args.lesson}.pronunciations.json"

    with open(script_path, "r", encoding="utf-8") as f:
        script = json.load(f)
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    script_clips = {c["id"]: c for c in script["clips"]}
    manifest_clips = {c["id"]: c for c in manifest["clips"]}

    errors = []
    warnings = []
    sample_checks = {}

    missing_clips = [cid for cid in script_clips if cid not in manifest_clips]
    if missing_clips:
        errors.append(f"Missing clips in manifest: {missing_clips}")

    extra_clips = [cid for cid in manifest_clips if cid not in script_clips]
    if extra_clips:
        errors.append(f"Orphaned clips in manifest not present in script: {extra_clips}")

    voices = manifest.get("availableVoices", [])
    if not voices:
        errors.append("Manifest has no availableVoices")

    for cid, sc in script_clips.items():
        mc = manifest_clips.get(cid)
        if not mc:
            continue
        if mc.get("textHash") != sc.get("textHash"):
            errors.append(f"textHash mismatch on clip '{cid}': manifest={mc.get('textHash')} vs script={sc.get('textHash')}")

        fields_by_name = {f["field"]: f["text"] for f in sc["fields"]}
        fields_u16_len = {fname: build_utf16_map(ftxt)[-1] for fname, ftxt in fields_by_name.items()}

        for v in voices:
            va = mc.get("audio", {}).get(v)
            if not va:
                errors.append(f"Clip '{cid}' missing voice '{v}'")
                continue

            mp3_file = out_dir / va["src"]
            if not mp3_file.exists():
                errors.append(f"Missing audio file: {mp3_file}")
                continue
            if mp3_file.stat().st_size == 0:
                errors.append(f"Empty audio file: {mp3_file}")
                continue

            real_dur_ms = ffprobe_duration_ms(mp3_file)
            if abs(real_dur_ms - va["durationMs"]) > 80:
                warnings.append(
                    f"{cid} [{v}]: manifest durationMs={va['durationMs']} vs ffprobe={real_dur_ms}"
                )

            words = va.get("words", [])
            if not words:
                errors.append(f"{cid} [{v}]: zero word timings")
                continue

            prev_start = -1
            for wi, w in enumerate(words):
                fname = w["field"]
                if fname not in fields_by_name:
                    errors.append(f"{cid} [{v}] word#{wi}: unknown field '{fname}'")
                    continue
                u_from, u_to = w["from"], w["to"]
                max_u16 = fields_u16_len[fname]
                if not (0 <= u_from < u_to <= max_u16):
                    errors.append(
                        f"{cid} [{v}] word#{wi}: invalid UTF-16 slice [{u_from}, {u_to}) for field '{fname}' (len={max_u16})"
                    )
                    continue
                s_ms, e_ms = w["startMs"], w["endMs"]
                if s_ms < 0 or e_ms < s_ms or e_ms > va["durationMs"] + 25:
                    errors.append(
                        f"{cid} [{v}] word#{wi}: timing [{s_ms}, {e_ms}] outside clip duration {va['durationMs']}"
                    )
                if s_ms < prev_start:
                    errors.append(
                        f"{cid} [{v}] word#{wi}: non-monotonic startMs {s_ms} < prev {prev_start}"
                    )
                prev_start = s_ms

                surface = slice_utf16(fields_by_name[fname], u_from, u_to)
                for target in ("fetch", "JSON", "201", "CORS", "JSON.stringify"):
                    if surface == target and target not in sample_checks:
                        sample_checks[target] = {
                            "clipId": cid,
                            "field": fname,
                            "surface": surface,
                            "from": u_from,
                            "to": u_to,
                            "startMs": s_ms,
                            "endMs": e_ms,
                        }

    flagged_terms = []
    max_drift = None
    if pron_path.exists():
        with open(pron_path, "r", encoding="utf-8") as f:
            pdata = json.load(f)
            flagged_terms = pdata.get("flaggedTermsForListening", [])
            max_drift = pdata.get("maxMp3DriftMs")

    report_data = {
        "lessonId": args.lesson,
        "status": "PASS" if not errors else "FAIL",
        "clipsExpected": len(script_clips),
        "clipsVerified": len(manifest_clips) - len(missing_clips),
        "voices": voices,
        "totalDurationMs": manifest.get("totalDurationMs", {}),
        "totalBytes": manifest.get("totalBytes", {}),
        "uncoveredBlocks": manifest.get("uncoveredBlocks", []),
        "sampleWordTimings": sample_checks,
        "flaggedTermsForListening": flagged_terms,
        "maxMp3DriftMs": max_drift,
        "warnings": warnings,
        "errors": errors,
    }

    report_out = Path(args.report) if args.report else repo_root / ".cache" / "narration" / "review" / f"{args.lesson}.verify.json"
    report_out.parent.mkdir(parents=True, exist_ok=True)
    with open(report_out, "w", encoding="utf-8") as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(json.dumps(report_data, ensure_ascii=False, indent=2))
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()

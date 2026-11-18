#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import onnxruntime as ort
import phonemizer
from phonemizer.separator import Separator
import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR_DEFAULT = Path(os.environ.get("KOKORO_MODEL_DIR", Path(__file__).resolve().parents[2] / ".cache/narration/kokoro"))

GENERATOR_VERSION = "1.0.0"
SAMPLE_RATE = 24_000
SAMPLES_PER_FRAME = 600
SYNTH_SPEED = 0.95
MAX_CHUNK_PHONEMES = 300
FIELD_GAP_MS = 260
SENTENCE_GAP_MS = 180
INTERACTIVE_ITEM_GAP_MS = 300
EDGE_PAD_MS = 60

VOICE_MODEL_IDS = {
    "dora": "pf_dora",
    "alex": "pm_alex",
    "santa": "pm_santa",
}

PH_SEP = Separator(phone="", word="|")

_UNIDADES = [
    "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
]
_DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
_CENTENAS = [
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos",
]

PT_COMMON_EXTRA = {
    "e", "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas", "por", "pelo", "pela", "pelos", "pelas", "para", "pra",
    "com", "sem", "sob", "sobre", "entre", "até", "após", "contra", "desde", "que", "quem",
    "qual", "quais", "quando", "onde", "como", "se", "mas", "ou", "nem", "não", "sim", "já",
    "só", "bem", "mal", "mais", "menos", "muito", "pouco", "tudo", "nada", "algo", "alguém",
    "ninguém", "cada", "todo", "toda", "todos", "todas", "outro", "outra", "outros", "outras",
    "mesmo", "mesma", "mesmos", "mesmas", "próprio", "isso", "isto", "aquilo", "esse", "essa",
    "este", "esta", "aquele", "aquela", "ele", "ela", "eles", "elas", "você", "vocês", "nós",
    "meu", "minha", "seu", "sua", "seus", "suas", "front", "status", "site", "internet",
}


def int_to_pt(n: int) -> str:
    if n < 0:
        return f"menos {int_to_pt(-n)}"
    if n < 20:
        return _UNIDADES[n]
    if n < 100:
        d, u = divmod(n, 10)
        return _DEZENAS[d] if u == 0 else f"{_DEZENAS[d]} e {_UNIDADES[u]}"
    if n == 100:
        return "cem"
    if n < 1000:
        c, r = divmod(n, 100)
        return _CENTENAS[c] if r == 0 else f"{_CENTENAS[c]} e {int_to_pt(r)}"
    if n < 1_000_000:
        mil, r = divmod(n, 1000)
        prefix = "mil" if mil == 1 else f"{int_to_pt(mil)} mil"
        if r == 0:
            return prefix
        if r < 100 or r % 100 == 0:
            return f"{prefix} e {int_to_pt(r)}"
        return f"{prefix} {int_to_pt(r)}"
    return str(n)


def build_utf16_map(text: str) -> list[int]:
    acc = [0]
    total = 0
    for ch in text:
        total += 2 if ord(ch) > 0xFFFF else 1
        acc.append(total)
    return acc


def split_token_punct(raw: str, lexicon_exact: dict) -> tuple[str, str, str]:
    """Split surrounding punctuation while preserving leading dots/slashes/minus/hash on identifiers/numbers."""
    if raw in lexicon_exact:
        return "", raw, ""

    lead = ""
    trail = ""
    s = raw

    while s and s[0] in '(["\'“‘¡¿【「{':
        lead += s[0]
        s = s[1:]

    # Check exact lexicon after stripping leading wrapper (e.g. `"201` -> keep if matches)
    if s in lexicon_exact:
        return lead, s, ""

    # Handle quote-balanced attributes like role="alert"
    if s.startswith('role="alert"'):
        rest = s[len('role="alert"'):]
        s_body = 'role="alert"'
        trail = rest
        return lead, s_body, trail

    # Keep function parens `()` at end of identifier like `express.json()`
    while s:
        if s.endswith("...") and s in lexicon_exact:
            break
        last = s[-1]
        if last in '.,;:!?)"\'”’】」}':
            if last == ")" and s.endswith("()"):
                candidate = s
                if candidate in lexicon_exact or re.match(r"^[A-Za-z_][\w.]*\(\)$", candidate):
                    break
            trail = last + trail
            s = s[:-1]
        else:
            break

    # If lead ends with '(' or quote and core ended with ')' before trail, keep core clean
    if not s:
        return raw, "", ""

    return lead, s, trail


class LexiconResolver:
    def __init__(self, lexicon_path: Path, vocab: dict[str, int]):
        with open(lexicon_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.version = data["version"]
        self.exact = data.get("exact", {})
        self.vocab = vocab
        self._ph_cache: dict[tuple[str, str], str] = {}
        self.flagged_terms: set[str] = set()

    def filter_vocab(self, ph: str) -> str:
        return "".join(c for c in ph if c in self.vocab or c == " ")

    def phonemize_phrase(self, text: str, lang: str) -> str:
        key = (text, lang)
        if key not in self._ph_cache:
            ph = phonemizer.phonemize(
                text,
                language=lang,
                preserve_punctuation=False,
                with_stress=True,
            ).strip()
            ph = self.filter_vocab(re.sub(r"\s+", " ", ph))
            self._ph_cache[key] = ph
        return self._ph_cache[key]

    def resolve_override(self, core: str) -> tuple[str, str] | None:
        """
        Return (spoken_label, ipa_phonemes) if `core` needs override / placeholder replacement,
        or None if pure Brazilian Portuguese native word.
        """
        entry = self.exact.get(core)
        if entry is not None:
            if "ipa" in entry:
                return entry.get("spoken", core), self.filter_vocab(entry["ipa"])
            if "segments" in entry:
                parts = []
                for seg in entry["segments"]:
                    if "ipa" in seg:
                        parts.append(self.filter_vocab(seg["ipa"]))
                    else:
                        parts.append(self.phonemize_phrase(seg["text"], seg.get("lang", "pt-br")))
                return entry.get("spoken", core), " ".join(p for p in parts if p)
            return entry["spoken"], self.phonemize_phrase(entry["spoken"], entry.get("lang", "pt-br"))

        # Integer or negative integer
        if re.fullmatch(r"-?\d{1,6}", core):
            spoken = int_to_pt(int(core))
            return spoken, self.phonemize_phrase(spoken, "pt-br")

        # Port `:1234`
        if re.fullmatch(r":\d{2,5}", core):
            spoken = f"porta {int_to_pt(int(core[1:]))}"
            return spoken, self.phonemize_phrase(spoken, "pt-br")

        # Pure punctuation/delimiter (not matched in exact)
        if not re.search(r"[A-Za-zÀ-ÿ0-9]", core):
            return "", ""

        # Dotted/slashed/underscored/hyphenated/equals identifiers not in exact lexicon
        if any(sym in core for sym in (".", "/", "_", "=", "#", ":", "@")):
            self.flagged_terms.add(core)
            cleaned = re.sub(r"[./_=#:@]", " ", core).strip()
            parts = []
            for sub in cleaned.split():
                sub_ov = self.resolve_override(sub)
                if sub_ov and sub_ov[1]:
                    parts.append(sub_ov[1])
                else:
                    parts.append(self.phonemize_phrase(sub, "pt-br"))
            spoken = cleaned
            return spoken, " ".join(p for p in parts if p)

        # Hyphenated word: avoid espeak breaking 1-to-1 groups by substituting via pato placeholder
        if "-" in core:
            pieces = [p for p in core.split("-") if p]
            piece_phs = []
            for p in pieces:
                ov = self.resolve_override(p)
                piece_phs.append(ov[1] if ov else self.phonemize_phrase(p, "pt-br"))
            if any(re.search(r"[kKwWyY]", p) or p.isupper() for p in pieces):
                self.flagged_terms.add(core)
            return core.replace("-", " "), " ".join(x for x in piece_phs if x)

        # Pure Portuguese alphabetic word check vs unfamiliar English/all-caps words
        if core.isupper() and len(core) >= 2:
            self.flagged_terms.add(core)
            spoken = " ".join(core.lower())
            return spoken, self.phonemize_phrase(spoken, "pt-br")

        # Check mixed camelCase / k,w,y outside PT loans -> force single group & flag for listening
        if re.search(r"[a-z][A-Z]", core) or (re.search(r"[kKwWyY]", core) and core.lower() not in PT_COMMON_EXTRA):
            self.flagged_terms.add(core)
            split_camel = re.sub(r"([a-z])([A-Z])", r"\1 \2", core)
            return split_camel, self.phonemize_phrase(split_camel, "en-us")

        return None


def tokenize_field_into_sentences(field_name: str, text: str, resolver: LexiconResolver):
    """Return list of sentences; each sentence is list of token dicts."""
    u16 = build_utf16_map(text)
    raw_tokens = list(re.finditer(r"\S+", text))
    tokens = []
    for m in raw_tokens:
        raw = m.group(0)
        lead, core, trail = split_token_punct(raw, resolver.exact)
        if not core:
            # Pure punctuation token like `{` or `}`
            tokens.append({
                "field": field_name,
                "raw": raw,
                "core": "",
                "lead": "",
                "trail": raw,
                "from": u16[m.start()],
                "to": u16[m.end()],
                "skip": True,
                "override": None,
                "sentence_end": any(c in raw for c in ".?!"),
            })
            continue

        lead_len = len(lead)
        core_start = m.start() + lead_len
        core_end = core_start + len(core)
        override = resolver.resolve_override(core)
        if override is not None and override[1] == "":
            skip = True
        else:
            skip = False

        tokens.append({
            "field": field_name,
            "raw": raw,
            "core": core,
            "lead": lead,
            "trail": trail,
            "from": u16[core_start],
            "to": u16[core_end],
            "skip": skip,
            "override": override,
            "sentence_end": any(c in trail for c in ".?!") or (not trail and core.endswith("...")),
        })

    # Split into sentences at sentence_end
    sentences = []
    cur = []
    for tok in tokens:
        cur.append(tok)
        if tok["sentence_end"]:
            sentences.append(cur)
            cur = []
    if cur:
        sentences.append(cur)
    return sentences


def sentence_to_phoneme_plan(tokens: list[dict], resolver: LexiconResolver) -> list[dict]:
    """
    Build aligned word phoneme plan for one sentence (may further split if > MAX_CHUNK_PHONEMES).
    Guarantees strict 1-to-1 group mapping via `pato` placeholder validation.
    """
    spoken_tokens = [t for t in tokens if not t["skip"]]
    if not spoken_tokens:
        return []

    # First pass: substitute known overrides & any word containing digits/punct with 'pato'
    use_placeholder = [False] * len(spoken_tokens)
    for i, t in enumerate(spoken_tokens):
        if t["override"] is not None or not re.fullmatch(r"[A-Za-zÀ-ÿ]+", t["core"]):
            use_placeholder[i] = True

    def build_and_phonemize():
        sent_words = []
        for i, t in enumerate(spoken_tokens):
            word = "pato" if use_placeholder[i] else t["core"]
            punct_t = "".join(c for c in t["trail"] if c in ",.;:!?")
            sent_words.append(f"{word}{punct_t}")
        template = " ".join(sent_words)
        ph = phonemizer.phonemize(
            template,
            language="pt-br",
            preserve_punctuation=True,
            with_stress=True,
            separator=PH_SEP,
        )
        groups = [g.strip() for g in ph.split("|") if g.strip()]
        return groups

    groups = build_and_phonemize()
    if len(groups) != len(spoken_tokens):
        # Fallback: replace any single word whose standalone phonemize yields != 1 group
        for i, t in enumerate(spoken_tokens):
            if not use_placeholder[i]:
                single_ph = phonemizer.phonemize(
                    t["core"],
                    language="pt-br",
                    preserve_punctuation=False,
                    with_stress=True,
                    separator=PH_SEP,
                )
                single_groups = [g.strip() for g in single_ph.split("|") if g.strip()]
                if len(single_groups) != 1:
                    use_placeholder[i] = True
        groups = build_and_phonemize()

    if len(groups) != len(spoken_tokens):
        # Ultimate fallback: replace all words in sentence with pato placeholders
        use_placeholder = [True] * len(spoken_tokens)
        groups = build_and_phonemize()

    if len(groups) != len(spoken_tokens):
        raise RuntimeError(
            f"Phoneme group count mismatch ({len(groups)} vs {len(spoken_tokens)}) in: {[t['raw'] for t in spoken_tokens]}"
        )

    items = []
    for i, t in enumerate(spoken_tokens):
        punct_t = "".join(c for c in t["trail"] if c in ",.;:!?")
        if t["override"] is not None:
            core_ph = t["override"][1]
        elif use_placeholder[i] and t["core"]:
            core_ph = resolver.phonemize_phrase(t["core"], "pt-br")
        else:
            # Remove trailing punct from native group so core_ph is strictly spoken letters
            g = groups[i]
            while g and g[-1] in ",.;:!?":
                g = g[:-1]
            core_ph = resolver.filter_vocab(g)

        items.append({
            "token": t,
            "core_ph": core_ph.strip(),
            "punct_after": punct_t,
            "spoken_label": t["override"][0] if t["override"] else t["core"],
        })
    return items


def split_plan_by_phoneme_budget(items: list[dict], max_ph: int = MAX_CHUNK_PHONEMES) -> list[list[dict]]:
    if not items:
        return []
    chunks = []
    cur = []
    cur_len = 0
    for item in items:
        item_len = len(item["core_ph"]) + len(item["punct_after"]) + 1
        if cur and cur_len + item_len > max_ph:
            # Prefer splitting on comma/semicolon if recent in cur
            split_idx = None
            for idx in range(len(cur) - 1, max(0, len(cur) - 8) - 1, -1):
                if cur[idx]["punct_after"] in (",", ";", ":"):
                    split_idx = idx + 1
                    break
            if split_idx and split_idx < len(cur):
                chunks.append(cur[:split_idx])
                cur = cur[split_idx:]
                cur_len = sum(len(x["core_ph"]) + len(x["punct_after"]) + 1 for x in cur)
            else:
                chunks.append(cur)
                cur = []
                cur_len = 0
        cur.append(item)
        cur_len += item_len
    if cur:
        chunks.append(cur)
    return chunks


def synthesize_chunk(kokoro: Kokoro, inp_name: str, voice_style: np.ndarray, items: list[dict]):
    vocab = kokoro.tokenizer.vocab
    phoneme_str_parts = []
    token_spans = []
    tok_cursor = 0

    for idx, item in enumerate(items):
        core = "".join(c for c in item["core_ph"] if c in vocab)
        punct = "".join(c for c in item["punct_after"] if c in vocab)
        core_tokens = kokoro.tokenizer.tokenize(core)
        punct_tokens = kokoro.tokenizer.tokenize(punct)

        start_tok = tok_cursor
        tok_cursor += len(core_tokens)
        end_tok = tok_cursor
        tok_cursor += len(punct_tokens)

        phoneme_str_parts.append(core + punct)
        if idx < len(items) - 1:
            phoneme_str_parts.append(" ")
            tok_cursor += len(kokoro.tokenizer.tokenize(" "))

        token_spans.append((item["token"], start_tok, end_tok))

    full_ph = "".join(phoneme_str_parts).strip()
    tokens = np.array(kokoro.tokenizer.tokenize(full_ph), dtype=np.int64)
    if len(tokens) == 0:
        return np.zeros(0, dtype=np.float32), []
    if len(tokens) > 508:
        raise RuntimeError(f"Chunk exceeded Kokoro token limit ({len(tokens)} > 508): {full_ph[:80]}")

    style = voice_style[len(tokens)]
    audio, dur = kokoro.sess.run(
        ["waveform", "duration"],
        {
            inp_name: [[0, *tokens, 0]],
            "style": style,
            "speed": np.array([SYNTH_SPEED], dtype=np.float32),
        },
    )
    bos_frames = float(dur[0])
    # Prefix sum of phoneme token frames excluding BOS
    tok_frames = dur[1 : 1 + len(tokens)]
    pref = np.concatenate(([0.0], np.cumsum(tok_frames)))

    timings = []
    for tok, s_idx, e_idx in token_spans:
        if e_idx <= s_idx:
            continue
        start_samples = (bos_frames + float(pref[s_idx])) * SAMPLES_PER_FRAME
        end_samples = (bos_frames + float(pref[e_idx])) * SAMPLES_PER_FRAME
        timings.append({
            "field": tok["field"],
            "from": tok["from"],
            "to": tok["to"],
            "startSample": start_samples,
            "endSample": end_samples,
        })
    return audio.astype(np.float32), timings


def encode_mp3_and_verify(pcm: np.ndarray, out_mp3: Path, tmp_dir: Path) -> tuple[int, int, float]:
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    wav_in = tmp_dir / "in.wav"
    wav_dec = tmp_dir / "dec.wav"
    sf.write(wav_in, pcm, SAMPLE_RATE)

    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(wav_in),
            "-codec:a", "libmp3lame",
            "-b:a", "64k",
            "-ar", str(SAMPLE_RATE),
            "-ac", "1",
            str(out_mp3),
        ],
        check=True,
    )

    # Verify decoded PCM correlation drift <= 2 ms against original
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(out_mp3), "-f", "wav", str(wav_dec)],
        check=True,
    )
    dec, sr = sf.read(wav_dec, dtype="float32")
    if sr != SAMPLE_RATE:
        raise RuntimeError(f"Decoded sample rate mismatch: {sr} != {SAMPLE_RATE}")

    window = min(len(pcm), len(dec), SAMPLE_RATE * 2)
    drift_ms = 0.0
    if window > 4000:
        seg_a = dec[:window]
        seg_b = pcm[: max(2000, window - 480)]
        if len(seg_a) > len(seg_b) and np.max(np.abs(seg_b)) > 0.01:
            corr = np.correlate(seg_a, seg_b, mode="valid")
            lag_samples = int(np.argmax(corr))
            drift_ms = lag_samples * 1000.0 / SAMPLE_RATE
            if abs(drift_ms) > 2.0:
                raise RuntimeError(f"MP3 correlation lag {drift_ms:.2f}ms exceeds 2.0ms for {out_mp3}")

    duration_ms = round(len(dec) * 1000.0 / sr)
    return duration_ms, out_mp3.stat().st_size, drift_ms


def build_normalized_script(clip: dict, resolver: LexiconResolver):
    """Extract normalized sentence plans and spoken script summary for cache keying."""
    field_plans = []
    spoken_lines = []
    for fld in clip["fields"]:
        sentences = tokenize_field_into_sentences(fld["field"], fld["text"], resolver)
        chunk_plans = []
        for sent in sentences:
            items = sentence_to_phoneme_plan(sent, resolver)
            for chunk_items in split_plan_by_phoneme_budget(items):
                chunk_plans.append(chunk_items)
                spoken_lines.append(" ".join(x["spoken_label"] for x in chunk_items))
        field_plans.append({"field": fld["field"], "chunks": chunk_plans})
    normalized_script = "\n".join(spoken_lines)
    return field_plans, normalized_script


def compute_clip_key(text_hash: str, normalized_script: str, voice: str) -> str:
    payload = f"{GENERATOR_VERSION}|{voice}|{SYNTH_SPEED}|{text_hash}|{normalized_script}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def main():
    parser = argparse.ArgumentParser(description="Generate Kokoro pt-BR MP3s and word timings from exported script.")
    parser.add_argument("--lesson", default="integracao-front-e-api")
    parser.add_argument("--voices", default="santa,dora", help="Comma-separated voices")
    parser.add_argument("--only-clip", default="", help="Regenerate only this clip id")
    parser.add_argument("--force", action="store_true", help="Ignore existing clipKey cache")
    parser.add_argument("--model-dir", default=str(MODEL_DIR_DEFAULT))
    parser.add_argument("--script", default="")
    parser.add_argument("--out-dir", default="")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    script_path = Path(args.script) if args.script else repo_root / ".cache" / "narration" / "scripts" / f"{args.lesson}.script.json"
    out_dir = Path(args.out_dir) if args.out_dir else repo_root / "public" / "narration" / args.lesson
    lexicon_path = Path(__file__).resolve().parent / "lexicon.json"
    model_dir = Path(args.model_dir)

    with open(script_path, "r", encoding="utf-8") as f:
        script = json.load(f)

    voices = [v.strip() for v in args.voices.split(",") if v.strip()]
    for v in voices:
        if v not in VOICE_MODEL_IDS:
            raise ValueError(f"Unsupported voice '{v}'. Choose from: {list(VOICE_MODEL_IDS)}")

    manifest_path = out_dir / "manifest.json"
    prev_by_id: dict[str, dict] = {}
    if manifest_path.exists() and not args.force:
        with open(manifest_path, "r", encoding="utf-8") as f:
            prev = json.load(f)
            for c in prev.get("clips", []):
                prev_by_id[c["id"]] = c

    options = ort.SessionOptions()
    options.intra_op_num_threads = max(1, int(os.environ.get("KOKORO_THREADS", "1")))
    options.add_session_config_entry("session.intra_op.allow_spinning", "0")
    session = ort.InferenceSession(str(model_dir / "kokoro-v1.0.onnx"), options, providers=["CPUExecutionProvider"])
    kokoro = Kokoro.from_session(session, str(model_dir / "voices-v1.0.bin"))
    inp_name = kokoro.sess.get_inputs()[0].name
    resolver = LexiconResolver(lexicon_path, kokoro.tokenizer.vocab)

    out_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = repo_root / ".cache" / "narration" / "review"
    cache_dir.mkdir(parents=True, exist_ok=True)

    pad_edge = np.zeros(int(SAMPLE_RATE * EDGE_PAD_MS / 1000.0), dtype=np.float32)
    sil_sentence = np.zeros(int(SAMPLE_RATE * SENTENCE_GAP_MS / 1000.0), dtype=np.float32)
    sil_field = np.zeros(int(SAMPLE_RATE * FIELD_GAP_MS / 1000.0), dtype=np.float32)
    sil_interactive = np.zeros(int(SAMPLE_RATE * INTERACTIVE_ITEM_GAP_MS / 1000.0), dtype=np.float32)

    clips_out = []
    regenerated_count = 0
    reused_count = 0
    max_drift_ms = 0.0

    with tempfile.TemporaryDirectory() as tmp_str:
        tmp_dir = Path(tmp_str)
        voice_styles = {v: kokoro.get_voice_style(VOICE_MODEL_IDS[v]) for v in voices}

        for clip in script["clips"]:
            clip_id = clip["id"]
            field_plans, normalized_script = build_normalized_script(clip, resolver)
            primary_voice = voices[0]
            clip_key = compute_clip_key(clip["textHash"], normalized_script, "+".join(voices))

            prev_clip = prev_by_id.get(clip_id)
            safe_file = re.sub(r"[^a-zA-Z0-9_-]", "__", clip_id)

            clip_entry = {
                "id": clip_id,
                "sectionId": clip["sectionId"],
                "kind": clip["kind"],
                "label": clip["label"],
                "textHash": clip["textHash"],
                "clipKey": clip_key,
                "audio": {},
            }
            if clip.get("pauseAfter"):
                clip_entry["pauseAfter"] = True
            if clip.get("interactiveKind"):
                clip_entry["interactiveKind"] = clip["interactiveKind"]

            for v in voices:
                rel_src = f"{v}/{safe_file}.mp3"
                mp3_path = out_dir / rel_src
                v_key = compute_clip_key(clip["textHash"], normalized_script, v)
                previous_audio = prev_clip.get("audio", {}).get(v) if prev_clip else None
                intact = previous_audio and mp3_path.is_file() and mp3_path.stat().st_size == previous_audio.get("bytes")

                can_reuse = (
                    not args.force
                    and (not args.only_clip or args.only_clip != clip_id)
                    and intact
                    and prev_clip.get("textHash") == clip["textHash"]
                    and previous_audio.get("normalizedScript") == normalized_script
                )
                # Preserve untouched clips when --only-clip is filtering
                if args.only_clip and args.only_clip != clip_id and intact:
                    clip_entry["audio"][v] = previous_audio
                    reused_count += 1
                    continue

                if can_reuse:
                    clip_entry["audio"][v] = previous_audio
                    reused_count += 1
                    continue

                # Synthesize full clip from chunks
                pcm_parts = [pad_edge]
                sample_cursor = len(pad_edge)
                raw_words = []

                interactive = clip.get("interactiveKind")
                for f_idx, fp in enumerate(field_plans):
                    if f_idx > 0:
                        if interactive == "flow" and fp["field"].endswith(":label"):
                            gap = sil_interactive
                        elif interactive == "anatomy" and fp["field"].endswith(":label"):
                            gap = sil_interactive
                        else:
                            gap = sil_field
                        pcm_parts.append(gap)
                        sample_cursor += len(gap)

                    for c_idx, chunk_items in enumerate(fp["chunks"]):
                        if c_idx > 0:
                            pcm_parts.append(sil_sentence)
                            sample_cursor += len(sil_sentence)

                        chunk_pcm, chunk_timings = synthesize_chunk(kokoro, inp_name, voice_styles[v], chunk_items)
                        for wt in chunk_timings:
                            start_ms = round((sample_cursor + wt["startSample"]) * 1000.0 / SAMPLE_RATE)
                            end_ms = max(start_ms + 20, round((sample_cursor + wt["endSample"]) * 1000.0 / SAMPLE_RATE))
                            raw_words.append({
                                "field": wt["field"],
                                "from": wt["from"],
                                "to": wt["to"],
                                "startMs": start_ms,
                                "endMs": end_ms,
                            })
                        pcm_parts.append(chunk_pcm)
                        sample_cursor += len(chunk_pcm)

                pcm_parts.append(pad_edge)
                full_pcm = np.concatenate(pcm_parts)
                # Peak normalize safely if ever exceeding 0.98 to avoid clipping
                peak = float(np.max(np.abs(full_pcm))) if len(full_pcm) else 0.0
                if peak > 0.98:
                    full_pcm = full_pcm * (0.95 / peak)

                dur_ms, byte_size, drift_ms = encode_mp3_and_verify(full_pcm, mp3_path, tmp_dir)
                max_drift_ms = max(max_drift_ms, abs(drift_ms))

                # Clamp and sanitize monotonicity
                clamped_words = []
                for w in raw_words:
                    s_ms = max(0, min(w["startMs"], dur_ms))
                    e_ms = max(s_ms + 10, min(w["endMs"], dur_ms))
                    if s_ms > dur_ms:
                        s_ms = dur_ms
                        e_ms = dur_ms
                    clamped_words.append({**w, "startMs": s_ms, "endMs": min(dur_ms, e_ms)})

                clip_entry["audio"][v] = {
                    "src": rel_src,
                    "durationMs": dur_ms,
                    "bytes": byte_size,
                    "sampleRate": SAMPLE_RATE,
                    "words": clamped_words,
                    "normalizedScript": normalized_script,
                }
                regenerated_count += 1
                print(f"  [{v}] {clip_id} -> {dur_ms} ms ({byte_size} B, {len(clamped_words)} palavras, drift={drift_ms:.2f}ms)")

            clips_out.append(clip_entry)

    # Prune orphaned MP3s when regenerating full lesson
    if not args.only_clip:
        expected_srcs = {
            c["audio"][v]["src"]
            for c in clips_out
            for v in voices
            if v in c["audio"]
        }
        for v in voices:
            v_dir = out_dir / v
            if v_dir.exists():
                for mp3 in v_dir.glob("*.mp3"):
                    rel = f"{v}/{mp3.name}"
                    if rel not in expected_srcs:
                        mp3.unlink()
                        print(f"  [prune] Removed orphaned clip {rel}")

    total_duration_ms = {
        v: sum(c["audio"][v]["durationMs"] for c in clips_out if v in c["audio"])
        for v in voices
    }
    total_bytes = {
        v: sum(c["audio"][v]["bytes"] for c in clips_out if v in c["audio"])
        for v in voices
    }

    manifest = {
        "schemaVersion": 1,
        "lessonId": script["lessonId"],
        "lessonTitle": script["lessonTitle"],
        "generatorVersion": GENERATOR_VERSION,
        "lexiconVersion": resolver.version,
        "defaultVoice": voices[0],
        "availableVoices": voices,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalDurationMs": total_duration_ms,
        "totalBytes": total_bytes,
        "clips": clips_out,
        "uncoveredBlocks": script.get("uncoveredBlocks", []),
    }

    temporary_manifest = manifest_path.with_suffix(".json.tmp")
    with open(temporary_manifest, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    temporary_manifest.replace(manifest_path)

    pronunciation_notes_path = cache_dir / f"{args.lesson}.pronunciations.json"
    with open(pronunciation_notes_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "lessonId": script["lessonId"],
                "flaggedTermsForListening": sorted(resolver.flagged_terms),
                "maxMp3DriftMs": round(max_drift_ms, 3),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(
        f"\nDone {args.lesson}: {len(clips_out)} clips | regenerated={regenerated_count} reused={reused_count} | "
        f"totalDuration={total_duration_ms}ms | totalBytes={total_bytes}B | flaggedTerms={len(resolver.flagged_terms)}"
    )


if __name__ == "__main__":
    main()

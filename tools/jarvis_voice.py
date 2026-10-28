"""
Record the website's J.A.R.V.I.S. lines in the real Jarvis's voice.

The lines are voice/lines.json. This speaks each one with exactly the
voice, model and delivery brief jarvis-lab uses (imported from its app.py,
so the two can't drift), and writes voice/en/<id>.mp3 and voice/no/<id>.mp3.

Run it from the jarvis-lab checkout, with its environment, so its .env
supplies the API key (which this never prints):

    cd ~/jarvis-lab && .venv/bin/python ~/oscar-portfolio/tools/jarvis_voice.py ~/oscar-portfolio

Only lines that are new or have changed are recorded again; voice/clips.json
remembers what each clip was made from. A full run is about 30 short clips,
a few cents.
"""
import hashlib
import json
import os
import sys
from pathlib import Path

site = Path(sys.argv[1]).expanduser().resolve()
sys.path.insert(0, os.getcwd())

import app  # noqa: E402  jarvis-lab's app: the voice settings
import jarvis  # noqa: E402  and its API client

NORWEGIAN = (" This line is in Norwegian (Bokmål). Say it in Norwegian, keeping your own"
             " voice and manner — a British butler who speaks good Norwegian.")

lines = json.loads((site / "voice" / "lines.json").read_text())
made_path = site / "voice" / "clips.json"
made = json.loads(made_path.read_text()) if made_path.exists() else {}

recorded = 0
for lang in ("en", "no"):
    folder = site / "voice" / lang
    folder.mkdir(parents=True, exist_ok=True)
    instructions = app.VOICE_INSTRUCTIONS + (NORWEGIAN if lang == "no" else "")
    for line_id, text in lines.items():
        spoken = app.speakable(text[lang])
        stamp = hashlib.sha256(f"{app.VOICE_MODEL}|{app.VOICE_NAME}|{instructions}|{spoken}".encode()).hexdigest()[:16]
        key = f"{lang}/{line_id}"
        out = folder / f"{line_id}.mp3"
        if made.get(key) == stamp and out.exists():
            continue
        with jarvis.client.audio.speech.with_streaming_response.create(
            model=app.VOICE_MODEL, voice=app.VOICE_NAME, input=spoken,
            instructions=instructions, response_format="mp3",
        ) as response:
            out.write_bytes(response.read())
        made[key] = stamp
        recorded += 1
        print(f"{key:28s} {out.stat().st_size / 1024:5.1f} KB")

# Clips for lines that no longer exist are removed.
for lang in ("en", "no"):
    for clip in (site / "voice" / lang).glob("*.mp3"):
        if clip.stem not in lines:
            clip.unlink()
            made.pop(f"{lang}/{clip.stem}", None)

made_path.write_text(json.dumps(dict(sorted(made.items())), indent=2) + "\n")
print(f"{recorded} recorded, {len(lines) * 2 - recorded} unchanged")

#!/usr/bin/env python3
"""
Turn a phone photo into a log photo: upright, 3:2, 1600 × 1067 JPEG, with
every bit of metadata removed (EXIF, GPS, XMP, ICC, comments). Used by the
log-entry skill (.claude/skills/log-entry).

    python tools/photo.py IMG_1234.HEIC log/img/glued-segments.jpg
    python tools/photo.py IMG_1234.jpg log/img/x.jpg --focus 0.3   # keep more of the top

--focus picks which part of the picture survives the crop to 3:2:
0 = top (or left), 0.5 = middle, 1 = bottom (or right).

Needs Pillow (and pillow-heif for .HEIC):
    python3 -m venv ~/.venvs/site && ~/.venvs/site/bin/pip install pillow pillow-heif

Afterwards run tools/check_public.py, which re-checks every photo in
log/img with no Pillow at all.
"""

import argparse
import sys

from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

WIDTH, HEIGHT = 1600, 1067
QUALITY = 82


def make(source, target, focus=0.5):
    with Image.open(source) as image:
        # Rotate the pixels by the EXIF orientation first: once the tag is
        # stripped, nothing else would know the photo was sideways.
        image = ImageOps.exif_transpose(image).convert("RGB")
        image = ImageOps.fit(image, (WIDTH, HEIGHT), Image.Resampling.LANCZOS,
                             centering=(focus, focus))
        # A fresh image carries nothing over from the original.
        clean = Image.new("RGB", image.size)
        clean.paste(image)
        clean.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    with Image.open(target) as check:
        assert check.size == (WIDTH, HEIGHT)
        assert not check.getexif(), "EXIF survived"
        assert not set(check.info) & {"exif", "icc_profile", "xmp", "comment"}, check.info.keys()
    with open(target, "rb") as handle:
        data = handle.read()
    for marker in (b"Exif", b"GPS", b"http://ns.adobe.com/xap"):
        assert marker not in data, f"{marker!r} found in {target}"
    return len(data)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Prepare a photo for the log.")
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("--focus", type=float, default=0.5)
    args = parser.parse_args(argv)
    size = make(args.source, args.target, args.focus)
    print(f"{args.target}: {WIDTH}x{HEIGHT}, {size / 1024:.0f} KB, no metadata")
    return 0


if __name__ == "__main__":
    sys.exit(main())

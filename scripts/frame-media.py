#!/usr/bin/env python3
"""Composite screenshots and screen recordings into the site's iPhone frame.

This is the local twin of the Frame Studio artifact. It exists because a browser
cannot encode HEVC with an alpha channel — only Apple's VideoToolbox can, and
only from a native process. Stills come out as PNG with transparency; clips come
out as HEVC .mov with a real alpha channel, ready to drop onto any background.

    scripts/frame-media.py shot.png recording.mov
    scripts/frame-media.py --out build/mockups --half *.png
    scripts/frame-media.py --webm clip.mp4        # VP9 WebM instead of HEVC

Geometry is measured off my-app/public/frames/iphone.png and matches the
PhoneFrame component percentage for percentage, so a mockup rendered here and
one rendered on the site line up exactly.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FRAME_PNG = REPO / "my-app" / "public" / "frames" / "iphone.png"

# --- frame geometry, as percentages of the frame artwork -------------------
FRAME_W, FRAME_H = 1060, 2160
SCREEN_LEFT, SCREEN_TOP = 5.3396, 1.9722
SCREEN_W, SCREEN_H = 90.4528, 96.0185
# Corner radius as a percentage of the screen's own width.
RADIUS = 14.3304

STILL_EXT = {".png", ".jpg", ".jpeg", ".heic", ".webp"}
CLIP_EXT = {".mov", ".mp4", ".m4v", ".webm", ".avi"}


class Geometry:
    """Pixel geometry of the frame and its screen cutout at a given scale."""

    def __init__(self, scale: float) -> None:
        self.W = round(FRAME_W * scale)
        self.H = round(FRAME_H * scale)
        self.x = round(self.W * SCREEN_LEFT / 100)
        self.y = round(self.H * SCREEN_TOP / 100)
        # Even dimensions keep every encoder happy.
        self.w = round(self.W * SCREEN_W / 100 / 2) * 2
        self.h = round(self.H * SCREEN_H / 100 / 2) * 2
        self.r = self.w * RADIUS / 100

    def __str__(self) -> str:
        return f"{self.W}x{self.H} screen {self.w}x{self.h} at {self.x},{self.y}"


def die(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


# --------------------------------------------------------------------------
# stills
# --------------------------------------------------------------------------

def frame_still(src: Path, dest: Path, geo: Geometry) -> None:
    from PIL import Image, ImageDraw

    frame = Image.open(FRAME_PNG).convert("RGBA")
    if (frame.width, frame.height) != (geo.W, geo.H):
        frame = frame.resize((geo.W, geo.H), Image.LANCZOS)

    shot = Image.open(src).convert("RGBA")

    # Cover fit: fill the screen, crop the overflow, keep the centre.
    factor = max(geo.w / shot.width, geo.h / shot.height)
    shot = shot.resize(
        (max(1, round(shot.width * factor)), max(1, round(shot.height * factor))),
        Image.LANCZOS,
    )
    left = (shot.width - geo.w) // 2
    top = (shot.height - geo.h) // 2
    shot = shot.crop((left, top, left + geo.w, top + geo.h))

    # Supersample the corner mask so the rounding stays smooth.
    ss = 4
    mask = Image.new("L", (geo.w * ss, geo.h * ss), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, geo.w * ss - 1, geo.h * ss - 1], radius=round(geo.r * ss), fill=255
    )
    shot.putalpha(mask.resize((geo.w, geo.h), Image.LANCZOS))

    canvas = Image.new("RGBA", (geo.W, geo.H), (0, 0, 0, 0))
    canvas.alpha_composite(shot, (geo.x, geo.y))
    canvas.alpha_composite(frame, (0, 0))
    canvas.save(dest, optimize=True)


# --------------------------------------------------------------------------
# clips
# --------------------------------------------------------------------------

def clip_filter(geo: Geometry) -> str:
    """Cover-fit the clip, then let the frame's own chassis do the masking.

    The frame artwork is opaque everywhere except its rounded screen cutout, so
    a square-cornered video laid underneath has its corners hidden for free —
    no separate alpha mask needed.
    """
    # Padding the clip out to the full canvas keeps the source's frame rate and
    # timestamps. Overlaying onto a synthetic colour source instead would
    # silently resample the clip to that source's rate.
    return (
        f"[0:v]scale={geo.w}:{geo.h}:force_original_aspect_ratio=increase,"
        f"crop={geo.w}:{geo.h},format=rgba,"
        f"pad={geo.W}:{geo.H}:{geo.x}:{geo.y}:color=0x00000000[under];"
        f"[1:v]scale={geo.W}:{geo.H},format=rgba[frame];"
        f"[under][frame]overlay=0:0:shortest=1,format=rgba[out]"
    )


def frame_clip(src: Path, dest: Path, geo: Geometry, codec: str, keep_audio: bool):
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        # Without -loop the single-frame PNG ends immediately and the
        # shortest=1 overlay below truncates the whole clip to one frame.
        "-loop", "1", "-i", str(FRAME_PNG),
        "-filter_complex", clip_filter(geo),
        "-map", "[out]",
    ]

    if keep_audio:
        cmd += ["-map", "0:a?", "-c:a", "aac", "-b:a", "160k"]
    else:
        cmd += ["-an"]

    if codec == "hevc":
        # VideoToolbox is the only encoder here that carries an alpha plane.
        cmd += [
            "-c:v", "hevc_videotoolbox",
            "-alpha_quality", "0.9",
            "-q:v", "60",
            "-pix_fmt", "bgra",
            "-tag:v", "hvc1",
        ]
    else:
        # Deliberately yuv420p, not yuva420p: ffmpeg's libvpx encoder accepts an
        # alpha input and then drops it on the floor, because writing VP9 alpha
        # needs the separate BlockAdditional track its WebM muxer won't emit.
        # Asking for alpha here would only produce a file that lies about it.
        cmd += [
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuv420p",
            "-crf", "30", "-b:v", "0", "-row-mt", "1",
        ]

    cmd.append(str(dest))
    result = run(cmd)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip().splitlines()[-1] if result.stderr else "ffmpeg failed")


def verify_alpha(path: Path) -> bool | None:
    """Decode one corner pixel of the output; it must come back transparent.

    Returns None when the file can't be read back rather than guessing — some
    HEVC alpha layouts defeat ffmpeg's decoder even when the encode was fine,
    in which case QuickTime is the arbiter.
    """
    probe = subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-i", str(path), "-frames:v", "1",
        "-vf", "crop=8:8:0:0",
        "-f", "rawvideo", "-pix_fmt", "rgba", "-",
    ], capture_output=True)
    if probe.returncode != 0 or len(probe.stdout) < 4:
        return None
    return probe.stdout[3] == 0


# --------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Frame screenshots and recordings in the site's iPhone mockup."
    )
    parser.add_argument("inputs", nargs="+", type=Path, help="images and/or videos")
    parser.add_argument("-o", "--out", type=Path, default=Path("framed"),
                        help="output directory (default: ./framed)")
    parser.add_argument("--half", action="store_true",
                        help="render at 530x1080 instead of 1060x2160")
    parser.add_argument("--webm", action="store_true",
                        help="encode clips as VP9 WebM instead — opaque, for the web "
                             "(ffmpeg cannot write alpha into WebM)")
    parser.add_argument("--keep-audio", action="store_true",
                        help="carry the source audio through (dropped by default)")
    args = parser.parse_args()

    if not FRAME_PNG.exists():
        die(f"frame artwork missing at {FRAME_PNG}")
    if not shutil.which("ffmpeg"):
        die("ffmpeg not found on PATH — brew install ffmpeg")

    geo = Geometry(0.5 if args.half else 1.0)
    codec = "vp9" if args.webm else "hevc"
    args.out.mkdir(parents=True, exist_ok=True)

    print(f"frame {geo}")
    failures = 0

    for src in args.inputs:
        if not src.exists():
            print(f"  skip  {src.name} — not found")
            failures += 1
            continue

        suffix = src.suffix.lower()
        try:
            if suffix in STILL_EXT:
                dest = args.out / f"{src.stem}-framed.png"
                frame_still(src, dest, geo)
                print(f"  still {src.name} -> {dest.name}  {dest.stat().st_size // 1024} KB")

            elif suffix in CLIP_EXT:
                ext = "webm" if codec == "vp9" else "mov"
                dest = args.out / f"{src.stem}-framed.{ext}"
                frame_clip(src, dest, geo, codec, args.keep_audio)
                if codec == "vp9":
                    mark = "opaque by design"
                else:
                    alpha = verify_alpha(dest)
                    mark = {True: "alpha ok", False: "NO ALPHA",
                            None: "alpha unverified — check in QuickTime"}[alpha]
                print(f"  clip  {src.name} -> {dest.name}  "
                      f"{dest.stat().st_size // 1024} KB  [{mark}]")

            else:
                print(f"  skip  {src.name} — unsupported extension")
                failures += 1

        except Exception as exc:  # noqa: BLE001 - report and keep going
            failures += 1
            note = str(exc)
            if "Function not implemented" in note or "non-base layer" in note:
                note = ("ffmpeg cannot decode HEVC-with-alpha input; re-export the "
                        "source without alpha, or convert it in QuickTime first")
            print(f"  FAIL  {src.name} — {note}")

    if failures:
        print(f"\n{failures} file(s) skipped or failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()

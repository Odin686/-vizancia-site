#!/usr/bin/env python3
"""Create responsive AVIF, WebP, and JPEG exports from an approved master image."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_ratio(value: str) -> float:
    try:
        width, height = (float(part) for part in value.split(":", 1))
    except (TypeError, ValueError) as exc:
        raise argparse.ArgumentTypeError("ratio must look like 4:3 or 16:10") from exc
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("ratio values must be positive")
    return width / height


def crop_to_ratio(image: Image.Image, ratio: float, focal_x: float, focal_y: float) -> Image.Image:
    width, height = image.size
    current = width / height
    if abs(current - ratio) < 0.001:
        return image.copy()

    if current > ratio:
        crop_width = round(height * ratio)
        left = round((width - crop_width) * focal_x)
        left = max(0, min(left, width - crop_width))
        box = (left, 0, left + crop_width, height)
    else:
        crop_height = round(width / ratio)
        top = round((height - crop_height) * focal_y)
        top = max(0, min(top, height - crop_height))
        box = (0, top, width, top + crop_height)
    return image.crop(box)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("basename")
    parser.add_argument("--ratio", type=parse_ratio, required=True)
    parser.add_argument("--widths", required=True, help="comma-separated pixel widths")
    parser.add_argument("--focal-x", type=float, default=0.5)
    parser.add_argument("--focal-y", type=float, default=0.5)
    args = parser.parse_args()

    if not 0 <= args.focal_x <= 1 or not 0 <= args.focal_y <= 1:
        parser.error("focal coordinates must be between 0 and 1")

    widths = sorted({int(value) for value in args.widths.split(",")})
    if not widths or widths[0] <= 0:
        parser.error("widths must contain positive integers")

    args.destination.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as source:
        master = crop_to_ratio(source.convert("RGB"), args.ratio, args.focal_x, args.focal_y)
        for width in widths:
            height = round(width / args.ratio)
            resized = master.resize((width, height), Image.Resampling.LANCZOS)
            stem = args.destination / f"{args.basename}-{width}"
            resized.save(stem.with_suffix(".avif"), quality=54, speed=6)
            resized.save(stem.with_suffix(".webp"), quality=78, method=6)
            resized.save(
                stem.with_suffix(".jpg"),
                quality=76,
                optimize=True,
                progressive=True,
                subsampling="4:2:0",
            )


if __name__ == "__main__":
    main()

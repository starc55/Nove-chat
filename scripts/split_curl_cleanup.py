from __future__ import annotations

import argparse
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Split a curl FTP cleanup config into bounded sessions.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--batch-size", type=int, default=300)
    args = parser.parse_args()

    source = Path(args.input).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    lines = source.read_text(encoding="utf-8").splitlines()
    common = [line for line in lines if not line.startswith("quote =") and not line.startswith("url =")]
    quotes = [line for line in lines if line.startswith("quote =")]
    url = next(line for line in lines if line.startswith("url ="))

    parts = 0
    for offset in range(0, len(quotes), args.batch_size):
        parts += 1
        batch = common + quotes[offset : offset + args.batch_size] + [url]
        (output_dir / f"cleanup-{parts:03d}.curl").write_text("\n".join(batch) + "\n", encoding="utf-8")

    print(f"CLEANUP_PARTS={parts}")
    print(f"CLEANUP_QUOTES={len(quotes)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

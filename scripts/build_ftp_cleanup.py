from __future__ import annotations

import argparse
import zipfile
from pathlib import Path, PurePosixPath


def curl_value(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def main() -> int:
    parser = argparse.ArgumentParser(description="Build safe FTP cleanup commands from a verified backup ZIP.")
    parser.add_argument("--archive", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", required=True)
    args = parser.parse_args()

    archive = Path(args.archive).resolve()
    output = Path(args.output).resolve()
    with zipfile.ZipFile(archive) as backup:
        paths = [PurePosixPath(info.filename) for info in backup.infolist() if not info.is_dir()]

    unsafe = [path for path in paths if path.is_absolute() or ".." in path.parts]
    if unsafe:
        raise RuntimeError(f"Backup contains unsafe paths: {unsafe[:3]}")

    preserved = {PurePosixPath(".ftpquota")}
    files = [path for path in paths if path not in preserved and not path.parts[0] == ".well-known"]
    files.extend([
        PurePosixPath(".nova-old-site-backup-20260823.zip"),
        PurePosixPath(".nova-backup-6f3c1a.php"),
    ])

    directories = {parent for path in files for parent in path.parents if parent != PurePosixPath(".")}
    directories.add(PurePosixPath("data/uploads/.quarantine"))
    directories = {path for path in directories if path.parts and path.parts[0] != ".well-known"}

    lines = ["silent", "show-error", "ssl-reqd", "ftp-ssl-control", "head"]
    for path in files:
        lines.append(f'quote = "*DELE /{curl_value(path.as_posix())}"')
    for path in sorted(directories, key=lambda item: (-len(item.parts), item.as_posix())):
        lines.append(f'quote = "*RMD /{curl_value(path.as_posix())}"')
    lines.append(f'url = "ftp://{args.host}:{args.port}/.ftpquota"')
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"CLEANUP_FILES={len(files)}")
    print(f"CLEANUP_DIRECTORIES={len(directories)}")
    print(f"CLEANUP_CONFIG={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

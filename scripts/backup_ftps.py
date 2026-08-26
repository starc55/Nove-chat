from __future__ import annotations

import argparse
import ftplib
import json
import ssl
from datetime import datetime
from pathlib import Path, PurePosixPath


def read_config(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def safe_local_path(root: Path, remote_path: PurePosixPath) -> Path:
    target = (root / Path(*remote_path.parts)).resolve()
    if root != target and root not in target.parents:
        raise RuntimeError(f"Unsafe remote path: {remote_path}")
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Back up an FTPS document root recursively.")
    parser.add_argument("--config", default=".ftp-deploy.env")
    parser.add_argument("--tls-host", required=True)
    parser.add_argument("--output-root", default=".ftp-backup")
    args = parser.parse_args()

    config = read_config(Path(args.config).resolve())
    required = ("FTP_PORT", "FTP_USERNAME", "FTP_PASSWORD")
    missing = [key for key in required if not config.get(key)]
    if missing:
        raise RuntimeError(f"Credential faylida yetishmaydi: {', '.join(missing)}")

    remote_root = config.get("FTP_REMOTE_DIR", "").strip() or "/"
    if ".." in PurePosixPath(remote_root).parts:
        raise RuntimeError("FTP_REMOTE_DIR xavfsiz emas.")

    stamp = datetime.now().strftime("full-site-%Y%m%d-%H%M%S")
    backup_root = (Path(args.output_root).resolve() / stamp)
    backup_root.mkdir(parents=True, exist_ok=False)

    context = ssl.create_default_context()
    ftp = ftplib.FTP_TLS(context=context, timeout=120)
    files_downloaded = 0
    bytes_downloaded = 0
    manifest: list[dict[str, object]] = []

    def walk(remote_directory: PurePosixPath) -> None:
        nonlocal files_downloaded, bytes_downloaded
        entries = list(ftp.mlsd(remote_directory.as_posix()))
        for name, facts in entries:
            if name in {".", ".."}:
                continue
            remote_path = remote_directory / name
            entry_type = facts.get("type", "file")
            if entry_type in {"cdir", "pdir"}:
                continue
            if entry_type == "dir":
                safe_local_path(backup_root, remote_path.relative_to(PurePosixPath(remote_root))).mkdir(parents=True, exist_ok=True)
                walk(remote_path)
                continue

            relative = remote_path.relative_to(PurePosixPath(remote_root))
            local_path = safe_local_path(backup_root, relative)
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with local_path.open("wb") as target:
                ftp.retrbinary(f"RETR {remote_path.as_posix()}", target.write, blocksize=256 * 1024)
            size = local_path.stat().st_size
            files_downloaded += 1
            bytes_downloaded += size
            manifest.append({"path": relative.as_posix(), "size": size, "modify": facts.get("modify")})
            if files_downloaded % 50 == 0:
                print(f"Backed up {files_downloaded} files / {bytes_downloaded} bytes", flush=True)

    try:
        ftp.connect(args.tls_host, int(config["FTP_PORT"]))
        ftp.login(config["FTP_USERNAME"], config["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        walk(PurePosixPath(remote_root))
        ftp.quit()
    except Exception:
        ftp.close()
        raise

    (backup_root / "backup-manifest.json").write_text(
        json.dumps({"remoteRoot": remote_root, "files": manifest}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"BACKUP_DIR={backup_root}", flush=True)
    print(f"BACKUP_FILES={files_downloaded}", flush=True)
    print(f"BACKUP_BYTES={bytes_downloaded}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

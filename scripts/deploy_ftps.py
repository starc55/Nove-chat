from __future__ import annotations

import argparse
import ftplib
import ssl
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


def ensure_directories(ftp: ftplib.FTP_TLS, directories: list[PurePosixPath]) -> None:
    for directory in directories:
        current = PurePosixPath()
        for part in directory.parts:
            current /= part
            try:
                ftp.mkd(current.as_posix())
            except ftplib.error_perm as error:
                if not str(error).startswith("550"):
                    raise


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload the static web build over one FTPS session.")
    parser.add_argument("--config", default=".ftp-deploy.env")
    parser.add_argument("--build", default="apps/web/dist")
    parser.add_argument("--tls-host", required=True)
    args = parser.parse_args()

    config = read_config(Path(args.config).resolve())
    required = ("FTP_PORT", "FTP_USERNAME", "FTP_PASSWORD", "SITE_URL")
    missing = [key for key in required if not config.get(key)]
    if missing:
        raise RuntimeError(f"Credential faylida yetishmaydi: {', '.join(missing)}")

    remote_dir = config.get("FTP_REMOTE_DIR", "").strip() or "/"
    if ".." in PurePosixPath(remote_dir).parts:
        raise RuntimeError("FTP_REMOTE_DIR xavfsiz emas.")

    build_root = Path(args.build).resolve()
    files = [path for path in build_root.rglob("*") if path.is_file()]
    activation_names = {"index.html": 1, ".htaccess": 2}
    files.sort(key=lambda path: (activation_names.get(path.name, 0), path.relative_to(build_root).as_posix()))
    directories = sorted(
        {PurePosixPath(path.relative_to(build_root).parent.as_posix()) for path in files if path.parent != build_root},
        key=lambda path: (len(path.parts), path.as_posix()),
    )

    context = ssl.create_default_context()
    ftp = ftplib.FTP_TLS(context=context, timeout=60)
    try:
        ftp.connect(args.tls_host, int(config["FTP_PORT"]))
        ftp.login(config["FTP_USERNAME"], config["FTP_PASSWORD"])
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.cwd(remote_dir)
        ensure_directories(ftp, directories)

        for index, path in enumerate(files, start=1):
            relative = PurePosixPath(path.relative_to(build_root).as_posix())
            with path.open("rb") as source:
                ftp.storbinary(f"STOR {relative.as_posix()}", source, blocksize=256 * 1024)
            if index % 5 == 0 or index == len(files):
                print(f"Uploaded {index}/{len(files)}", flush=True)

        ftp.quit()
    except Exception:
        try:
            ftp.close()
        finally:
            raise

    print(f"FTP_DEPLOY_OK={len(files)}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

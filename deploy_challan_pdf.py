import glob
import os
import sys
import time

import paramiko

HOST = '187.127.160.28'
HOSTNAME = 'jagdambaprofile.tech'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
CONNECT_TIMEOUT = 45
MAX_RETRIES = 5

SOURCE_FILES = [
    'src/projects/profile/components/ChallanPrintViews.tsx',
    'src/projects/profile/components/ChallanPrint.tsx',
    'src/projects/profile/utils/challanDownload.tsx',
    'src/projects/profile/utils/pdfGenerator.ts',
    'src/projects/profile/pages/ChallanPage.tsx',
    'src/projects/profile/utils/logo2Base64.ts',
    'src/projects/profile/utils/logoPrintBase64.ts',
]


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def connect_client() -> paramiko.SSHClient:
    last_error: Exception | None = None
    targets = [HOST, HOSTNAME]

    for attempt in range(1, MAX_RETRIES + 1):
        for target in targets:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            try:
                safe_print(f'Connecting to {target} (attempt {attempt}/{MAX_RETRIES})...')
                client.connect(
                    target,
                    username=USER,
                    password=PW,
                    timeout=CONNECT_TIMEOUT,
                    banner_timeout=CONNECT_TIMEOUT,
                    auth_timeout=CONNECT_TIMEOUT,
                    look_for_keys=False,
                    allow_agent=False,
                )
                safe_print(f'Connected to {target}.')
                return client
            except Exception as exc:
                last_error = exc
                safe_print(f'Connection failed for {target}: {exc}')
                client.close()
        if attempt < MAX_RETRIES:
            wait = attempt * 3
            safe_print(f'Waiting {wait}s before retry...')
            time.sleep(wait)

    raise RuntimeError(f'Unable to connect to VPS after {MAX_RETRIES} attempts: {last_error}')


def run(client: paramiko.SSHClient, cmd: str, check: bool = True) -> str:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=600)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print(err.strip())
    code = stdout.channel.recv_exit_status()
    if check and code != 0:
        raise RuntimeError(f'Command failed ({code}): {cmd}')
    return out


def upload_file(sftp: paramiko.SFTPClient, local_rel: str, remote_rel: str) -> None:
    local_path = local_rel.replace('\\', '/')
    remote_path = f'{REMOTE_ROOT}/{remote_rel}'
    if not os.path.isfile(local_path):
        raise FileNotFoundError(f'Local file missing: {local_path}')
    safe_print(f'Uploading {local_path} -> {remote_path}')
    sftp.put(local_path, remote_path)


def upload_dist(sftp: paramiko.SFTPClient) -> None:
    dist_root = 'dist'
    if not os.path.isdir(dist_root):
        raise FileNotFoundError('Local dist folder missing. Run npm run build first.')

    for root, _, files in os.walk(dist_root):
        for filename in files:
            local_path = os.path.join(root, filename).replace('\\', '/')
            remote_path = f'{REMOTE_ROOT}/{local_path}'.replace('\\', '/')
            remote_dir = os.path.dirname(remote_path).replace('\\', '/')
            parts = remote_dir.split('/')
            current = ''
            for part in parts:
                current = f'{current}/{part}' if current else part
                try:
                    sftp.stat(current)
                except OSError:
                    try:
                        sftp.mkdir(current)
                    except OSError:
                        pass
            safe_print(f'Uploading {local_path} -> {remote_path}')
            sftp.put(local_path, remote_path)


def verify_bundle(client: paramiko.SSHClient) -> None:
    verify_cmd = (
        "python3 - <<'PY'\n"
        "import glob\n"
        f"paths = glob.glob('{REMOTE_ROOT}/dist/assets/ProfileApp-*.js')\n"
        "if not paths:\n"
        "    raise SystemExit('ProfileApp bundle not found')\n"
        "content = open(paths[0], encoding='utf-8', errors='ignore').read()\n"
        "checks = {\n"
        "    'ORIGINAL COPY': 'ORIGINAL COPY' in content,\n"
        "    'DUPLICATE COPY': 'DUPLICATE COPY' in content,\n"
        "    'challan original id': 'challan-original-print-area' in content,\n"
        "    'challan duplicate id': 'challan-duplicate-print-area' in content,\n"
        "}\n"
        "for label, ok in checks.items():\n"
        "    print(f'{label}:', 'OK' if ok else 'MISSING')\n"
        "if not all(checks.values()):\n"
        "    raise SystemExit(1)\n"
        "print('Bundle verification passed.')\n"
        "PY"
    )
    run(client, verify_cmd)


def main() -> None:
    client = connect_client()

    try:
        with client.open_sftp() as sftp:
            for rel in SOURCE_FILES:
                upload_file(sftp, rel, rel)

        run(client, f'test -f {REMOTE_ROOT}/src/projects/profile/utils/challanDownload.tsx && echo challanDownload.tsx OK')
        run(client, f'grep -n "CHALLAN_ORIGINAL_PRINT_ID" {REMOTE_ROOT}/src/projects/profile/components/ChallanPrintViews.tsx | head -1')

        try:
            run(client, f'cd {REMOTE_ROOT} && npm run build')
            verify_bundle(client)
        except Exception as build_error:
            safe_print(f'Remote build failed, uploading local dist instead: {build_error}')
            with client.open_sftp() as sftp:
                upload_dist(sftp)
            verify_bundle(client)

        run(client, 'pm2 restart frontend --update-env', check=False)
        run(client, 'pm2 save', check=False)
        run(client, f"grep -o 'ProfileApp-[^\\\"]*' {REMOTE_ROOT}/dist/index.html | head -1", check=False)
        run(client, 'curl -sI https://jagdambaprofile.tech/ | head -5', check=False)
    finally:
        client.close()

    safe_print('\nChallan dual PDF download deployed to live VPS successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)

import os
import sys

from deploy_common import (
    REMOTE_ROOT,
    connect_client,
    deploy_via_archives,
    restart_services,
    run,
    safe_print,
)

SRC_PATHS = [
    'src',
    'public',
    'backend/src',
    'server/src',
    'vite.config.ts',
    'jagdamba_nginx.txt',
]


def main() -> None:
    if not os.path.isdir('dist'):
        safe_print('ERROR: dist/ not found. Run first: npm run build')
        sys.exit(1)

    for path in SRC_PATHS:
        if not os.path.exists(path):
            safe_print(f'ERROR: missing {path}')
            sys.exit(1)

    client = connect_client()
    try:
        safe_print('\n=== Fast archive deploy (src + dist) ===')
        client = deploy_via_archives(client, SRC_PATHS, 'dist')

        run(client, f'test -f {REMOTE_ROOT}/src/projects/profile/index.css && echo profile theme OK')
        run(client, f'test -f {REMOTE_ROOT}/dist/index.html && echo dist index OK')

        safe_print('\n=== Restart services ===')
        restart_services(client)
    finally:
        client.close()

    safe_print('\nFull deploy completed successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)

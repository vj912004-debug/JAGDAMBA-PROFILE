import sys
import urllib.request

LIVE_URL = 'https://jagdambaprofile.tech/'


def fetch(url: str) -> str:
    with urllib.request.urlopen(url, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')


def main() -> None:
    print(f'Checking {LIVE_URL} ...')
    index = fetch(LIVE_URL)
    asset_name = None
    for token in index.replace('"', ' ').replace("'", ' ').split():
        if token.startswith('/assets/ProfileApp-') and token.endswith('.js'):
            asset_name = token
            break

    if not asset_name:
        print('Could not find ProfileApp bundle on live site.')
        sys.exit(1)

    bundle_url = f'https://jagdambaprofile.tech{asset_name}'
    print(f'Bundle: {bundle_url}')
    bundle = fetch(bundle_url)

    checks = {
        'ORIGINAL COPY': 'ORIGINAL COPY' in bundle,
        'DUPLICATE COPY': 'DUPLICATE COPY' in bundle,
        'challan-original-print-area': 'challan-original-print-area' in bundle,
        'challan-duplicate-print-area': 'challan-duplicate-print-area' in bundle,
    }

    for label, ok in checks.items():
        print(f'{label}:', 'OK' if ok else 'MISSING')

    if all(checks.values()):
        print('\nLive site has the dual challan PDF update.')
        return

    print('\nLive site does not yet have the challan PDF update.')
    sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'Verification failed: {exc}')
        sys.exit(1)

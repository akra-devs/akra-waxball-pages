"""Verify signed, immutable public Akra files without private source or keys."""
import base64
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

PUBLIC_KEY = '8UnRVQ4siBfIeXmofzCtoeEhZS9acGHufkb3olFmGZQ'


def unbase64(value):
    return base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))


def verify(root):
    root = Path(root).resolve()
    pointer = root / 'apps/waxball/channels/production/release.json'
    current = json.loads(pointer.read_text(encoding='utf-8'))
    allowed = {pointer}
    releases = list((root / 'apps/waxball/releases').glob('*/release.json'))
    assert releases, 'No immutable release'
    for path in releases:
        doc = json.loads(path.read_text(encoding='utf-8'))
        assert doc['schemaVersion'] == 2 and doc['appId'] == 'waxball'
        assert doc['channel'] == 'production'
        assert re.fullmatch(r'[a-z0-9][a-z0-9._-]{0,127}', doc['revision'])
        assert doc['revision'] == path.parent.name
        assert isinstance(doc['sequence'], int) and 0 < doc['sequence'] < 2**53
        signature = dict(doc['signature'])
        value = signature.pop('value')
        assert signature == {'algorithm': 'Ed25519', 'canonicalization': 'RFC8785', 'keyId': 'waxball-pages-2026'}
        # This manifest schema uses ASCII property names and integer numbers;
        # compact sorted JSON is its RFC8785 canonical representation.
        payload = {**doc, 'signature': signature}
        data = b'AKRA-RELEASE-MANIFEST-V2\n' + json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            (tmp / 'key.der').write_bytes(bytes.fromhex('302a300506032b6570032100') + unbase64(PUBLIC_KEY))
            (tmp / 'message').write_bytes(data)
            (tmp / 'signature').write_bytes(unbase64(value))
            subprocess.run(['openssl', 'pkeyutl', '-verify', '-pubin', '-keyform', 'DER',
                            '-inkey', str(tmp / 'key.der'), '-rawin', '-in', str(tmp / 'message'),
                            '-sigfile', str(tmp / 'signature')], check=True, capture_output=True)
        allowed.add(path.resolve())
        for name, item in doc['artifacts'].items():
            artifact = (path.parent / name).resolve()
            assert artifact.is_relative_to(path.parent.resolve())
            assert item['url'] == 'https://waxball.akra.kr/control-plane/' + artifact.relative_to(root).as_posix()
            content = artifact.read_bytes()
            assert len(content) == item['bytes'] and hashlib.sha256(content).hexdigest() == item['sha256']
            allowed.add(artifact)
    assert json.loads((root / 'apps/waxball/releases' / current['revision'] / 'release.json').read_text()) == current
    now = datetime.now(timezone.utc)
    assert datetime.fromisoformat(current['notBefore']) <= now < datetime.fromisoformat(current['expiresAt'])
    assert {p.resolve() for p in root.rglob('*') if p.is_file()} == allowed, 'Unexpected public file'
    assert not any(p.is_symlink() for p in root.rglob('*')), 'Symlinks are forbidden'
    print(f"Verified {len(releases)} signed releases; current revision {current['revision']}")


if __name__ == '__main__':
    verify(sys.argv[1] if len(sys.argv) > 1 else 'control-plane')

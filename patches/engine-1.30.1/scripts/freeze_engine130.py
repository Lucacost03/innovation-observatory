"""Retain the verified 1.30.0 baseline before applying the reporting patch."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
destination = root / 'research/frozen_engine_v1_30'
if destination.exists():
    manifest = json.loads((destination / 'manifest.json').read_text())
    for name, digest in manifest['files'].items():
        assert hashlib.sha256((destination / name).read_bytes()).hexdigest() == digest, name
    print('Verified retained engine 1.30.0 baseline.')
else:
    assert "MODEL_VERSION='1.30.0'" in (root / 'dist/parameters.mjs').read_text(), 'Freeze before overlaying the patch.'
    destination.mkdir(parents=True)
    pending, seen = ['engine.mjs', 'parameters.mjs'], set()
    while pending:
        name = pending.pop()
        if name in seen:
            continue
        seen.add(name)
        source = root / 'dist' / name
        shutil.copy2(source, destination / name)
        pending.extend(re.findall(r"(?:from\s*|import\s*)['\"]\./([^'\"]+\.mjs)['\"]", source.read_text()))
    shutil.copy2(root / 'dist/data/profiles.json', destination / 'profiles.json')
    manifest = {'version': '1.30.0',
                'originSourceSHA256': '7f27eb8de94e035c53c63732bbe6e34a49b20f8be400265276242ddfcc0f4b68',
                'files': {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                          for p in sorted(destination.glob('*')) if p.name != 'manifest.json'}}
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Frozen engine 1.30.0 with', len(seen), 'modules and original preset inputs.')

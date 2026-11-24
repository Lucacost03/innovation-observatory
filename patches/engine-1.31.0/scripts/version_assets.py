"""Version deployed module URLs together, after packaging the clean source."""
from pathlib import Path
import argparse
import json
import re

parser = argparse.ArgumentParser()
parser.add_argument('--version', required=True)
parser.add_argument('--directory', type=Path, default=Path(__file__).resolve().parents[1] / 'dist')
args = parser.parse_args()
assert re.fullmatch(r'[A-Za-z0-9._-]{1,100}', args.version), 'Invalid asset version'
root = args.directory.resolve()
patterns = [
    re.compile(r'''(?P<head>\bfrom\s*|\bimport\s*(?:\(\s*)?)(?P<q>['"])(?P<path>\.{1,2}/[^'"?#]+\.mjs)(?:\?[^'"]*)?(?P=q)'''),
    re.compile(r'''(?P<head>\bnew\s+(?:Worker|URL)\s*\(\s*)(?P<q>['"])(?P<path>\.{1,2}/[^'"?#]+\.mjs)(?:\?[^'"]*)?(?P=q)'''),
]
def replacement(match):
    return match['head'] + match['q'] + match['path'] + '?v=' + args.version + match['q']

count = 0
for path in root.glob('*.mjs'):
    text = path.read_text()
    for pattern in patterns:
        text, changes = pattern.subn(replacement, text)
        count += changes
    path.write_text(text)
index = root / 'index.html'
pattern = re.compile(r'''(?P<head>\b(?:src|href)\s*=\s*)(?P<q>['"])(?P<path>\./[^'"?#]+\.(?:mjs|css))(?:\?[^'"]*)?(?P=q)''')
text, changes = pattern.subn(replacement, index.read_text())
index.write_text(text)
print(json.dumps({'assetVersion': args.version, 'moduleReferences': count, 'htmlAssets': changes}))

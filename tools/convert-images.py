from pathlib import Path
from PIL import Image, ImageOps
import argparse
import shutil

repo = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Convert landing images to WebP and update references.')
parser.add_argument('landing', nargs='?', default='profi-atelier')
args = parser.parse_args()
root = (repo / 'landings' / args.landing).resolve()
if root.parent != (repo / 'landings').resolve():
    raise ValueError('Expected a landing folder directly inside landings/')
converted = []
before = after = 0
for source in (root / 'images').rglob('*'):
    if source.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
        continue
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.save(target, 'WEBP', quality=88, method=6)
        original_size = image.size
        original_alpha = image.getchannel('A').getextrema() if 'A' in image.getbands() else None
    with Image.open(target) as check:
        if check.size != original_size:
            raise ValueError(f'Image size changed: {target}')
        if original_alpha and check.getchannel('A').getextrema() != original_alpha:
            raise ValueError(f'Image transparency changed: {target}')
        check.verify()
    converted.append((source, target))
    before += source.stat().st_size
    after += target.stat().st_size

for file in root.rglob('*'):
    if file.suffix not in ('.html', '.css', '.js', '.json', '.md', '.mjs'):
        continue
    text = file.read_text(encoding='utf-8')
    updated = text
    for source, target in converted:
        updated = updated.replace(source.relative_to(root).as_posix(), target.relative_to(root).as_posix())
        if file.suffix == '.md':
            updated = updated.replace(source.name, target.name)
    if updated != text:
        file.write_text(updated, encoding='utf-8')

for source, _ in converted:
    backup = repo / 'outputs' / 'image-originals' / args.landing / source.relative_to(root)
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, backup)
    source.unlink()
print(f'Converted {len(converted)} images: {before:,} -> {after:,} bytes ({(1-after/before)*100 if before else 0:.1f}% smaller)')

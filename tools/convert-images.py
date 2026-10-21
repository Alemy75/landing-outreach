from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1] / 'landings' / 'profi-atelier'
converted = []
before = after = 0
for source in (root / 'images').rglob('*'):
    if source.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
        continue
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.save(target, 'WEBP', quality=88, method=6)
    with Image.open(target) as check:
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
    if updated != text:
        file.write_text(updated, encoding='utf-8')

for source, _ in converted:
    source.unlink()
print(f'Converted {len(converted)} images: {before:,} -> {after:,} bytes ({(1-after/before)*100 if before else 0:.1f}% smaller)')

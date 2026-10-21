import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const site=path.join(root,'landings/profi-atelier');
let checked=0;
for(const file of ['index.html','landings/profi-atelier/index.html']) {
  const html=await fs.readFile(path.join(root,file),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if(/^(?:https?:|tel:|mailto:|data:)/.test(match[1])) continue;
    let target=path.resolve(root,path.dirname(file),match[1].split(/[?#]/)[0]);
    if(match[1].endsWith('/'))target=path.join(target,'index.html');
    await fs.access(target); checked++;
  }
}
const html=await fs.readFile(path.join(site,'index.html'),'utf8');
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
if(schema.hasOfferCatalog.itemListElement.length!==17)throw new Error('Expected 17 services');
if(/images\/[^"\s<>]+\.(png|jpe?g)/i.test(html))throw new Error('Unconverted raster reference');
const data=JSON.parse(await fs.readFile(path.join(site,'data/profi-services.json'),'utf8'));
for(const row of data.services)if(row.image)await fs.access(path.join(site,row.image));
console.log(`Verified ${checked} local links, 17 services and all catalog image paths.`);

import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../landings/profi-atelier');
const source=JSON.parse(await fs.readFile(path.resolve(import.meta.dirname,'../outputs/profi-services-source.json'),'utf8'));
const imageDir=path.join(root,'images/01-profi/services');
await fs.mkdir(imageDir,{recursive:true});
await fs.mkdir(path.join(root,'data'),{recursive:true});
const groups={tailoring:'Пошив',hemming:'Подгиб',alteration:'Ремонт и подгонка'};
const records=[];
for(const row of source){
  const [sourceTitle,priceText]=row.text.split('\n');
  const name=sourceTitle.replace(/\s*\|\s*Кировский$/,'').trim().replace(/\s*\/\s*/g,' / ');
  const id=row.url.split('/').at(-1).replace('TYCOON_','');
  const price=Number(priceText.replace(/[^\d]/g,''));
  if(!Number.isFinite(price)||price<=0)throw new Error('Invalid source price: '+name);
  const group=/пошив/i.test(name)?'tailoring':/подгиб|Укоротить джинсы|свадебной юбки/i.test(name)?'hemming':'alteration';
  let image=null;
  if(row.download){image=`images/01-profi/services/${id}.webp`;await fs.access(path.join(root,image));}
  records.push({id,name,sourceTitle,price,currency:'RUB',group,image,imageSource:row.images[0]?.src||null,sourceUrl:row.url,checkedAt:'2026-10-21'});
}
const order=['81805363696','81805363697','81805363695','81805363698','81805363699','84657335462'];
records.sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return (ai<0?(a.image?100:200):ai)-(bi<0?(b.image?100:200):bi)});
await fs.writeFile(path.join(root,'data/profi-services.json'),JSON.stringify({source:'https://atele-profi.clients.site/',checkedAt:'2026-10-21',services:records},null,2)+'\n');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const money=new Intl.NumberFormat('ru-RU');
const cards=records.map(r=>`          <article class="catalog-card${r.image?'':' catalog-card-no-image'}" data-category="${r.group}">
${r.image?`            <a class="catalog-image-link" href="${escape(r.image)}" target="_blank" rel="noopener" aria-label="Открыть изображение: ${escape(r.name)}"><img class="catalog-image" src="${escape(r.image)}" alt="${escape(r.name)}: изображение из каталога ателье «Профи»" width="1024" height="720" loading="lazy" decoding="async"></a>`:''}
            <div class="catalog-copy"><p class="catalog-category">${groups[r.group]}</p><h3><a href="${escape(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(r.name)}</a></h3>${r.image?'':'<p class="catalog-no-photo">В каталоге ателье нет изображения этой услуги.</p>'}<div class="catalog-card-bottom"><p class="catalog-price">${money.format(r.price)} <span>₽</span></p><a class="text-link" href="tel:+79159820608">Позвонить <span aria-hidden="true">↗</span></a></div></div>
          </article>`).join('\n');
const section=`    <!-- Imported service catalog: https://atele-profi.clients.site/ | 2026-10-21 -->
    <section class="section catalog" id="catalog" aria-labelledby="catalog-title">
      <div class="container">
        <header class="section-heading"><h2 id="catalog-title">Услуги и цены</h2><p>От подгиба джинсов до пошива пальто. Выберите нужную услугу и обсудите детали с ателье.</p></header>
        <div class="catalog-toolbar" hidden>
          <div class="catalog-filters" role="group" aria-label="Вид услуги">
            <button type="button" data-filter="all" aria-pressed="true">Все услуги</button>
            <button type="button" data-filter="tailoring" aria-pressed="false">Пошив</button>
            <button type="button" data-filter="hemming" aria-pressed="false">Подгиб</button>
            <button type="button" data-filter="alteration" aria-pressed="false">Ремонт и подгонка</button>
          </div>
        </div>
        <div class="catalog-grid" id="catalog-items" tabindex="0" role="region" aria-roledescription="карусель" aria-label="Услуги ателье">
${cards}
        </div>
        <div class="catalog-navigation" hidden>
          <span class="catalog-hint">Листайте, чтобы найти своё</span>
          <p class="catalog-status" aria-live="polite" aria-atomic="true"></p>
          <div class="catalog-progress" aria-hidden="true"><div class="catalog-progress-fill"></div></div>
          <div class="catalog-arrows">
            <button class="catalog-arrow" type="button" data-slide-prev aria-label="Предыдущая услуга" aria-controls="catalog-items"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>
            <button class="catalog-arrow" type="button" data-slide-next aria-label="Следующая услуга" aria-controls="catalog-items"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
          </div>
        </div>
        <p class="catalog-source">Цены из <a href="https://atele-profi.clients.site/#services" target="_blank" rel="noopener noreferrer">каталога ателье</a>, проверены <time datetime="2026-10-21">21 октября 2026</time>. Стоимость и срок вашего заказа уточните перед обращением.</p>
      </div>
    </section>
    <!-- End imported service catalog -->

`;
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
if(html.includes('<!-- Imported service catalog:'))html=html.replace(/    <!-- Imported service catalog:[\s\S]*?    <!-- End imported service catalog -->\r?\n(?:\r?\n)?/,'');
html=html.replace('    <section class="section work"',section+'    <section class="section work"');
const schemaPattern=/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/;
const schema=JSON.parse(html.match(schemaPattern)[1]);
schema.sameAs=[...new Set([...(schema.sameAs||[]),'https://atele-profi.clients.site/'])];
schema.hasOfferCatalog={ '@type':'OfferCatalog',name:'Услуги и цены ателье Профи',itemListElement:records.map(r=>({'@type':'Offer',price:r.price,priceCurrency:r.currency,url:r.sourceUrl,itemOffered:{'@type':'Service',name:r.name,areaServed:{'@type':'City',name:'Ярославль'}}}))};
html=html.replace(schemaPattern,`<script type="application/ld+json">\n${JSON.stringify(schema,null,2)}\n  </script>`);
await fs.writeFile(path.join(root,'index.html'),html);
const md=['# Услуги ателье «Профи»','', 'Источник: https://atele-profi.clients.site/#services','Проверено: 21.10.2026. Названия и цены перенесены из каталога. Суффикс «| Кировский» в отображаемых названиях опущен; исходные названия сохранены в JSON. Подробные описания не добавлялись.','', '| Услуга | Цена, ₽ | Изображение | Источник |','| --- | ---: | --- | --- |',...records.map(r=>`| ${r.name} | ${money.format(r.price)} | ${r.image?`[Скачать](${r.image})`:'В источнике нет'} | [Карточка](${r.sourceUrl}) |`),'','Оригинальные URL изображений и числовые цены сохранены в data/profi-services.json. Цены могут изменяться, стоимость конкретного заказа нужно уточнить у ателье.'];
await fs.writeFile(path.join(root,'profi-services.md'),md.join('\n')+'\n');
console.log(JSON.stringify({services:records.length,images:records.filter(x=>x.image).length,priceMin:Math.min(...records.map(x=>x.price)),priceMax:Math.max(...records.map(x=>x.price))}));

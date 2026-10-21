// Run after the real production domain is known. Never invent a domain.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const input=process.argv[2] || process.env.SITE_URL;
if(!input) {console.error('Укажите реальный адрес: npm run prepare:seo -- https://ваш-домен.рф');process.exit(1)}
const url=new URL(input);
if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash || /^(localhost|127\.|example\.)/.test(url.hostname)){console.error('Нужен HTTPS-адрес сайта.');process.exit(1)}
const base=url.href.replace(/\/?$/, '/');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let html=await readFile(resolve(root,'index.html'),'utf8');
html=html.replace(/\n  <!-- Production URL metadata -->[\s\S]*?<!-- End production URL metadata -->/,'');
const tags=`\n  <!-- Production URL metadata -->\n  <link rel="canonical" href="${escape(base)}">\n  <meta property="og:url" content="${escape(base)}">\n  <meta property="og:image" content="${escape(base)}images/01-profi/atelier-hero.webp">\n  <meta property="og:image:alt" content="Пошив пиджака в мастерской">\n  <!-- End production URL metadata -->`;
html=html.replace('</head>',tags+'\n</head>');
const ld=/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/;
const data=JSON.parse(html.match(ld)[1]);data.url=base;data['@id']=base+'#atelier';data.image=[base+'images/01-profi/photo-1.webp',base+'images/01-profi/photo-2.webp'];
html=html.replace(ld,`<script type="application/ld+json">\n${JSON.stringify(data,null,2)}\n  </script>`);
await writeFile(resolve(root,'index.html'),html);
await writeFile(resolve(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
await writeFile(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(base)}</loc></url></urlset>\n`);
console.log('Canonical, Open Graph, LocalBusiness, robots.txt и sitemap.xml настроены для '+base);

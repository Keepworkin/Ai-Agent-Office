import {readFileSync,existsSync,readdirSync} from 'node:fs';
const html=readFileSync('dist/index.html','utf8');
const referenced=new Set(['index.html']);
for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 if(/^(?:https?:|data:|#)/.test(ref)) continue;
 if(!existsSync('dist/'+ref)) throw new Error('Missing local asset: '+ref);
 referenced.add(ref);
}
// Stylesheets pull in images with url(...).
for(const sheet of [...referenced].filter(file=>file.endsWith('.css'))){
 for(const [,ref] of readFileSync('dist/'+sheet,'utf8').matchAll(/url\(['"]?([^'")]+)['"]?\)/g)){
  if(/^(?:https?:|data:)/.test(ref)) continue;
  if(!existsSync('dist/'+ref)) throw new Error(`Missing asset in ${sheet}: ${ref}`);
  referenced.add(ref);
 }
}
// dist/ is deployed as-is, so anything unreferenced ships to every visitor for nothing.
const unused=readdirSync('dist').filter(file=>!referenced.has(file));
if(unused.length) throw new Error('Unreferenced files in dist/: '+unused.join(', '));
console.log(`Local asset references verified; all ${referenced.size} files in dist/ are used.`);

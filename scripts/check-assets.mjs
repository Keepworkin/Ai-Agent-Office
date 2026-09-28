import {readFileSync,existsSync} from 'node:fs';
const html=readFileSync('dist/index.html','utf8');
for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 if(/^(?:https?:|data:|#)/.test(ref)) continue;
 if(!existsSync('dist/'+ref)) throw new Error('Missing local asset: '+ref);
}
console.log('Local asset references verified.');

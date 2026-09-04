import {cp,mkdir,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
for(const file of await readdir('src'))if(file.endsWith('.js'))execFileSync(process.execPath,['--check',`src/${file}`],{stdio:'inherit'});
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const file of ['index.html','src'])await cp(file,`dist/${file}`,{recursive:true});
console.log('Синтаксис перевірено. Збірку створено в dist/');

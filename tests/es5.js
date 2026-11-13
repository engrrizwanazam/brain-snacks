const acorn=require('acorn'),fs=require('fs');const d=process.argv[2];let bad=0;
for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.js'))){const s=fs.readFileSync(d+'/'+f,'utf8');
 try{acorn.parse(s,{ecmaVersion:5});}catch(e){bad++;console.log('ES5 FAIL',f,e.message);}
 const m=s.match(/\.at\(|Object\.fromEntries|\.animate\(|requestAnimationFrame|setTimeout\(|setInterval\(|\.includes\(|\.padStart|\.find\(|\.findIndex\(|Object\.assign|Array\.from|\.startsWith|\.endsWith|\.repeat\(|Number\.is|Math\.sign|Math\.trunc|\.closest\(|classList|new Set|new Map|Promise|\.fill\(|\.keys\(\)|\.values\(|\.entries\(/g);
 if(m){const c={};m.forEach(x=>c[x]=(c[x]||0)+1);console.log(f,JSON.stringify(c));}}
console.log('bad',bad);

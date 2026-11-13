const L=require('./lib.js');
(async()=>{const t=await L.open(require('path').resolve(__dirname, '..'));const r=await t.p.evaluate(()=>PUZZLES.map((p,i)=>[i+1,p.d,BS.pid(p),p.ask.slice(0,70)].join(' | ')));console.log(r.join('\n'));console.log(t.errs);await t.close();})();

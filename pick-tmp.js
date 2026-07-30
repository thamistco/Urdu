const {chromium}=require('playwright-core');const fs=require('fs');
const FONT=fs.readFileSync('node_modules/@expo-google-fonts/noto-nastaliq-urdu/NotoNastaliqUrdu_600SemiBold.ttf').toString('base64');
const dir=fs.readdirSync('/opt/pw-browsers').filter(d=>d.startsWith('chromium-')).sort().pop();
const tile=(o,i)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><linearGradient id="g${i}" x1="0" y1="0" x2="0.35" y2="1">
<stop offset="0" stop-color="${o.b1}"/><stop offset="1" stop-color="${o.b2||o.b1}"/></linearGradient></defs>
<rect width="1024" height="1024" fill="url(#g${i})"/>
<circle cx="470" cy="625" r="100" fill="${o.dot}"/>
<text x="512" y="714" text-anchor="middle" font-family="Nastaliq" font-size="820"
 fill="${o.fg}" stroke="${o.fg}" stroke-width="16" stroke-linejoin="round">ح</text></svg>`;
const C=[
 ['cream / bright orange (just shipped)', {b1:'#FF9A50',b2:'#DE4A16',fg:'#FFF6EA',dot:'#2A1208'}],
 ['ink / bright orange',                  {b1:'#FF9A50',b2:'#F0741F',fg:'#2A1208',dot:'#FFF6EA'}],
 ['cream / deep ember',                   {b1:'#D14A10',b2:'#A8330A',fg:'#FFF6EA',dot:'#2A1208'}],
 ['cream / deeper ember',                 {b1:'#C2410C',b2:'#932E06',fg:'#FFF6EA',dot:'#2A1208'}],
 ['cream / terracotta',                   {b1:'#B33C12',b2:'#8A2A08',fg:'#FFF6EA',dot:'#2A1208'}],
];
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/'+dir+'/chrome-linux/chrome',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1024,height:1024}});
const S={};
console.log('candidate'.padEnd(38),'contrast  %<3:1   ground lum  sat');
for(let i=0;i<C.length;i++){
  const [n,o]=C[i];
  await p.setContent(`<style>@font-face{font-family:Nastaliq;src:url(data:font/ttf;base64,${FONT});}html,body{margin:0}</style>${tile(o,i)}`);
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(180);
  const shot=await p.screenshot(); S[n]=shot.toString('base64');
  await p.setContent(`<body style="margin:0"><img id=i src="data:image/png;base64,${S[n]}" width=1024 height=1024></body>`);
  await p.waitForTimeout(140);
  const r=await p.evaluate((fg)=>{
    const c=document.createElement('canvas');c.width=1024;c.height=1024;
    const x=c.getContext('2d');x.drawImage(document.getElementById('i'),0,0);
    const d=x.getImageData(0,0,1024,1024).data;
    const L=(r,g,b)=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};
    const t=[parseInt(fg.slice(1,3),16),parseInt(fg.slice(3,5),16),parseInt(fg.slice(5,7),16)];
    const isFg=i=>Math.abs(d[i]-t[0])<14&&Math.abs(d[i+1]-t[1])<14&&Math.abs(d[i+2]-t[2])<14;
    const crs=[];
    for(let y=0;y<1024;y+=2)for(let X=0;X<1024;X+=2){const i=(y*1024+X)*4;if(!isFg(i))continue;
      for(const dx of [-18,18]){const j=(y*1024+Math.min(1023,Math.max(0,X+dx)))*4;if(isFg(j))continue;
        const a=L(d[i],d[i+1],d[i+2]),bl=L(d[j],d[j+1],d[j+2]);crs.push((Math.max(a,bl)+0.05)/(Math.min(a,bl)+0.05));}}
    crs.sort((a,b)=>a-b);
    const s0=x.getImageData(120,120,40,40).data;let R=0,G=0,B=0;
    for(let i=0;i<s0.length;i+=4){R+=s0[i];G+=s0[i+1];B+=s0[i+2];}
    const n0=s0.length/4;R=Math.round(R/n0);G=Math.round(G/n0);B=Math.round(B/n0);
    const mx=Math.max(R,G,B)/255,mn=Math.min(R,G,B)/255;
    return {med:+crs[Math.floor(crs.length*0.5)].toFixed(2),u3:+(crs.filter(v=>v<3).length/crs.length*100).toFixed(0),
      lum:+L(R,G,B).toFixed(3),sat:+((mx-mn)/mx).toFixed(2)};
  }, o.fg);
  console.log(n.padEnd(38), String(r.med+':1').padStart(8), String(r.u3+'%').padStart(6), String(r.lum).padStart(11), String(r.sat).padStart(5));
}
fs.writeFileSync(process.argv[2], JSON.stringify(S));
await b.close();})();

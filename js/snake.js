'use strict';
/* ═══════════════ بافر پیکسلی و اسپرایت‌های شفاف ═══════════════ */
var SP_W=200, SP_H=150, SP_OX=32, SP_OY=36, SP_AX=50, SP_AY=52;
function newBuf(){ return { b:new Uint8Array(SP_W*SP_H) }; }
function bpx(g,x,y,i){ x=Math.round(x)+SP_OX; y=Math.round(y)+SP_OY;
  if(x>=0&&x<SP_W&&y>=0&&y<SP_H) g.b[y*SP_W+x]=i; }
function brect(g,x,y,w,h,i){ for(var j=0;j<h;j++)for(var k=0;k<w;k++)bpx(g,x+k,y+j,i); }
function bell(g,cx,cy,rx,ry,i){ if(rx<.5)rx=.5;if(ry<.5)ry=.5;
  for(var y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)
  for(var x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
    var dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1.05)bpx(g,x,y,i);} }
function bpoly(g,p,i){ var y0=1e9,y1=-1e9,k;
  for(k=0;k<p.length;k++){if(p[k][1]<y0)y0=p[k][1];if(p[k][1]>y1)y1=p[k][1];}
  for(var y=Math.ceil(y0);y<=Math.floor(y1);y++){var xs=[];
    for(k=0;k<p.length;k++){var a=p[k],q=p[(k+1)%p.length];
      if((a[1]<=y&&q[1]>y)||(q[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])/(q[1]-a[1])*(q[0]-a[0]));}
    xs.sort(function(m,n){return m-n;});
    for(k=0;k+1<xs.length;k+=2)for(var x=Math.ceil(xs[k]);x<=Math.floor(xs[k+1]);x++)bpx(g,x,y,i);} }
function bline(g,x0,y0,x1,y1,i,t){ t=t||1; var r=t>>1,n=0;
  var dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx-dy;
  while(n++<900){for(var j=-r;j<=r;j++)for(var k=-r;k<=r;k++)bpx(g,x0+k,y0+j,i);
    if(x0==x1&&y0==y1)break;var e2=2*e;
    if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}}
function outlineBuf(g){
  var s=new Uint8Array(g.b);
  for(var y=0;y<SP_H;y++)for(var x=0;x<SP_W;x++){
    if(s[y*SP_W+x])continue;
    var l=x>0?s[y*SP_W+x-1]:0, r=x<SP_W-1?s[y*SP_W+x+1]:0,
        u=y>0?s[(y-1)*SP_W+x]:0, d=y<SP_H-1?s[(y+1)*SP_W+x]:0;
    if((l&&l!=1)||(r&&r!=1)||(u&&u!=1)||(d&&d!=1)) g.b[y*SP_W+x]=1; }
}
function bakeBuf(g,pal){
  var c=document.createElement('canvas'); c.width=SP_W; c.height=SP_H;
  var cc=c.getContext('2d');
  for(var y=0;y<SP_H;y++)for(var x=0;x<SP_W;x++){
    var v=g.b[y*SP_W+x];
    if(v){ cc.fillStyle=pal[v]; cc.fillRect(x,y,1,1); } }
  return c;
}
function makeCleanSprite(w, h, rows, cmap){
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var cc = c.getContext('2d');
  for (var y=0; y<rows.length && y<h; y++){
    var r = rows[y];
    for (var x=0; x<r.length && x<w; x++){
      var ch = r[x];
      if (ch !== '.' && cmap[ch]){
        cc.fillStyle = cmap[ch];
        cc.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

var PX_ICONS = {};
var PX_URLS = {};
function initPixelIcons(){
  var defs = {
    apple: [20, 20, [
      '..........ooo.......','.........oGGGo......','........oGgGGgo.....','.......ob..oo.......',
      '........ob..........','....ooooobooooo.....','...oRRRRRoRRRRro....','..oRRWWWRRRRRRRro...',
      '..oRRWWRRRRRRRRddo..','.oRRRRRRRRRRRRRRdo..','.oRRRRRRRRRRRRRRdo..','.oRRRRRRRRRRRRRddo..',
      '.oRRRRRRRRRRRRdddo..','..orRRRRRRRRRdddo...','..orrrrrrrrrddddo...','...orrdddddddooo....',
      '....ooorrrrooo......','.......oooo.........','....................','....................'
    ], { o:'#1a080c', R:'#f02843', r:'#c9162e', d:'#8c0b1d', W:'#ffd6dc', b:'#784421', G:'#68c962', g:'#368a32' }],

    gold: [20, 20, [
      '....................','.........oo.........','........oYYo........','.......oYWWYo.......',
      '.......oYYYYo.......','..oooooooYYooooooo..','.oYWWYYYYYYYYYYYYYo.','..oYYYYYYYYYYYYYYdo.',
      '...oYYYYYYYYYYYddo..','....oYYYYYYYYYddo...','....oYYYYYYYYdddo...','...oYYYYYYYYYYYdo...',
      '...oYYYYYddYYYYdo...','..oYYYYdd..ddYYddo..','..oYYdd......ddYYo..','..ooo..........ooo..',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd83e', d:'#d97706', W:'#fffbe6' }],

    crystal: [20, 20, [
      '........oooo........','.......oPPPPo.......','......oPPWWPPo......','.....oPPWWWWPPo.....',
      '....oPPPWWWWPPPo....','...oPPPPCCCCPPPPo...','..oPPPPCCCCCCPPPPo..','..oPPPCCWWWWCCPPPo..',
      '..oPPPCCCCCCCCPPPo..','...oPPPCCCCCCPPPo...','....oPPCCCCCCPPo....','.....oPPCCCCPPo.....',
      '......oPPddPPo......','.......oPddPo.......','........oooo........','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e0b3b', P:'#a855f7', C:'#38bdf8', d:'#6b21a8', W:'#f5f3ff' }],

    bomb: [20, 20, [
      '..............oYo...','.............oYWWo..','............oROYo...','..........bb.oRo....',
      '........ob..........','.......oMMMMo.......','......oMMWWMMo......','....oooKKKKKKooo....',
      '...oKKWWWWKKKKddo...','..oKKWWKKKKKKKKddo..','..oKKWKKKRRRKKKddo..','..oKKKKKRRRRRKKddo..',
      '..oKKKKKRRRRRKKddo..','..oKKKKKKRRRKKdddo..','...oKKKKKKKKddddo...','....oddddddddddo....',
      '.....oooooooooo.....','....................','....................','....................'
    ], { o:'#05080f', K:'#3b4d63', d:'#1e293b', M:'#94a3b8', W:'#f8fafc', b:'#d97706', O:'#f97316', Y:'#fde047', R:'#ef4444' }],

    ghost: [20, 20, [
      '....................','......oooooooo......','....ooWWWWWWWWoo....','...oWWWWCCCCCCCCo...',
      '..oWWWCCCCCCCCCCCo..','..oWWCCCCCCCCCCCCo..','.oWCCoooCCCCoooCCCo.','.oWCCoWKoCCCoWKoCCo.',
      '.oWCCoKKoCCCoKKoCCo.','.oWCCoooCCCCoooCCCo.','.oWCCCCCCCCCCCCCCCo.','.oWCCCCbbCCbbCCCCbo.',
      '.oWCCCCCCCCCCCCCCbo.','.oWCCboCCboCCboCCbo.','.oWCCo.oo..oo.oCCo..','..ooo..........ooo..',
      '....................','....................','....................','....................'
    ], { o:'#0c2d48', C:'#7dd3fc', W:'#f0f9ff', b:'#38bdf8', K:'#09111e' }],

    slow: [20, 20, [
      '....................','....................','....................','...oooooo...........',
      '.ooYYYYYYoo.........','oYYWWYYYYddo.ooo.ooo','oYWYdooooodo.oKo.oKo','oYYdoYYYYddo.oCo.oCo',
      'oYYdoYddYddo.oCo.oCo','oYYdoYooYddo.oCCoCCo','.oYYdoooYddo.oCCCCCo','.ooYYddddYoo.oCCWCCo',
      '..oooooooooooCCCCCCo','..oCCCCCCCCCCCCCCCCo','.oCWCCCCCCCCCCCCCCbo','.oCCCCCCCCCCCCCCCbbo',
      '..ooooooooooooooooo.','....................','....................','....................'
    ], { o:'#1a140c', Y:'#fbbf24', d:'#b45309', W:'#fffbeb', C:'#2dd4bf', b:'#0d9488', K:'#0f172a' }],

    double: [20, 20, [
      '....................','.....oooooooooo.....','...ooYYYYYYYYYYoo...','..oYYWWWWWWWWYYYYo..',
      '.oYYWWooYYYYYYooddo.','.oYYoWWWWoYYYoWoWdo.','oYYYooooWoYYYoWoWddo','oYYYYYoWWoYYYoWWoddo',
      'oYYYYoWWooYYYYoWoodo','oYYYoWWoooYYYoWWoddo','oYYYoWWWWoYYYoWoWddo','.oYYooooooYYYoWoWdo.',
      '.oYYdddddddddddddYo.','..ooYYYYdddddddyoo..','....oooooooooooo....','....................',
      '....................','....................','....................','....................'
    ], { o:'#451a03', Y:'#ffd43b', y:'#d97706', d:'#92400e', W:'#ffffff' }],

    orb: [20, 20, [
      '....................','......oooooooo......','....ooCCCCCCCCoo....','...oCCWWWWCCCCCCo...',
      '..oCCWWWWCCCCCCCCo..','..oCCWWCCCCCCCCbCo..','.oCCCCCCCCCCCCCbbCo.','.oCCCCCCCCCCCCCbbCo.',
      '.oCCCCCCCCCCCbbbbCo.','..oCCCCCCCCCbbbbCo..','..oCCCCCCCCbbbbCCo..','...oCCCCCCbbbbCCo...',
      '....ooCCCCCCCCoo....','......oooooooo......','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0c2d48', C:'#38bdf8', b:'#0284c7', W:'#e0f2fe' }],

    acid: [20, 20, [
      '........oGGGo.......','.......oGWWGGo......','........oooo........','.......oPPPPo.......',
      '.......oPWWPo.......','........oPPo........','......ooPPPPoo......','....ooPWWPPPPPoo....',
      '...oPPWPPPPPPPPPo...','..oPPPPGGGGGGPPPPo..','..oPPPGGGGGGGGPPPo..','..oPPPGGWGGGGGddPo..',
      '..oPPPGGGGGGGGddPo..','...oPPPGGGGGGdddo...','....ooPPPPddddoo....','......oooooooo......',
      '....................','....................','....................','....................'
    ], { o:'#2e0947', P:'#c026d3', d:'#701a75', W:'#fae8ff', G:'#a3e635' }],

    portal: [20, 20, [
      '......oooooooo......','....ooCCCCCCCCoo....','...oCCWWWWWWWWCCo...','..oCWCCPPPPPPCCWCo..',
      '..oWCWPPPPPPPPWCWo..','.oWCWPWWWWWWWWPWCCo.','.oWCWPWCCCCCCWPWCCo.','.oWCWPWCWWWWCWPWCCo.',
      '.oWCWPWCWWWWCWPWCCo.','.oWCWPWCCCCCCWPWCCo.','.oWCWPWWWWWWWWPWCCo.','..oWCWPPPPPPPPWCWo..',
      '..oCWCCPPPPPPCCWCo..','...oCCWWWWWWWWCCo...','....ooCCCCCCCCoo....','......oooooooo......',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', C:'#38bdf8', P:'#a855f7', W:'#ffffff' }],

    portal_b: [20, 20, [
      '......oooooooo......','....ooYYYYYYYYoo....','...oYYWWWWWWWWYYo...','..oYWYYOOOOOOYYWYo..',
      '..oWYWOORRRROOWYWo..','.oWYWOOWWWWWWOOWYYo.','.oWYWOWYYYYYYWOWYYo.','.oWYWOWYWWWWYWOWYYo.',
      '.oWYWOWYWWWWYWOWYYo.','.oWYWOWYYYYYYWOWYYo.','.oWYWOOWWWWWWOOWYYo.','..oWYWOORRRROOWYWo..',
      '..oYWYYOOOOOOYYWYo..','...oYYWWWWWWWWYYo...','....ooYYYYYYYYoo....','......oooooooo......',
      '....................','....................','....................','....................'
    ], { o:'#2b0712', Y:'#fde047', O:'#f97316', R:'#ef4444', W:'#ffffff' }],

    fireball: [20, 20, [
      '.........oo.........','........oRRo........','.......oRORRo.......','......oROYYORo......',
      '.....oROYYYYORo.....','....oROYYWWYYORo....','...oROYYWWWWYYORo...','...oROYYWWWWYYORo...',
      '...oROYYYYYYYYORo...','....oROYYYYYYORo....','....oROOOOOOOORo....','.....oRRRRRRRRo.....',
      '......oooooooo......','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#3b0a0a', R:'#ef4444', O:'#f97316', Y:'#fde047', W:'#fefce8' }],

    superfire: [20, 20, [
      '.......oooooo.......','.....ooYYYYYYoo.....','....oYYWWWWWWYYo....','...oYWWOOOOOOWWYo...',
      '..oYWOORRRRRROOWYo..','..oYWORWWWWWWROWYo..','..oYWORWWWWWWROWYo..','..oYWOORRRRRROOWYo..',
      '...oYWWOOOOOOWWYo...','....oYYWWWWWWYYo....','.....ooYYYYYYoo.....','.......oooooo.......',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#451a03', Y:'#fde047', O:'#f97316', R:'#ef4444', W:'#ffffff' }],

    heart_full: [20, 20, [
      '....................','...ooooo....ooooo...','..oRRRRRo..oRRRRRo..','.oRRWWWRRroRRRRRRro.',
      '.oRRWWRRRRRRRRRRRdo.','.oRRRRRRRRRRRRRRRdo.','.oRRRRRRRRRRRRRRRdo.','..oRRRRRRRRRRRRRdo..',
      '...oRRRRRRRRRRRdo...','....oRRRRRRRRRdo....','.....oRRRRRRRdo.....','......oRRRRRdo......',
      '.......oRRRdo.......','........oRdo........','.........oo.........','....................',
      '....................','....................','....................','....................'
    ], { o:'#330610', R:'#ff3b5c', r:'#e11d48', d:'#9f1239', W:'#ffd1da' }],

    heart_empty: [20, 20, [
      '....................','...ooooo....ooooo...','..oDDDDDo..oDDDDDo..','.oDDDDDDDdoDDDDDDdo.',
      '.oDDDDDDDDDDDDDDDdo.','.oDDDDDDDDDDDDDDDdo.','.oDDDDDDDDDDDDDDDdo.','..oDDDDDDDDDDDDDdo..',
      '...oDDDDDDDDDDDdo...','....oDDDDDDDDDdo....','.....oDDDDDDDdo.....','......oDDDDDdo......',
      '.......oDDDdo.......','........oDdo........','.........oo.........','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', D:'#475569', d:'#1e293b' }],

    shield: [20, 20, [
      '....................','..oooooooooooooooo..','.oSSSSSSSSSSSSSSSSo.','.oSSCCCYYYYYYCCCSSo.',
      '.oSSCCCYYYYYYCCCSSo.','.oSSCCCYYYYYYCCbSSo.','.oSSYYYYYYYYYYYbSSo.','.oSSYYYYYYYYYYYbSSo.',
      '..oSCCCYYYYYYCbbSo..','..oSCCCYYYYYYCbbSo..','...oSCCYYYYYYbbSo...','...oSSCYYYYYYbSSo...',
      '....oSSCYYYYbSSo....','.....oSSCCCCSSo.....','......oSSSSSSo......','.......ooSSoo.......',
      '.........oo.........','....................','....................','....................'
    ], { o:'#0f172a', S:'#cbd5e1', C:'#3b82f6', b:'#1d4ed8', Y:'#ffd43b' }],

    coin: [20, 20, [
      '......oooooooo......','....ooYYYYYYYYoo....','...oYYWWWWYYYYYYo...','..oYYWWyyyyyYYYYdo..',
      '..oYYWyYYYYYyYYYdo..','.oYYWWyYYYYYyYYYddo.','.oYYWWyYYYYYyYYYddo.','.oYYWWyYYYYYyYYYddo.',
      '.oYYWWyYYYYYyYYYddo.','..oYYWyyyyyyyYYYdo..','..oYYYYYYYYYYYYddo..','...oYYYYYYYYYYddo...',
      '....ooddddddddoo....','......oooooooo......','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd43b', y:'#f59e0b', d:'#b45309', W:'#fffbeb' }],

    gem: [20, 20, [
      '.....oooooooooo.....','....oCCWWWWWWCCo....','...oCCWWWWWWWWCCo...','..oCCCCWWWWWWCCCCo..',
      '.oCCCCCCCCCCCCCCCCo.','.oCCCddddddddddCCCo.','..oCCddddddddddCCo..','...oCCddddddddCCo...',
      '....oCCddddddCCo....','.....oCCddddCCo.....','......oCCddCCo......','.......oCCCCo.......',
      '........oCCo........','.........oo.........','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#064e3b', C:'#46f88f', d:'#059669', W:'#d1fae5' }],

    trophy: [20, 20, [
      '...oooooooooooooo...','..oYYYYYYYYYYYYYYo..','.oYYoYYYYWWYYYYoYYo.','.oYo.oYYYYYYYYo.oYo.',
      '..oo.oYYYYYYYdo.oo..','......oYYYYYdo......','.......oYYYdo.......','........oYYo........',
      '........oYYo........','.......oYYYYo.......','......oddddddo......','.....oddddddddo.....',
      '.....oooooooooo.....','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd43b', d:'#b45309', W:'#fffbeb' }],

    sword: [20, 20, [
      '....................','..............oooo..','.............oWWSSo.','............oWWSSSo.',
      '...........oWWSSSo..','..........oWWSSSo...','.........oWWSSSo....','........oWWSSSo.....',
      '..ooo..oWWSSSo......','.oGGGo.oWSSSo.......','..oGGGoWSSSo........','...oGGGGGGoo........',
      '....oGGGGGGo........','...obboGGGGGo.......','..obbbo.oGGGo.......','.oYYbo...ooo........',
      '.oYYo...............','..oo................','....................','....................'
    ], { o:'#0f172a', S:'#94a3b8', W:'#f8fafc', G:'#ffd43b', Y:'#f59e0b', b:'#78350f' }],

    shop: [20, 20, [
      '..oooooooooooooooo..','.oRRRWWWRRRRWWWRRRo.','.oRRRWWWRRRRWWWRRRo.','.oRRRRRRRRRRRRRRRRo.',
      '..oooooooooooooooo..','..obYYYYYYYYYYYYbo..','..obYCCCCbbYYYYYbo..','..obYCCCCbbYYYYYbo..',
      '..obYCCCCbbYYYYYbo..','..obbbbbbbbbbbbbbo..','..oooooooooooooooo..','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e1b4b', R:'#ef4444', W:'#ffffff', b:'#78350f', Y:'#fbbf24', C:'#38bdf8' }],

    snake_ico: [20, 20, [
      '......oooooooo......','....ooGGGGGGGGoo....','...oGGddGGGGGGGGoo..','..oGGGGGGKWWGGGGGGoo',
      '..oGGGGGGKKKGGGdGGGo','..oGGCCCCCCCCCCCCCCo','..oGCCCoooooooooooo.','..oGCCCo..r..r......',
      '..oGCCCoo..rr.......','..ooGGGGGGoooo......','...oGGddGGGGGGoo....','..oGGGGGGGGddGGGo...',
      '..oooooooooooooooo..','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#122016', G:'#68a862', d:'#2d5932', C:'#ede1b0', K:'#0c140e', W:'#ffffff', r:'#e62e4c' }],

    gift: [20, 20, [
      '.....oooo..oooo.....','....oYYYYooYYYYo....','..oooooooooooooooo..','.oRRRRRYYYYYYRRRRRo.',
      '.oRRRRRYYYYYYRRRRRo.','..oooooooooooooooo..','..oRRRRYYYYYYRRRdo..','..oRRRRYYYYYYRRRdo..',
      '..oRRRRYYYYYYRRRdo..','..oRRRRYYYYYYRRRdo..','..oRRRRYYYYYYRRRdo..','..oddddYYYYYYddddo..',
      '..oooooooooooooooo..','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#2b0712', R:'#ff4757', d:'#9f1239', Y:'#ffd43b' }],

    sound_on: [20, 20, [
      '.......ooo..........','......oGGGo...oo....','.....oGGGGGo...oo...','..ooooGGGGGo.oo..o..',
      '.oGGGGGGGGGo..oo..o.','.oGGGGGGGGGo..oo..o.','..ooooGGGGGo.oo..o..','.....oGGGGGo...oo...',
      '......oGGGo...oo....','.......ooo..........','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0c2414', G:'#68c962' }],

    sound_off: [20, 20, [
      '.......ooo..........','......oSSSo.........','.....oSSSSSo..oo..oo','..ooooSSSSSo...oooo.',
      '.oSSSSSSSSSo....oo..','.oSSSSSSSSSo...oooo.','..ooooSSSSSo..oo..oo','.....oSSSSSo........',
      '......oSSSo.........','.......ooo..........','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', S:'#94a3b8' }],

    pause_ico: [20, 20, [
      '....................','....ooooo..ooooo....','....oGGGo..oGGGo....','....oGGGo..oGGGo....',
      '....oGGGo..oGGGo....','....oGGGo..oGGGo....','....oGGGo..oGGGo....','....oGGGo..oGGGo....',
      '....oGGGo..oGGGo....','....oGGGo..oGGGo....','....oGGGo..oGGGo....','....ooooo..ooooo....',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0c2414', G:'#85c278' }],

    dash_ico: [20, 20, [
      '....................','........oooooo......','.......oCCWWCCo.....','..oooooCCWWCCCo.....',
      '.oCCCCCWWWWCCCo.....','..oooooCCWWCCCCCo...','.....oCCCCWWWWCCCo..','..oooCCCCCWWCCCCo...',
      '.oCCCCCCCCCWWCCo....','..oooCCCCCCWWCo.....','.......oCCCCCo......','........oooooo......',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0c2d48', C:'#38bdf8', W:'#f0f9ff' }],

    brick: [20, 20, [
      '.oooooooooooooooooo.','.oMMMMMMMoMMMMMMMMo.','.oMWWWMMMoMWWMMMMdo.','.oMMMMMMMoMMMMMMddo.',
      '.oooooooooooooooooo.','.oMMMoMMMMMMMoMMMMo.','.oMWMoMWWMMMMoMWMdo.','.oMMdoMMMMMMdoMMMdo.',
      '.oooooooooooooooooo.','.oMMMMMMMoMMMMMMMMo.','.oMWWMMMMoMWWMMMMdo.','.oMddddMdoMdddddddo.',
      '.oooooooooooooooooo.','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e293b', M:'#94a3b8', d:'#475569', W:'#e2e8f0' }],

    gear: [20, 20, [
      '.......oooooo.......','.......oSSSSo.......','...oooooSSSSooooo...','..oSSSWWWWWWWWSSSo..',
      '..oSSWWWWSSWWWWSSo..','ooSSWWSSooooSSWWSSoo','oSSSWWSsoooosSWWSSSo','oSSSWWSoooooosWWSSSo',
      'ooSSWWSSooooSSWWSSoo','..oSSWWWWSSWWWWSSo..','..oSSSWWWWWWWWSSSo..','...oooooSSSSooooo...',
      '.......oSSSSo.......','.......oooooo.......','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', S:'#94a3b8', s:'#64748b', W:'#f8fafc' }],

    badge: [20, 20, [
      '....oooo....oooo....','...oRRRRo..oRRRRo...','...oRRRRooooRRRRo...',
      '....ooYYYYYYYYoo....','....oYYWWWWWWYYo....','...oYYWWYYYYWWYYo...',
      '...oYYWYYKKYYWYYo...','...oYYWYYYYYYWYYo...','....oYYWWWWWWYYo....',
      '.....oYYYYYYYYo.....','......ooYYYYoo......','........oooo........',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd43b', W:'#fffbeb', K:'#d97706', R:'#ef4444' }],

    book: [20, 20, [
      '..oooooooooooooooo..','.oBBBBBBBBBBBBBBBBo.','.oBWWWWWWWWWWWWWWBo.','.oBWKKKKWWKKKKWWBBo.',
      '.oBWKKKKWWKKKKWWBBo.','.oBWWWWWWWWWWWWWWBo.','.oBWGGGGWWGGGGWWBBo.','.oBWWWWWWWWWWWWWWBo.',
      '.oBdddddddddddddBBo.','.oBBBBBBBBBBBBBBBBo.','..oooooooooooooooo..','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1c1917', B:'#a855f7', W:'#f5f3ff', K:'#3b0764', G:'#46f88f', d:'#6b21a8' }],

    golem_ico: [20, 20, [
      '....oooo....oooo....','...oCCCCooooCCCCo...','...oSSSSCCCCSSSSo...','..ooSSSSSSSSSSSSoo..',
      '.oSSSSSSSSSSSSSSSSo.','.oSSWWWWSSWWWWSSSSo.','.oSSWCCWSSWCCWSSdSo.','.oSSSSSSSSSSSSSSddo.',
      '.oSSdKKKKKKKKddSSdo.','.oSSdKCCCCCCKdSSddo.','.ooSSSSSSSSSSSSddoo.','..oddddddddddddddo..',
      '...oooooooooooooo...','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', S:'#94a3b8', d:'#475569', C:'#22d3ee', W:'#f8fafc', K:'#1e293b' }],

    chest_bronze: [24, 24, [
      '........................','....oooooooooooooooo....','...oMMBBBBBBBBBBBBMMo...','..oMMBWWWWBBBBBBBBMMBo..',
      '..oMMBBBBBBBBBBBBBMddo..','..oMMBBBBBBBBBBBBBMddo..','..oMMMMMMMMMMMMMMMMMMo..','..oMMBBBBMMYYYYMMBBddo..',
      '..oMMDDDDMMYKKYMMddMMo..','..oMMDDDDMMMMMMMMddMMo..','..oMMDDDDDDDDDDDDddMMo..','..oMMDDDDDDDDDDDDddMMo..',
      '..oMMddddddddddddddMMo..','...oooooooooooooooooo...','........................','........................',
      '........................','........................','........................','........................',
      '........................','........................','........................','........................'
    ], { o:'#1c0f06', B:'#c97128', D:'#8c4714', d:'#5e2c09', M:'#94a3b8', Y:'#ffd43b', K:'#1c0f06', W:'#f5b971' }],

    chest_silver: [24, 24, [
      '........................','....oooooooooooooooo....','...oSSCCCCCCCCCCCCSSo...','..oSSCWWWWCCCCCCCCSSCo..',
      '..oSSCCCCCCCCCCCCCSddo..','..oSSCCCCCCCCCCCCCSddo..','..oSSSSSSSSSSSSSSSSSSo..','..oSSCCCCSSWWWWSSCCddo..',
      '..oSSDDDDSSWKKWSSddSSo..','..oSSDDDDSSSSSSSSddSSo..','..oSSDDDDDDDDDDDDddSSo..','..oSSDDDDDDDDDDDDddSSo..',
      '..oSSddddddddddddddSSo..','...oooooooooooooooooo...','........................','........................',
      '........................','........................','........................','........................',
      '........................','........................','........................','........................'
    ], { o:'#0d1b2a', C:'#4ea8de', D:'#2563eb', d:'#1e3a8a', S:'#cbd5e1', W:'#ffffff', K:'#0d1b2a' }],

    chest_gold: [24, 24, [
      '........................','....oooooooooooooooo....','...oYYYYYYYYYYYYYYYYo...','..oYYWWWWYYYYYYYYYYYYo..',
      '..oYYYYYYYYYYYYYYYYddo..','..oYYYYYYYYYYYYYYYYddo..','..oooooooooooooooooooo..','..oYYYYYYooRRRRooYYddo..',
      '..oYYDDDDooRKKRooDDYYo..','..oYYDDDDooooooooDDYYo..','..oYYDDDDDDDDDDDDDDYYo..','..oYYDDDDDDDDDDDDDDYYo..',
      '..oYYddddddddddddddYYo..','...oooooooooooooooooo...','........................','........................',
      '........................','........................','........................','........................',
      '........................','........................','........................','........................'
    ], { o:'#422006', Y:'#ffd43b', D:'#f59e0b', d:'#b45309', W:'#fffbeb', R:'#ff3b5c', K:'#422006' }],

    chest_dragon: [24, 24, [
      '..oo................oo..','..oRRo............oRRo..','...oRRo.oooooooo.oRRo...','...oGGGGGGGGGGGGGGGGoo..',
      '..oGGWWWWGGGGGGGGGGGGGo.','..oGGGGGGGGGGGGGGGGddGo.','..oooooooooooooooooooo..','..oGGGGGGooYYYYooGGddGo.',
      '..oGGDDDDooYKKYooDDGGGo.','..oGGDDDDooooooooDDGGGo.','..oGGDDDDDDDDDDDDDDGGGo.','..oGGDDDDDDDDDDDDDDGGGo.',
      '..oGGddddddddddddddGGGo.','...ooooooooooooooooooo..','........................','........................',
      '........................','........................','........................','........................',
      '........................','........................','........................','........................'
    ], { o:'#09140e', G:'#46f88f', D:'#15803d', d:'#064e3b', R:'#ff4757', Y:'#ffd43b', K:'#09140e', W:'#dcfce7' }],

    acc_none: [20, 20, [
      '....................','....................','.......oooooo.......','.....ooSSSSSSoo.....',
      '....oSSSSSSSSSSo....','....oSSooooooSSo....','....oSSSSSSSSSSo....','.....ooSSSSSSoo.....',
      '.......oooooo.......','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e293b', S:'#64748b' }],

    acc_crown: [20, 20, [
      '....................','...oo....oo....oo...','...oYo..oYYo..oYo...','...oYYooYYYYooYYo...',
      '...oYYYYYYYYYYYYo...','...oYYRYYYYYYBYYo...','...oYYYYYYYYYYYYo...','...oddddddddddddo...',
      '...oooooooooooooo...','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd43b', d:'#b45309', R:'#ff3b5c', B:'#38bdf8' }],

    acc_shades: [20, 20, [
      '....................','....................','..oooooooooooooooo..','.oKKKKKKKooKKKKKKKo.',
      '.oKWWKKKKooKWWKKKKo.','.oKWKKKKKooKWKKKKKo.','.oKKKKKKKooKKKKKKKo.','..ooooooo..ooooooo..',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#68c962', K:'#090d14', W:'#e0f2fe' }],

    acc_horns: [20, 20, [
      '..oo............oo..','..oRo..........oRo..','...oRRo......oRRo...','...oRYRo....oRYRo...',
      '....oYYRo..oRYYo....','....oYYRRRRRYYYo....','.....oooooooooo.....','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#3b0a0a', R:'#ef4444', Y:'#fde047' }],

    acc_wizard: [20, 20, [
      '.........oo.........','........oPPo........','.......oPPPPo.......','......oPPPPPPo......',
      '.....oPPPPPPPPo.....','.....oYYYYYYYYo.....','..ooooPPPPPPPPoooo..','.oPPPPPPPPPPPPPPPPo.',
      '..oooooooooooooooo..','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e1b4b', P:'#7c3aed', Y:'#ffd43b' }],

    acc_halo: [20, 20, [
      '....................','....oooooooooooo....','..ooYYYYWWWWYYYYoo..','.oYYooooooooooooYYo.',
      '..ooYYYYYYYYYYYYoo..','....oooooooooooo....','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#78350f', Y:'#fde047', W:'#ffffff' }],

    acc_ninja: [20, 20, [
      '....................','...oooooooooooooo...','..oRRRRRRRRRRRRRRo..','..oRRRWWWWWWWWrrro..',
      '...oooooooooooooo...','.............oRRo...','..............oRRo..','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#3b0a0a', R:'#ef4444', r:'#b91c1c', W:'#f8fafc' }],

    key: [20, 20, [
      '....................','.....oooooo.........','....oYYYYYYo........','...oYYWWWWYYo.......',
      '...oYYWooWYYo.......','...oYYooooYYo.......','....oYYYYYYoooooooo.','.....ooooooYYYYYYYo.',
      '...........ooYYoYYo.','.............oo.ooo.','....................','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd43b', W:'#fffbeb' }],

    lightning: [20, 20, [
      '....................','..........ooooo.....','.........oYYYYo.....','........oYYWWYo.....',
      '.......oYYWWYo......','......oYYWWYoooo....','.....oYYYYYYYYYYo...','.....oooooYYWWYYo...',
      '.........oYYWWYo....','........oYYWWYo.....','.......oYYWYYo......','......oYYYYYo.......',
      '.....oYYWYYo........','.....oYYYYo.........','......oooo..........','....................',
      '....................','....................','....................','....................'
    ], { o:'#0c2d48', Y:'#fde047', W:'#ffffff' }],

    magnet: [20, 20, [
      '....................','....oooo....oooo....','...oSSSSo..oSSSSo...','...oSSSSo..oSSSSo...',
      '...oRRRRo..oBBBBo...','...oRRRRo..oBBBBo...','...oRRRRo..oBBBBo...','...oRRRRo..oBBBBo...',
      '...oRRRRooooBBBBo...','....oRRRRBBBBBBo....','.....oRRRBBBBBo.....','......oooooooo......',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', S:'#e2e8f0', R:'#ef4444', B:'#3b82f6' }],

    rewind: [20, 20, [
      '....................','....................','.......oo......oo...','......oCCo....oCCo..',
      '.....oCWCCo..oCWCCo.','....oCWWCCCoCWWCCCo.','...oCWWWCCCWWCCCCCo.','....oCWWCCCoCWWCCCo.',
      '.....oCWCCo..oCWCCo.','......oCCo....oCCo..','.......oo......oo...','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0c2d48', C:'#38bdf8', W:'#e0f2fe' }],

    dna: [20, 20, [
      '....................','....oooo....oooo....','....oGGooooooCCo....','.....oGGGGGGGGoo....',
      '......oGGGGCCo......','.......oooooo.......','......oCCGGGGoo.....','....ooCCCCCCCCoo....',
      '....oCCooooooGGo....','......oGGGGCCo......','.......oooooo.......','......oGGCCCCo......',
      '....ooGGGGGGGGoo....','....oGGooooooCCo....','....oooo....oooo....','....................',
      '....................','....................','....................','....................'
    ], { o:'#091412', G:'#68c962', C:'#38bdf8' }],

    mimic: [20, 20, [
      '....................','...oooooooooooooo...','..oRRRRRRRRRRRRRRo..','..oRWWWWWWWWWWWWRo..',
      '..oRWKWKWKWKWKWKRo..','..oooooooooooooooo..','..oBBBBooYYooBBBBo..','..oBBBBooKKooBBBBo..',
      '..oDDDDooooooDDDDo..','..oDDDDDDDDDDDDDDo..','...oooooooooooooo...','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#2b0712', R:'#dc2626', W:'#ffffff', K:'#090d14', B:'#a16207', D:'#713f12', Y:'#ffd43b' }],

    timer: [20, 20, [
      '....................','.......oooooo.......','......oSSSSSSo......','.......ooSSoo.......',
      '.....ooooSSoooo.....','...ooSSWWWWWWSSoo...','..oSSWWWWKKWWWWSSo..','..oSSWWWWKKWWWWSSo..',
      '..oSSWWWWKKKWWWSSo..','..oSSWWWWWWWWWWSSo..','...ooSSWWWWWWSSoo...','.....oooooooooo.....',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', S:'#94a3b8', W:'#f8fafc', K:'#ef4444' }],

    meteor: [20, 20, [
      '....................','............oooo....','..........ooYYRRo...','........ooYYOORRo...',
      '......ooYYOORRRo....','....oooOORRRRRo.....','...oKKKRROORRo......','..oKWWKKROORo.......',
      '..oKKKKKKRRoo.......','..oKKddKKKo.........','...odddddo..........','....ooooo...........',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e0909', K:'#57534e', d:'#292524', W:'#d6d3d1', R:'#ef4444', O:'#f97316', Y:'#fde047' }],

    relic_fang: [20, 20, [
      '....................','.....oooo...........','....oYYYYoo.........','....oYYWWYYo........',
      '.....oYYYYYYo.......','......oYYYYYYo......','.......oYYYddYo.....','........oYYYddo.....',
      '.........oYYddo.....','..........oYYdo.....','...........oYdo.....','............ooo.....',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#ffd43b', d:'#d97706', W:'#fffbeb' }],

    relic_eye: [20, 20, [
      '....................','......oooooooo......','....ooPPPPPPPPoo....','..ooPPWWWWWWWWPPoo..',
      '.oPPWWCCCCCCCCWWPPo.','.oPWWCCKKKKKKCCWWPo.','.oPWWCCKWWWWKCCWWPo.','.oPPWWCCCCCCCCWWPPo.',
      '..ooPPWWWWWWWWPPoo..','....ooPPPPPPPPoo....','......oooooooo......','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e1b4b', P:'#a855f7', W:'#f8fafc', C:'#38bdf8', K:'#090d14' }],

    relic_clock: [20, 20, [
      '....................','......oooooooo......','....ooYYYYYYYYoo....','...oYYWWWWWWWWYYo...',
      '..oYYWWKKKKKKWWYYo..','..oYYWKCCCCCCKWYYo..','..oYYWKCCWKKCKWYYo..','..oYYWKKCCWWWWKYYo..',
      '...oYYWWWWWWWWYYo...','....ooYYYYYYYYoo....','......oooooooo......','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#422006', Y:'#fbbf24', W:'#f8fafc', K:'#1e293b', C:'#38bdf8' }],

    relic_scale: [20, 20, [
      '....................','......oooooooo......','....ooRRRRRRRRoo....','...oRRWWYYYYWWRRo...',
      '..oRRWYYYYYYYYWRRo..','..oRRYYRRRRRRYYRRo..','...oRRYRRRRRRYRRo...',
      '....oRRYYYYYYRRo....','.....oRRRRRRRRo.....','......oRRddRRo......','.......oooooo.......',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#450a0a', R:'#ef4444', d:'#991b1b', Y:'#fde047', W:'#fffbeb' }],

    relic_magnet: [20, 20, [
      '....................','....oooo....oooo....','...oYYYYo..oYYYYo...','...oRRRRo..oCCCCo...',
      '...oRRRRo..oCCCCo...','...oRRRRo..oCCCCo...','...oRRRRooooCCCCo...',
      '....oRRRRCCCCCCo....','.....oRRRCCCCCo.....','......oooooooo......','....................',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#0f172a', Y:'#ffd43b', R:'#ef4444', C:'#38bdf8' }],

    secret_door: [20, 20, [
      '....................','.....oooooooooo.....','....oPPPPPPPPPPo....','...oPPWWWWWWWWPPo...',
      '..oPPWCCCCCCCCWPPo..','..oPPWCPPPPPPCWPPO..','..oPPWCPWWWWPCWPPO..','..oPPWCPWYYWPCWPPO..',
      '..oPPWCPWWWWPCWPPO..','..oPPWCCCCCCCCWPPO..','..oPPWWWWWWWWWWPPO..','..oooooooooooooooo..',
      '....................','....................','....................','....................',
      '....................','....................','....................','....................'
    ], { o:'#1e1b4b', P:'#9333ea', W:'#f3e8ff', C:'#38bdf8', Y:'#ffd43b', O:'#1e1b4b' }]
  };

  for (var key in defs){
    var d = defs[key];
    var cv = makeCleanSprite(d[0], d[1], d[2], d[3]);
    PX_ICONS[key] = cv;
    PX_URLS[key] = cv.toDataURL();
  }
}
initPixelIcons();

function pxImgTag(name, sizePx){
  var s = sizePx || 20;
  var url = PX_URLS[name] || PX_URLS.apple;
  return '<img class="px-img" src="'+url+'" width="'+s+'" height="'+s+'" alt="">';
}

/* ═══════════════ اسکین‌ها و اکسسوری‌های ۲ ارزی (سکه + کریستال) ═══════════════ */
var SKINS = [
  { id:'neon',   name:'مار جنگلی',   rarity:'common', currency:'gold', price:0,   head:'#85c278', body:'#68a862', spot:'#2d5932', belly:'#ede1b0', dark:'#3f703b', desc:'مار پیکسلی اصیل با خال‌های جنگلی', bonusScore:1.0,  bonusGold:1.0,  dmg:1 },
  { id:'viper',  name:'افعی آتشین',  rarity:'rare',   currency:'gold', price:110, head:'#ff944d', body:'#e85d22', spot:'#7a1c0a', belly:'#ffe3b3', dark:'#a83210', desc:'+۱۰٪ امتیاز بیشتر در مراحل',          bonusScore:1.10, bonusGold:1.0,  dmg:1 },
  { id:'frost',  name:'مار یخی',     rarity:'rare',   currency:'gold', price:160, head:'#7dd3fc', body:'#38bdf8', spot:'#075985', belly:'#e0f2fe', dark:'#0284c7', desc:'+۱۰٪ سکه طلا و بدنه یخی',            bonusScore:1.05, bonusGold:1.10, dmg:1 },
  { id:'shadow', name:'شبح سایه',    rarity:'epic',   currency:'gold', price:230, head:'#c084fc', body:'#9333ea', spot:'#3b0764', belly:'#f3e8ff', dark:'#6b21a8', desc:'+۲ ثانیه مدت روح عبور از دیوار',     bonusScore:1.10, bonusGold:1.10, dmg:1, ghostExtra:2000 },
  { id:'royal',  name:'مار طلایی',   rarity:'epic',   currency:'gold', price:320, head:'#fde047', body:'#eab308', spot:'#713f12', belly:'#fef9c3', dark:'#a16207', desc:'+۲۰٪ سکه طلا از هر بازی',            bonusScore:1.15, bonusGold:1.20, dmg:1 },
  { id:'cosmic', name:'مار کیهانی',  rarity:'legend', currency:'crystals', price:18, head:'#ffffff', body:'rainbow', spot:'#1e1b4b', belly:'#fef08a', dark:'#312e81', desc:'آسیب دوبرابر به باس و هاله رنگین', bonusScore:1.20, bonusGold:1.25, dmg:2 }
];

var ACCESSORIES = [
  { id:'none',   name:'بدون اکسسوری', rarity:'common', currency:'gold', price:0,   ico:'acc_none',   desc:'سر ساده مار' },
  { id:'ninja',  name:'هدبند نینجا',  rarity:'common', currency:'gold', price:75,  ico:'acc_ninja',  desc:'هدبند سرخ جنگجو' },
  { id:'shades', name:'عینک نئونی',   rarity:'rare',   currency:'gold', price:110, ico:'acc_shades', desc:'عینک پیکسلی محافظ' },
  { id:'halo',   name:'هاله طلایی',   rarity:'rare',   currency:'gold', price:160, ico:'acc_halo',   desc:'هاله درخشان قهرمان' },
  { id:'horns',  name:'شاخ اژدها',   rarity:'epic',   currency:'crystals', price:8,  ico:'acc_horns',  desc:'شاخ‌های آتشین اژدها' },
  { id:'wizard', name:'کلاه جادوگر',  rarity:'epic',   currency:'crystals', price:11, ico:'acc_wizard', desc:'کلاه جادویی نبرد' },
  { id:'crown',  name:'تاج شاهانه',   rarity:'legend', currency:'crystals', price:15, ico:'acc_crown',  desc:'تاج طلایی پادشاه' }
];

function getSkinObj(id){
  for (var i=0;i<SKINS.length;i++) if (SKINS[i].id===id) return SKINS[i];
  return SKINS[0];
}
function getAccObj(id){
  for (var i=0;i<ACCESSORIES.length;i++) if (ACCESSORIES[i].id===id) return ACCESSORIES[i];
  return ACCESSORIES[0];
}

var snakeHeadCache = {};
function buildSnakeHeads(sk, overrideBody, overrideBelly){
  var key = sk.id + (overrideBody||'') + (overrideBelly||'');
  if (snakeHeadCache[key]) return snakeHeadCache[key];

  var bodyC = overrideBody || (sk.body === 'rainbow' ? '#46f88f' : sk.body);
  var headC = overrideBody || sk.head;
  var bellyC = overrideBelly || sk.belly;
  var spotC = sk.spot;
  var darkC = sk.dark;
  var outC = '#122016';

  var headSide = makeCleanSprite(22, 18, [
    '......................','......................','......oooooooooo......','....ooLLLLLLLLLLoo....',
    '..ooLLHHSSHHHHHHHHoo..','.oHHHHSSSSHHHHKKKHHoo.','.GHHHHHHHHHHHHWKKHHHn.','GGHHHHHHHHHHHHKKKHHHho',
    'GGHHHHHHHHHHHHHHHHHHho','GGGBBBBBBBBBBBBBBBBoo.','.GBBBBBBBBBBBBBBBBoo..','.oGBBBBBBBBBBBBBoo....',
    '..ooDDDDDDDDDDDoo.....','....ooooooooooo.......','......................','......................',
    '......................','......................'
  ], { o:outC, G:bodyC, H:headC, L:headC, S:spotC, B:bellyC, D:darkC, K:'#09120c', W:'#ffffff', n:'#09120c', h:bodyC });

  var headUD = makeCleanSprite(20, 22, [
    '....................','.......oooooo.......','.....ooLLLLLLoo.....','....oLLHHHHHHLLo....',
    '...oLHnHHHHHHnHLo...','...oHHHHHHHHHHHHo...','..oHHWKoHHHHoKWHHo..','..oHHKKoHHHHoKKHHo..',
    '..oHHKKHHHHHHKKHHo..','..oHHHHHHHHHHHHHHo..','..oHHHHSSHHSSHHHHo..','...oHHHSSHHSSHHHo...',
    '...oGGGGGGGGGGGGo...','....oGGGGGGGGGGGo...','....oGGGGSSGGGGGo...','.....oGGGGGGGGGo....',
    '.....oGGGGGGGGGo....','......GGGGGGGGG.....','......GGGGGGGGG.....','....................',
    '....................','....................'
  ], { o:outC, G:bodyC, H:headC, L:headC, S:spotC, n:'#09120c', K:'#09120c', W:'#ffffff' });

  snakeHeadCache[key] = { side:headSide, ud:headUD };
  return snakeHeadCache[key];
}

function drawAxialCapsule(cctx, x0, y0, x1, y1, r, col){
  var minX = Math.round(Math.min(x0, x1) - r);
  var minY = Math.round(Math.min(y0, y1) - r);
  var maxX = Math.round(Math.max(x0, x1) + r);
  var maxY = Math.round(Math.max(y0, y1) + r);
  cctx.fillStyle = col;
  cctx.fillRect(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
}

function drawPixelAccOnHead(cctx, accId, hx, hy, segSize, dirStr){
  if (!accId || accId === 'none') return;
  var ico = PX_ICONS[getAccObj(accId).ico];
  if (!ico) return;
  var sz = Math.round(segSize * 1.05);
  var ox = 0, oy = -Math.round(segSize * 0.56);
  if (accId === 'shades' || accId === 'ninja'){
    oy = (dirStr === 'up') ? -Math.round(segSize * 0.14) : (dirStr === 'down' ? Math.round(segSize * 0.14) : -Math.round(segSize * 0.08));
    if (dirStr === 'right') ox = Math.round(segSize * 0.18);
    else if (dirStr === 'left') ox = -Math.round(segSize * 0.18);
  }
  cctx.save();
  cctx.imageSmoothingEnabled = false;
  cctx.drawImage(ico, Math.round(hx + ox - sz/2), Math.round(hy + oy - sz/2), sz, sz);
  cctx.restore();
}

function drawSeamlessSnake(cctx, pts, dirStr, sk, cellSize, t, opts){
  if (!pts || !pts.length) return;
  opts = opts || {};
  var n = pts.length;
  var r = Math.max(4, Math.round(cellSize * 0.39));
  var rTail = Math.max(3, Math.round(r * 0.65));
  var ol = Math.max(2, Math.round(cellSize * 0.10));
  var outC = '#122016';

  var baseBody = opts.overrideBody || (sk.body === 'rainbow' ? '#46f88f' : sk.body);
  var bellyC = opts.overrideBelly || sk.belly;
  var spotC = sk.spot;
  var hlC = sk.head;
  var ribC = sk.dark;

  var evo = opts.evoForm || 'basic';
  var isGolden = !!opts.goldenCombo;

  function segCol(s){
    if (isGolden && ((s + Math.floor((t||0)/140)) % 2 === 0)) return '#ffd43b';
    if (opts.rainbow){
      var h = Math.floor(((s * 24 + (t||0) / 6) % 360) / 15) * 15;
      return 'hsl('+h+',85%,56%)';
    }
    return baseBody;
  }

  for (var s = n - 1; s >= 0; s--){
    var p = pts[s];
    var rs = (s === n - 1) ? rTail : r;
    drawAxialCapsule(cctx, p.x, p.y, p.x, p.y, rs + ol, outC);
    if (s < n - 1 && !p.wrapNext){
      var pNext = pts[s+1];
      var rBridge = (s + 1 === n - 1) ? Math.round((r + rTail) / 2) : r;
      if (p.pivot){
        drawAxialCapsule(cctx, p.x, p.y, p.pivot.x, p.pivot.y, rBridge + ol, outC);
        drawAxialCapsule(cctx, p.pivot.x, p.pivot.y, pNext.x, pNext.y, rBridge + ol, outC);
      } else {
        drawAxialCapsule(cctx, p.x, p.y, pNext.x, pNext.y, rBridge + ol, outC);
      }
    }
  }

  for (var s2 = n - 1; s2 >= 0; s2--){
    var p2 = pts[s2];
    var col2 = segCol(s2);
    var rs2 = (s2 === n - 1) ? rTail : r;
    drawAxialCapsule(cctx, p2.x, p2.y, p2.x, p2.y, rs2, col2);
    if (s2 < n - 1 && !p2.wrapNext){
      var p2N = pts[s2+1];
      var rBr2 = (s2 + 1 === n - 1) ? Math.round((r + rTail) / 2) : r;
      if (p2.pivot){
        drawAxialCapsule(cctx, p2.x, p2.y, p2.pivot.x, p2.pivot.y, rBr2, col2);
        drawAxialCapsule(cctx, p2.pivot.x, p2.pivot.y, p2N.x, p2N.y, rBr2, col2);
      } else {
        drawAxialCapsule(cctx, p2.x, p2.y, p2N.x, p2N.y, rBr2, col2);
      }
    }
  }

  var hlH = Math.max(1, Math.round(r * 0.28));
  var blH = Math.max(2, Math.round(r * 0.42));
  var spW = Math.max(2, Math.round(r * 0.55));
  for (var s3 = n - 1; s3 >= 1; s3--){
    var p3 = pts[s3];
    if (s3 < n - 1 && !p3.wrapNext){
      var q3 = pts[s3+1];
      var midX = p3.pivot ? p3.pivot.x : (p3.x + q3.x) * 0.5;
      var midY = p3.pivot ? p3.pivot.y : (p3.y + q3.y) * 0.5;
      var horiz = Math.abs(p3.x - q3.x) >= Math.abs(p3.y - q3.y);
      var rs3 = (s3 === n - 1) ? rTail : r;

      if (horiz){
        var xL = Math.round(Math.min(p3.x, q3.x) - rs3 * 0.5);
        var wL = Math.max(2, Math.round(Math.abs(p3.x - q3.x) + rs3));
        cctx.fillStyle = hlC;
        cctx.fillRect(xL, Math.round(p3.y - rs3), wL, hlH);
        cctx.fillStyle = bellyC;
        cctx.fillRect(xL, Math.round(p3.y + rs3 - blH), wL, blH);
        cctx.fillStyle = ribC;
        cctx.fillRect(Math.round(midX), Math.round(p3.y + rs3 - blH), Math.max(1, Math.round(hlH * 0.8)), blH);
      } else {
        var yT = Math.round(Math.min(p3.y, q3.y) - rs3 * 0.5);
        var hT = Math.max(2, Math.round(Math.abs(p3.y - q3.y) + rs3));
        cctx.fillStyle = hlC;
        cctx.fillRect(Math.round(p3.x - rs3), yT, hlH, hT);
        cctx.fillStyle = bellyC;
        cctx.fillRect(Math.round(p3.x + rs3 - blH), yT, blH, hT);
        cctx.fillStyle = ribC;
        cctx.fillRect(Math.round(p3.x + rs3 - blH), Math.round(midY), blH, Math.max(1, Math.round(hlH * 0.8)));
      }
      if (s3 % 2 === 1 && !opts.rainbow){
        cctx.fillStyle = spotC;
        cctx.fillRect(Math.round(midX - spW * 0.5), Math.round(midY - spW * 0.4), spW, Math.max(2, Math.round(spW * 0.7)));
      }
      if ((evo === 'armored' || evo === 'legend') && s3 % 2 === 0){
        cctx.fillStyle = evo === 'legend' ? '#fde047' : '#cbd5e1';
        var armS = Math.max(3, Math.round(r * 0.45));
        cctx.fillRect(Math.round(midX - armS * 0.5), Math.round(midY - armS * 0.5), armS, armS);
      }
    }
  }

  /* دم شعله انرژی در فرم تکامل ۱۵ و افسانه‌ای */
  if ((evo === 'energy_tail' || evo === 'legend') && n > 1){
    var tp = pts[n - 1];
    var pulseT = Math.max(2, Math.round(r * (0.45 + 0.15 * Math.sin((t||0)/95))));
    cctx.fillStyle = evo === 'legend' ? '#ffd43b' : '#38bdf8';
    cctx.fillRect(Math.round(tp.x - pulseT), Math.round(tp.y - pulseT), pulseT * 2, pulseT * 2);
  }

  var hp = pts[0];
  if (evo === 'legend'){
    cctx.save();
    cctx.strokeStyle = 'rgba(255,212,59,' + (0.45 + 0.35 * Math.sin((t||0)/130)) + ')';
    cctx.lineWidth = Math.max(1.5, cellSize * 0.09);
    cctx.strokeRect(Math.round(hp.x - r * 1.45), Math.round(hp.y - r * 1.45), Math.round(r * 2.9), Math.round(r * 2.9));
    cctx.restore();
  }

  var heads = buildSnakeHeads(sk, isGolden ? '#ffd43b' : opts.overrideBody, isGolden ? '#fef08a' : opts.overrideBelly);
  cctx.save();
  cctx.imageSmoothingEnabled = false;
  cctx.translate(Math.round(hp.x), Math.round(hp.y));
  if (dirStr === 'right' || dirStr === 'left'){
    var wS = Math.round(cellSize * 1.18), hS = Math.round(cellSize * 0.96);
    if (dirStr === 'left') cctx.scale(-1, 1);
    cctx.drawImage(heads.side, -Math.round(wS * 0.42), -Math.round(hS * 0.5), wS, hS);
    if (evo === 'glow_eyes' || evo === 'legend'){
      cctx.fillStyle = evo === 'legend' ? '#fde047' : '#38bdf8';
      var eS = Math.max(2, Math.round(cellSize * 0.16));
      cctx.fillRect(Math.round(wS * 0.14), -Math.round(hS * 0.22), eS, eS);
    }
    if (((t || 0) % 750) < 280){
      var tx = Math.round(wS * 0.54), px = Math.max(1, Math.round(cellSize * 0.08));
      cctx.fillStyle = '#e62e4c';
      cctx.fillRect(tx, -px, px * 2, px * 2);
      cctx.fillRect(tx + px * 2, -px * 2, px, px);
      cctx.fillRect(tx + px * 2, px, px, px);
    }
  } else {
    var wU = Math.round(cellSize * 0.98), hU = Math.round(cellSize * 1.14);
    if (dirStr === 'down') cctx.scale(1, -1);
    cctx.drawImage(heads.ud, -Math.round(wU * 0.5), -Math.round(hU * 0.54), wU, hU);
    if (evo === 'glow_eyes' || evo === 'legend'){
      cctx.fillStyle = evo === 'legend' ? '#fde047' : '#38bdf8';
      var eS2 = Math.max(2, Math.round(cellSize * 0.14));
      cctx.fillRect(-Math.round(wU * 0.22), -Math.round(hU * 0.14), eS2, eS2);
      cctx.fillRect(Math.round(wU * 0.08), -Math.round(hU * 0.14), eS2, eS2);
    }
    if (((t || 0) % 750) < 280){
      var ty = -Math.round(hU * 0.56), px2 = Math.max(1, Math.round(cellSize * 0.08));
      cctx.fillStyle = '#e62e4c';
      cctx.fillRect(-px2, ty - px2 * 2, px2 * 2, px2 * 2);
      cctx.fillRect(-px2 * 2, ty - px2 * 3, px2, px2);
      cctx.fillRect(px2, ty - px2 * 3, px2, px2);
    }
  }
  cctx.restore();

  if (opts.accId && opts.accId !== 'none'){
    drawPixelAccOnHead(cctx, opts.accId, hp.x, hp.y, cellSize, dirStr);
  }
}

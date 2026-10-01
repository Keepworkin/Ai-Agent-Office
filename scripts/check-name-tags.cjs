const test=require('node:test');
const assert=require('node:assert/strict');
require('../dist/name-tags.js');
const {spread}=global.OfficeNameTags;

// Tag boxes after applying the moves, with the gap spread() keeps between them.
const boxes=(tags,moves)=>tags.map((t,i)=>({left:t.x+moves[i].dx-t.w/2,right:t.x+moves[i].dx+t.w/2,top:t.y+moves[i].dy,bottom:t.y+moves[i].dy+t.h}));
function assertNoOverlap(tags,moves){
  const b=boxes(tags,moves);
  for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++)
    assert(!(b[i].left<b[j].right&&b[j].left<b[i].right&&b[i].top<b[j].bottom&&b[j].top<b[i].bottom),`Tags ${i} and ${j} overlap`);
}
const tag=(x,y)=>({x,y,w:41,h:17});

test('tags that already fit are left where they are',()=>{
  assert.deepEqual(spread([tag(50,100),tag(150,100),tag(50,200)]),[{dx:0,dy:0},{dx:0,dy:0},{dx:0,dy:0}]);
});

test('three lounge robots on a phone-width map: outer tags share a row, the centre one drops below',()=>{
  // The 390 px layout that overlapped before: lounge slots ~18 px apart, outer two ~5 px further back.
  const tags=[tag(114,128),tag(132,133),tag(150,128)];
  const moves=spread(tags);
  assertNoOverlap(tags,moves);
  assert.equal(moves[0].dy,0,'left tag keeps its row');
  assert.equal(moves[2].dy,0,'right tag keeps its row');
  assert(moves[1].dy>0,'centre tag drops below');
});

test('a sideways nudge never moves a tag more than half its width from its robot',()=>{
  const tags=[tag(100,100),tag(125,100)];
  const moves=spread(tags);
  assertNoOverlap(tags,moves);
  assert.equal(moves[1].dy,0,'a small nudge sideways is enough');
  assert(Math.abs(moves[1].dx)<=tags[1].w/2);
});

test('robots standing on the same spot get stacked tags',()=>{
  const tags=[tag(100,100),tag(100,100),tag(100,100)];
  const moves=spread(tags);
  assertNoOverlap(tags,moves);
  assert.deepEqual(moves.map(m=>m.dx),[0,0,0]);
});

test('no overlaps in 2000 random crowds',()=>{
  let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let run=0;run<2000;run++){
    const tags=Array.from({length:2+Math.floor(rand()*7)},()=>({x:rand()*400,y:rand()*300,w:30+rand()*20,h:14+rand()*6}));
    const moves=spread(tags);
    assertNoOverlap(tags,moves);
    moves.forEach((m,i)=>{assert(m.dy>=0,'tags only move down');assert(Math.abs(m.dx)<=tags[i].w/2,'tags stay under their robot');});
  }
});

test('fixed boxes are avoided but never moved',()=>{
  const fixed=[{x:100,y:100,w:41,h:17}];
  const tags=[tag(100,100),tag(160,100)];
  const moves=spread(tags,2,fixed);
  assertNoOverlap([...fixed,...tags],[{dx:0,dy:0},...moves]);
  assert.deepEqual(moves[1],{dx:0,dy:0},'a tag clear of the fixed box stays put');
  for(let run=0;run<500;run++){
    const fixedBoxes=Array.from({length:3},()=>({x:Math.random()*300,y:Math.random()*200,w:40,h:16}));
    const free=Array.from({length:5},()=>({x:Math.random()*300,y:Math.random()*200,w:40,h:16}));
    const m=spread(free,2,fixedBoxes);
    // Fixed boxes may overlap each other; only the moved tags must stay clear of everything.
    const boxesOf=(t,mv)=>({left:t.x+mv.dx-t.w/2,right:t.x+mv.dx+t.w/2,top:t.y+mv.dy,bottom:t.y+mv.dy+t.h});
    const all=[...fixedBoxes.map(f=>boxesOf(f,{dx:0,dy:0}))],moved=free.map((t,i)=>boxesOf(t,m[i]));
    moved.forEach((b,i)=>[...all,...moved.filter((_,j)=>j!==i)].forEach(o=>
      assert(!(b.left<o.right&&o.left<b.right&&b.top<o.bottom&&o.top<b.bottom),'a moved tag overlaps')));
  }
});

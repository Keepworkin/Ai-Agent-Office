const assert=require('node:assert/strict');
require('../dist/navigation.js');
const nav=global.OfficeNavigation;
const points=[[43,37],[57,37],[20.5,34.5],[28.5,27],[36.5,23],[63.5,23],[71.5,27],[79.5,34.5],[37,37.5],[63,37.5],[49,46],[51,58]];
let count=0;
for(const a of points)for(const b of points){
  const start=nav.nearest(a),end=nav.nearest(b),path=nav.route(start,end);
  if(Math.hypot(start[0]-end[0],start[1]-end[1])>.1)assert(path.length,`No route ${a} -> ${b}`);
  let prev=start;for(const next of path){assert(nav.clear(prev,next),`Blocked segment ${prev} -> ${next}`);prev=next;}
  assert.deepEqual(prev,end);count++;
}
assert.equal(nav.walkable([34,30]),false,'Sofa blocks walking');
assert.equal(nav.walkable([16,29]),false,'Desk blocks walking');
assert.equal(nav.walkable([50,50]),true,'Hallway is open');
console.log(`${count} routes verified; furniture and wall clearance pass.`);

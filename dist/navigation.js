/* Floor coordinates are percentages of office-iso.png, anchored at character feet.
   Furniture footprints include chairs and a clearance margin. Never route across walls. */
(function(root){
  const mirror = polygon => polygon.map(([x,y])=>[100-x,y]);
  const room = [[13,25],[38,8],[43,19],[44,33],[41,37.5],[20,38],[14,33]];
  const door = [[40,34],[44,33],[48,39],[46,43],[41,38]];
  const desk1 = [[12,27],[18,23.5],[22,28.5],[18.5,35],[14,33]];
  const desk2 = [[21.5,21],[27,17.5],[31,22],[27.5,29],[23,27]];
  const desk3 = [[29,16],[34.5,12.5],[38,17.5],[35,24.5],[31,23]];
  const sofa = [[29.5,28],[37.5,24.5],[41,31.5],[35.5,36],[29,33.5]];
  const surfaces=[room,mirror(room),door,mirror(door),[[46,23],[54,23],[54,76],[46,76]],[[43,39],[57,39],[57,45],[43,45]]];
  const obstacles=[desk1,desk2,desk3,sofa,...[desk1,desk2,desk3,sofa].map(mirror)];
  function inside([x,y],p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;}
  function walkable(p){return surfaces.some(s=>inside(p,s))&&!obstacles.some(s=>inside(p,s));}
  const step=.5, key=(x,y)=>x+','+y, nodes=new Map();
  for(let x=12;x<=88;x+=step)for(let y=8;y<=76;y+=step)if(walkable([x,y]))nodes.set(key(x,y),[x,y]);
  const distance=(a,b)=>Math.hypot((a[0]-b[0])*1.5,a[1]-b[1]);
  function nearest(p){let result,best=Infinity;for(const n of nodes.values()){const d=distance(n,p);if(d<best){best=d;result=n;}}return [...result];}
  function clear(a,b){const length=distance(a,b),n=Math.ceil(length/.15);for(let i=0;i<=n;i++)if(!walkable([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]))return false;return true;}
  function route(from,to){
    const start=nearest(from),end=nearest(to),sid=key(...start),eid=key(...end);
    const open=new Set([sid]),came=new Map(),cost=new Map([[sid,0]]),score=new Map([[sid,distance(start,end)]]);
    while(open.size){let id,best=Infinity;for(const k of open){if(score.get(k)<best){best=score.get(k);id=k;}}
      if(id===eid){let path=[end];while(came.has(id)){id=came.get(id);path.unshift(nodes.get(id));}
        if(clear(from,path[0]))path.unshift(from);
        const simplified=[path[0]];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clear(path[i],path[j]))j--;simplified.push(path[j]);i=j;}return simplified.slice(1).map(p=>[...p]);}
      open.delete(id);const p=nodes.get(id);
      for(const dx of [-step,0,step])for(const dy of [-step,0,step]){if(!dx&&!dy)continue;const n=[p[0]+dx,p[1]+dy],nid=key(...n);if(!nodes.has(nid)||!clear(p,n))continue;
        const g=cost.get(id)+distance(p,n);if(g<(cost.get(nid)??Infinity)){came.set(nid,id);cost.set(nid,g);score.set(nid,g+distance(n,end));open.add(nid);}}
    }return [];
  }
  root.OfficeNavigation={walkable,route,nearest,clear,surfaces,obstacles};
})(typeof window==='undefined'?globalThis:window);

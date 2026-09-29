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
  function inside(point,p){const x=point[0],y=point[1];let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i][0],b=p[i][1],c=p[j][0],d=p[j][1];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;}
  // walkable() runs thousands of times per route: skip polygons whose bounding box
  // excludes the point, and avoid per-call allocation.
  const bounded=polygon=>{const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);return {polygon,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};};
  const surfaceBoxes=surfaces.map(bounded),obstacleBoxes=obstacles.map(bounded);
  function hits(boxes,p){const x=p[0],y=p[1];for(const b of boxes)if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1&&inside(p,b.polygon))return true;return false;}
  function walkable(p){return hits(surfaceBoxes,p)&&!hits(obstacleBoxes,p);}
  const step=.5, key=(x,y)=>x+','+y, nodes=new Map();
  for(let x=12;x<=88;x+=step)for(let y=8;y<=76;y+=step)if(walkable([x,y]))nodes.set(key(x,y),[x,y]);
  const distance=(a,b)=>Math.hypot((a[0]-b[0])*1.5,a[1]-b[1]);
  function nearest(p){let result,best=Infinity;for(const n of nodes.values()){const d=distance(n,p);if(d<best){best=d;result=n;}}return [...result];}
  const probe=[0,0];
  function clear(a,b){const length=distance(a,b),n=Math.ceil(length/.15);for(let i=0;i<=n;i++){probe[0]=a[0]+(b[0]-a[0])*i/n;probe[1]=a[1]+(b[1]-a[1])*i/n;if(!walkable(probe))return false;}return true;}
  /* Routing runs inside the animation frame, so it must stay well under a frame.
     Edge checks (clear) dominate, so each node's walkable neighbours are computed
     once and cached; the open list is a binary heap; and finished node paths are
     cached, since robots mostly walk between the same fixed waypoints. */
  const neighbourCache=new Map();
  function neighbours(id){
    let list=neighbourCache.get(id);
    if(!list){const p=nodes.get(id);list=[];
      for(const dx of [-step,0,step])for(const dy of [-step,0,step]){if(!dx&&!dy)continue;const n=[p[0]+dx,p[1]+dy],nid=key(...n);
        if(nodes.has(nid)&&clear(p,n))list.push([nid,distance(p,n)]);}
      neighbourCache.set(id,list);}
    return list;
  }
  function heapPush(heap,item){heap.push(item);let i=heap.length-1;while(i>0){const up=(i-1)>>1;if(heap[up][0]<=item[0])break;heap[i]=heap[up];i=up;}heap[i]=item;}
  function heapPop(heap){const top=heap[0],last=heap.pop();if(heap.length){let i=0;for(;;){let c=2*i+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;}
  const pathCache=new Map(), PATH_CACHE_LIMIT=500;
  function nodePath(sid,eid){
    const cacheKey=sid+'|'+eid;
    if(pathCache.has(cacheKey))return pathCache.get(cacheKey);
    const end=nodes.get(eid),cost=new Map([[sid,0]]),came=new Map(),done=new Set(),heap=[[distance(nodes.get(sid),end),sid]];
    let path=[];
    while(heap.length){const [,id]=heapPop(heap);if(done.has(id))continue;done.add(id);
      if(id===eid){let at=id;path=[nodes.get(at)];while(came.has(at)){at=came.get(at);path.unshift(nodes.get(at));}break;}
      const g0=cost.get(id);
      for(const [nid,d] of neighbours(id)){const g=g0+d;if(g<(cost.get(nid)??Infinity)){came.set(nid,id);cost.set(nid,g);heapPush(heap,[g+distance(nodes.get(nid),end),nid]);}}
    }
    if(pathCache.size>=PATH_CACHE_LIMIT)pathCache.delete(pathCache.keys().next().value);
    pathCache.set(cacheKey,path);
    return path;
  }
  function route(from,to){
    const start=nearest(from),end=nearest(to),found=nodePath(key(...start),key(...end));
    if(!found.length)return [];
    const path=clear(from,found[0])?[from,...found]:found.slice();
    const simplified=[path[0]];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clear(path[i],path[j]))j--;simplified.push(path[j]);i=j;}return simplified.slice(1).map(p=>[...p]);
  }
  root.OfficeNavigation={walkable,route,nearest,clear,surfaces,obstacles};
})(typeof window==='undefined'?globalThis:window);

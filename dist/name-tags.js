// Name-tag placement for the office map, kept free of the DOM so scripts/check-name-tags.cjs can test it.
(root=>{
  // tags: [{x, y, w, h}] in map pixels, where x is the tag's centre and y its top edge.
  // fixed: boxes of the same shape that tags must also avoid but that never move (e.g. labels placed earlier).
  // Returns [{dx, dy}] in the same order: how far to move each tag so no two overlap.
  // Tags are placed top to bottom. One that would overlap an already placed tag first slides sideways, by at most
  // half its width so it stays under its robot, and otherwise drops just below the tag it hits.
  function spread(tags,gap=2,fixed=[]){
    const order=tags.map((t,i)=>i).sort((a,b)=>tags[a].y-tags[b].y||tags[a].x-tags[b].x);
    const placed=fixed.map(f=>({x:f.x,y:f.y,w:f.w,h:f.h})),moves=tags.map(()=>({dx:0,dy:0}));
    const hits=(t,x,top)=>placed.find(p=>Math.abs(x-p.x)<(t.w+p.w)/2+gap&&top<p.y+p.h+gap&&p.y<top+t.h+gap);
    for(const i of order){
      const t=tags[i];let dx=0,top=t.y;
      if(hits(t,t.x,top)){
        // Sideways candidates: just clear of each placed tag, on either side, nearest first.
        const sideways=placed.flatMap(p=>[-1,1].map(side=>p.x+side*((t.w+p.w)/2+gap)-t.x))
          .filter(d=>Math.abs(d)<=t.w/2).sort((a,b)=>Math.abs(a)-Math.abs(b));
        const clear=sideways.find(d=>!hits(t,t.x+d,top));
        if(clear!==undefined)dx=clear;
        else{let hit;while((hit=hits(t,t.x,top)))top=hit.y+hit.h+gap;}
      }
      placed.push({x:t.x+dx,y:top,w:t.w,h:t.h});
      moves[i]={dx,dy:top-t.y};
    }
    return moves;
  }
  root.OfficeNameTags={spread};
})(typeof window==='undefined'?globalThis:window);

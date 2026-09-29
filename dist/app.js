const initial=[{id:'atlas',name:'Atlas',role:'Research',emoji:'🧑🏽‍🚀',state:'working',task:'Researching the market for our next launch',progress:42,x:28,y:37},{id:'nova',name:'Nova',role:'Design',emoji:'👩🏻‍🎨',state:'working',task:'Exploring visual directions for the new homepage',progress:65,x:48,y:33},{id:'byte',name:'Byte',role:'Engineering',emoji:'👨🏽‍💻',state:'working',task:'Building the signup flow and checking accessibility',progress:28,x:68,y:40},{id:'quill',name:'Quill',role:'Writing',emoji:'🧑🏼‍🏫',state:'review',task:'Draft three welcome emails for new customers',progress:100,x:27,y:68},{id:'sage',name:'Sage',role:'Analytics',emoji:'👩🏾‍🔬',state:'working',task:'Finding patterns in this month’s demo campaign',progress:18,x:47,y:65},{id:'orbit',name:'Orbit',role:'Operations',emoji:'🧑🏻‍✈️',state:'idle',task:'Ready for a new assignment',progress:0,x:70,y:69}];initial.forEach((a,i)=>{a.emoji='🤖';a.department=['ChatGPT','ChatGPT','Claude','Claude','ChatGPT','Claude'][i];});initial[4].state='idle';initial[4].progress=0;initial[4].task='Ready for a new assignment';let agents=structuredClone(initial),paused=false,completed=12,selected=null;let events=[{name:'Quill',text:'finished a draft. Ready for your review.',time:'Just now'},{name:'Nova',text:'started exploring visual directions.',time:'2 min ago'},{name:'Atlas',text:'is gathering market insights.',time:'4 min ago'},{name:'Orbit',text:'completed the weekly project roundup.',time:'8 min ago'}];const $=s=>document.querySelector(s),label=s=>({working:'Working',review:'Needs review',idle:'Available',waiting:'Waiting',offline:'Offline'})[s],escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function log(a,text){events.unshift({name:a.name,text,time:'Just now'});events=events.slice(0,5)}function notify(text){$('#toast').textContent=text;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3000)}function render(){const focused=document.activeElement;const focusId=focused?.id;const focusAgent=focused?.dataset?.agent;const focusArea=focused?.closest('#characters,#roster,#teamgrid')?.id;const focusClose=focused?.matches('#detail .close');let working=agents.filter(a=>a.state==='working').length,review=agents.filter(a=>a.state==='review').length;$('#stats').innerHTML=[['Agents in the office',6,'Your demo team','♧'],['Working now',working,'Making things happen','↗'],['Needs your review',review,review?'Ready when you are':'All caught up','◇'],['Tasks completed',completed,'In this demo session','✓']].map(([l,n,s,i])=>`<div class="stat"><div class="statlabel">${l}<span>${i}</span></div><strong>${n.toString().padStart(2,'0')}</strong><small>${s}</small></div>`).join('');syncScene();$('#reviewcount').textContent=review?`${review} task${review===1?'':'s'} to review`:'You’re all caught up';$('#reviewnext').disabled=!review;$('#activity').innerHTML=events.map(e=>`<div class="event"><span class="eventicon">↗</span><p><b>${e.name}</b> ${escape(e.text)}<small>${e.time}</small></p></div>`).join('');$('#roster').innerHTML=agents.map(a=>`<button class="agentcard" data-agent="${a.id}"><span class="miniavatar">${a.emoji}</span><strong>${a.name}</strong><small>${a.department} · ${a.role}</small><span class="state"><i class="dot ${a.state}"></i>${label(a.state)}</span></button>`).join('');$('#teamgrid').innerHTML=agents.map(a=>`<article class="workcard"><h2>${a.emoji} ${a.name} <span class="tag">${a.role}</span></h2><p>${escape(a.task)}</p><div class="progress"><i style="width:${a.progress}%"></i></div><span class="small">${label(a.state)}${a.state==='working'?' · '+Math.floor(a.progress)+'%':''}</span><br><button class="secondary" data-agent="${a.id}">Open task ↗</button></article>`).join('');if($('#detail').open&&selected)detailContent();const restore=focusId?document.getElementById(focusId):focusAgent&&focusArea?document.querySelector('#'+focusArea+' [data-agent="'+focusAgent+'"]'):focusClose?document.querySelector('#detail .close'):null;if(restore&&restore!==document.activeElement)restore.focus({preventScroll:true})}
function detailContent(){const a=agents.find(a=>a.id===selected);$('#detailbody').innerHTML=`<button class="close" aria-label="Close">×</button><span class="detailavatar">${a.emoji}</span><h2>${a.name}</h2><p class="muted">${a.department} · ${a.role} specialist · ${label(a.state)}</p><div class="detailtask"><span class="eyebrow">${a.state==='idle'?'AT THEIR DESK':'CURRENT TASK'}</span><p>${escape(a.task)}</p>${a.state!=='idle'?`<div class="progress"><i style="width:${a.progress}%"></i></div><span class="small">${Math.floor(a.progress)}% · ${a.state==='review'?'Awaiting your approval':'Demo task in progress'}</span>`:''}</div>${a.state==='review'?'<p class="small">This is simulated work. Approving it marks the demo task complete; no real deliverable has been generated.</p>':''}<div class="detailactions">${a.state==='review'?'<button class="primary" id="approve">✓ Approve task</button><button class="secondary" id="revise">Request revision</button>':a.state==='idle'?'<button class="primary" id="assignselected">＋ Assign a task</button>':'<button class="secondary" id="canceltask">Stop task</button>'}</div>`}
function openAgent(id){selected=id;detailContent();$('#detail').showModal()}function openTask(id){const available=agents.filter(a=>a.state==='idle');if(!available.length){notify('All desks are busy. Approve or stop a task first.');return}$('#agentselect').innerHTML=available.map(a=>`<option value="${a.id}">${a.name} · ${a.department} / ${a.role}</option>`).join('');if(id&&available.some(a=>a.id===id))$('#agentselect').value=id;$('#tasktext').value='';$('#taskdialog').showModal()}
function assign(id,text){if(window.officeStore?.live)throw Error('Demo assignment is unavailable in live mode. Use the task form.');const a=agents.find(a=>a.id===id);if(!a||a.state!=='idle'||typeof text!=='string'||!text.trim()||text.length>180)throw Error('Choose an available agent and a task of 1–180 characters.');a.task=text.trim();a.state='working';a.progress=0;log(a,'started a new assignment.');render();return {agent:a.name,status:a.state,task:a.task}}
// Persistent character nodes avoid restarting walks and stealing focus on task updates.
const scene = new Map();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const rooms = {
  ChatGPT: { door: [43,37], hub: [26,36.5], lounge: [37,37.5], desks: [[20.5,34.5],[28.5,27],[36.5,23]] },
  Claude: { door: [57,37], hub: [74,36.5], lounge: [63,37.5], desks: [[63.5,23],[71.5,27],[79.5,34.5]] }
};
const deskSlots = {atlas:0,nova:1,sage:2,byte:0,quill:1,orbit:2};
const palette = {atlas:0,nova:50,sage:100,byte:170,quill:220,orbit:280};
function routeTo(a, motion) {
  const room=rooms[a.department];
  const target=a.state==='working'?room.desks[deskSlots[a.id]]:[room.lounge[0]+(deskSlots[a.id]-1)*3,room.lounge[1]+(deskSlots[a.id]-1)*1.5];
  motion.path=OfficeNavigation.route([motion.x,motion.y],target);
  if(reducedMotion.matches){const dest=OfficeNavigation.nearest(target);motion.x=dest[0];motion.y=dest[1];motion.path=[];}
  motion.behavior=a.state==='working'?'Heading to desk':a.state==='review'?'Taking a break':'Taking it easy';
  motion.wait=0;
}
function syncScene(){
  for(const a of agents){
    let m=scene.get(a.id);
    if(!m){
      const room=rooms[a.department];
      const el=document.createElement('button');
      el.className='character';el.dataset.agent=a.id;
      el.innerHTML='<span class="tooltip"></span><span class="bubble"></span><span class="ground-shadow"></span><span class="avatar"><span class="walker"><span class="robot-part robot-left-leg"></span><span class="robot-part robot-right-leg"></span><span class="robot-part robot-torso"></span></span></span><span class="nametag"></span>';
      el.querySelector('.walker').style.filter=`hue-rotate(${palette[a.id]}deg)`;
      document.querySelector('#characters').append(el);
      m={el,x:room.door[0]+deskSlots[a.id]*1.3,y:room.door[1]+deskSlots[a.id]*1.1,state:a.state,path:[],wait:0,behavior:''};
      const spawn=OfficeNavigation.nearest([m.x,m.y]);m.x=spawn[0];m.y=spawn[1];m.stride=0;m.speed=0;m.gait=0;m.facing=1;m.row=0;scene.set(a.id,m);routeTo(a,m);
      
    } else if(m.state!==a.state){m.state=a.state;routeTo(a,m);}
    m.el.setAttribute('aria-label',`${a.name}, ${a.department}, ${label(a.state)}: ${a.task}`);
    m.el.querySelector('.tooltip').innerHTML=`<b>${a.name} · ${a.department}</b>${escape(a.task)}<br><span>${label(a.state)}${a.state==='working'?' · '+Math.floor(a.progress)+'%':''}</span>`;
    m.el.querySelector('.nametag').innerHTML=`<i class="dot ${a.state}"></i>${a.name}`;
    paintCharacter(a,m);
  }
  for(const [dept,id] of [['ChatGPT','gptcount'],['Claude','claudecount']]){
    document.getElementById(id).textContent=agents.filter(a=>a.department===dept&&a.state==='working').length+' working';
  }
}
function paintCharacter(a,m){
  const walking=m.path.length>0;
  m.el.className=`character ${a.state} ${walking?'walking':a.state==='working'?'at-desk':'lounging'}`;
  const sprite=m.el.querySelector('.walker');
  sprite.style.setProperty('--sprite-row',m.row*100+'%');
  sprite.style.transform=`scaleX(${m.facing})`;
  const amplitude=m.path.length?Math.min(1,m.speed/1.8):0;
  const swing=Math.sin(m.stride)*amplitude;
  const leftLift=Math.max(0,Math.cos(m.stride))*amplitude;
  const rightLift=Math.max(0,-Math.cos(m.stride))*amplitude;
  sprite.style.setProperty('--left-step',`${swing*13}%`);
  sprite.style.setProperty('--right-step',`${-swing*13}%`);
  sprite.style.setProperty('--left-lift',`${-leftLift*3}%`);
  sprite.style.setProperty('--right-lift',`${-rightLift*3}%`);
  sprite.style.setProperty('--left-angle',`${swing*13}deg`);
  sprite.style.setProperty('--right-angle',`${-swing*13}deg`);
  sprite.style.setProperty('--body-angle',`${swing*1.4}deg`);
  m.el.style.left=m.x+'%';m.el.style.top=m.y+'%';m.el.style.zIndex=String(10+Math.round(m.y));
  m.el.querySelector('.bubble').textContent=walking?'↟':a.state==='working'?'⌨ ···':a.state==='review'?'✓ Review':m.behavior==='Taking it easy'?'z z':'☕';
}
function resetScene(){scene.clear();document.getElementById('characters').replaceChildren();}
let previousFrame=0;
function animateOffice(time){
  const dt=Math.min((time-previousFrame)/1000,.06);previousFrame=time;
  if(!paused&&!document.hidden&&!reducedMotion.matches){
    for(const a of agents){
      const m=scene.get(a.id);if(!m)continue;
      if(m.el.matches(':hover,:focus-visible'))continue;
      if(m.path.length){
        const [tx,ty]=m.path[0];const dx=tx-m.x,dy=ty-m.y;const distance=Math.hypot(dx,dy);const remaining=m.path.reduce((sum,p,i)=>sum+Math.hypot(p[0]-(i?m.path[i-1][0]:m.x),p[1]-(i?m.path[i-1][1]:m.y)),0);const desired=Math.min(1.8,Math.sqrt(2*2.2*remaining));m.speed=Math.min(desired,m.speed+dt*2.2);const step=dt*m.speed;
        if(distance<=step){m.x=tx;m.y=ty;m.path.shift();m.wait=5+Math.random()*7;}
        else {m.x+=dx/distance*step;m.y+=dy/distance*step;m.facing=dx<0?-1:1;m.row=dy<-.1?1:0;m.stride+=step/1.3*Math.PI*2;}
      } else if(a.state!=='working'){
        m.speed=0;
        m.wait-=dt;
        if(m.wait<=0){const r=rooms[a.department];const wandering=Math.random()>.45;
          const destinations=[r.hub,r.door,[49,46],[51,58],[r.lounge[0]+(deskSlots[a.id]-1)*2,r.lounge[1]]];
          const target=wandering?destinations[Math.floor(Math.random()*destinations.length)]:destinations[4];
          m.path=OfficeNavigation.route([m.x,m.y],target);m.wait=5+Math.random()*7;
          m.behavior=wandering?'Getting coffee':'Taking it easy';
        }
      }
      paintCharacter(a,m);
    }
  }
  requestAnimationFrame(animateOffice);
}
requestAnimationFrame(animateOffice);
let zoom=100;
function changeZoom(delta){zoom=Math.max(100,Math.min(175,zoom+delta));$('#map').style.width=zoom+'%';$('#zoomlevel').textContent=zoom+'%';$('#zoomout').disabled=zoom===100;$('#zoomin').disabled=zoom===175;}
$('#zoomout').onclick=()=>changeZoom(-25);$('#zoomin').onclick=()=>changeZoom(25);changeZoom(0);

document.addEventListener('click',e=>{const agent=e.target.closest('[data-agent]');if(agent)openAgent(agent.dataset.agent);if(e.target.closest('.close'))e.target.closest('dialog').close();const a=agents.find(a=>a.id===selected);if(e.target.id==='approve'){a.state='idle';a.progress=0;completed++;log(a,'had a task approved. Their desk is free.');a.task='Ready for a new assignment';$('#detail').close();render();notify('Task approved. Nice work, team.')}if(e.target.id==='revise'){a.state='working';a.progress=55;log(a,'is revising their draft.');render();notify('Revision requested')}if(e.target.id==='canceltask'){a.state='idle';a.progress=0;a.task='Ready for a new assignment';log(a,'stopped their task.');$('#detail').close();render()}if(e.target.id==='assignselected'){$('#detail').close();openTask(selected)}});$('#newtask').onclick=()=>openTask();$('#taskform').onsubmit=e=>{e.preventDefault();try{assign($('#agentselect').value,$('#tasktext').value);$('#taskdialog').close();notify('Task assigned. Your teammate is on it.')}catch(err){notify(err.message)}};$('#reviewnext').onclick=()=>{const a=agents.find(a=>a.state==='review');if(a)openAgent(a.id)};$('#pause').onclick=()=>{paused=!paused;document.body.classList.toggle('paused',paused);$('#pause').textContent=paused?'▶ Resume demo':'Ⅱ Pause demo'};$('#reset').onclick=()=>{agents=structuredClone(initial);completed=12;events=[{name:'Team',text:'is back at their desks. Demo reset.',time:'Just now'}];resetScene();render();notify('Demo reset')};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const office=b.dataset.view==='office';$('#officeView').hidden=!office;$('#officeView').style.display=office?'grid':'none';$('#overviewView').hidden=office;document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n===b));$('#crumb').textContent=office?'Office floor':'Manager overview';$('#title').textContent=office?'Your AI headquarters.':'The big picture, at a glance.';$('#subtitle').textContent=office?'Two teams at work. Room for what comes next.':'Know what’s moving, what’s ready, and who can help next.'});$('#date').textContent=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',weekday:'short'});setInterval(()=>{if(paused||window.officeStore?.live)return;agents.forEach(a=>{if(a.state==='working'){a.progress=Math.min(100,a.progress+1+Math.random()*2);if(a.progress===100){a.state='review';log(a,'finished a task. Ready for your review.')}}});render()},5000);render();if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'assign_demo_task',description:'Assign a simulated task to an available demo office agent.',inputSchema:{type:'object',properties:{agentId:{type:'string'},task:{type:'string',minLength:1,maxLength:180}},required:['agentId','task'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>assign(input.agentId,input.task)})).catch(()=>{})}catch{}}

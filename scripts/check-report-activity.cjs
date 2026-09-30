const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const {spawn}=require('node:child_process');

const script=path.join(__dirname,'report-activity.mjs');
// Runs the script against a fake office and returns what it posted, its exit code and stderr.
function run(args,{stdin='',status=200}={}){
  return new Promise(resolve=>{
    const posts=[];
    const server=http.createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{posts.push({url:req.url,body:JSON.parse(body)});res.writeHead(status,{'content-type':'application/json'});res.end('{}');});});
    server.listen(0,'127.0.0.1',()=>{
      const child=spawn(process.execPath,[script,...args],{env:{...process.env,OFFICE_URL:`http://127.0.0.1:${server.address().port}`}});
      let stderr='';child.stderr.on('data',c=>stderr+=c);
      child.stdin.end(stdin);
      child.on('close',code=>{server.close();resolve({posts,code,stderr});});
    });
  });
}

test('plain report posts the agent, status and message',async()=>{
  const {posts,code}=await run(['--agent','codex','--status','working','--message','Refactoring the router']);
  assert.equal(code,0);
  assert.deepEqual(posts,[{url:'/api/external/report',body:{agentId:'codex',kind:'codex',status:'working',message:'Refactoring the router'}}]);
});

test('Claude Code hook events map to office statuses, without prompt text',async()=>{
  const prompt=await run(['--claude-hook'],{stdin:JSON.stringify({hook_event_name:'UserPromptSubmit',prompt:'secret plans'})});
  assert.deepEqual(prompt.posts[0].body,{agentId:'claude-code',kind:'claude-code',status:'working',message:'Working on a prompt'});
  assert(!JSON.stringify(prompt.posts).includes('secret'),'prompt text is never sent');
  const stop=await run(['--claude-hook'],{stdin:JSON.stringify({hook_event_name:'Stop'})});
  assert.equal(stop.posts[0].body.status,'idle');
  const end=await run(['--claude-hook'],{stdin:JSON.stringify({hook_event_name:'SessionEnd'})});
  assert.equal(end.posts[0].body.status,'offline');
  const ignored=await run(['--claude-hook'],{stdin:JSON.stringify({hook_event_name:'PreToolUse',tool_name:'Bash'})});
  assert.deepEqual(ignored.posts,[],'unmapped events are not reported');
});

test('Codex notify reports a finished turn, without the reply text',async()=>{
  const {posts}=await run(['--codex-notify',JSON.stringify({type:'agent-turn-complete','last-assistant-message':'private reply'})]);
  assert.deepEqual(posts[0].body,{agentId:'codex',kind:'codex',status:'idle',message:'Finished a turn; waiting for the next prompt'});
  assert(!JSON.stringify(posts).includes('private'));
});

test('never fails the calling tool: bad input, office errors and no office all exit 0',async()=>{
  const bad=await run(['--agent','someone']);
  assert.equal(bad.code,0);assert.match(bad.stderr,/--agent codex/);assert.deepEqual(bad.posts,[]);
  const rejected=await run(['--agent','codex'],{status:400});
  assert.equal(rejected.code,0);assert.match(rejected.stderr,/office answered 400/);
  const started=Date.now();
  const down=await new Promise(resolve=>{
    const child=spawn(process.execPath,[script,'--agent','codex'],{env:{...process.env,OFFICE_URL:'http://127.0.0.1:9'}});
    let stderr='';child.stderr.on('data',c=>stderr+=c);child.stdin.end();
    child.on('close',code=>resolve({code,stderr}));
  });
  assert.equal(down.code,0);assert.match(down.stderr,/report-activity:/);
  assert(Date.now()-started<5000,'gives up quickly when no office is running');
});

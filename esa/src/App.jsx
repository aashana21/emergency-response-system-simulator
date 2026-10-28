import {useState,useEffect} from 'react';import * as A from './algorithms.js';
const num=v=>Math.max(0,parseInt(v)||0);
const ALGOS=['FCFS','SJF','SRTF','PRIORITY','RR'];
const COL=['#d9a441','#8ba888','#b5483f','#c9c2b0','#7d8a96','#a8845c'];
function CPU(){
  const [ps,setPs]=useState([{id:'Ambulance',arrival:0,burst:5,priority:2},{id:'Fire',arrival:1,burst:3,priority:1},{id:'Police',arrival:2,burst:1,priority:3},{id:'Sensor',arrival:3,burst:2,priority:4}]);
  const [algo,setAlgo]=useState('FCFS'),[q,setQ]=useState(2),[tick,setTick]=useState(0),[run,setRun]=useState(false);
  const r=A.schedule(ps,algo,Math.max(1,q));
  useEffect(()=>{if(!run)return;if(tick>=r.total){setRun(false);return}const h=setTimeout(()=>setTick(t=>t+1),450);return()=>clearTimeout(h)},[run,tick,r.total]);
  const set=(i,k,v)=>{setPs(ps.map((p,j)=>j===i?{...p,[k]:k==='burst'?Math.max(1,num(v)):num(v)}:p));setTick(0);setRun(false)};
  const state=run?'running':tick>=r.total&&tick>0?'completed':tick>0?'paused':'idle';
  return <section><div className="row wide o2"><select aria-label="Algorithm" value={algo} onChange={e=>{setAlgo(e.target.value);setTick(0);setRun(false)}}>{ALGOS.map(a=><option key={a}>{a}</option>)}</select>
  {algo==='RR'&&<label>Quantum <input type="number" min="1" value={q} onChange={e=>setQ(num(e.target.value))}/></label>}
  <button onClick={()=>setRun(!run)}>{run?'Pause':'Run'}</button><button onClick={()=>{setRun(false);setTick(t=>Math.min(r.total,t+1))}}>Step</button><button onClick={()=>{setRun(false);setTick(0)}}>Restart</button><span className="amb">state: {state} · t={tick}</span></div>
  <table><thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Priority</th><th>CT</th><th>TAT</th><th>WT</th><th>RT</th></tr></thead><tbody>{ps.map((p,i)=><tr key={i}><td>{p.id}</td>{['arrival','burst','priority'].map(k=><td key={k}><input aria-label={k} type="number" min="0" value={p[k]} onChange={e=>set(i,k,e.target.value)}/></td>)}<td>{r.rows[i].completion}</td><td>{r.rows[i].turnaround}</td><td>{r.rows[i].waiting}</td><td>{r.rows[i].response}</td></tr>)}</tbody></table>
  <div className="wide o1 gantt" style={{position:'relative',border:'1px solid #2a2a2b'}}>{r.gantt.filter(g=>g.start<tick).map((g,i)=>{const e=Math.min(g.end,tick);return <div key={i} className="seg" style={{position:'absolute',left:g.start/r.total*100+'%',width:(e-g.start)/r.total*100+'%',background:COL[ps.findIndex(p=>p.id===g.id)%6],color:'#111'}}>{g.id}</div>})}</div>
  <div className="wide o1 big">Avg WT <b className="amb">{r.avgWaiting.toFixed(2)}</b> · Avg TAT <b>{r.avgTurnaround.toFixed(2)}</b> · Avg RT <b>{r.avgResponse.toFixed(2)}</b> · CPU util <b className="grn">{r.utilization.toFixed(1)}%</b></div>
  <table><caption className="note">Performance lab: same input, all algorithms</caption><thead><tr><th>Algo</th><th>Avg WT</th><th>Avg TAT</th><th>Util</th></tr></thead><tbody>{ALGOS.map(a=>{const x=A.schedule(ps,a,Math.max(1,q));return <tr key={a}><td>{a}</td><td>{x.avgWaiting.toFixed(2)}</td><td>{x.avgTurnaround.toFixed(2)}</td><td>{x.utilization.toFixed(0)}%</td></tr>})}</tbody></table></section>
}
function PC(){
  const [cap,setCap]=useState(4),[s,setS]=useState(A.pcInit(4));const st=a=>setS(A.pcStep(s,a));
  return <section><div className="row wide"><label>Capacity <input type="number" min="1" max="12" value={cap} onChange={e=>{const c=Math.min(12,Math.max(1,num(e.target.value)));setCap(c);setS(A.pcInit(c))}}/></label><button onClick={()=>st('P')}>Produce alert</button><button onClick={()=>st('C')}>Consume alert</button><button onClick={()=>setS(A.pcInit(cap))}>Reset</button></div>
  <div className="bar wide">{Array.from({length:s.cap},(_,i)=><div key={i} className={'seg '+(s.buf[i]?'a':'f')} style={{width:100/s.cap+'%'}}>{s.buf[i]||'—'}</div>)}</div>
  <div>mutex=<b>{s.mutex}</b> · empty=<b className="amb">{s.empty}</b> · full=<b className="amb">{s.full}</b> · blocked producers <b className="red">{s.blockedP}</b> · blocked consumers <b className="red">{s.blockedC}</b>{s.empty===0&&<b className="red"> · BUFFER FULL</b>}</div>
  <div className="log">{[...s.log].reverse().map((l,i)=><div key={i}>{l}</div>)}</div></section>
}
function Mem(){
  const [mem,setMem]=useState(A.memInit([100,500,200,300,600])),[strat,setStrat]=useState('first'),[pid,setPid]=useState('P1'),[size,setSize]=useState(212),[msg,setMsg]=useState('');
  const st=A.memStats(mem);
  return <section><div className="row wide"><select value={strat} onChange={e=>setStrat(e.target.value)}><option value="first">First Fit</option><option value="best">Best Fit</option><option value="worst">Worst Fit</option></select><input value={pid} onChange={e=>setPid(e.target.value.trim())} aria-label="Process id" size="6"/><input type="number" min="1" value={size} onChange={e=>setSize(num(e.target.value))}/>
  <button onClick={()=>{if(!pid||size<1||mem.some(b=>b.pid===pid))return setMsg('Invalid input or duplicate process id.');const r=A.memAlloc(mem,pid,size,strat);setMsg(r.ok?`${pid} allocated (${strat} fit)`:`ALLOCATION FAILED: no free block ≥ ${size}`);setMem(r.mem)}}>Allocate</button>
  <button onClick={()=>{if(!mem.some(b=>b.pid===pid))return setMsg('No such process.');setMem(A.memFree(mem,pid));setMsg(pid+' released')}}>Release</button><button onClick={()=>{setMem(A.memInit([100,500,200,300,600]));setMsg('')}}>Reset</button></div>
  <div className="bar wide">{mem.map((b,i)=><div key={i} className={'seg '+(b.pid?'a':'f')} style={{width:b.size/st.total*100+'%'}} title={`${b.start}–${b.start+b.size}`}>{b.pid||''} {b.size}</div>)}</div>
  <div className="amb">{msg}</div><div>Utilization <b className="grn">{st.utilization.toFixed(1)}%</b> · free {st.free} · largest free {st.largestFree} · external fragmentation <b className="amb">{st.externalFrag.toFixed(1)}%</b></div></section>
}
const SAFE={avail:[3,3,2],alloc:[[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],max:[[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]]};
function Bank(){
  const [d,setD]=useState(SAFE),[k,setK]=useState(0),[pid,setPid]=useState('1'),[req,setReq]=useState('1,0,2'),[msg,setMsg]=useState(''),[example,setExample]=useState('safe');
  const s=A.safety(d.avail,d.alloc,d.max),N=A.need(d.max,d.alloc);
  const M=(n,m)=><table><caption className="note">{n}</caption><tbody>{m.map((r,i)=><tr key={i}><td>P{i}</td>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table>;
  const loadExample=(kind)=>{
    const next=kind==='safe'?SAFE:{...SAFE,avail:[0,0,0]};
    setD({avail:[...next.avail],alloc:next.alloc.map(r=>[...r]),max:next.max.map(r=>[...r])});
    setExample(kind);setK(0);setMsg('');
  };
  const resetSteps=()=>{setK(0);setMsg('');};
  const nextStep=()=>{setK(current=>Math.min(s.steps.length,current+1));setMsg('');};
  const doRequest=()=>{
    const process=Number(pid);
    const pieces=req.split(',').map(x=>x.trim());
    if(!Number.isInteger(process)||process<0||process>=d.alloc.length){setMsg('Enter a valid process ID from 0 to 4.');return;}
    if(pieces.length!==3||pieces.some(x=>x===''||!/^\d+$/.test(x))){setMsg('Enter exactly 3 non-negative integers, separated by commas (e.g. 1,0,2).');return;}
    const vector=pieces.map(Number);
    const result=A.request(d.avail,d.alloc,d.max,process,vector);
    if(result.granted){setD({...d,avail:result.avail,alloc:result.alloc});setK(0);setExample('custom');}
    setMsg((result.granted?'GRANTED: ':'DENIED: ')+result.reason);
  };
  return <section>
    <div className="row wide bank-actions">
      <button type="button" onClick={()=>loadExample('safe')}>Safe example</button>
      <button type="button" onClick={()=>loadExample('unsafe')}>Unsafe example</button>
      <button type="button" onClick={nextStep} disabled={k>=s.steps.length}>Next safety step</button>
      <button type="button" onClick={resetSteps}>Reset steps</button>
      <span className="note">Example: {example==='custom'?'Custom allocation':example==='safe'?'Safe state':'Unsafe state'}</span>
    </div>
    <div className="mats wide">{M('Allocation',d.alloc)}{M('Max',d.max)}{M('Need',N)}<table><caption className="note">Available</caption><tbody><tr>{d.avail.map((v,j)=><td key={j}>{v}</td>)}</tr></tbody></table></div>
    <div className="wide big">State: <b className={s.safe?'grn':'red'}>{s.safe?'SAFE':'UNSAFE'}</b> {s.safe&&<>· sequence {s.seq.map(i=>'P'+i).join(' → ')}</>}</div>
    <div className="log wide" aria-live="polite">
      {k===0&&<div>{s.safe?'Ready to check the safe sequence. Select “Next safety step” to advance.':'No safe sequence exists for the current allocation.'}</div>}
      {s.steps.slice(0,k).map((x,i)=><div key={i}>Step {i+1}: Work=[{x.work.join(', ')}], Need(P{x.pid})=[{x.need.join(', ')}] ≤ Work. P{x.pid} finishes; release Allocation to Work.</div>)}
      {k>=s.steps.length&&s.safe&&<div className="grn">Safety check complete: all processes can finish.</div>}
      {k>=s.steps.length&&!s.safe&&<div className="red">No remaining process can proceed: the state is unsafe.</div>}
    </div>
    <div className="row wide request-row"><label>Process <input type="number" min="0" max="4" value={pid} onChange={e=>setPid(e.target.value)} aria-label="Process ID"/></label><label>Request vector <input value={req} onChange={e=>setReq(e.target.value)} aria-label="Request vector" placeholder="1,0,2"/></label><button type="button" onClick={doRequest}>Request</button></div>
    <div className="amb wide" role="status" aria-live="polite">{msg}</div>
  </section>
}
const TABS=[['CPU Scheduling',CPU],['Producer–Consumer',PC],['Memory',Mem],['Deadlock Avoidance',Bank]];
export default function App(){
  const [on,setOn]=useState(false),[t,setT]=useState(0),Tab=TABS[t][1];
  return <><div className="grid"/>{!on?<div className="land"><p className="project-title">Emergency Response System</p><h1><span>Explore.</span><span>Simulate.</span><span>Analyze.</span></h1><button className="cta" onClick={()=>setOn(true)}>Enter Simulation →</button></div>
  :<><nav>{TABS.map(([n],i)=><button key={n} className={i===t?'on':''} onClick={()=>setT(i)}>{n}</button>)}</nav><main key={t}><Tab/></main></>}</>
}

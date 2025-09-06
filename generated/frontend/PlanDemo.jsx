// generated/frontend/PlanDemo.jsx
import { useState } from "react";
import { planTask } from "./api";
export default function PlanDemo(){
  const [title,setTitle]=useState(""); const [plan,setPlan]=useState([]);
  async function run(){ if(!title.trim()) return; const out=await planTask("p_demo",{ title }); setPlan(out.proposed||[]); }
  return (<div style={{padding:16}}>
    <h3>AI Planner</h3>
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" style={{flex:1}}/>
      <button onClick={run}>Generate Plan</button>
    </div>
    <ul>{plan.map((s,i)=>(
      <li key={i} style={{marginBottom:8}}><b>{s.title}</b>
        <ol style={{marginTop:6}}>{(s.steps||[]).map((st,j)=><li key={j}>{st}</li>)}</ol>
      </li>
    ))}</ul>
  </div>);
}

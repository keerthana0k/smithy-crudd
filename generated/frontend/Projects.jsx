
import { useEffect, useState } from "react";
import { listProjects, createProject, updateProject, deleteProject } from "./api";
export default function Projects(){
  const [items,setItems]=useState([]); const [name,setName]=useState(""); const [edit,setEdit]=useState({id:"",name:""});
  async function load(){ const out=await listProjects(); setItems(out.items||[]); }
  async function add(){ if(!name.trim()) return; await createProject({name}); setName(""); await load(); }
  async function save(){ if(!edit.id) return; await updateProject(edit.id,{name:edit.name}); setEdit({id:"",name:""}); await load(); }
  async function remove(id){ await deleteProject(id); await load(); }
  useEffect(()=>{ load(); },[]);
  return (<div style={{padding:16}}>
    <h2>Projects</h2>
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="New project name"/><button onClick={add}>Add</button>
    </div>
    {edit.id && <div style={{display:"flex",gap:8,marginBottom:12}}>
      <input value={edit.name} onChange={e=>setEdit(s=>({...s,name:e.target.value}))} placeholder="Edit project name"/>
      <button onClick={save}>Save</button><button onClick={()=>setEdit({id:"",name:""})}>Cancel</button>
    </div>}
    <ul>{items.map((p,i)=>{ const id=p.projectId||`idx-${i}`; return (
      <li key={id} style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{minWidth:220}}>{p.name||id}</span>
        <button onClick={()=>setEdit({id,name:p.name||""})}>Edit</button>
        <button onClick={()=>remove(id)}>Delete</button>
      </li>
    )})}</ul>
  </div>);
}

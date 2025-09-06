#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import path from "path";

const ensure = (p) => fs.mkdirSync(p, { recursive: true });

// CORS + error wrapper used by all handlers
const CORS = `{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
}`;

const wrap = (body) => `exports.handler = async (event) => {
  try {
    const headers = ${CORS};
    ${body}
  } catch (e) {
    const headers = ${CORS};
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};`;

// --- Handler bodies (safe parsing, no webcrypto dependency) ---

const CREATE = `
  const payload = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
  if (!payload.name || typeof payload.name !== "string") {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "name is required" }) };
  }
  const now = new Date().toISOString();
  const id = "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const project = { projectId: id, name: payload.name, description: payload.description || "", createdAt: now, updatedAt: now };
  return { statusCode: 201, headers, body: JSON.stringify({ project }) };
`;

const LIST = `
  return { statusCode: 200, headers, body: JSON.stringify({ items: [] }) };
`;

const GET = `
  const { projectId } = event.pathParameters || {};
  if (!projectId) return { statusCode: 400, headers, body: JSON.stringify({ message: "projectId required" }) };
  const project = { projectId, name: "Sample", description: "", createdAt: "", updatedAt: "" };
  return { statusCode: 200, headers, body: JSON.stringify({ project }) };
`;

const UPDATE = `
  const { projectId } = event.pathParameters || {};
  if (!projectId) return { statusCode: 400, headers, body: JSON.stringify({ message: "projectId required" }) };
  const payload = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
  const now = new Date().toISOString();
  const project = { projectId, name: payload.name || "Sample", description: payload.description || "", createdAt: "", updatedAt: now };
  return { statusCode: 200, headers, body: JSON.stringify({ project }) };
`;

const DELETE = `
  const { projectId } = event.pathParameters || {};
  if (!projectId) return { statusCode: 400, headers, body: JSON.stringify({ message: "projectId required" }) };
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
`;

// Simple React pieces to exercise the API (optional)
const API_JS = `
const BASE = import.meta.env.VITE_API_BASE;
async function req(path, init){
  const r = await fetch(BASE + path, { headers: { "Content-Type": "application/json" }, ...init });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export const listProjects  = () => req("/projects");
export const createProject = (body) => req("/projects", { method: "POST", body: JSON.stringify(body) });
export const getProject    = (id) => req("/projects/" + id);
export const updateProject = (id, body) => req("/projects/" + id, { method: "PATCH", body: JSON.stringify(body) });
export const deleteProject = (id) => req("/projects/" + id, { method: "DELETE" });
`;

const PROJECTS_JSX = `
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
    <ul>{items.map((p,i)=>{ const id=p.projectId||\`idx-\${i}\`; return (
      <li key={id} style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{minWidth:220}}>{p.name||id}</span>
        <button onClick={()=>setEdit({id,name:p.name||""})}>Edit</button>
        <button onClick={()=>remove(id)}>Delete</button>
      </li>
    )})}</ul>
  </div>);
}
`;

program
  .name("smithy-crud-gen")
  .argument("[openapiFile]", "Path to your TaskManager.openapi.json (optional)")
  .action((_openapiFile) => {
    // For now we don't parse OpenAPI; we generate the Project handlers directly.
    const outBackend = path.join(process.cwd(), "generated", "backend");
    const outFrontend = path.join(process.cwd(), "generated", "frontend");
    ensure(outBackend); ensure(outFrontend);

    fs.writeFileSync(path.join(outBackend, "createProject.js"), wrap(CREATE));
    fs.writeFileSync(path.join(outBackend, "listProjects.js"),  wrap(LIST));
    fs.writeFileSync(path.join(outBackend, "getProject.js"),    wrap(GET));
    fs.writeFileSync(path.join(outBackend, "updateProject.js"), wrap(UPDATE));
    fs.writeFileSync(path.join(outBackend, "deleteProject.js"), wrap(DELETE));

    fs.writeFileSync(path.join(outFrontend, "api.js"), API_JS);
    fs.writeFileSync(path.join(outFrontend, "Projects.jsx"), PROJECTS_JSX);

    console.log("✅ Regenerated backend and frontend files in ./generated");
  });

program.parse();

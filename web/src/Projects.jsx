import { useEffect, useState } from "react";
import { listProjects, createProject, updateProject, deleteProject } from "./api";

export default function Projects() {
  const [items, setItems] = useState([]);
  const [name, setName]   = useState("");
  const [edit, setEdit]   = useState({ id: "", name: "" });

  useEffect(() => { load(); }, []);
  async function load() {
    // server list is empty, so just leave as [] on first load
    try {
      const out = await listProjects();
      setItems(out.items || []);
    } catch { setItems([]); }
  }

  async function add() {
    if (!name.trim()) return;
    const { project } = await createProject({ name });   // server returns the new project
    setItems(prev => [...prev, project]);                // append locally
    setName("");
  }

  async function save() {
    if (!edit.id) return;
    const { project } = await updateProject(edit.id, { name: edit.name });
    setItems(prev => prev.map(p => p.projectId === project.projectId ? project : p));
    setEdit({ id:"", name:"" });
  }

  async function remove(id) {
    await deleteProject(id);
    setItems(prev => prev.filter(p => p.projectId !== id));
  }

  return (
    <div style={{ padding: 16, maxWidth: 700 }}>
      <h2>Projects</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New project name" />
        <button onClick={add}>Add</button>
      </div>

      {edit.id && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={edit.name} onChange={e => setEdit(s => ({ ...s, name: e.target.value }))} />
          <button onClick={save}>Save</button>
          <button onClick={() => setEdit({ id:"", name:"" })}>Cancel</button>
        </div>
      )}

      <ul style={{ display: "grid", gap: 8, paddingLeft: 16 }}>
        {items.map((p) => (
          <li key={p.projectId} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ minWidth: 220 }}>{p.name}</span>
            <button onClick={() => setEdit({ id: p.projectId, name: p.name || "" })}>Edit</button>
            <button onClick={() => remove(p.projectId)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

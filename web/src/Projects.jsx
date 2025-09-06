import { useEffect, useState } from "react";
import { listProjects, createProject, updateProject, deleteProject, planTask } from "./api";

export default function Projects() {
  // --- CRUD state ---
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [edit, setEdit] = useState({ id: "", name: "" });

  // --- AI Planner state ---
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [proposed, setProposed] = useState([]);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const out = await listProjects();
      setItems(out.items || []);
    } catch {
      setItems([]);
    }
  }

  async function add() {
    if (!name.trim()) return;
    const { project } = await createProject({ name });
    setItems(prev => [...prev, project]);
    setName("");
  }

  async function save() {
    if (!edit.id) return;
    const { project } = await updateProject(edit.id, { name: edit.name });
    setItems(prev => prev.map(p => (p.projectId === project.projectId ? project : p)));
    setEdit({ id: "", name: "" });
  }

  async function remove(id) {
    await deleteProject(id);
    setItems(prev => prev.filter(p => p.projectId !== id));
  }

  async function runPlan() {
    setPlanError("");
    setProposed([]);
    const pid = selectedProjectId || items[0]?.projectId || "p_demo"; // fallback if list is empty
    if (!planTitle.trim()) { setPlanError("Please enter a task title."); return; }
    setPlanning(true);
    try {
      const out = await planTask(pid, { title: planTitle, description: planDesc });
      setProposed(out.proposed || []);
    } catch (e) {
      setPlanError(e?.message || "Failed to generate plan.");
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <h2>Projects</h2>

      {/* Add project */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New project name"
        />
        <button onClick={add}>Add</button>
      </div>

      {/* Edit project */}
      {edit.id && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={edit.name}
            onChange={e => setEdit(s => ({ ...s, name: e.target.value }))}
          />
          <button onClick={save}>Save</button>
          <button onClick={() => setEdit({ id: "", name: "" })}>Cancel</button>
        </div>
      )}

      {/* Project list */}
      <ul style={{ display: "grid", gap: 8, paddingLeft: 16, marginBottom: 24 }}>
        {items.map(p => (
          <li key={p.projectId} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ minWidth: 220 }}>{p.name || p.projectId}</span>
            <button onClick={() => setEdit({ id: p.projectId, name: p.name || "" })}>Edit</button>
            <button onClick={() => remove(p.projectId)}>Delete</button>
          </li>
        ))}
        {!items.length && <li style={{ opacity: 0.7 }}>No projects yet — add one above (planner will use <code>p_demo</code> if empty).</li>}
      </ul>

      {/* AI Planner */}
      <h3>AI Planner</h3>
      <div style={{ display: "grid", gap: 8, marginBottom: 12, maxWidth: 720 }}>
        <select
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
        >
          <option value="">(choose project or fallback to first / p_demo)</option>
          {items.map(p => (
            <option key={p.projectId} value={p.projectId}>
              {p.name || p.projectId}
            </option>
          ))}
        </select>

        <input
          placeholder="Task title (e.g., Build login page)"
          value={planTitle}
          onChange={e => setPlanTitle(e.target.value)}
        />
        <input
          placeholder="(optional) Description / context"
          value={planDesc}
          onChange={e => setPlanDesc(e.target.value)}
        />

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={runPlan} disabled={planning}>
            {planning ? "Planning..." : "Generate Plan"}
          </button>
          {planError && <span style={{ color: "crimson" }}>{planError}</span>}
        </div>
      </div>

      {/* Results */}
      {!!proposed.length && <h4>Proposed subtasks & steps</h4>}
      <ul>
        {proposed.map((s, i) => (
          <li key={i} style={{ marginBottom: 12 }}>
            <b>{s.title}</b>
            <ol style={{ marginTop: 6 }}>
              {(s.steps || []).map((st, j) => <li key={j}>{st}</li>)}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}

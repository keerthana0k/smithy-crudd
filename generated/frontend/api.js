// web/src/api.js
const BASE = import.meta.env.VITE_API_BASE;

async function req(path, init = {}) {
  const r = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await r.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(json.message || json.error || r.statusText);
  return json;
}

// ---- CRUD helpers ----
export const listProjects  = () => req(`/projects`, { method: "GET" });
export const createProject = (body) => req(`/projects`, { method: "POST", body: JSON.stringify(body) });
export const updateProject = (id, body) => req(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteProject = (id) => req(`/projects/${id}`, { method: "DELETE" });

// ---- AI planner helper ----
export const planTask = (projectId, body) =>
  req(`/projects/${projectId}/tasks/plan`, {
    method: "POST",
    body: JSON.stringify(body),
  });

console.log("VITE_API_BASE =", BASE);

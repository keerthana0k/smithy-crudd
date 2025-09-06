
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

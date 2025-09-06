exports.handler = async (event) => {
  try {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    
  const payload = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
  if (!payload.name || typeof payload.name !== "string") {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "name is required" }) };
  }
  const now = new Date().toISOString();
  const id = "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const project = { projectId: id, name: payload.name, description: payload.description || "", createdAt: now, updatedAt: now };
  return { statusCode: 201, headers, body: JSON.stringify({ project }) };

  } catch (e) {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
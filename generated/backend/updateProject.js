exports.handler = async (event) => {
  try {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    
  const { projectId } = event.pathParameters || {};
  if (!projectId) return { statusCode: 400, headers, body: JSON.stringify({ message: "projectId required" }) };
  const payload = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
  const now = new Date().toISOString();
  const project = { projectId, name: payload.name || "Sample", description: payload.description || "", createdAt: "", updatedAt: now };
  return { statusCode: 200, headers, body: JSON.stringify({ project }) };

  } catch (e) {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
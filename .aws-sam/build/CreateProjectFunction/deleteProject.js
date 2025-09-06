exports.handler = async (event) => {
  try {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    
  const { projectId } = event.pathParameters || {};
  if (!projectId) return { statusCode: 400, headers, body: JSON.stringify({ message: "projectId required" }) };
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (e) {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
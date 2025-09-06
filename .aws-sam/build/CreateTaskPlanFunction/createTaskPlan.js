// generated/backend/ai-planner/createTaskPlan.js
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// The client picks up region from Lambda's env (AWS_REGION)
const bedrock = new BedrockRuntimeClient({});

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  };

  try {
    const { projectId } = event.pathParameters || {};
    const body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
    if (!projectId) return res(400, { message: "projectId required" }, headers);
    if (!body.title)  return res(400, { message: "title required" }, headers);

    const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";

    const prompt = buildPrompt(body.title, body.description || "");

    // Claude 3 Messages API on Bedrock
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    };

    const cmd = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const resp = await bedrock.send(cmd);
    const raw = new TextDecoder().decode(resp.body);
    const json = JSON.parse(raw);
    const text = json?.content?.[0]?.text?.trim?.() || "[]";

    // Make sure we return a JSON array [{title, steps:[...]}, ...]
    let proposed;
    try {
      proposed = JSON.parse(text);
    } catch {
      const m = text.match(/\[[\s\S]*\]/);
      proposed = m ? JSON.parse(m[0]) : [];
    }

    const now = new Date().toISOString();
    const taskId = "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    return res(201, {
      task: { taskId, projectId, title: body.title, description: body.description || "", createdAt: now, updatedAt: now },
      proposed,
    }, headers);
  } catch (e) {
    // Common errors to surface: AccessDeniedException if model access not granted
    return res(500, { error: String(e) }, headers);
  }
};

function res(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function buildPrompt(title, description) {
  return `You are an expert planner.

Return ONLY a JSON array with this schema (no prose, no backticks):
[
  {"title": "subtask title", "steps": ["step 1", "step 2", "..."] }
]

Rules:
- 3 to 7 subtasks.
- Steps must be short, actionable, and ordered.
- Do not include any text outside the JSON.

Task title: "${title}"
Context: "${description}"`;
}

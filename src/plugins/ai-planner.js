// src/plugins/ai-planner.js
const CORS = `{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
}`;

const stubBackend = `// generated/backend/createTaskPlan.js (stub)
exports.handler = async (event) => {
  const headers = ${CORS};
  try {
    const { projectId } = event.pathParameters || {};
    const body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
    if (!projectId) return { statusCode: 400, headers, body: JSON.stringify({ message: "projectId required" }) };
    if (!body.title)  return { statusCode: 400, headers, body: JSON.stringify({ message: "title required" }) };

    const proposed = [
      { title: \`Define scope for "\${body.title}"\`, steps: ["Clarify outcome","List constraints","Write acceptance criteria"] },
      { title: \`Break down "\${body.title}"\`, steps: ["Identify 3–5 subtasks","Order by dependency","Estimate each"] },
      { title: \`Implement "\${body.title}"\`, steps: ["Create branch","Code feature","Write tests","Open PR"] },
      { title: \`Validate & ship "\${body.title}"\`, steps: ["QA on dev","Staging check","Deploy","Monitor"] }
    ];

    const now = new Date().toISOString();
    const taskId = "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

    return { statusCode: 201, headers, body: JSON.stringify({
      task: { taskId, projectId, title: body.title, description: body.description || "", createdAt: now, updatedAt: now },
      proposed
    })};
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};`;

function bedrockBackend(modelId) {
  return `// generated/backend/createTaskPlan.js (Bedrock)
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const bedrock = new BedrockRuntimeClient({});

exports.handler = async (event) => {
  const headers = ${CORS};
  try {
    const { projectId } = event.pathParameters || {};
    const body = typeof event.body === "string" ? JSON.parse(event.body) : (event.body || {});
    if (!projectId) return res(400, { message: "projectId required" }, headers);
    if (!body.title)  return res(400, { message: "title required" }, headers);

    const modelId = process.env.BEDROCK_MODEL_ID || "${modelId}";
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 800, temperature: 0.2,
      messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(body.title, body.description || "") }]}],
    };

    const cmd = new InvokeModelCommand({
      modelId, contentType: "application/json", accept: "application/json", body: JSON.stringify(payload),
    });

    const resp = await bedrock.send(cmd);
    const raw = new TextDecoder().decode(resp.body);
    const parsed = JSON.parse(raw);
    const text = parsed?.content?.[0]?.text?.trim?.() || "[]";

    let proposed;
    try { proposed = JSON.parse(text); }
    catch { const m = text.match(/\\[[\\s\\S]*\\]/); proposed = m ? JSON.parse(m[0]) : []; }

    const now = new Date().toISOString();
    const taskId = "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

    return res(201, { task: { taskId, projectId, title: body.title, description: body.description || "", createdAt: now, updatedAt: now }, proposed }, headers);
  } catch (e) {
    return res(500, { error: e.message }, headers);
  }
};

function res(statusCode, body, headers) { return { statusCode, headers, body: JSON.stringify(body) }; }
function buildPrompt(title, description){
  return \`You are an expert planner.
Return ONLY a JSON array:
[
  {"title":"subtask title","steps":["step 1","step 2","..."]}
]
3–7 subtasks; ordered, actionable steps; no prose outside JSON.
Task: "\${title}"
Context: "\${description}"\`;
}
`;
}

const samSnippet = `
  CreateTaskPlanFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: generated/backend
      Handler: createTaskPlan.handler
      Environment:
        Variables:
          BEDROCK_MODEL_ID: anthropic.claude-3-haiku-20240307-v1:0
      Policies:
        - Statement:
            Effect: Allow
            Action:
              - bedrock:InvokeModel
              - bedrock:InvokeModelWithResponseStream
            Resource: "*"
      Events:
        Api:
          Type: Api
          Properties:
            Path: /projects/{projectId}/tasks/plan
            Method: post
`;

const frontAppend = `
// --- AI planner ---
export const planTask = (projectId, body) =>
  req(\`/projects/\${projectId}/tasks/plan\`, { method: "POST", body: JSON.stringify(body) });
`;

const frontDemo = `// generated/frontend/PlanDemo.jsx
import { useState } from "react";
import { planTask } from "./api";
export default function PlanDemo(){
  const [title,setTitle]=useState(""); const [plan,setPlan]=useState([]);
  async function run(){ if(!title.trim()) return; const out=await planTask("p_demo",{ title }); setPlan(out.proposed||[]); }
  return (<div style={{padding:16}}>
    <h3>AI Planner</h3>
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" style={{flex:1}}/>
      <button onClick={run}>Generate Plan</button>
    </div>
    <ul>{plan.map((s,i)=>(
      <li key={i} style={{marginBottom:8}}><b>{s.title}</b>
        <ol style={{marginTop:6}}>{(s.steps||[]).map((st,j)=><li key={j}>{st}</li>)}</ol>
      </li>
    ))}</ul>
  </div>);
}
`;

export default {
  run: async (ctx, { aiMode, aiModel }) => {
    // 1) Backend file
    if (aiMode === "bedrock") {
      const modelId = aiModel === "sonnet"
        ? "anthropic.claude-3-sonnet-20240229-v1:0"
        : "anthropic.claude-3-haiku-20240307-v1:0"; // default: Haiku (cheaper)
      ctx.writeBackend("createTaskPlan.js", bedrockBackend(modelId));

      // ensure backend has package.json for Lambda deps
      const pkg = ctx.path.join(ctx.outBackend, "package.json");
      if (!ctx.fs.existsSync(pkg)) {
        ctx.fs.writeFileSync(pkg, JSON.stringify({ name: "backend", version: "1.0.0", private: true, dependencies: { "@aws-sdk/client-bedrock-runtime": "^3.600.0" } }, null, 2));
        console.log("✔ wrote", pkg);
        console.log("➡ Run: npm --prefix generated/backend i");
      } else {
        console.log("ℹ ensure @aws-sdk/client-bedrock-runtime is installed in generated/backend");
      }

      // 2) Patch SAM (adds route + IAM)
      ctx.patchSam(samSnippet);
    } else {
      ctx.writeBackend("createTaskPlan.js", stubBackend);

      // For stub mode we still add the route but without IAM + env (safe to keep same snippet or you can strip IAM if you prefer)
      ctx.patchSam(samSnippet.replace(/Policies:[\s\S]*?Events:/, "Events:")); // strip the IAM block for stub
    }

    // 3) Frontend API and simple demo page
    // Ensure an api.js exists (your CRUD may have created one already)
    const apiFile = "api.js";
    if (!ctx.fs.existsSync(ctx.path.join(ctx.outFrontend, apiFile))) {
      ctx.writeFrontend(apiFile,
`const BASE = import.meta.env.VITE_API_BASE;
async function req(path, init){ const r = await fetch(BASE + path, { headers: { "Content-Type":"application/json" }, ...init }); if(!r.ok) throw new Error(await r.text()); return r.json(); }
export { req };`
      );
    }
    ctx.appendOnce(apiFile, "planTask = (projectId, body) =>", frontAppend);
    ctx.writeFrontend("PlanDemo.jsx", frontDemo);

    console.log("✅ AI Planner plugin finished.");
  }
};

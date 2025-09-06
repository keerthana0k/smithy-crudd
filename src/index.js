#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import path from "path";

// ------------- tiny utilities -------------
const ensure = (p) => fs.mkdirSync(p, { recursive: true });
const read  = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => fs.writeFileSync(p, s);
const exists = (p) => fs.existsSync(p);

// Simple plugin context
function makeContext(repoRoot) {
  const outBackend  = path.join(repoRoot, "generated", "backend");
  const outFrontend = path.join(repoRoot, "generated", "frontend");
  ensure(outBackend); ensure(outFrontend);

  return {
    repoRoot, outBackend, outFrontend, fs, path,
    writeBackend: (file, content) => {
      const p = path.join(outBackend, file);
      ensure(path.dirname(p)); write(p, content); console.log("✔ wrote", p);
    },
    writeFrontend: (file, content) => {
      const p = path.join(outFrontend, file);
      ensure(path.dirname(p)); write(p, content); console.log("✔ wrote", p);
    },
    appendOnce: (file, marker, block) => {
      const p = path.join(outFrontend, file);
      const text = exists(p) ? read(p) : "";
      if (!text.includes(marker)) {
        write(p, text + (text.endsWith("\n") ? "" : "\n") + block);
        console.log("✚ appended to", p);
      }
    },
    patchSam: (yamlSnippet) => {
      const file = path.join(repoRoot, "template.yaml");
      if (!exists(file)) { console.warn("template.yaml not found; skipping SAM patch."); return; }
      const src = read(file);
      // Idempotent: don’t re-insert if function already present
      if (/CreateTaskPlanFunction:/.test(src)) { console.log("SAM already has CreateTaskPlanFunction; skipping patch."); return; }
      const idx = src.indexOf("\nResources:");
      if (idx === -1) { console.warn("No 'Resources:' in template.yaml; please add manually:\n", yamlSnippet); return; }
      const patched = src.slice(0, idx + 11) + "\n" + yamlSnippet + src.slice(idx + 11);
      write(file, patched); console.log("✚ patched template.yaml with AI planner function");
    }
  };
}

program
  .name("smithy-crud-gen")
  .argument("[openapiFile]", "Path to openapi.json (optional)")
  .option("--plugins <list>", "Comma-separated plugin names (e.g. ai-planner)")
  .option("--ai-mode <mode>", "AI mode: stub|bedrock", "stub")
  .option("--ai-model <name>", "Bedrock model: haiku|sonnet", "haiku")
  .action(async (_openapi, opts) => {
    const repoRoot = process.cwd();
    const ctx = makeContext(repoRoot);

    // (1) your normal CRUD generation would run here…
    // …left out for brevity since it already works for you

    // (2) load plugins

    if (opts.plugins) {
      const names = opts.plugins.split(",").map(s => s.trim()).filter(Boolean);

      // dynamic import for each plugin
      // (file URL style is most robust for Node’s ESM)
      const { pathToFileURL } = await import("url");
      for (const name of names) {
        const modPath = path.join(repoRoot, "src", "plugins", `${name}.js`);
        const mod = await import(pathToFileURL(modPath).href);   // ← await import
        const plugin = mod.default || mod;
        await plugin.run(ctx, { aiMode: opts.aiMode, aiModel: opts.aiModel }); // ← await plugin
      }
    }

    console.log("✅ Generation complete");
  });

program.parse();

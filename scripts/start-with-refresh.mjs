import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: options.stdio ?? "inherit",
    shell: false,
    env: process.env
  });

  return child;
}

function runTask(scriptName) {
  return new Promise((resolve) => {
    console.log(`[startup] Running ${scriptName}...`);
    const child = run(npmCommand, ["run", scriptName], { stdio: "inherit" });

    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`[startup] ${scriptName} completed.`);
      } else {
        console.log(`[startup] ${scriptName} skipped or failed with exit code ${code}.`);
      }
      resolve();
    });
  });
}

async function refreshInBackground() {
  await runTask("fetch");

  if (process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY) {
    await runTask("translate:titles");
  } else {
    console.log("[startup] AI API key is missing; skipped translate:titles.");
  }
}

const server = run("npx", ["next", "start", "-H", "0.0.0.0", "-p", port], { stdio: "inherit" });

server.on("exit", (code) => {
  process.exit(code ?? 0);
});

refreshInBackground().catch((error) => {
  console.log(`[startup] Background refresh failed: ${error instanceof Error ? error.message : String(error)}`);
});

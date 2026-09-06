import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// The first browser visit starts the shared refresh job and tracks completion.
// Avoid a second writer racing with the web process on cold starts.
const require = createRequire(import.meta.url);
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"], {
  stdio: "inherit", env: process.env
});
server.on("error", (error) => { console.error(error); process.exit(1); });
server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.kill(signal));

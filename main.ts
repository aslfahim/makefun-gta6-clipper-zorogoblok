// gta6-clipper-01 entry for @zorogoblok.
//
// The grader runs this program with VIDEO.json sitting in the bot
// directory. That file carries the YouTube address of the submitted
// Short, and our only job is to hand it over to the output directory
// unchanged. Anything that goes wrong must fail loudly with a non-zero
// exit code instead of leaving a missing or truncated file behind.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Read a directory location from the environment, treating an unset or
// empty variable as "use the grader's conventional location".
function envDir(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

async function main(): Promise<void> {
  const botDir = envDir("MAKEFUN_BOT_DIR", "/bot");
  const outputDir = envDir("MAKEFUN_OUTPUT_DIR", "/output");

  const sourcePath = join(botDir, "VIDEO.json");
  const destPath = join(outputDir, "VIDEO.json");

  // The output directory may not exist yet on a fresh grader run.
  await mkdir(outputDir, { recursive: true });

  // Buffer the whole file in memory: VIDEO.json is a few dozen bytes,
  // so a streaming copy would add complexity for no benefit.
  const payload = await readFile(sourcePath);
  if (payload.byteLength === 0) {
    throw new Error(`source file ${sourcePath} is empty`);
  }
  await writeFile(destPath, payload);

  // Verify the hand-off landed intact: read the copy back and require it
  // to hold exactly as many bytes as the source. A short write would
  // otherwise look like success while the grader gets a broken file.
  const written = await readFile(destPath);
  if (written.byteLength !== payload.byteLength) {
    throw new Error(
      `copy verification failed for ${destPath}: ` +
        `wrote ${written.byteLength} bytes, expected ${payload.byteLength}`,
    );
  }

  console.log(
    `Copied ${sourcePath} -> ${destPath} (${payload.byteLength} bytes, verified)`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`VIDEO.json hand-off failed: ${message}`);
  process.exitCode = 1;
});

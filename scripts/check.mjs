/**
 * Consistency checks a human or an agent can run without reading the code:
 * package name, patch row and constants must agree, and the built bundle must
 * carry the same id.
 *
 * @module scripts/check
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const patch = await readFile(join(root, "cordis.patch.yml"), "utf8");
const constants = await readFile(join(root, "src/shared/constants.ts"), "utf8");

const problems = [];
if (!patch.includes(`name: ${pkg.name}`))
  problems.push("cordis.patch.yml does not reference the package name");
const declaredName = /NAME\s*=\s*["']([^"']+)["']/.exec(constants)?.[1];
if (declaredName !== pkg.name)
  problems.push("src/shared/constants.ts NAME does not match package.json");

try {
  const bundle = await readFile(join(root, "lib/client.js"), "utf8");
  if (!bundle.includes(`id: ${JSON.stringify(pkg.name)}`))
    problems.push("lib/client.js carries a different module id");
} catch {
  problems.push("lib/client.js is missing: run `pnpm build` first");
}

if (problems.length > 0) {
  console.error(problems.map((problem) => `- ${problem}`).join("\n"));
  process.exit(1);
}
console.log("manifest, constants and bundle agree");

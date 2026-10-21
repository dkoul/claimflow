import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specDir = path.join(root, "spec");

const required = [
  "README.md",
  "product-overview.md",
  "users-and-permissions.md",
  "claim-lifecycle.md",
  "business-rules.md",
  "page-behavior.md",
  "validation-rules.md",
  "error-handling.md",
  "persistence-rules.md",
  "acceptance-criteria.md",
];

async function main() {
  let ok = true;
  for (const file of required) {
    const full = path.join(specDir, file);
    try {
      const stat = await fs.stat(full);
      if (!stat.isFile() || stat.size < 50) {
        console.error(`Spec file missing or too small: ${file}`);
        ok = false;
      }
    } catch {
      console.error(`Missing spec file: ${file}`);
      ok = false;
    }
  }

  if (!ok) {
    process.exit(1);
  }
  console.log(`All ${required.length} specification files are present.`);
}

main();

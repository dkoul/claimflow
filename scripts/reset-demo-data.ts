import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedDir = path.join(root, "data", "seed");
const files = ["users.json", "claims.json", "categories.json", "app-config.json"];

async function main() {
  for (const file of files) {
    const src = path.join(seedDir, file);
    const dest = path.join(root, "data", file);
    await fs.copyFile(src, dest);
    console.log(`Restored ${file}`);
  }
  console.log("Demo data reset complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

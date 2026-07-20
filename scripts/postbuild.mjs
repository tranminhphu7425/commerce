import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "out");
const docsDir = path.join(process.cwd(), "docs");

try {
  // Ensure public/data directory exists and copy store.json to public/data/store.json
  const publicDataDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
  const sourceStore = path.join(process.cwd(), "data", "store.json");
  if (fs.existsSync(sourceStore)) {
    fs.copyFileSync(sourceStore, path.join(publicDataDir, "store.json"));
  }

  if (fs.existsSync(outDir)) {
    if (fs.existsSync(docsDir)) {
      fs.rmSync(docsDir, { recursive: true, force: true });
    }
    fs.cpSync(outDir, docsDir, { recursive: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Ensure docs/data/store.json exists
  const docsDataDir = path.join(docsDir, "data");
  if (!fs.existsSync(docsDataDir)) {
    fs.mkdirSync(docsDataDir, { recursive: true });
  }
  if (fs.existsSync(sourceStore)) {
    fs.copyFileSync(sourceStore, path.join(docsDataDir, "store.json"));
  }

  fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");
  console.log(" Cross-platform postbuild complete: out -> docs & .nojekyll created");
} catch (err) {
  console.error("Error in postbuild script:", err);
  process.exit(1);
}

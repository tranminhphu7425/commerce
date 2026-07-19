import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "out");
const docsDir = path.join(process.cwd(), "docs");

try {
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
  fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");
  console.log(" Cross-platform postbuild complete: out -> docs & .nojekyll created");
} catch (err) {
  console.error("Error in postbuild script:", err);
  process.exit(1);
}

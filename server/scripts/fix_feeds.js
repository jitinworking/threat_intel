import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.join(__dirname, '../feeds');

const files = fs.readdirSync(feedsDir).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const file of files) {
  const filePath = path.join(feedsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove the extra closing brace right before `if (batch.length > 0) {`
  // We replaced `}); tx();` with `}\n    if (batch.length > 0) { ...`
  // The `}` was the extra one! We need to change `}\n    if (batch` to `\n    if (batch`
  content = content.replace(/\}\s+if\s*\(batch\.length > 0\)\s*\{/g, "if (batch.length > 0) {");

  // 2. Fix the db.prepare UPDATE feeds SET... which failed
  content = content.replace(/db\.prepare\((["']UPDATE feeds.*?["'])\)\.run\(\);/g, "await db.execute($1);");

  // Fix email.js which had a slightly different signature
  content = content.replace(/\}\s+if\s*\(batch\.length > 0\)\s*\{\s*try\s*\{\s*await db\.batch\(batch,\s*'write'\);\s*\}\s*catch\s*\(e\)\s*\{\}\s*\}/g, "if (batch.length > 0) { try { await db.batch(batch, 'write'); } catch (e) {} }");

  fs.writeFileSync(filePath, content, 'utf8');
}

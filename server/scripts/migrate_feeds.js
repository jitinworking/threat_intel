import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.join(__dirname, '../feeds');

const files = fs.readdirSync(feedsDir).filter(f => f.endsWith('.js') && f !== 'index.js');

for (const file of files) {
  const filePath = path.join(feedsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. UPDATE feeds SET last_polled
  content = content.replace(/db\.prepare\((["'`]UPDATE feeds SET last_polled[^"']*?["'`])\)\.run\(\);/g, "await db.execute($1);");

  // 2. const insert = db.prepare(...)
  content = content.replace(/const\s+insert\s*=\s*db\.prepare\(([`'"][\s\S]*?[`'"])\);/g, "const insertSql = $1;");

  // 3. const tx = db.transaction(...)
  content = content.replace(/const\s+tx\s*=\s*db\.transaction\(\(\)\s*=>\s*\{/g, "const batch = [];\n    // begin batch");

  // 4. insert.run(...)
  content = content.replace(/const\s+result\s*=\s*insert\.run\(([\s\S]*?)\);\s*count\s*\+=\s*result\.changes;/g, "batch.push({ sql: insertSql, args: [$1] });\n            count++;");
  content = content.replace(/insert\.run\(([\s\S]*?)\);(\s*totalCount\+\+;)?/g, "batch.push({ sql: insertSql, args: [$1] });$2");

  // 5. tx();
  content = content.replace(/\}\);\s*tx\(\);/g, "}\n    if (batch.length > 0) {\n      try {\n        await db.batch(batch, 'write');\n      } catch (e) { /* ignore batch errors */ }\n    }");

  // For specific feeds that have unique tx structures
  // email.js
  content = content.replace(/totalCount\+\+;\s*\} catch \(e\) \{\}\s*\}\s*\}\);\s*tx\(\);/g, "totalCount++;\n            } catch (e) {}\n          }\n          if (batch.length > 0) {\n            try {\n              await db.batch(batch, 'write');\n            } catch (e) {}\n          }");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Migrated ${file}`);
}

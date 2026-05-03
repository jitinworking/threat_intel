import fs from 'fs';
import path from 'path';

const dir = './server/feeds';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.js') && file !== 'index.js') {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Add import if not exists
    if (!content.includes('isSuppressed')) {
      content = content.replace(/import \{ getDB \} from '\.\.\/db\.js';/, `import { getDB } from '../db.js';\nimport { isSuppressed } from '../suppression.js';`);
    }
    
    // Most loops look like: for (const item of json) { batch.push(...) }
    // Or: args: [ item.ioc_value, ... ]
    // Since there are many different parsers, a safe regex is hard. Let's just use the update script to inject a check right before `batch.push`.
    
    // Actually, it's easier to just do it in the `getDB().batch(batch, 'write')` by intercepting the batch logic inside the feeds, OR modifying the db.batch function itself.
    // Modifying `db.execute` and `db.batch` in `db.js` would be a global solution!
  }
}

import fs from 'fs';
import path from 'path';

const dir = './server/feeds';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.js') && file !== 'index.js') {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if it has INSERT OR IGNORE INTO iocs
    if (content.includes('INSERT OR IGNORE INTO iocs')) {
      // It's a multi-line SQL statement usually enclosed in backticks
      // E.g.
      // const insertSql = `
      //   INSERT OR IGNORE INTO iocs (...)
      //   VALUES (...)
      // `;
      
      // Let's do a regex replace to catch the end of the VALUES (...) and insert the ON CONFLICT clause before the closing backtick.
      
      // First, replace INSERT OR IGNORE with just INSERT
      content = content.replace(/INSERT OR IGNORE INTO iocs/g, 'INSERT INTO iocs');
      
      // Second, append ON CONFLICT to the SQL statement
      // Since all of them are of the form VALUES (...)\n    ` we can look for the closing backtick of insertSql.
      
      // find the insertSql definition
      const regex = /const insertSql = `([^`]+)`/g;
      content = content.replace(regex, (match, sql) => {
        // remove trailing whitespace from sql
        const cleanSql = sql.replace(/\s+$/, '');
        return `const insertSql = \`${cleanSql}\n      ON CONFLICT(ioc, source) DO UPDATE SET last_seen = datetime('now'), confidence_level = MIN(100, confidence_level + 10)\n    \``;
      });
      
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated ' + file);
    }
  }
}

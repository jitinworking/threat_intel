import fs from 'fs';
import path from 'path';

const srcDir = './src';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath.includes('config.ts')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('localhost:3001')) {
        // Add import
        if (!content.includes("from '../config'") && !content.includes("from '../../config'") && !content.includes("from './config'")) {
          const depth = fullPath.split('/').length - 2;
          const importPath = depth === 0 ? './config' : depth === 1 ? '../config' : '../../config';
          content = `import { API_BASE_URL, WS_BASE_URL } from '${importPath}';\n` + content;
        }

        // Replace HTTP
        content = content.replace(/['"`]http:\/\/localhost:3001\/api(.*?)[`'"]/g, "`\${API_BASE_URL}/api$1`");
        content = content.replace(/['"`]http:\/\/localhost:3001(.*?)[`'"]/g, "`\${API_BASE_URL}$1`");

        // Replace WS
        content = content.replace(/['"`]ws:\/\/localhost:3001(.*?)[`'"]/g, "`\${WS_BASE_URL}$1`");

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk(srcDir);

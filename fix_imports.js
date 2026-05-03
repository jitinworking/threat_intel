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
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const usesApi = content.includes('API_BASE_URL') && !content.match(/import\s+\{[^}]*API_BASE_URL[^}]*\}\s+from\s+['"][^'"]*['"]/g)?.every(match => match === content);
      const usesWs = content.includes('WS_BASE_URL') && !content.match(/import\s+\{[^}]*WS_BASE_URL[^}]*\}\s+from\s+['"][^'"]*['"]/g)?.every(match => match === content);
      
      // A more robust check: does it use API_BASE_URL outside of the import statement?
      const actualUsesApi = content.split('API_BASE_URL').length > 2; // 1 for import, >1 means used
      const actualUsesWs = content.split('WS_BASE_URL').length > 2;
      
      // Let's just do a string replacement on the import line
      if (content.includes('import { API_BASE_URL, WS_BASE_URL }')) {
        if (!actualUsesApi && actualUsesWs) {
          content = content.replace('import { API_BASE_URL, WS_BASE_URL }', 'import { WS_BASE_URL }');
        } else if (actualUsesApi && !actualUsesWs) {
          content = content.replace('import { API_BASE_URL, WS_BASE_URL }', 'import { API_BASE_URL }');
        } else if (!actualUsesApi && !actualUsesWs) {
          content = content.replace(/import\s+\{\s*API_BASE_URL,\s*WS_BASE_URL\s*\}\s+from\s+['"].*?config['"];?\n/g, '');
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

walk(srcDir);

const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    fs.writeFileSync('dom.html', body);
    res.end('ok');
    process.exit(0);
  });
}).listen(3005, () => console.log('Listening on 3005'));

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  
  // Default to index.html
  if (filePath === './') {
    filePath = './public/index.html';
  } else if (filePath === './login') {
    filePath = './public/login.html';
  } else if (filePath === './dashboard') {
    filePath = './public/dashboard.html';
  } else if (filePath === './timesheet') {
    filePath = './public/timesheet.html';
  } else if (filePath === './manual-entry') {
    filePath = './public/manual-entry.html';
  } else if (filePath === './time-off') {
    filePath = './public/time-off.html';
  } else if (!filePath.includes('.')) {
    filePath = './public' + filePath + '.html';
  } else if (!filePath.startsWith('./public')) {
    filePath = './public' + req.url;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});

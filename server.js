const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const app = express();

// Helper: gera ETag baseado no conteúdo do arquivo
function fileETag(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return `"${stat.mtimeMs.toString(16)}-${stat.size.toString(16)}"`;
  } catch { return null; }
}

// HTML: nunca fica em cache — always fresh
const noCache = (res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

// Assets estáticos com cache inteligente (ETag + Last-Modified)
// Browser revalida a cada request; só baixa de novo se o arquivo mudou
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: 0,                        // força revalidação em todo request
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      noCache(res);
    } else {
      // assets: revalida sempre, usa cache local se não mudou (304 Not Modified)
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// SPA fallback → index.html (sempre sem cache)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  noCache(res);
  res.sendFile(indexPath);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Sabino Rifas rodando na porta', process.env.PORT || 3000);
});

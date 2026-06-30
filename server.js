const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();

// Atrás do proxy da Hostinger → IP/protocolo corretos
app.set('trust proxy', 1);
app.disable('x-powered-by');

// GZIP/deflate (antes vinha do mod_deflate no .htaccess; agora no Express)
app.use(compression());

// Headers de segurança (antes no .htaccess; agora aplicados pelo Node)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// HTML: nunca fica em cache — always fresh
const noCache = (res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

// Assets estáticos: ETag + Last-Modified → browser revalida e usa 304 se não mudou.
// HTML nunca em cache.
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      noCache(res);
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// SPA fallback → index.html (sempre sem cache)
app.get('*', (req, res) => {
  noCache(res);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Sabino Rifas rodando na porta', PORT);
});

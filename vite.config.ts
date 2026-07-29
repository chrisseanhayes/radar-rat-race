import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-music-saver',
      configureServer(server) {
        server.middlewares.use('/api/list-tracks', (req, res) => {
          if (req.method === 'GET') {
            try {
              const tracksDir = path.resolve(__dirname, 'public/assets/tracks');
              if (!fs.existsSync(tracksDir)) fs.mkdirSync(tracksDir, { recursive: true });
              const files = fs.readdirSync(tracksDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(files));
            } catch (e: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            }
          }
        });

        server.middlewares.use('/api/save-track', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const tracksDir = path.resolve(__dirname, 'public/assets/tracks');
                if (!fs.existsSync(tracksDir)) fs.mkdirSync(tracksDir, { recursive: true });
                const filePath = path.resolve(tracksDir, data.id + '.json');
                fs.writeFileSync(filePath, JSON.stringify(data.track, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: filePath }));
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          }
        });

        server.middlewares.use('/api/save-map', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const assetsDir = path.resolve(__dirname, 'public/assets');
                if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
                const filePath = path.resolve(assetsDir, 'map.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: filePath }));
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          }
        });

        server.middlewares.use('/api/save-gamedata', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const assetsDir = path.resolve(__dirname, 'public/assets');
                if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
                const filePath = path.resolve(assetsDir, 'gameData.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: filePath }));
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          }
        });
        server.middlewares.use('/api/list-sprites', (req, res) => {
          if (req.method === 'GET') {
            try {
              const assetsDir = path.resolve(__dirname, 'public/assets/sprites');
              if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
              const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(files));
            } catch (e: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            }
          }
        });

        server.middlewares.use('/api/save-sprite', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const assetsDir = path.resolve(__dirname, 'public/assets/sprites');
                if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
                const filePath = path.resolve(assetsDir, `${data.name}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: filePath }));
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          }
        });
      }
    }
  ]
});

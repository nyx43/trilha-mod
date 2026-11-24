import type { Plugin } from 'vite';

const draftPath = /(?:^|\/)\.cache\/editorial(?:\/|$)/;

export function privateDrafts(): Plugin {
  return {
    name: 'trilha-private-drafts',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let path: string;
        try {
          path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
        } catch {
          return next();
        }
        if (!draftPath.test(path)) return next();
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Rascunho disponível pelo comando de prévia.');
      });
    },
    load(id) {
      if (draftPath.test(id.split('?')[0])) this.error('Rascunho disponível pelo comando de prévia.');
    },
  };
}

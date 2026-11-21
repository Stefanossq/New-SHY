/**
 * Servidor do gerador (modo web).
 * - Em desenvolvimento serve a interface via Vite; com --prod serve a pasta dist/.
 * - Expõe só endpoints de geração com entrada validada: não é um proxy aberto da Gemini.
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HealthResponse } from '../shared/api';
import { InputError, normalizeRequest, type Brand, type Product } from '../shared/content';
import { generateBrand, generateImage, generateProducts, hasKey, imageModel, imagesEnabled, textModel } from './gemini';

try {
  process.loadEnvFile('.env');
} catch {
  // .env é opcional
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

/** Limite simples por IP para proteger a cota da chave Gemini. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT ?? 60);
const hits = new Map<string, { count: number; reset: number }>();
const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip ?? 'local';
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return next();
  }
  if (++entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Muitas gerações seguidas. Tente de novo em alguns minutos.' });
    return;
  }
  next();
};

const handle =
  <T>(fn: (body: any) => Promise<T>) =>
  async (req: Request, res: Response) => {
    if (!hasKey()) {
      res.status(503).json({ error: 'IA indisponível: configure GEMINI_API_KEY no .env do servidor.' });
      return;
    }
    try {
      res.json(await fn(req.body ?? {}));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[gerador] ${req.path}: ${message}`);
      const status = err instanceof InputError ? 400 : /quota|429|RESOURCE_EXHAUSTED/i.test(message) ? 429 : 502;
      res.status(status).json({ error: message });
    }
  };

const isBrand = (b: any): b is Brand => b && typeof b.name === 'string' && typeof b.accentColor === 'string';
const isProduct = (p: any): p is Product => p && typeof p.name === 'string' && typeof p.category === 'string';

app.get('/api/health', (_req, res) => {
  const body: HealthResponse = { ai: hasKey(), images: imagesEnabled(), textModel: textModel(), imageModel: imageModel() };
  res.json(body);
});

app.post('/api/generate/brand', rateLimit, handle((body) => generateBrand(normalizeRequest(body.request))));
app.post('/api/generate/products', rateLimit, handle((body) => generateProducts(normalizeRequest(body.request))));
app.post(
  '/api/generate/image',
  rateLimit,
  handle(async (body) => {
    if (!imagesEnabled()) throw new InputError('Geração de imagens desativada (GENERATE_IMAGES=0).');
    if (!isProduct(body.product) || !isBrand(body.brand)) throw new InputError('Requisição de imagem inválida.');
    return generateImage(body.product, body.brand);
  }),
);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

async function start() {
  if (isProd) {
    const dist = path.join(root, 'dist');
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(PORT, () => {
    console.log(`[gerador] http://localhost:${PORT} (${isProd ? 'produção' : 'desenvolvimento'})`);
    console.log(`[gerador] IA: ${hasKey() ? `ativa (${textModel()})` : 'sem GEMINI_API_KEY: usando dados de exemplo'}`);
  });
}

start().catch((err) => {
  console.error('[gerador] Falha ao iniciar:', err);
  process.exit(1);
});

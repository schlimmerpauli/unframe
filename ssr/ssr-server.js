// ssr-server.js
import express from 'express';
import { parseHTML } from 'linkedom';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const COMPONENTS_DIR = path.resolve(__dirname, 'web-components');
const PORT = process.env.SSR_PORT || 3001;
const CACHE_TTL_MS = +(process.env.SSR_CACHE_TTL_MS || 30_000);
const MAX_CACHE_ENTRIES = +(process.env.SSR_CACHE_SIZE || 500);

// ---------- Load & Prepare Component Sources ----------

const componentFiles = fs
  .readdirSync(COMPONENTS_DIR)
  .filter(f => f.endsWith('.js'));

if (componentFiles.length === 0) {
  console.warn('[SSR] No component .js files found in', COMPONENTS_DIR);
}

const scripts = componentFiles.map(file => {
  const full = path.join(COMPONENTS_DIR, file);
  const src  = fs.readFileSync(full, 'utf-8');
  return {
    file,
    script: new vm.Script(src, { filename: file })
  };
});

// Whitelist tag names (derived from definition files or explicit list)
const allowedTags = new Set(
  componentFiles
    .map(f => f.replace(/\.[^.]+$/, '')) // base name
    // heuristic: file 'ssr-hello-world.js' defines <ssr-hello-world>
    .filter(n => n.includes('-'))        // custom elements must contain a dash
);

// ---------- Simple LRU-ish Cache ----------

const cache = new Map(); // key -> { html, expires, size }

function cacheKey(tag, props) {
  const stable = JSON.stringify({ tag, props });
  return crypto.createHash('sha1').update(stable).digest('hex');
}

function getCached(tag, props) {
  if (!CACHE_TTL_MS) return null;
  const key = cacheKey(tag, props);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  // refresh recency (simple LRU)
  cache.delete(key);
  cache.set(key, entry);
  return entry.html;
}

function setCached(tag, props, html) {
  if (!CACHE_TTL_MS) return;
  const key = cacheKey(tag, props);
  cache.set(key, {
    html,
    expires: Date.now() + CACHE_TTL_MS,
    size: html.length
  });
  // Evict oldest if over size
  while (cache.size > MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// ---------- Rendering Core ----------

function renderOne(tag, props = {}) {
  if (!allowedTags.has(tag)) {
    throw new Error(`Tag "${tag}" not allowed`);
  }

  // Cache lookup
  const cached = getCached(tag, props);
  if (cached) {
    return { html: cached, cached: true };
  }

  const start = performance.now();

  // 1. Fresh DOM (per request)
  const { window } = parseHTML('<!DOCTYPE html><html><body></body></html>');
  window.__SSR__ = true;

  // 2. Sandbox
  const sandbox = {
    window,
    document: window.document,
    console,
    customElements: window.customElements,
    HTMLElement: window.HTMLElement,
  };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);

  // 3. Run component scripts
  for (const { script } of scripts) {
    script.runInContext(context);
  }

  // 4. Instantiate + props
  const el = window.document.createElement(tag);
  
  for (const [k, v] of Object.entries(props)) {
    if (v != null && typeof v === 'object') {
      // rich prop -> data-json attribute
      el.setAttribute(`data-prop-${k}`, JSON.stringify(v));
    } else if (v != null) {
      el.setAttribute(k, String(v));
    }
  }

  // 5. Inject template if component provides renderSSR
  if (typeof el.renderSSR === 'function') {
    el.innerHTML = el.renderSSR(props);
  }

  window.document.body.appendChild(el);
  el.setAttribute('ssr', '');

  const html = el.outerHTML;
  setCached(tag, props, html);

  const ms = (performance.now() - start).toFixed(1);
  return { html, ms, cached: false };
}

// ---------- Express App ----------

const app = express();
app.use(express.json());

// Single component
app.post('/render', (req, res) => {
  const { tag, props } = req.body || {};
  if (typeof tag !== 'string' || !tag) {
    return res.status(400).json({ error: '`tag` must be a non-empty string' });
  }
  try {
    const result = renderOne(tag, props || {});
    res.json({ html: result.html, ms: result.ms, cached: result.cached });
  } catch (e) {
    console.error('[SSR] render error', e);
    // Fallback: send client-only placeholder (optionally)
    res.status(500).json({ error: e.message, fallback: `<${tag}></${tag}>` });
  }
});

// Batch endpoint
app.post('/render-batch', (req, res) => {
  const { components } = req.body || {};
  if (!Array.isArray(components)) {
    return res.status(400).json({ error: '`components` must be an array' });
  }
  const results = [];
  for (const item of components) {
    if (!item || typeof item.tag !== 'string') {
      results.push({ error: 'invalid item' });
      continue;
    }
    try {
      const r = renderOne(item.tag, item.props || {});
      results.push({ tag: item.tag, html: r.html, ms: r.ms, cached: r.cached });
    } catch (e) {
      results.push({ tag: item.tag, error: e.message, fallback: `<${item.tag}></${item.tag}>` });
    }
  }
  res.json({ results });
});

// Health
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    components: componentFiles.length,
    cacheSize: cache.size,
    cacheTTLms: CACHE_TTL_MS,
    timestamp: new Date().toISOString()
  });
});

// Metrics (very minimal). Extend as needed.
app.get('/metrics', (_req, res) => {
  const totalCacheBytes = Array.from(cache.values()).reduce((n, e) => n + e.size, 0);
  res.type('text/plain').send(
    `ssr_components_loaded ${componentFiles.length}\n` +
    `ssr_cache_entries ${cache.size}\n` +
    `ssr_cache_ttl_ms ${CACHE_TTL_MS}\n` +
    `ssr_cache_bytes ${totalCacheBytes}\n`
  );
});

// ---------- Startup ----------

app.listen(PORT, () => {
  console.log(`[SSR] service on http://localhost:${PORT}`);
  console.log(`[SSR] loaded components: ${componentFiles.join(', ')}`);
  console.log(`[SSR] allowed tags: ${[...allowedTags].join(', ')}`);
});

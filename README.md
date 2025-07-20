# Go + Web‑Components SSR Starter

A minimal full‑stack template that shows how to:

* **Server‑side render vanilla Web‑Components** from Go
  (via a tiny Node+Linkedom micro‑service).
* Keep **hot‑reload** across
  *Go code & HTML templates*  | *Web‑Component source*  | *Node SSR service*.
* Deliver **SEO‑friendly pages** (robots.txt, sitemap.xml, meta tags, JSON‑LD).
* Build a **client bundle** with Vite but ship **Go‑only** in production.
* Debug Go **and** Node side‑by‑side in VS Code with one <kbd>F5</kbd>.

Use it when you have just a handful of SEO‑critical routes but still want the
rest of your app to be a SPA (Flutter, React, etc.) without adopting a big
framework such as Next or Nuxt.

---

## 

## Project layout

```
repo‑root/
├─ backend/                 ← Go server (Gin)
│  ├─ cmd/server/           ← main package
│  ├─ internal/             ← router + feature groups
│  ├─ templates/            ← HTML pages
│  ├─ static/               ← Vite copy‑build (client bundle)
│  └─ .air.toml             ← hot‑reload config
├─ ssr/                     ← Node SSR micro‑service
│  ├─ web-components/       ← vanilla custom‑elements
│  ├─ vite.config.js        ← copy build → backend/static
│  └─ ssr-server.js         ← Express + Linkedom
└─ .vscode/                 ← launch & task recipes
```

---

## Quick start

```bash
git clone https://github.com/schlimmerpauli/unframe.git
cd go-webcomponents-ssr

# Go deps
cd backend
go mod tidy
cd ..

# Node deps (+ Vite copy build)
cd ssr
npm install
npm run build          # copies hello-widget.js to backend/static/
cd ..

# Open repo root in VS Code and press F5 → choose “Dev‑all + Debug Node”
# http://localhost:8080  (SSR page)
# Edit any Go, template, or component file → browser auto‑reloads
```

---

## What it does

| Capability             | How it’s wired                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **SSR Web‑Components** | Gin → `prerender()` → Node SSR → Linkedom executes the component → injects HTML (Declarative Shadow DOM).                  |
| **Client hydration**   | Vite copy‑build drops `hello-widget.js` into `backend/static/`; page loads it with `<script type="module">`.               |
| **Hot‑reload**         | Air (Go) ‑ Nodemon (SSR) ‑ Vite watch (components) ‑ LiveReload (browser) — all started by a single VS Code compound task. |
| **SEO**                | robots.txt, sitemap.xml, Open‑Graph meta, JSON‑LD.                                                                         |
| **Debugging**          | Attach to Nodemon on 9229 and/or Delve Go debugger with the same <kbd>F5</kbd>.                                            |
| **Prod build**         | `npm run build` in `ssr/` copies assets, then `go build` — Go binary runs alone; Node is optional in prod.                 |

---

## Limitations

### General

* **No decorators/TypeScript transform** out of the box — Vite is configured as a pure copy build. Add Babel or `vite-plugin-lit` if you need stage‑3 decorators.
* **Single SSR instance** — good for dev; production should add concurrency, caching, or swap Linkedom for a Go embedded JS engine (Goja, V8).
* **No streaming or isomorphic state** — server sends ready HTML; hydration is client‑only.
* **Security hardening** (CSRF, rate limits, AF headers) left to you.
* Tested with **Go 1.24**, **Node ≥ 18**, **Vite 5/6**.

### CSS custom‑property quirks

| Area                                      | Current behaviour                                                                                                          | Impact / workaround                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **CSS variables inside Shadow DOM (SSR)** | Linkedom doesn’t compute custom‑property inheritance; variables from `:root` or light DOM aren’t resolved until hydration. | Minor flash of un‑themed styles. Provide fallbacks `var(--brand, #2a7cff)` or inline critical CSS. |
| **`::part()` theming**                    | External sheets apply only after hydration.                                                                                | Inline critical styles in the component or accept the flash.                                       |
| **Global design‑token sheet**             | Not inlined into SSR HTML.                                                                                                 | Inline critical tokens or render them from Go.                                                     |
| **Tailwind custom props**                 | Class utilities fine; `--tw-*` vars share above limitation.                                                                | Add Tailwind JIT + critical CSS inlining if needed.                                                |

---

// web-components/ssr-element.js
const IS_SSR = typeof window !== 'undefined' && window.__SSR__ === true;

class SSRElement extends HTMLElement {
  constructor() {
    super();
    // During SSR we DO NOT attach a shadow root.
    // For hydrated SSR, the browser (or polyfill) will create it from <template shadowroot="open">.
    // For fresh client-only mounts (no [ssr]) we'll attach in connectedCallback.
  }

  /**
   * Full Declarative Shadow DOM string:
   * Return: <template shadowroot="open"> ... </template>
   * Subclasses SHOULD override.
   */
  renderSSR(_props) {
    return `<template shadowroot="open"><slot></slot></template>`;
  }

  /**
   * Markup for fresh client-only mount (no template wrapper).
   * Default: strip wrapper from renderSSR().
   */
  renderInner(props) {
    return this
      .renderSSR(props)
      .replace(/<template[^>]*shadowroot=["']open["'][^>]*>/i, '')
      .replace(/<\/template>\s*$/i, '');
  }

  /**
   * Render for client-only mount (no SSR).
   */
  renderClient() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    this.shadowRoot.innerHTML = this.renderInner(this.props);
  }

  /**
   * Hydration path: DOM already present (or adopted manually).
   * Do NOT re-render; just bind events.
   */
  hydrate() {
    this.bindEvents();
  }

  /**
   * Override in subclass to wire interactivity.
   */
  bindEvents() {}

  /**
   * Manual adoption fallback if browser hasn't upgraded the template yet
   * (older browsers before polyfill, or race condition).
   */
  adoptTemplateIfNeeded() {
    if (this.shadowRoot) return; // already upgraded
    const tmpl = this.querySelector('template[shadowroot="open"]');
    if (!tmpl) return;
    const mode = tmpl.getAttribute('shadowroot') || 'open';
    const sr = this.attachShadow({ mode });
    sr.append(...tmpl.content.cloneNode(true).childNodes);
    tmpl.remove();
  }

  /**
   * Optional lazy hydration: add `lazy` attribute to delay event binding until visible.
   */
  maybeLazyHydrate() {
    if (!this.hasAttribute('lazy')) {
      this.hydrate();
      return;
    }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        io.disconnect();
        this.hydrate();
      }
    });
    io.observe(this);
  }

  debug(...args) {
    if (this.hasAttribute('data-debug')) {
      console.debug(`[${this.tagName.toLowerCase()}]`, ...args);
    }
  }

  connectedCallback() {
    // Collect attributes as props
    this.props = Array.from(this.attributes).reduce((acc, a) => {
      acc[a.name] = a.value;
      return acc;
    }, {});

    if (this.hasAttribute('ssr')) {
      // Hydration path
      this.adoptTemplateIfNeeded();
      this.debug('hydrating; shadowRoot exists?', !!this.shadowRoot);
      this.maybeLazyHydrate();
    } else if (!IS_SSR) {
      // Fresh client-only mount
      this.debug('client-only mount, rendering inner markup');
      this.renderClient();
      this.bindEvents();
    }
  }

  attributeChangedCallback(name, _oldVal, newVal) {
    if (!this.props) this.props = {};
    this.props[name] = newVal;
    // Optionally: if dynamic attribute changes should trigger re-render on client-only mounts:
    // if (!this.hasAttribute('ssr')) this.renderClient();
  }
}
console.log('[SSR] typeof SSRElement at load:', typeof SSRElement);

// web-components/ssr-hello-world.js

class SSRHelloWidget extends SSRElement {
    
  static get observedAttributes() {
    return ['name'];
  }

  renderSSR(props) {
    const name = props.name || 'World';
    return /* html */ `
      <template shadowroot="open">
        <style>
          :host {
            display: inline-block;
            font-family: system-ui, sans-serif;
          }
          .card {
            border: 2px solid #444;
            border-radius: 8px;
            padding: 1rem;
            display: inline-block;
            background: #fff;
            max-width: 340px;
          }
          h1 { margin: 0 0 .5rem; font-size: 1.05rem; line-height: 1.2; }
          p { margin: .35rem 0; font-size: .9rem; }
          button {
            margin-top: 0.6rem;
            padding: 0.45rem 0.9rem;
            cursor: pointer;
            border: 1px solid #333;
            background: #f5f5f5;
            border-radius: 4px;
            font: inherit;
          }
          button:hover { background: #e9e9e9; }
          #response { min-height: 1.2em; font-weight: 500; }
        </style>
        <div class="card">
          <h1>Hello, ${name}!</h1>
          <p>This was SSR’d on the server (Declarative Shadow DOM).</p>
          <button id="btn" type="button">Call Server</button>
          <p id="response"></p>
        </div>
      </template>
    `;
  }

  renderInner(props) {
    // Client-only mount variant (no "SSR’d" wording)
    const name = props.name || 'World';
    return /* html */ `
      <style>
        :host {
          display: inline-block;
          font-family: system-ui, sans-serif;
        }
        .card {
          border: 2px solid #444;
          border-radius: 8px;
          padding: 1rem;
          display: inline-block;
          background: #fff;
          max-width: 340px;
        }
        h1 { margin: 0 0 .5rem; font-size: 1.05rem; line-height: 1.2; }
        p { margin: .35rem 0; font-size: .9rem; }
        button {
          margin-top: 0.6rem;
          padding: 0.45rem 0.9rem;
          cursor: pointer;
          border: 1px solid #333;
          background: #f5f5f5;
          border-radius: 4px;
          font: inherit;
        }
        button:hover { background: #e9e9e9; }
        #response { min-height: 1.2em; font-weight: 500; }
      </style>
      <div class="card">
        <h1>Hello, ${name}!</h1>
        <p>Client-rendered (no SSR template).</p>
        <button id="btn" type="button">Call Server</button>
        <p id="response"></p>
      </div>
    `;
  }

  bindEvents() {
    const root = this.shadowRoot;
    if (!root) return;

    const btn = root.getElementById('btn');
    const resp = root.getElementById('response');
    if (!btn || !resp) {
      this.debug('btn/response not found; shadowRoot children:', root.children.length);
      return;
    }
    if (btn.__bound) return;
    btn.__bound = true;

    btn.addEventListener('click', async () => {
      resp.textContent = '…';
      try {
        // GET endpoint; adapt if you add POST semantics
        const r = await fetch('/api/hello');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        // Accept either { message } or { msg }
        resp.textContent = data.message || data.msg || '(no message)';
      } catch (e) {
        resp.textContent = 'Error contacting server';
        console.error('[ssr-hello-world] fetch error', e);
      }
    });
  }
}

customElements.define('ssr-hello-widget', SSRHelloWidget);

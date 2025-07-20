const d = typeof window < "u" && window.__SSR__ === !0;
class s extends HTMLElement {
  constructor() {
    super();
  }
  /**
   * Full Declarative Shadow DOM string:
   * Return: <template shadowroot="open"> ... </template>
   * Subclasses SHOULD override.
   */
  renderSSR(e) {
    return '<template shadowroot="open"><slot></slot></template>';
  }
  /**
   * Markup for fresh client-only mount (no template wrapper).
   * Default: strip wrapper from renderSSR().
   */
  renderInner(e) {
    return this.renderSSR(e).replace(/<template[^>]*shadowroot=["']open["'][^>]*>/i, "").replace(/<\/template>\s*$/i, "");
  }
  /**
   * Render for client-only mount (no SSR).
   */
  renderClient() {
    this.shadowRoot || this.attachShadow({ mode: "open" }), this.shadowRoot.innerHTML = this.renderInner(this.props);
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
  bindEvents() {
  }
  /**
   * Manual adoption fallback if browser hasn't upgraded the template yet
   * (older browsers before polyfill, or race condition).
   */
  adoptTemplateIfNeeded() {
    if (this.shadowRoot) return;
    const e = this.querySelector('template[shadowroot="open"]');
    if (!e) return;
    const t = e.getAttribute("shadowroot") || "open";
    this.attachShadow({ mode: t }).append(...e.content.cloneNode(!0).childNodes), e.remove();
  }
  /**
   * Optional lazy hydration: add `lazy` attribute to delay event binding until visible.
   */
  maybeLazyHydrate() {
    if (!this.hasAttribute("lazy")) {
      this.hydrate();
      return;
    }
    const e = new IntersectionObserver((t) => {
      t.some((r) => r.isIntersecting) && (e.disconnect(), this.hydrate());
    });
    e.observe(this);
  }
  debug(...e) {
    this.hasAttribute("data-debug") && console.debug(`[${this.tagName.toLowerCase()}]`, ...e);
  }
  connectedCallback() {
    this.props = Array.from(this.attributes).reduce((e, t) => (e[t.name] = t.value, e), {}), this.hasAttribute("ssr") ? (this.adoptTemplateIfNeeded(), this.debug("hydrating; shadowRoot exists?", !!this.shadowRoot), this.maybeLazyHydrate()) : d || (this.debug("client-only mount, rendering inner markup"), this.renderClient(), this.bindEvents());
  }
  attributeChangedCallback(e, t, r) {
    this.props || (this.props = {}), this.props[e] = r;
  }
}
console.log("[SSR] typeof SSRElement at load:", typeof s);
class a extends s {
  static get observedAttributes() {
    return ["name"];
  }
  renderSSR(e) {
    return (
      /* html */
      `
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
          <h1>Hello, ${e.name || "World"}!</h1>
          <p>This was SSR’d on the server (Declarative Shadow DOM).</p>
          <button id="btn" type="button">Call Server</button>
          <p id="response"></p>
        </div>
      </template>
    `
    );
  }
  renderInner(e) {
    return (
      /* html */
      `
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
        <h1>Hello, ${e.name || "World"}!</h1>
        <p>Client-rendered (no SSR template).</p>
        <button id="btn" type="button">Call Server</button>
        <p id="response"></p>
      </div>
    `
    );
  }
  bindEvents() {
    const e = this.shadowRoot;
    if (!e) return;
    const t = e.getElementById("btn"), r = e.getElementById("response");
    if (!t || !r) {
      this.debug("btn/response not found; shadowRoot children:", e.children.length);
      return;
    }
    t.__bound || (t.__bound = !0, t.addEventListener("click", async () => {
      r.textContent = "…";
      try {
        const n = await fetch("/api/hello");
        if (!n.ok) throw new Error(`HTTP ${n.status}`);
        const o = await n.json();
        r.textContent = o.message || o.msg || "(no message)";
      } catch (n) {
        r.textContent = "Error contacting server", console.error("[ssr-hello-world] fetch error", n);
      }
    }));
  }
}
customElements.define("ssr-hello-widget", a);

const s = typeof window < "u" && window.__SSR__ === !0;
function t(o) {
  console.log(`[${s ? "SSR" : "Browser"}] ${o}`);
}
t(s ? "SSR" : "Browser");
t(s ? "SSR" : "Browser");
class a extends HTMLElement {
  static get observedAttributes() {
    return ["message"];
  }
  constructor() {
    super(), t("constructor update in log"), this.shadowRoot || this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    t("connectedCallback"), s || this.fetchMessage(), this.shadowRoot.children.length === 0 && this.render();
  }
  disconnectedCallback() {
    t("disconnectedCallback");
  }
  attributeChangedCallback() {
    t("attributeChangedCallback"), s || this.render();
  }
  async fetchMessage() {
    try {
      const e = await fetch("/api/hello");
      if (e.ok) {
        const { msg: r } = await e.json();
        this.setAttribute("message", r);
      }
    } catch (e) {
      console.error("fetchMessage error", e);
    }
  }
  render() {
    const e = this.getAttribute("message") || "Hello!";
    this.shadowRoot.innerHTML = /*html*/
    `
      <style>
        .card { padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
        .msg  { font-size: 1.25rem; }
      </style>
      <div class="card">
        <h1>Foo bar</h1>
        <h2>Update two</h2>
        <p class="msg">${e}</p>
        <slot></slot>
      </div>
    `;
  }
}
customElements.define("hello-widget", a);

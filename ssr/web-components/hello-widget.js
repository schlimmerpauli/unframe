const isServer =
  typeof window !== 'undefined' && window.__SSR__ === true;

function log(msg) {
  console.log(`[${isServer ? 'SSR' : 'Browser'}] ${msg}`);
}

// call with both values
log(isServer ? 'SSR' : 'Browser', 'constructor');
log(isServer ? 'SSR' : 'Browser', 'connectedCallback');
/**
 * <hello-widget message="Hello!"></hello-widget>
 * A simple greeting card demonstrating SSR with Declarative Shadow DOM.
 */
class HelloWidget extends HTMLElement {
  static get observedAttributes() {
    return ['message'];
  }

  constructor() {
    super();
    log('constructor update in log');
    // log('Foobar the second');
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    log('connectedCallback');

    // Skip expensive work during SSR
    if (!isServer) this.fetchMessage();

    if (this.shadowRoot.children.length === 0) this.render();
  }

  disconnectedCallback() {
    log('disconnectedCallback');
  }

  attributeChangedCallback() {
    log('attributeChangedCallback');
    if (!isServer) this.render();
  }

  async fetchMessage() {
    try {
      const res = await fetch('/api/hello');
      if (res.ok) {
        const { msg } = await res.json();
        this.setAttribute('message', msg);
      }
    } catch (err) {
      console.error('fetchMessage error', err);
    }
  }

  render() {
    const msg = this.getAttribute('message') || 'Hello!';
    this.shadowRoot.innerHTML = /*html*/ `
      <style>
        .card { padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
        .msg  { font-size: 1.25rem; }
      </style>
      <div class="card">
        <h1>Foo bar</h1>
        <h2>Update two</h2>
        <p class="msg">${msg}</p>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('hello-widget', HelloWidget);



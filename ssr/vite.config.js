import { defineConfig } from 'vite';
import * as path from 'path';
import * as fs from 'fs';

const componentsDir = path.resolve(__dirname, 'web-components');
// scan for all .js files in web-components
const componentFiles = fs
  .readdirSync(componentsDir)
  .filter((f) => f.endsWith('.js'));

// build an entry object: { hello-widget: '/abs/path/web-components/hello-widget.js', … }
const entry = componentFiles.reduce((obj, file) => {
  const name = path.basename(file, '.js');
  obj[name] = path.resolve(componentsDir, file);
  return obj;
}, {});

export default defineConfig({
  root: '.',
  build: {
    outDir: path.resolve(__dirname, '../backend/static'),
    emptyOutDir: false,
    lib: {
      // pass our multi‐entry object here:
      entry,
      formats: ['es'],
      // name is only used for UMD/IIFE, so we can leave it generic
      name: 'WebComponents',
      // emit each file as `${entryName}.js`
      fileName: (format, entryName) => `${entryName}.js`,
    },
    // ensure rollup respects our entries as separate bundles
    rollupOptions: {
      input: entry,
    }
  }
});
/**
 * Library build for both halves.
 *
 * The client bundle has to arrive as one script that calls
 * `window.__ModuleLoader__.load`, so the CJS output is wrapped with a banner and
 * footer here — never in the source.
 *
 * @module tsdown.config
 */
import pkg from './package.json' with { type: 'json' }

const moduleBanner = `window.__ModuleLoader__.load({ id: ${JSON.stringify(pkg.name)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`
const moduleFooter = `return module.exports; } });`

export default [
  {
    entry: { index: 'src/host/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    dts: false,
    clean: true,
    outputOptions: { entryFileNames: 'index.js' }
  },
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    deps: { neverBundle: ['react', 'react/jsx-runtime'] },
    dts: false,
    clean: false,
    outputOptions: {
      entryFileNames: 'client.js',
      banner: moduleBanner,
      footer: moduleFooter
    }
  }
]

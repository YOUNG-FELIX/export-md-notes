const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const livePhotoPlugin = {
  name: 'live-photo-base64',
  setup(build) {
    build.onLoad({ filter: /\.live-photo-tool$/ }, async (args) => {
      const data = fs.readFileSync(args.path);
      return { contents: JSON.stringify(data.toString('base64')), loader: 'text' };
    });
  }
};

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  external: ['obsidian', 'electron'],
  format: 'cjs',
  minify: true,
  outfile: 'pkg_1624/main.js',
  plugins: [livePhotoPlugin],
  logLevel: 'warning',
}).then(() => console.log('BUILD_OK')).catch((e) => { console.error(e); process.exit(1); });
